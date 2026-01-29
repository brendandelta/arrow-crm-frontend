"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { STATUS_ORDER, STATUS_CONFIG } from "./types";
import { formatCurrency } from "../utils";
import type { FlowDeal, FlowStats } from "./types";

interface FunnelDrawerProps {
  open: boolean;
  onClose: () => void;
  deals: FlowDeal[];
  stats: FlowStats | null;
}

interface StageInfo {
  status: string;
  label: string;
  count: number;
  value: number;
  avgCoverage: number | null;
  avgDays: number | null;
  dotColor: string;
}

export function FunnelDrawer({ open, onClose, deals, stats }: FunnelDrawerProps) {
  const stages: StageInfo[] = STATUS_ORDER.map((status) => {
    const cfg = STATUS_CONFIG[status];
    const stageDeals = deals.filter((d) => d.status === status);
    const value = stageDeals.reduce((s, d) => s + (d.blocksValue || 0), 0);
    const coverages = stageDeals
      .map((d) => d.coverageRatio)
      .filter((c): c is number => c !== null);
    const avgCoverage =
      coverages.length > 0
        ? Math.round(coverages.reduce((a, b) => a + b, 0) / coverages.length)
        : null;
    const daysArr = stageDeals
      .map((d) => d.daysUntilClose)
      .filter((d): d is number => d !== null);
    const avgDays =
      daysArr.length > 0
        ? Math.round(daysArr.reduce((a, b) => a + b, 0) / daysArr.length)
        : null;

    return {
      status,
      label: cfg.label,
      count: stageDeals.length,
      value,
      avgCoverage,
      avgDays,
      dotColor: cfg.dotColor,
    };
  });

  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  // Conversion rates between adjacent stages
  const conversions: { from: string; to: string; rate: string | null }[] = [];
  for (let i = 0; i < stages.length - 1; i++) {
    const from = stages[i];
    const to = stages[i + 1];
    const rate =
      from.count > 0 ? ((to.count / from.count) * 100).toFixed(0) : null;
    conversions.push({ from: from.label, to: to.label, rate });
  }

  // Aging distribution
  const agingBuckets = [
    {
      label: "< 7 days",
      count: deals.filter(
        (d) => d.daysUntilClose !== null && d.daysUntilClose >= 0 && d.daysUntilClose <= 7
      ).length,
    },
    {
      label: "7-30 days",
      count: deals.filter(
        (d) => d.daysUntilClose !== null && d.daysUntilClose > 7 && d.daysUntilClose <= 30
      ).length,
    },
    {
      label: "30+ days",
      count: deals.filter(
        (d) => d.daysUntilClose !== null && d.daysUntilClose > 30
      ).length,
    },
    {
      label: "Overdue",
      count: deals.filter(
        (d) => d.daysUntilClose !== null && d.daysUntilClose < 0
      ).length,
    },
    {
      label: "No date",
      count: deals.filter((d) => d.daysUntilClose === null).length,
    },
  ];
  const maxAging = Math.max(...agingBuckets.map((b) => b.count), 1);

  // Coverage distribution
  const coverageBuckets = [
    {
      label: "0-30%",
      count: deals.filter(
        (d) => d.coverageRatio !== null && d.coverageRatio < 30
      ).length,
      color: "bg-red-400",
    },
    {
      label: "30-60%",
      count: deals.filter(
        (d) => d.coverageRatio !== null && d.coverageRatio >= 30 && d.coverageRatio < 60
      ).length,
      color: "bg-amber-400",
    },
    {
      label: "60-100%",
      count: deals.filter(
        (d) => d.coverageRatio !== null && d.coverageRatio >= 60 && d.coverageRatio < 100
      ).length,
      color: "bg-blue-400",
    },
    {
      label: "100%+",
      count: deals.filter(
        (d) => d.coverageRatio !== null && d.coverageRatio >= 100
      ).length,
      color: "bg-emerald-400",
    },
    {
      label: "N/A",
      count: deals.filter((d) => d.coverageRatio === null).length,
      color: "bg-slate-300",
    },
  ];
  const maxCoverage = Math.max(...coverageBuckets.map((b) => b.count), 1);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="bottom">
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <DrawerTitle>Pipeline Funnel</DrawerTitle>
            <DrawerDescription>
              Stage totals, conversions, aging, and coverage
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <button className="p-2 rounded-md hover:bg-slate-100 transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-3 gap-8">
            {/* Stage funnel */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Stage Breakdown</h3>
              <div className="space-y-2">
                {stages.map((stage, i) => (
                  <div key={stage.status}>
                    <div className="flex items-center gap-3">
                      <div className="w-16 text-right">
                        <span className="text-xs text-muted-foreground">
                          {stage.label}
                        </span>
                      </div>
                      <div className="flex-1 flex gap-1 items-center">
                        <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                          <div
                            className={`h-full ${stage.dotColor} rounded transition-all`}
                            style={{
                              width: `${Math.max(
                                (stage.count / maxCount) * 100,
                                2
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums w-6 text-right">
                          {stage.count}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                        {formatCurrency(stage.value)}
                      </span>
                    </div>
                    {conversions[i] && conversions[i].rate && (
                      <div className="ml-[76px] my-0.5 text-[10px] text-muted-foreground">
                        → {conversions[i].rate}% pass to{" "}
                        {conversions[i].to}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Aging distribution */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Close Date Distribution</h3>
              <div className="space-y-2">
                {agingBuckets.map((bucket) => (
                  <div key={bucket.label} className="flex items-center gap-3">
                    <div className="w-16 text-right">
                      <span className="text-xs text-muted-foreground">
                        {bucket.label}
                      </span>
                    </div>
                    <div className="flex-1 flex gap-1 items-center">
                      <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all ${
                            bucket.label === "Overdue"
                              ? "bg-red-400"
                              : bucket.label === "< 7 days"
                              ? "bg-amber-400"
                              : "bg-slate-400"
                          }`}
                          style={{
                            width: `${Math.max(
                              (bucket.count / maxAging) * 100,
                              2
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium tabular-nums w-6 text-right">
                        {bucket.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coverage distribution */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Coverage Distribution</h3>
              <div className="space-y-2">
                {coverageBuckets.map((bucket) => (
                  <div key={bucket.label} className="flex items-center gap-3">
                    <div className="w-16 text-right">
                      <span className="text-xs text-muted-foreground">
                        {bucket.label}
                      </span>
                    </div>
                    <div className="flex-1 flex gap-1 items-center">
                      <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                        <div
                          className={`h-full ${bucket.color} rounded transition-all`}
                          style={{
                            width: `${Math.max(
                              (bucket.count / maxCoverage) * 100,
                              2
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium tabular-nums w-6 text-right">
                        {bucket.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
