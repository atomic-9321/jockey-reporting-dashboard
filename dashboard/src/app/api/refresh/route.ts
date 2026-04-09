import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

const REFRESH_SECRET = process.env.REFRESH_SECRET;
const REFRESH_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes — covers retries under degraded upstreams
const LOCK_TTL_MS = 12 * 60 * 1000; // 12 minutes — outlives the timeout so lock isn't stolen during cleanup

interface RefreshLock {
  job_id: string;
  region: string;
  started_at: string;
}

/** Try to acquire a cross-instance refresh lock via Vercel Blob. */
async function acquireRefreshLock(
  jobId: string,
  region: string
): Promise<{ acquired: boolean; existing?: RefreshLock }> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    // No blob storage — fall back to process-level guard
    if (processLock) {
      return { acquired: false, existing: processLock };
    }
    processLock = { job_id: jobId, region, started_at: new Date().toISOString() };
    return { acquired: true };
  }

  // Check for an existing lock and get its ETag
  let existingEtag: string | null = null;
  try {
    const listResp = await fetch("https://blob.vercel-storage.com", {
      headers: { Authorization: `Bearer ${blobToken}`, "x-api-version": "7" },
    });
    if (listResp.ok) {
      const data = await listResp.json();
      const blobs = (data as { blobs: Array<{ pathname: string; url: string }> }).blobs || [];
      const lockBlob = blobs.find((b: { pathname: string }) => b.pathname === "refresh-lock.json");
      if (lockBlob) {
        const lockResp = await fetch(lockBlob.url, {
          headers: { Authorization: `Bearer ${blobToken}` },
        });
        if (lockResp.ok) {
          existingEtag = lockResp.headers.get("etag");
          const lock = (await lockResp.json()) as RefreshLock;
          const age = Date.now() - new Date(lock.started_at).getTime();
          if (age < LOCK_TTL_MS) {
            // Active lock — reject
            return { acquired: false, existing: lock };
          }
          // Lock expired — will overwrite with if-match to ensure atomicity
        }
      }
    }
  } catch {
    // Can't read lock — try conditional create below
  }

  // Atomic lock acquisition
  const lock: RefreshLock = { job_id: jobId, region, started_at: new Date().toISOString() };
  const headers: Record<string, string> = {
    Authorization: `Bearer ${blobToken}`,
    "Content-Type": "application/octet-stream",
    "x-api-version": "7",
    "x-content-type": "application/json",
    "x-vercel-blob-access": "private",
    "x-add-random-suffix": "0",
    "x-allow-overwrite": "1",
  };

  if (existingEtag) {
    // Expired lock exists — only overwrite if no one else already did
    headers["if-match"] = existingEtag;
  } else {
    // No lock exists — only create if still absent
    headers["if-none-match"] = "*";
  }

  try {
    const resp = await fetch("https://blob.vercel-storage.com/refresh-lock.json", {
      method: "PUT",
      headers,
      body: JSON.stringify(lock),
    });
    if (resp.status === 412) {
      // Another instance acquired the lock between our read and write
      return { acquired: false };
    }
    if (!resp.ok) {
      throw new Error(`Lock write failed: ${resp.status}`);
    }
  } catch {
    return { acquired: false };
  }

  return { acquired: true };
}

/** Release the cross-instance refresh lock. */
async function releaseRefreshLock(): Promise<void> {
  processLock = null;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return;

  try {
    // List to find the lock blob URL, then delete
    const listResp = await fetch("https://blob.vercel-storage.com", {
      headers: { Authorization: `Bearer ${blobToken}`, "x-api-version": "7" },
    });
    if (listResp.ok) {
      const data = await listResp.json();
      const blobs = (data as { blobs: Array<{ pathname: string; url: string }> }).blobs || [];
      const lockBlob = blobs.find((b: { pathname: string }) => b.pathname === "refresh-lock.json");
      if (lockBlob) {
        await fetch(`https://blob.vercel-storage.com/delete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${blobToken}`,
            "Content-Type": "application/json",
            "x-api-version": "7",
          },
          body: JSON.stringify({ urls: [lockBlob.url] }),
        });
      }
    }
  } catch {
    // Best-effort cleanup — lock will expire via TTL
  }
}

// Process-level fallback when blob storage is not configured
let processLock: RefreshLock | null = null;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!REFRESH_SECRET) {
    return NextResponse.json(
      { error: "Server misconfigured: REFRESH_SECRET is required" },
      { status: 500 }
    );
  }

  if (token !== REFRESH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const region = (body as { region?: string }).region || "all";

  if (!["eu", "uk", "all"].includes(region)) {
    return NextResponse.json(
      { error: "Invalid region. Use: eu, uk, or all" },
      { status: 400 }
    );
  }

  const jobId = `refresh-${Date.now()}`;

  // Acquire cross-instance lock
  const { acquired, existing } = await acquireRefreshLock(jobId, region);
  if (!acquired) {
    return NextResponse.json(
      {
        error: "A refresh job is already running",
        ...(existing && {
          job_id: existing.job_id,
          region: existing.region,
          started_at: existing.started_at,
        }),
      },
      { status: 409, headers: { "Retry-After": "30" } }
    );
  }

  const projectRoot = path.resolve(process.cwd(), "..");
  const scriptPath = path.join(projectRoot, "tools", "refresh_all_data.py");

  let timedOut = false;
  try {
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" --region ${region}`,
      {
        cwd: projectRoot,
        timeout: REFRESH_TIMEOUT_MS,
        env: { ...process.env, PYTHONPATH: projectRoot },
      }
    );

    const success = !stderr || !stderr.includes("FAILED");

    return NextResponse.json({
      success,
      job_id: jobId,
      region,
      message: success
        ? "Data refresh completed successfully"
        : "Data refresh completed with some failures",
      stdout: stdout.slice(-2000),
      stderr: stderr ? stderr.slice(-1000) : null,
      triggered_at: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as { message?: string; stderr?: string; killed?: boolean; signal?: string };
    console.error("Refresh failed:", err.message);

    // Detect timeout: subprocess was killed by the timeout
    if (err.killed || err.signal === "SIGTERM") {
      timedOut = true;
      return NextResponse.json(
        {
          success: false,
          job_id: jobId,
          region,
          error: "Refresh timed out — data may be partially updated. Lock retained until TTL expires.",
          triggered_at: new Date().toISOString(),
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        job_id: jobId,
        region,
        error: "Refresh script failed",
        details: err.stderr?.slice(-1000) || err.message,
        triggered_at: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    // On timeout, keep the lock so no one starts a refresh against partial state.
    // The lock will auto-expire after LOCK_TTL_MS.
    if (!timedOut) {
      await releaseRefreshLock();
    }
  }
}
