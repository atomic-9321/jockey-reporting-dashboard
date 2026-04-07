import { NextRequest, NextResponse } from "next/server";
import { loadAnnotations } from "@/lib/data-loader";
import type { Annotation } from "@/lib/types";

export async function GET() {
  const annotations = await loadAnnotations();
  return NextResponse.json(annotations);
}

export async function POST(request: NextRequest) {
  // V1: Simple append to annotations.json
  // In production, this would write to Vercel Blob
  const body = await request.json();
  const { region, calendar_week, note, category, created_by } = body;

  if (!region || !calendar_week || !note || !category) {
    return NextResponse.json(
      { error: "Missing required fields: region, calendar_week, note, category" },
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

  // In production: append to Vercel Blob annotations.json
  // For now: return the created annotation
  return NextResponse.json(annotation, { status: 201 });
}
