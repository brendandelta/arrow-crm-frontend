"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCapital } from "@/lib/capital-map-api";
import type { MasterSeriesNodeData } from "../types";

function MasterSeriesNodeComponent({ id, data }: NodeProps) {
  const {
    label,
    isExpanded,
    isSelected,
    isDimmed,
    entityType,
    capitalMetrics,
    childCount,
    status,
    onToggle,
    onSelect,
  } = data as unknown as MasterSeriesNodeData;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="relative px-4 py-3 rounded-xl bg-white cursor-pointer select-none transition-all duration-150 hover:-translate-y-0.5"
      style={{
        border: isSelected ? "2px solid #6366f1" : "1.5px solid #e2e8f0",
        boxShadow: isSelected
          ? "0 0 0 3px rgba(99, 102, 241, 0.15), 0 4px 12px rgba(0,0,0,0.08)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
        opacity: isDimmed ? 0.15 : 1,
        filter: isDimmed ? "grayscale(0.8)" : "none",
        minWidth: 170,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-300 !border-2 !border-white !top-[-5px]"
      />

      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold text-slate-800 truncate leading-tight">
          {label}
        </span>
        {childCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="ml-auto p-0.5 rounded hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
          {entityType.replace(/_/g, " ")}
        </span>
        {status === "inactive" && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">
            Inactive
          </span>
        )}
        {childCount > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">
            {childCount}
          </span>
        )}
      </div>

      {/* Capital summary */}
      <div className="mt-2 text-[10px] text-slate-400">
        <span className="text-slate-600 font-medium">
          {formatCapital(capitalMetrics.committedCents)}
        </span>{" "}
        committed
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-slate-300 !border-2 !border-white !bottom-[-5px]"
      />
    </div>
  );
}

export const MasterSeriesNode = memo(MasterSeriesNodeComponent);
