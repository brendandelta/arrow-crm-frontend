"use client";

import { TrendingUp, AlertTriangle, DollarSign, Target, Banknote } from "lucide-react";

interface KPIStripProps {
  stats: {
    liveCount: number;
    totalSoftCircled: number;
    totalCommitted: number;
    totalWired: number;
    atRiskCount: number;
    overdueTasksCount?: number;
  };
  onFilterClick?: (filter: string) => void;
  activeFilter?: string;
}

function fmt(cents: number) {
  if (!cents || cents === 0) return "$0";
  const d = cents / 100;
  if (d >= 1_000_000_000) return `$${(d / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (d >= 1_000_000) return `$${(d / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (d >= 1_000) return `$${(d / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${d.toFixed(0)}`;
}

export function KPIStrip({ stats, onFilterClick, activeFilter }: KPIStripProps) {
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
    <div className="grid grid-cols-5 gap-2">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isActive = activeFilter === kpi.key;

        return (
          <button
            key={kpi.key}
            onClick={() => onFilterClick?.(kpi.key)}
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
  );
}

// Compact version for smaller spaces
export function KPIStripCompact({ stats }: { stats: KPIStripProps["stats"] }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-green-600 font-medium">{stats.liveCount}</span>
        <span className="text-muted-foreground">live</span>
      </div>
      <span className="text-slate-300">|</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{fmt(stats.totalSoftCircled)}</span>
        <span className="text-muted-foreground">soft circled</span>
      </div>
      <span className="text-slate-300">|</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{fmt(stats.totalCommitted)}</span>
        <span className="text-muted-foreground">committed</span>
      </div>
      <span className="text-slate-300">|</span>
      <div className="flex items-center gap-1.5">
        <span className="text-emerald-600 font-medium">{fmt(stats.totalWired)}</span>
        <span className="text-muted-foreground">wired</span>
      </div>
      {stats.atRiskCount > 0 && (
        <>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-red-600 font-medium">{stats.atRiskCount}</span>
            <span className="text-muted-foreground">at risk</span>
          </div>
        </>
      )}
    </div>
  );
}
