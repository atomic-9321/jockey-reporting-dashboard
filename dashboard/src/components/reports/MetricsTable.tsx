"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import type { Campaign, CampaignMetrics, AnomalyFlag } from "@/lib/types";
import type { Currency } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MetricsTableProps {
  campaigns: Array<{
    name: string;
    metrics: CampaignMetrics;
    anomalies?: AnomalyFlag[];
  }>;
  currency: Currency;
}

function MetricCell({
  value,
  formatter,
  anomaly,
}: {
  value: number | null;
  formatter: (v: number | null) => string;
  anomaly?: AnomalyFlag;
}) {
  const display = formatter(value);

  if (anomaly) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="flex items-center gap-1">
            {display}
            <AlertTriangle size={12} className="text-amber-400/80" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{anomaly.reason}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <span className={value === null ? "text-muted-foreground/40" : "tabular-nums"}>{display}</span>;
}

export function MetricsTable({ campaigns, currency }: MetricsTableProps) {
  const currencyFormatter = (v: number | null) => formatCurrency(v, currency);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            <TableHead className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Campaign</TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-right">Investment</TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-right">Impressions</TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-right">Unique Link Clicks</TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-right">CTR</TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-right">Purchases</TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-right">Revenue</TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-right">ROAS</TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider text-right">CPA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign, idx) => {
            const getAnomaly = (metric: string) =>
              campaign.anomalies?.find((a) => a.metric === metric);

            return (
              <TableRow key={idx} className="border-border/20 cyber-table-row">
                <TableCell className="text-sm font-medium max-w-[200px] truncate">
                  {campaign.name}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <MetricCell
                    value={campaign.metrics.spend}
                    formatter={currencyFormatter}
                    anomaly={getAnomaly("spend")}
                  />
                </TableCell>
                <TableCell className="text-right text-sm">
                  <MetricCell
                    value={campaign.metrics.impressions}
                    formatter={formatNumber}
                    anomaly={getAnomaly("impressions")}
                  />
                </TableCell>
                <TableCell className="text-right text-sm">
                  <MetricCell
                    value={campaign.metrics.clicks}
                    formatter={formatNumber}
                    anomaly={getAnomaly("clicks")}
                  />
                </TableCell>
                <TableCell className="text-right text-sm">
                  <MetricCell
                    value={campaign.metrics.ctr}
                    formatter={formatPercent}
                  />
                </TableCell>
                <TableCell className="text-right text-sm">
                  <MetricCell
                    value={campaign.metrics.purchases}
                    formatter={formatNumber}
                    anomaly={getAnomaly("purchases")}
                  />
                </TableCell>
                <TableCell className="text-right text-sm">
                  <MetricCell
                    value={campaign.metrics.purchase_value}
                    formatter={currencyFormatter}
                  />
                </TableCell>
                <TableCell className="text-right text-sm">
                  <MetricCell
                    value={campaign.metrics.roas}
                    formatter={(v) => (v !== null ? `${v}x` : "N/A")}
                    anomaly={getAnomaly("roas")}
                  />
                </TableCell>
                <TableCell className="text-right text-sm">
                  <MetricCell
                    value={campaign.metrics.cpa}
                    formatter={currencyFormatter}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
