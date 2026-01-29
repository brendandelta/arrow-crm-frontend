"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCapital } from "@/lib/capital-map-api";
import type { SeriesLlcNodeData } from "../types";

function SeriesLlcNodeComponent({ id, data }: NodeProps) {
  const {
    label,
    isExpanded,
    isSelected,
    isDimmed,
    capitalMetrics,
    dealCount,
    status,
    onToggle,
    onSelect,
  } = data as unknown as SeriesLlcNodeData;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="relative px-3.5 py-2.5 rounded-lg bg-white cursor-pointer select-none transition-all duration-150 hover:-translate-y-0.5"
      style={{
        border: isSelected ? "2px solid #6366f1" : "1px solid #e2e8f0",
        boxShadow: isSelected
          ? "0 0 0 3px rgba(99, 102, 241, 0.15), 0 2px 8px rgba(0,0,0,0.06)"
          : "0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)",
        opacity: isDimmed ? 0.15 : 1,
        filter: isDimmed ? "grayscale(0.8)" : "none",
        minWidth: 150,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-300 !border-2 !border-white !top-[-4px]"
      />

      {/* Header row */}
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-medium text-slate-700 truncate leading-tight">
          {label}
        </span>
        {dealCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="ml-auto p-0.5 rounded hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Info row */}
      <div className="flex items-center gap-1.5 mt-1">
        {dealCount > 0 && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
            {dealCount} {dealCount === 1 ? "deal" : "deals"}
          </span>
        )}
        {status === "inactive" && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">
            Inactive
          </span>
        )}
      </div>

      {/* Capital */}
      <div className="mt-1.5 text-[9px] text-slate-400">
        {formatCapital(capitalMetrics.deployedCents)} deployed
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-300 !border-2 !border-white !bottom-[-4px]"
      />
    </div>
  );
}

export const SeriesLlcNode = memo(SeriesLlcNodeComponent);
