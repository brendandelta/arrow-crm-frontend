"use client";

import {
  TrendingUp,
  DollarSign,
  Target,
  AlertTriangle,
  Banknote,
} from "lucide-react";
import type { FlowStats } from "./types";

function fmt(cents: number) {
  if (!cents || cents === 0) return "$0";
  const d = cents / 100;
  if (d >= 1_000_000_000) return `$${(d / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (d >= 1_000_000) return `$${(d / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (d >= 1_000) return `$${(d / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${d.toFixed(0)}`;
}

interface FlowMetricsProps {
  stats: FlowStats | null;
  activeFilter: string | null;
  onFilterClick: (key: string) => void;
  deals: { status: string; blocksValue: number }[];
}

export function FlowMetrics({
  stats,
  activeFilter,
  onFilterClick,
  deals,
}: FlowMetricsProps) {
  if (!stats) return null;

  const totalValue = deals.reduce((s, d) => s + (d.blocksValue || 0), 0);
  const closedValue = deals
    .filter((d) => d.status === "closed")
    .reduce((s, d) => s + (d.blocksValue || 0), 0);
  const sourcingCount = deals.filter((d) => d.status === "sourcing").length;
  const closedCount = deals.filter((d) => d.status === "closed").length;
  const convRate =
    sourcingCount > 0
      ? ((closedCount / sourcingCount) * 100).toFixed(0)
      : null;

  const kpis = [
    {
      key: "live",
      label: "Live",
      value: String(stats.liveCount),
      icon: TrendingUp,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
    },
    {
      key: "softCircled",
      label: "Soft Circled",
      value: fmt(stats.totalSoftCircled),
      icon: Target,
      accent: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-200",
    },
    {
      key: "committed",
      label: "Committed",
      value: fmt(stats.totalCommitted),
      icon: DollarSign,
      accent: "text-violet-600",
      bg: "bg-violet-50",
      ring: "ring-violet-200",
    },
    {
      key: "wired",
      label: "Wired",
      value: fmt(stats.totalWired),
      icon: Banknote,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
    },
    {
      key: "atRisk",
      label: "At Risk",
      value: String(stats.atRiskCount),
      icon: AlertTriangle,
      accent: "text-red-600",
      bg: "bg-red-50",
      ring: "ring-red-200",
    },
  ];

  return (
    <div className="space-y-2">
      {/* Primary KPI cards */}
      <div className="grid grid-cols-5 gap-2">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isActive = activeFilter === kpi.key;
          return (
            <button
              key={kpi.key}
              onClick={() => onFilterClick(kpi.key)}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all text-left ${
                isActive
                  ? `${kpi.bg} ${kpi.ring} ring-1 border-transparent`
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className={`p-1.5 rounded-md ${kpi.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${kpi.accent}`} />
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground leading-none">
                  {kpi.label}
                </div>
                <div
                  className={`text-base font-semibold tabular-nums leading-tight ${
                    isActive ? kpi.accent : ""
                  }`}
                >
                  {kpi.value}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Secondary inline stats */}
      <div className="flex items-center gap-4 px-1 text-[11px] text-muted-foreground">
        <span>
          <strong className="font-medium text-foreground">{stats.totalDeals}</strong>{" "}
          total deals
        </span>
        <span className="text-slate-300">|</span>
        <span>
          <strong className="font-medium text-foreground">{fmt(totalValue)}</strong>{" "}
          pipeline
        </span>
        <span className="text-slate-300">|</span>
        <span>
          <strong className="font-medium text-foreground">{fmt(closedValue)}</strong>{" "}
          closed
        </span>
        {convRate && (
          <>
            <span className="text-slate-300">|</span>
            <span>
              <strong className="font-medium text-foreground">{convRate}%</strong>{" "}
              conversion
            </span>
          </>
        )}
      </div>
    </div>
  );
}
