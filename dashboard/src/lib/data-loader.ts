/**
 * Data loading utilities.
 *
 * In development: reads from local .tmp/data/ files.
 * In production: reads from Vercel Blob.
 *
 * Always returns last good data on error (never blank).
 */

import { promises as fs } from "fs";
import path from "path";
import { list, getDownloadUrl } from "@vercel/blob";
import type {
  CampaignData,
  AdData,
  EcosystemData,
  RefreshStatus,
  Annotation,
  InsightResult,
  Region,
  Ad,
} from "./types";
import { parseAdName } from "./ad-name-parser";

const DATA_DIR = path.join(process.cwd(), "..", ".tmp", "data");

// ── File readers ──

async function readLocalJson<T>(filename: string): Promise<T | null> {
  try {
    const filepath = path.join(DATA_DIR, filename);
    const content = await fs.readFile(filepath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function readBlobJson<T>(filename: string): Promise<T | null> {
  try {
    const { blobs } = await list({ prefix: filename });
    const blob = blobs.find((b) => b.pathname === filename);
    if (!blob) return null;

    const downloadUrl = getDownloadUrl(blob.url);
    const resp = await fetch(downloadUrl);
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

async function loadJson<T>(filename: string): Promise<T | null> {
  // Try Vercel Blob first (production), then local files (development)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blobData = await readBlobJson<T>(filename);
    if (blobData) return blobData;
  }

  return readLocalJson<T>(filename);
}

// ── Public loaders ──

export async function loadCampaigns(region: Region): Promise<CampaignData | null> {
  const filename = `meta_${region.toLowerCase()}_campaigns.json`;
  return loadJson<CampaignData>(filename);
}

export async function loadAds(region: Region): Promise<AdData | null> {
  const filename = `meta_${region.toLowerCase()}_ads.json`;
  const data = await loadJson<AdData>(filename);

  if (data) {
    // Parse ad names
    data.ads = data.ads.map((ad) => ({
      ...ad,
      parsed_name: parseAdName(ad.ad_name),
    }));
  }

  return data;
}

export async function loadEcosystem(region: Region): Promise<EcosystemData | null> {
  const filename = `sheets_${region.toLowerCase()}_ecosystem.json`;
  return loadJson<EcosystemData>(filename);
}

export async function loadRefreshStatus(): Promise<RefreshStatus | null> {
  return loadJson<RefreshStatus>("refresh_status.json");
}

export async function loadAnnotations(): Promise<Annotation[]> {
  const data = await loadJson<Annotation[]>("annotations.json");
  return data || [];
}

export async function loadInsightHistory(): Promise<InsightResult[]> {
  const data = await loadJson<InsightResult[]>("insights_history.json");
  return data || [];
}

// ── Freshness check ──

export function isDataStale(fetchedAt: string, maxHours: number = 12): boolean {
  const fetched = new Date(fetchedAt);
  const now = new Date();
  const diffHours = (now.getTime() - fetched.getTime()) / (1000 * 60 * 60);
  return diffHours > maxHours;
}

export function getDataAge(fetchedAt: string): string {
  const fetched = new Date(fetchedAt);
  const now = new Date();
  const diffMinutes = Math.floor(
    (now.getTime() - fetched.getTime()) / (1000 * 60)
  );

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
