"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Grid3X3, List, Filter, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdCard } from "@/components/ads/AdCard";
import { AdInsightsModal } from "@/components/ads/AdInsightsModal";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { useRegion } from "@/hooks/useRegion";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { getAdMetricsForPeriod, getAvailableCWs, cwKeysForDateRange } from "@/lib/metrics";
import { parseAdName } from "@/lib/ad-name-parser";
import { cn } from "@/lib/utils";
import type {
  FunnelStage,
  AdFormat,
  CreativeType,
  AwarenessLevel,
  Ad,
  AdMetrics,
  Campaign,
} from "@/lib/types";

const FUNNEL_STAGES: Array<{ value: FunnelStage | "ALL"; label: string }> = [
  { value: "ALL", label: "All Stages" },
  { value: "TOF", label: "TOF" },
  { value: "MOF", label: "MOF" },
  { value: "BOF", label: "BOF" },
];

const FORMAT_FILTERS: Array<{ value: AdFormat | "all"; label: string }> = [
  { value: "all", label: "All Formats" },
  { value: "static", label: "Static" },
  { value: "video", label: "Video" },
  { value: "carousel", label: "Carousel" },
];

const TYPE_FILTERS: Array<{ value: CreativeType | "all"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "New Concept", label: "New Concept" },
  { value: "Iteration", label: "Iteration" },
];

const AWARENESS_FILTERS: Array<{ value: AwarenessLevel | "all"; label: string }> = [
  { value: "all", label: "All Awareness" },
  { value: "Solution Aware", label: "Solution Aware" },
  { value: "Product/Brand Aware", label: "Product Aware" },
  { value: "Most Aware", label: "Most Aware" },
];

const SORT_OPTIONS = [
  { value: "spend", label: "Investment" },
  { value: "roas", label: "ROAS" },
  { value: "purchases", label: "Purchases" },
  { value: "ctr", label: "CTR" },
  { value: "conversion_rate", label: "Conv. Rate" },
] as const;

type SortField = (typeof SORT_OPTIONS)[number]["value"];

export default function AdsLibraryPage() {
  const { region, currency } = useRegion();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stageFilter, setStageFilter] = useState<FunnelStage | "ALL">("ALL");
  const [formatFilter, setFormatFilter] = useState<AdFormat | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CreativeType | "all">("all");
  const [awarenessFilter, setAwarenessFilter] = useState<AwarenessLevel | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("spend");
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [allCWs, setAllCWs] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [selectedAd, setSelectedAd] = useState<{ ad: Ad; metrics: AdMetrics } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/${region.toLowerCase()}`)
      .then((r) => r.json())
      .then((d) => {
        const rawAds = d.ads?.ads || [];
        const parsed: Ad[] = rawAds.map((ad: Ad) => ({
          ...ad,
          parsed_name: parseAdName(ad.ad_name),
        }));
        setAds(parsed);
        const campaigns: Campaign[] = d.campaigns?.campaigns || [];
        setAllCWs(getAvailableCWs(campaigns));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [region]);

  // Compute filtered CW keys based on date range
  const activeCWKeys = useMemo(() => {
    if (!dateRange) return allCWs;
    return cwKeysForDateRange(allCWs, dateRange.startDate, dateRange.endDate);
  }, [allCWs, dateRange]);

  const adsWithMetrics = useMemo(() => {
    return ads.map((ad) => {
      const adCWKeys = Object.keys(ad.weekly_breakdown || {});
      // Intersect ad's available CWs with the active date range CWs
      const filteredCWKeys = activeCWKeys.length < allCWs.length
        ? adCWKeys.filter((cw) => activeCWKeys.includes(cw))
        : adCWKeys;
      const metrics = getAdMetricsForPeriod(ad, filteredCWKeys);
      return { ad, metrics };
    });
  }, [ads, activeCWKeys, allCWs]);

  const filteredAds = useMemo(() => {
    let result = adsWithMetrics;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(({ ad }) => {
        const p = ad.parsed_name;
        return (
          ad.ad_name.toLowerCase().includes(q) ||
          p.product_name.toLowerCase().includes(q) ||
          p.avatar.toLowerCase().includes(q) ||
          p.hook_angle.toLowerCase().includes(q) ||
          p.joc_id.toLowerCase().includes(q) ||
          ad.campaign_name.toLowerCase().includes(q)
        );
      });
    }

    if (stageFilter !== "ALL") {
      result = result.filter(({ ad }) => ad.parsed_name.funnel_stage === stageFilter);
    }
    if (formatFilter !== "all") {
      result = result.filter(({ ad }) => ad.parsed_name.format === formatFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter(({ ad }) => ad.parsed_name.creative_type === typeFilter);
    }
    if (awarenessFilter !== "all") {
      result = result.filter(({ ad }) => ad.parsed_name.awareness_level === awarenessFilter);
    }

    result.sort((a, b) => {
      const aVal = (a.metrics as unknown as Record<string, number | null>)[sortBy] ?? 0;
      const bVal = (b.metrics as unknown as Record<string, number | null>)[sortBy] ?? 0;
      return (bVal as number) - (aVal as number);
    });

    return result;
  }, [adsWithMetrics, searchQuery, stageFilter, formatFilter, typeFilter, awarenessFilter, sortBy]);

  const parsedCount = ads.filter((a) => a.parsed_name.parse_success).length;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Ads Library</h1>
        <p className="text-sm text-muted-foreground/70 font-mono">
          Jockey {region} &middot; {ads.length} ads, {parsedCount} parsed ({CURRENCY_SYMBOL[currency]})
        </p>
      </div>

      {/* Search + Date Range */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
          />
          <input
            type="text"
            placeholder="Search by product, avatar, hook, Joc ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg cyber-input text-sm placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Filter rows */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mr-1 font-mono">Stage</span>
          {FUNNEL_STAGES.map((stage) => (
            <Badge
              key={stage.value}
              variant={stageFilter === stage.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs transition-all duration-300",
                stageFilter === stage.value
                  ? "bg-primary text-primary-foreground badge-glow"
                  : "border-border/30 hover:border-primary/20 hover:bg-primary/5"
              )}
              onClick={() => setStageFilter(stage.value)}
            >
              {stage.label}
            </Badge>
          ))}
          <div className="w-px h-4 bg-border/20 mx-1" />
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mr-1 font-mono">Format</span>
          {FORMAT_FILTERS.map((fmt) => (
            <Badge
              key={fmt.value}
              variant={formatFilter === fmt.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs transition-all duration-300",
                formatFilter === fmt.value
                  ? "bg-accent text-accent-foreground shadow-[0_0_12px_oklch(0.72_0.16_280_/_15%)]"
                  : "border-border/30 hover:border-accent/20 hover:bg-accent/5"
              )}
              onClick={() => setFormatFilter(fmt.value)}
            >
              {fmt.label}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mr-1 font-mono">Type</span>
          {TYPE_FILTERS.map((t) => (
            <Badge
              key={t.value}
              variant={typeFilter === t.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs transition-all duration-300",
                typeFilter === t.value
                  ? "bg-primary text-primary-foreground badge-glow"
                  : "border-border/30 hover:border-primary/20 hover:bg-primary/5"
              )}
              onClick={() => setTypeFilter(t.value)}
            >
              {t.label}
            </Badge>
          ))}
          <div className="w-px h-4 bg-border/20 mx-1" />
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mr-1 font-mono">Awareness</span>
          {AWARENESS_FILTERS.map((a) => (
            <Badge
              key={a.value}
              variant={awarenessFilter === a.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs transition-all duration-300",
                awarenessFilter === a.value
                  ? "bg-accent text-accent-foreground shadow-[0_0_12px_oklch(0.72_0.16_280_/_15%)]"
                  : "border-border/30 hover:border-accent/20 hover:bg-accent/5"
              )}
              onClick={() => setAwarenessFilter(a.value)}
            >
              {a.label}
            </Badge>
          ))}
          <div className="w-px h-4 bg-border/20 mx-1" />
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mr-1 font-mono">Sort</span>
          {SORT_OPTIONS.map((s) => (
            <Badge
              key={s.value}
              variant={sortBy === s.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs transition-all duration-300",
                sortBy === s.value
                  ? "bg-primary text-primary-foreground badge-glow"
                  : "border-border/30 hover:border-primary/20 hover:bg-primary/5"
              )}
              onClick={() => setSortBy(s.value)}
            >
              {s.label}
            </Badge>
          ))}
          <div className="flex gap-1 ml-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-2 h-7 transition-all duration-300",
                viewMode === "grid" && "shadow-[0_0_10px_oklch(0.78_0.17_195_/_15%)]"
              )}
            >
              <Grid3X3 size={12} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "px-2 h-7 transition-all duration-300",
                viewMode === "list" && "shadow-[0_0_10px_oklch(0.78_0.17_195_/_15%)]"
              )}
            >
              <List size={12} />
            </Button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground/50 font-mono">
        {filteredAds.length} / {ads.length} ads
        {dateRange && ` \u00B7 ${activeCWKeys.length} weeks selected`}
      </p>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Filter size={32} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">No ads match your filters</p>
          <p className="text-xs mt-1 text-muted-foreground/50">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-3"
          )}
        >
          {filteredAds.map(({ ad, metrics }) => (
            <AdCard
              key={ad.ad_id}
              ad={ad}
              metrics={metrics}
              currency={currency}
              onClick={() => setSelectedAd({ ad, metrics })}
            />
          ))}
        </div>
      )}

      <AdInsightsModal
        ad={selectedAd?.ad ?? null}
        metrics={selectedAd?.metrics ?? null}
        currency={currency}
        region={region}
        open={!!selectedAd}
        onClose={() => setSelectedAd(null)}
      />
    </div>
  );
}
