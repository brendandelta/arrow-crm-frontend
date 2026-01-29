"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCapital } from "@/lib/capital-map-api";
import type { HoldingsNodeData } from "../types";

function HoldingsNodeComponent({ id, data }: NodeProps) {
  const {
    label,
    isExpanded,
    isSelected,
    isDimmed,
    capitalMetrics,
    childCount,
    onToggle,
    onSelect,
  } = data as unknown as HoldingsNodeData;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="relative px-6 py-4 rounded-2xl text-white select-none cursor-pointer transition-all duration-150"
      style={{
        background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
        boxShadow: isSelected
          ? "0 0 0 3px rgba(99, 102, 241, 0.4), 0 4px 14px rgba(99,102,241,0.25)"
          : "0 1px 3px rgba(0,0,0,0.08), 0 4px 14px rgba(99,102,241,0.25), 0 12px 28px rgba(99,102,241,0.12)",
        opacity: isDimmed ? 0.3 : 1,
        filter: isDimmed ? "grayscale(0.8)" : "none",
        minWidth: 200,
      }}
    >
      {/* Title row */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-[15px] tracking-wide">{label}</span>
        {childCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="ml-auto p-0.5 rounded hover:bg-white/20 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Capital metrics row */}
      <div className="flex items-center gap-3 mt-2 text-[11px] text-indigo-100">
        <div className="flex flex-col items-center">
          <span className="font-medium text-white">
            {formatCapital(capitalMetrics.committedCents)}
          </span>
          <span className="opacity-70">Committed</span>
        </div>
        <div className="w-px h-6 bg-indigo-300/40" />
        <div className="flex flex-col items-center">
          <span className="font-medium text-white">
            {formatCapital(capitalMetrics.wiredCents)}
          </span>
          <span className="opacity-70">Wired</span>
        </div>
        <div className="w-px h-6 bg-indigo-300/40" />
        <div className="flex flex-col items-center">
          <span className="font-medium text-white">
            {formatCapital(capitalMetrics.deployedCents)}
          </span>
          <span className="opacity-70">Deployed</span>
        </div>
      </div>

      {/* Child count badge */}
      {childCount > 0 && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 rounded-full text-[10px] font-medium">
          {childCount} {childCount === 1 ? "entity" : "entities"}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-300 !border-2 !border-white !bottom-[-6px]"
      />
    </div>
  );
}

export const HoldingsNode = memo(HoldingsNodeComponent);
