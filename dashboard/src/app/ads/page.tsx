"use client";

import { useState } from "react";
import { Search, Grid3X3, List, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRegion } from "@/hooks/useRegion";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { FunnelStage, AdFormat, CreativeType, AwarenessLevel } from "@/lib/types";

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

export default function AdsLibraryPage() {
  const { region, currency } = useRegion();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stageFilter, setStageFilter] = useState<FunnelStage | "ALL">("ALL");
  const [formatFilter, setFormatFilter] = useState<AdFormat | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CreativeType | "all">("all");
  const [awarenessFilter, setAwarenessFilter] = useState<AwarenessLevel | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ads Library</h1>
        <p className="text-sm text-muted-foreground">
          Jockey {region} — All ad creatives with performance metrics ({CURRENCY_SYMBOL[currency]})
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search by product, avatar, hook, Joc ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filter rows */}
      <div className="space-y-2">
        {/* Row 1: Funnel Stage + Format */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center mr-1">Stage:</span>
          {FUNNEL_STAGES.map((stage) => (
            <Badge
              key={stage.value}
              variant={stageFilter === stage.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs",
                stageFilter === stage.value && "bg-primary text-primary-foreground"
              )}
              onClick={() => setStageFilter(stage.value)}
            >
              {stage.label}
            </Badge>
          ))}
          <span className="text-border mx-1">|</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center mr-1">Format:</span>
          {FORMAT_FILTERS.map((fmt) => (
            <Badge
              key={fmt.value}
              variant={formatFilter === fmt.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs",
                formatFilter === fmt.value && "bg-accent text-accent-foreground"
              )}
              onClick={() => setFormatFilter(fmt.value)}
            >
              {fmt.label}
            </Badge>
          ))}
        </div>

        {/* Row 2: Type + Awareness */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center mr-1">Type:</span>
          {TYPE_FILTERS.map((t) => (
            <Badge
              key={t.value}
              variant={typeFilter === t.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs",
                typeFilter === t.value && "bg-primary text-primary-foreground"
              )}
              onClick={() => setTypeFilter(t.value)}
            >
              {t.label}
            </Badge>
          ))}
          <span className="text-border mx-1">|</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center mr-1">Awareness:</span>
          {AWARENESS_FILTERS.map((a) => (
            <Badge
              key={a.value}
              variant={awarenessFilter === a.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs",
                awarenessFilter === a.value && "bg-accent text-accent-foreground"
              )}
              onClick={() => setAwarenessFilter(a.value)}
            >
              {a.label}
            </Badge>
          ))}
          <span className="text-border mx-1">|</span>
          {/* View Toggle */}
          <div className="flex gap-1 ml-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-2 h-6"
            >
              <Grid3X3 size={12} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-2 h-6"
            >
              <List size={12} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <Card className="glass-card border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Filter size={32} className="mb-3 opacity-50" />
            <p className="text-sm font-medium">No ads loaded yet</p>
            <p className="text-xs mt-1">
              Connect your Meta API credentials to load ad data with creative previews.
            </p>
            <p className="text-xs mt-4 max-w-md text-center">
              Naming convention parser is ready. Ads will be parsed into: Product, Avatar, Hook/Angle,
              Funnel Stage (TOFU/MOFU/BOFU), Format (Static/Video/Carousel), Type (New Concept/Iteration),
              and Awareness Level.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
