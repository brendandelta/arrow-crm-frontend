"use client";

import { TrendingUp, Clock, AlertTriangle, DollarSign, Target } from "lucide-react";

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

function formatCurrency(cents: number) {
  if (!cents || cents === 0) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

export function KPIStrip({ stats, onFilterClick, activeFilter }: KPIStripProps) {
  const kpis = [
    {
      key: "live",
      label: "Live Deals",
      value: stats.liveCount,
      format: "number",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      key: "softCircled",
      label: "Soft Circled",
      value: stats.totalSoftCircled,
      format: "currency",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      key: "committed",
      label: "Committed",
      value: stats.totalCommitted,
      format: "currency",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      key: "wired",
      label: "Wired",
      value: stats.totalWired,
      format: "currency",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      key: "atRisk",
      label: "At Risk",
      value: stats.atRiskCount,
      format: "number",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isActive = activeFilter === kpi.key;
        const displayValue = kpi.format === "currency"
          ? formatCurrency(kpi.value)
          : kpi.value;

        return (
          <button
            key={kpi.key}
            onClick={() => onFilterClick?.(kpi.key)}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all
              ${isActive
                ? `${kpi.bgColor} ${kpi.borderColor} ring-2 ring-offset-1 ring-${kpi.color.replace('text-', '')}`
                : 'bg-card border-border hover:border-border hover:bg-muted'
              }
            `}
          >
            <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div className="text-left">
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
              <div className={`text-lg font-semibold ${isActive ? kpi.color : ''}`}>
                {displayValue}
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
      <span className="text-muted-foreground/60">|</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{formatCurrency(stats.totalSoftCircled)}</span>
        <span className="text-muted-foreground">soft circled</span>
      </div>
      <span className="text-muted-foreground/60">|</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{formatCurrency(stats.totalCommitted)}</span>
        <span className="text-muted-foreground">committed</span>
      </div>
      <span className="text-muted-foreground/60">|</span>
      <div className="flex items-center gap-1.5">
        <span className="text-emerald-600 font-medium">{formatCurrency(stats.totalWired)}</span>
        <span className="text-muted-foreground">wired</span>
      </div>
      {stats.atRiskCount > 0 && (
        <>
          <span className="text-muted-foreground/60">|</span>
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
