"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { formatCapital } from "@/lib/capital-map-api";
import type { BlockNodeData } from "../types";

function BlockNodeComponent({ id, data }: NodeProps) {
  const {
    label,
    isSelected,
    isDimmed,
    sellerName,
    totalCents,
    filledPct,
    interests,
    onSelect,
  } = data as unknown as BlockNodeData;

  const [showTooltip, setShowTooltip] = useState(false);

  const displayName = sellerName || label || "Unnamed Block";
  const filledPctClamped = Math.min(100, Math.max(0, filledPct));

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="relative px-3 py-2.5 rounded-lg bg-white cursor-pointer select-none transition-all duration-150 hover:-translate-y-0.5"
      style={{
        border: isSelected ? "2px solid #6366f1" : "1px solid #e2e8f0",
        boxShadow: isSelected
          ? "0 0 0 3px rgba(99, 102, 241, 0.15), 0 2px 8px rgba(0,0,0,0.06)"
          : "0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)",
        opacity: isDimmed ? 0.15 : 1,
        filter: isDimmed ? "grayscale(0.8)" : "none",
        minWidth: 140,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-300 !border-2 !border-white !top-[-4px]"
      />

      {/* Seller name */}
      <div className="text-[12px] font-medium text-slate-700 truncate">
        {displayName}
      </div>

      {/* Block size */}
      <div className="text-[10px] text-slate-500 mt-0.5">
        {formatCapital(totalCents)} block
      </div>

      {/* Fill bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[9px] mb-0.5">
          <span className="text-slate-400">{filledPctClamped}% filled</span>
          <span className="text-slate-400">{interests.length} investors</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              filledPctClamped >= 100
                ? "bg-emerald-500"
                : filledPctClamped >= 75
                  ? "bg-blue-500"
                  : filledPctClamped >= 50
                    ? "bg-amber-400"
                    : "bg-slate-300"
            }`}
            style={{ width: `${filledPctClamped}%` }}
          />
        </div>
      </div>

      {/* Investor tooltip on hover */}
      {showTooltip && interests.length > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 bg-slate-900 text-white rounded-lg shadow-lg px-3 py-2 text-[11px] min-w-[180px] max-w-[250px]"
          style={{ pointerEvents: "none" }}
        >
          <div className="font-medium mb-1.5 text-slate-200">Investors</div>
          <div className="space-y-1">
            {interests.slice(0, 5).map((interest) => (
              <div
                key={interest.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate text-slate-100">
                  {interest.investorName}
                </span>
                <span className="text-slate-400 shrink-0">
                  {formatCapital(interest.committedCents)}
                </span>
              </div>
            ))}
            {interests.length > 5 && (
              <div className="text-slate-400 text-[10px] pt-0.5">
                +{interests.length - 5} more
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

export const BlockNode = memo(BlockNodeComponent);
