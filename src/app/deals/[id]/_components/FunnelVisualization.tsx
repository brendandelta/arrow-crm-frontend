"use client";

import { useState } from "react";

interface FunnelVisualizationProps {
  funnel: {
    prospecting: number;
    contacted: number;
    softCircled: number;
    committed: number;
    allocated: number;
    funded: number;
  };
  onStageClick?: (stage: string) => void;
  activeStage?: string | null;
}

const stageConfig = [
  { key: "prospecting", label: "Prospecting", color: "bg-muted-foreground/30", hoverColor: "bg-muted-foreground/50" },
  { key: "contacted", label: "Contacted", color: "bg-muted-foreground/50", hoverColor: "bg-muted0" },
  { key: "softCircled", label: "Soft Circled", color: "bg-blue-400", hoverColor: "bg-blue-500" },
  { key: "committed", label: "Committed", color: "bg-purple-500", hoverColor: "bg-purple-600" },
  { key: "allocated", label: "Allocated", color: "bg-indigo-500", hoverColor: "bg-indigo-600" },
  { key: "funded", label: "Funded", color: "bg-emerald-500", hoverColor: "bg-emerald-600" },
];

export function FunnelVisualization({
  funnel,
  onStageClick,
  activeStage,
}: FunnelVisualizationProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const total = Object.values(funnel).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(funnel), 1);

  return (
    <div className="space-y-4">
      {/* Horizontal Funnel */}
      <div className="flex items-end gap-1 h-24">
        {stageConfig.map((stage, idx) => {
          const count = funnel[stage.key as keyof typeof funnel];
          const heightPct = (count / maxCount) * 100;
          const isActive = activeStage === stage.key;
          const isHovered = hoveredStage === stage.key;

          return (
            <button
              key={stage.key}
              onClick={() => onStageClick?.(stage.key)}
              onMouseEnter={() => setHoveredStage(stage.key)}
              onMouseLeave={() => setHoveredStage(null)}
              className={`
                flex-1 transition-all rounded-t relative group
                ${isHovered ? stage.hoverColor : stage.color}
                ${isActive ? "ring-2 ring-offset-2 ring-slate-900" : ""}
              `}
              style={{ height: `${Math.max(heightPct, 10)}%` }}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {stage.label}: {count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-1">
        {stageConfig.map((stage) => {
          const count = funnel[stage.key as keyof typeof funnel];
          const isActive = activeStage === stage.key;

          return (
            <button
              key={stage.key}
              onClick={() => onStageClick?.(stage.key)}
              className={`
                flex-1 text-center py-2 rounded text-sm transition-colors
                ${isActive ? "bg-muted font-medium" : "hover:bg-muted"}
              `}
            >
              <div className="text-xs text-muted-foreground">{stage.label}</div>
              <div className="font-semibold">{count}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact inline funnel for cards
export function FunnelCompact({
  funnel,
  onStageClick,
}: {
  funnel: FunnelVisualizationProps["funnel"];
  onStageClick?: (stage: string) => void;
}) {
  const total = Object.values(funnel).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex items-center gap-3 text-sm">
      {stageConfig.slice(2).map((stage) => {
        const count = funnel[stage.key as keyof typeof funnel];
        if (count === 0) return null;

        return (
          <button
            key={stage.key}
            onClick={() => onStageClick?.(stage.key)}
            className="flex items-center gap-1.5 hover:opacity-80"
          >
            <div className={`w-2 h-2 rounded-full ${stage.color}`} />
            <span className="text-muted-foreground">{stage.label}:</span>
            <span className="font-medium">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// Arrow-style funnel
export function FunnelArrow({
  funnel,
  onStageClick,
  activeStage,
}: FunnelVisualizationProps) {
  return (
    <div className="flex items-center">
      {stageConfig.map((stage, idx) => {
        const count = funnel[stage.key as keyof typeof funnel];
        const isActive = activeStage === stage.key;
        const isLast = idx === stageConfig.length - 1;

        return (
          <div key={stage.key} className="flex items-center">
            <button
              onClick={() => onStageClick?.(stage.key)}
              className={`
                relative px-4 py-2 text-white text-sm font-medium transition-all
                ${stage.color} ${isActive ? "ring-2 ring-offset-1 ring-slate-900" : ""}
                ${idx === 0 ? "rounded-l-lg" : ""}
                ${isLast ? "rounded-r-lg" : ""}
              `}
              style={{
                clipPath: isLast
                  ? undefined
                  : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
                marginRight: isLast ? 0 : "-12px",
                zIndex: stageConfig.length - idx,
              }}
            >
              <span className="relative z-10">{count}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Vertical funnel for sidebar
export function FunnelVertical({
  funnel,
  onStageClick,
  activeStage,
}: FunnelVisualizationProps) {
  const maxCount = Math.max(...Object.values(funnel), 1);

  return (
    <div className="space-y-2">
      {stageConfig.map((stage) => {
        const count = funnel[stage.key as keyof typeof funnel];
        const widthPct = (count / maxCount) * 100;
        const isActive = activeStage === stage.key;

        return (
          <button
            key={stage.key}
            onClick={() => onStageClick?.(stage.key)}
            className={`
              w-full flex items-center gap-3 group
              ${isActive ? "bg-muted rounded" : ""}
            `}
          >
            <div className="w-20 text-xs text-right text-muted-foreground group-hover:text-foreground">
              {stage.label}
            </div>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div
                className={`h-full ${stage.color} transition-all group-hover:opacity-80`}
                style={{ width: `${Math.max(widthPct, 3)}%` }}
              />
            </div>
            <div className="w-8 text-sm font-medium tabular-nums text-right">{count}</div>
          </button>
        );
      })}
    </div>
  );
}
