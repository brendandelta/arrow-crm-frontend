"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCapital } from "@/lib/capital-map-api";
import type { DealNodeData, DEAL_STATUS_COLORS } from "../types";

const STATUS_COLORS: Record<string, string> = {
  sourcing: "bg-slate-100 text-slate-600",
  live: "bg-blue-50 text-blue-700",
  closing: "bg-amber-50 text-amber-700",
  closed: "bg-green-50 text-green-700",
  dead: "bg-red-50 text-red-600",
};

function DealNodeComponent({ id, data }: NodeProps) {
  const {
    label,
    isExpanded,
    isSelected,
    isDimmed,
    company,
    dealStatus,
    committedCents,
    wiredCents,
    blockCount,
    relationshipType,
    onToggle,
    onSelect,
  } = data as unknown as DealNodeData;

  const statusStyle = STATUS_COLORS[dealStatus] || STATUS_COLORS.sourcing;
  const wiredPct =
    committedCents > 0
      ? Math.min(100, Math.round((wiredCents / committedCents) * 100))
      : 0;

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
        minWidth: 160,
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
        <span
          className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${statusStyle}`}
        >
          {dealStatus}
        </span>
      </div>

      {/* Company */}
      {company && (
        <div className="text-[11px] text-slate-400 truncate mt-0.5">
          {company}
        </div>
      )}

      {/* Capital bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-slate-500">
            {formatCapital(committedCents)} committed
          </span>
          <span className="text-slate-400">{wiredPct}% wired</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              wiredPct >= 100
                ? "bg-emerald-500"
                : wiredPct >= 50
                  ? "bg-blue-500"
                  : "bg-amber-400"
            }`}
            style={{ width: `${wiredPct}%` }}
          />
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center gap-1.5 mt-2">
        {blockCount > 0 && (
          <>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
              {blockCount} {blockCount === 1 ? "block" : "blocks"}
            </span>
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
          </>
        )}
        {relationshipType && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">
            {relationshipType}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-slate-300 !border-2 !border-white !bottom-[-5px]"
      />
    </div>
  );
}

export const DealNode = memo(DealNodeComponent);
