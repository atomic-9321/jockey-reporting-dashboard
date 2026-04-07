/**
 * Ad naming convention parser for Jockey creative assets.
 *
 * Format: Month #Week_Joc ID_Market_Hook/Angle_Brand_Avatar_Product_Type_Format_Funnel Stage_Awareness Level_Placement
 * Delimiter: underscore `_`
 * 12 fields + optional PROMOCODE suffix
 *
 * Examples:
 *   March #05_Joc 165_UK_Visual proof of smoothing_Jockey_The Active Comparer_Back Smoothing Bra_Iteration_Static_TOFU_Solution Aware_MP
 *   March #03_Joc 166_EU_25% OFF Spring Cleaning_Jockey_all_all_New Concept_Static_TOFU_Product/Brand Aware_MP PROMOCODE: SPRINGCLEAN
 */

import type {
  ParsedAdName,
  FunnelStage,
  AdFormat,
  AwarenessLevel,
  CreativeType,
  Placement,
} from "./types";

const DELIMITER = "_";

// ── Field mappers ──

const FUNNEL_STAGE_MAP: Record<string, FunnelStage> = {
  tofu: "TOF",
  mofu: "MOF",
  bofu: "BOF",
  tof: "TOF",
  mof: "MOF",
  bof: "BOF",
};

const FORMAT_MAP: Record<string, AdFormat> = {
  static: "static",
  video: "video",
  carousel: "carousel",
  gif: "static", // GIFs treated as static for metric purposes
};

const AWARENESS_MAP: Record<string, AwarenessLevel> = {
  "solution aware": "Solution Aware",
  "product/brand aware": "Product/Brand Aware",
  "most aware": "Most Aware",
};

const TYPE_MAP: Record<string, CreativeType> = {
  "new concept": "New Concept",
  iteration: "Iteration",
};

const PLACEMENT_MAP: Record<string, Placement> = {
  mp: "MP",
  feed: "Feed",
  stories: "Stories",
  reels: "Reels",
};

function emptyParsed(rawName: string): ParsedAdName {
  return {
    month_week: "",
    joc_id: "",
    market: "",
    hook_angle: "",
    brand: "",
    avatar: "",
    product_name: rawName || "Unknown",
    creative_type: "Unknown",
    format: "unknown",
    funnel_stage: "UNKNOWN",
    awareness_level: "Unknown",
    placement: "Unknown",
    promo_code: null,
    raw_name: rawName,
    parse_success: false,
  };
}

export function parseAdName(rawName: string): ParsedAdName {
  if (!rawName) return emptyParsed(rawName);

  // Check for PROMOCODE suffix
  let nameWithoutPromo = rawName;
  let promoCode: string | null = null;
  const promoMatch = rawName.match(/\s*PROMOCODE:\s*(\S+)\s*$/i);
  if (promoMatch) {
    promoCode = promoMatch[1];
    nameWithoutPromo = rawName.slice(0, promoMatch.index).trim();
  }

  const segments = nameWithoutPromo.split(DELIMITER).map((s) => s.trim());

  // Need at least 12 fields for a valid name
  if (segments.length < 12) {
    return emptyParsed(rawName);
  }

  const monthWeek = segments[0] || "";
  const jocId = segments[1] || "";
  const market = segments[2] || "";
  const hookAngle = segments[3] || "";
  const brand = segments[4] || "";
  const avatar = segments[5] || "";
  const productName = segments[6] || "";
  const typeRaw = (segments[7] || "").toLowerCase();
  const formatRaw = (segments[8] || "").toLowerCase();
  const funnelRaw = (segments[9] || "").toLowerCase();
  const awarenessRaw = (segments[10] || "").toLowerCase();
  // Placement might have PROMOCODE attached if we didn't catch it above
  const placementRaw = (segments[11] || "").toLowerCase().replace(/\s*promocode:.*$/i, "").trim();

  const funnelStage = FUNNEL_STAGE_MAP[funnelRaw] || "UNKNOWN";
  const format = FORMAT_MAP[formatRaw] || "unknown";
  const awarenessLevel = AWARENESS_MAP[awarenessRaw] || "Unknown";
  const creativeType = TYPE_MAP[typeRaw] || "Unknown";
  const placement = PLACEMENT_MAP[placementRaw] || "Unknown";

  const parseSuccess =
    funnelStage !== "UNKNOWN" && format !== "unknown" && jocId !== "";

  return {
    month_week: monthWeek,
    joc_id: jocId,
    market,
    hook_angle: hookAngle,
    brand,
    avatar: avatar === "all" ? "All Audiences" : avatar,
    product_name: productName === "all" ? "All Products" : productName,
    creative_type: creativeType,
    format,
    funnel_stage: funnelStage,
    awareness_level: awarenessLevel,
    placement,
    promo_code: promoCode,
    raw_name: rawName,
    parse_success: parseSuccess,
  };
}

// ── Display helpers ──

export function getFunnelStageColor(stage: FunnelStage): string {
  switch (stage) {
    case "TOF":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "MOF":
      return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    case "BOF":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
}

export function getFormatIcon(format: AdFormat): string {
  switch (format) {
    case "video":
      return "play-circle";
    case "carousel":
      return "layers";
    case "static":
      return "image";
    default:
      return "help-circle";
  }
}

export function getAwarenessColor(level: AwarenessLevel): string {
  switch (level) {
    case "Solution Aware":
      return "bg-cyan-500/15 text-cyan-300 border-cyan-500/20";
    case "Product/Brand Aware":
      return "bg-violet-500/15 text-violet-300 border-violet-500/20";
    case "Most Aware":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  }
}

export function getTypeColor(type: CreativeType): string {
  switch (type) {
    case "New Concept":
      return "bg-amber-500/15 text-amber-300 border-amber-500/20";
    case "Iteration":
      return "bg-blue-500/15 text-blue-300 border-blue-500/20";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  }
}
