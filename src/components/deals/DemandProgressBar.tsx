"use client";

import { useState } from "react";

interface DemandProgressBarProps {
  target?: number;
  softCircled: number;
  committed: number;
  wired: number;
  inventory?: number;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
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

export function DemandProgressBar({
  target,
  softCircled,
  committed,
  wired,
  inventory,
  showLabels = false,
  size = "md",
}: DemandProgressBarProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Use inventory or target as the base, whichever is larger
  const base = Math.max(target || 0, inventory || 0, softCircled + committed + wired);
  if (base === 0) return <span className="text-muted-foreground text-sm">No data</span>;

  // Calculate percentages
  const wiredPct = (wired / base) * 100;
  const committedPct = (committed / base) * 100;
  const softCircledPct = (softCircled / base) * 100;

  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const segments = [
    {
      key: "wired",
      label: "Wired",
      value: wired,
      pct: wiredPct,
      color: "bg-emerald-500",
      hoverColor: "bg-emerald-600",
    },
    {
      key: "committed",
      label: "Committed",
      value: committed,
      pct: committedPct,
      color: "bg-purple-500",
      hoverColor: "bg-purple-600",
    },
    {
      key: "softCircled",
      label: "Soft Circled",
      value: softCircled,
      pct: softCircledPct,
      color: "bg-blue-400",
      hoverColor: "bg-blue-500",
    },
  ];

  return (
    <div className="relative">
      <div className={`flex ${heights[size]} bg-muted rounded-full overflow-hidden`}>
        {segments.map((segment) => (
          segment.pct > 0 && (
            <div
              key={segment.key}
              className={`${hoveredSegment === segment.key ? segment.hoverColor : segment.color} transition-all cursor-pointer`}
              style={{ width: `${segment.pct}%` }}
              onMouseEnter={() => setHoveredSegment(segment.key)}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredSegment && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {segments.find((s) => s.key === hoveredSegment)?.label}:{" "}
          {formatCurrency(segments.find((s) => s.key === hoveredSegment)?.value || 0)}
        </div>
      )}

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {segments.map((segment) => (
              <div key={segment.key} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${segment.color}`} />
                <span>{segment.label}: {formatCurrency(segment.value)}</span>
              </div>
            ))}
          </div>
          {(target || inventory) && (
            <span>
              {inventory ? `Inventory: ${formatCurrency(inventory)}` : `Target: ${formatCurrency(target || 0)}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Vertical funnel visualization for detail pages
export function DemandFunnel({
  funnel,
  onStageClick,
}: {
  funnel: {
    prospecting: number;
    contacted: number;
    softCircled: number;
    committed: number;
    allocated: number;
    funded: number;
  };
  onStageClick?: (stage: string) => void;
}) {
  const stages = [
    { key: "prospecting", label: "Prospecting", count: funnel.prospecting, color: "bg-muted" },
    { key: "contacted", label: "Contacted", count: funnel.contacted, color: "bg-muted" },
    { key: "softCircled", label: "Soft Circled", count: funnel.softCircled, color: "bg-blue-400" },
    { key: "committed", label: "Committed", count: funnel.committed, color: "bg-purple-500" },
    { key: "allocated", label: "Allocated", count: funnel.allocated, color: "bg-indigo-500" },
    { key: "funded", label: "Funded", count: funnel.funded, color: "bg-emerald-500" },
  ];

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-2">
      {stages.map((stage) => {
        const widthPct = (stage.count / maxCount) * 100;
        return (
          <button
            key={stage.key}
            onClick={() => onStageClick?.(stage.key)}
            className="w-full flex items-center gap-3 group"
          >
            <div className="w-24 text-xs text-right text-muted-foreground group-hover:text-foreground transition-colors">
              {stage.label}
            </div>
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div
                className={`h-full ${stage.color} transition-all group-hover:opacity-80`}
                style={{ width: `${Math.max(widthPct, 2)}%` }}
              />
            </div>
            <div className="w-8 text-sm font-medium tabular-nums">
              {stage.count}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Compact inline version for table rows
export function DemandProgressInline({
  softCircled,
  committed,
  wired,
  inventory,
}: {
  softCircled: number;
  committed: number;
  wired: number;
  inventory: number;
}) {
  const total = softCircled + committed + wired;
  const coverageRatio = inventory > 0 ? Math.round((total / inventory) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <DemandProgressBar
        softCircled={softCircled}
        committed={committed}
        wired={wired}
        inventory={inventory}
        size="sm"
      />
      <span className="text-xs text-muted-foreground tabular-nums w-10">
        {coverageRatio}%
      </span>
    </div>
  );
}
