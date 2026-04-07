import { NextRequest, NextResponse } from "next/server";
import { loadCampaigns, loadAds, loadEcosystem, loadRefreshStatus } from "@/lib/data-loader";
import type { Region } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ region: string }> }
) {
  const { region: regionParam } = await params;
  const region = regionParam.toUpperCase() as Region;

  if (region !== "EU" && region !== "UK") {
    return NextResponse.json({ error: "Invalid region. Use EU or UK." }, { status: 400 });
  }

  const [campaigns, ads, ecosystem, refreshStatus] = await Promise.all([
    loadCampaigns(region),
    loadAds(region),
    loadEcosystem(region),
    loadRefreshStatus(),
  ]);

  return NextResponse.json({
    region,
    campaigns,
    ads,
    ecosystem,
    refresh_status: refreshStatus,
  });
}
