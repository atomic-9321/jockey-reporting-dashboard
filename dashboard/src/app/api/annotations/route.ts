import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Annotation } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "..", ".tmp", "data");
const ANNOTATIONS_FILE = path.join(DATA_DIR, "annotations.json");
const LOCK_FILE = path.join(DATA_DIR, "annotations.lock");
const MAX_RETRIES = 3;

type AnnotationsWithEtag = Annotation[] & { _etag?: string | null };

/** Read annotations from blob storage. Throws on transient errors. */
async function readAnnotationsBlob(token: string): Promise<AnnotationsWithEtag> {
  const resp = await fetch("https://blob.vercel-storage.com", {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-version": "7",
    },
  });
  if (!resp.ok) {
    throw new Error(`Blob list failed: ${resp.status} ${resp.statusText}`);
  }
  const data = await resp.json();
  const blobs =
    (data as { blobs: Array<{ pathname: string; url: string }> }).blobs || [];
  const blob = blobs.find(
    (b: { pathname: string }) => b.pathname === "annotations.json"
  );
  if (!blob) {
    // No annotations file yet — start fresh
    return Object.assign([] as Annotation[], { _etag: null }) as AnnotationsWithEtag;
  }
  const blobResp = await fetch(blob.url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!blobResp.ok) {
    throw new Error(`Blob download failed: ${blobResp.status} ${blobResp.statusText}`);
  }
  const etag = blobResp.headers.get("etag");
  const annotations = (await blobResp.json()) as Annotation[];
  return Object.assign(annotations, { _etag: etag }) as AnnotationsWithEtag;
}

/** Read annotations from local file. Only returns [] if file doesn't exist. */
async function readAnnotationsLocal(): Promise<Annotation[]> {
  try {
    const content = await fs.readFile(ANNOTATIONS_FILE, "utf-8");
    return JSON.parse(content) as Annotation[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw new Error(
      `Failed to read annotations file: ${err instanceof Error ? err.message : "unknown error"}`
    );
  }
}

/** Read annotations — used by GET. Throws when blob is configured but unreadable. */
async function readAnnotations(): Promise<Annotation[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    // Blob is the source of truth — do not fall back to stale local data
    return await readAnnotationsBlob(token);
  }
  return readAnnotationsLocal();
}

async function writeBlobAnnotations(
  json: string,
  token: string,
  expectedEtag: string | null
): Promise<boolean> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/octet-stream",
    "x-api-version": "7",
    "x-content-type": "application/json",
    "x-vercel-blob-access": "private",
    "x-add-random-suffix": "0",
    "x-allow-overwrite": "1",
  };
  if (expectedEtag) {
    // Existing blob — only overwrite if it hasn't changed
    headers["if-match"] = expectedEtag;
  } else {
    // Blob doesn't exist yet — only succeed if no one else created it first
    headers["if-none-match"] = "*";
  }
  const resp = await fetch(
    "https://blob.vercel-storage.com/annotations.json",
    { method: "PUT", headers, body: json }
  );
  if (resp.status === 412) {
    // Precondition failed — another writer created or updated the blob
    return false;
  }
  if (!resp.ok) {
    throw new Error(`Blob upload failed: ${resp.status} ${resp.statusText}`);
  }
  return true;
}

async function appendAnnotationBlob(
  annotation: Annotation,
  token: string
): Promise<void> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Read from blob only — never fall back to local in the mutation path
    const annotations = await readAnnotationsBlob(token);
    const etag = annotations._etag ?? null;
    annotations.push(annotation);
    const json = JSON.stringify(annotations, null, 2);
    const ok = await writeBlobAnnotations(json, token, etag);
    if (ok) return;
    // Conflict — re-read from blob and retry
  }
  throw new Error("Failed to write annotation after retries (concurrent conflict)");
}

async function acquireFileLock(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (let i = 0; i < 50; i++) {
    try {
      await fs.writeFile(LOCK_FILE, String(process.pid), { flag: "wx" });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("Could not acquire annotation lock — please retry");
}

async function releaseFileLock(): Promise<void> {
  try {
    await fs.unlink(LOCK_FILE);
  } catch {
    // Already released
  }
}

async function appendAnnotationLocal(annotation: Annotation): Promise<void> {
  await acquireFileLock();
  try {
    let annotations: Annotation[] = [];
    try {
      const content = await fs.readFile(ANNOTATIONS_FILE, "utf-8");
      annotations = JSON.parse(content) as Annotation[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new Error(
          `Annotations file is corrupted or unreadable: ${err instanceof Error ? err.message : "unknown error"}`
        );
      }
      // File doesn't exist yet — start fresh
    }
    annotations.push(annotation);
    // Atomic write: write to temp file then rename to prevent partial reads
    const tmpFile = `${ANNOTATIONS_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(annotations, null, 2), "utf-8");
    await fs.rename(tmpFile, ANNOTATIONS_FILE);
  } finally {
    await releaseFileLock();
  }
}

export async function GET() {
  try {
    const annotations = await readAnnotations();
    return NextResponse.json(annotations);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read annotations";
    return NextResponse.json(
      { error: message },
      { status: 503, headers: { "Retry-After": "5" } }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { region, calendar_week, note, category, created_by } = body;

  if (!region || !calendar_week || !note || !category) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: region, calendar_week, note, category",
      },
      { status: 400 }
    );
  }

  const annotation: Annotation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    region,
    calendar_week,
    note,
    category,
    created_at: new Date().toISOString(),
    created_by: created_by || "admin",
  };

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      await appendAnnotationBlob(annotation, blobToken);
    } else {
      await appendAnnotationLocal(annotation);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Write failed";
    return NextResponse.json(
      { error: message },
      { status: 409, headers: { "Retry-After": "1" } }
    );
  }

  return NextResponse.json(annotation, { status: 201 });
}
