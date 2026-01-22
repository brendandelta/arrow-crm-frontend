import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { NextAction } from "./types";

interface DealNodeData {
  dealId: number;
  name: string;
  company: string | null;
  status: string;
  riskLevel: "danger" | "warning" | "ok";
  nextAction: NextAction;
  expanded: boolean;
  onToggleExpand: (dealId: number) => void;
  onNavigate: (dealId: number) => void;
  [key: string]: unknown;
}

const riskColors: Record<string, string> = {
  danger: "border-l-red-500",
  warning: "border-l-amber-500",
  ok: "border-l-green-500",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  sourcing: { label: "Sourcing", className: "bg-blue-100 text-blue-700" },
  live: { label: "Live", className: "bg-green-100 text-green-700" },
  closing: { label: "Closing", className: "bg-purple-100 text-purple-700" },
  closed: { label: "Closed", className: "bg-slate-100 text-slate-700" },
};

function DealNodeComponent({ data }: NodeProps) {
  const { dealId, name, company, status, riskLevel, nextAction, expanded, onToggleExpand, onNavigate } = data as DealNodeData;

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 border-l-4 ${riskColors[riskLevel]} shadow-sm w-[240px] cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onNavigate(dealId)}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />

      <div className="p-3">
        {/* Header with expand button */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900 truncate">{name}</div>
            {company && (
              <div className="text-xs text-slate-500 truncate">{company}</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(dealId);
            }}
            className="p-0.5 rounded hover:bg-slate-100 shrink-0"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Status */}
        <div className="mt-2">
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusLabels[status]?.className || "bg-slate-100 text-slate-600"}`}>
            {statusLabels[status]?.label || status}
          </span>
        </div>

        {/* Next Action */}
        <div className={`mt-2 text-xs truncate ${nextAction.isOverdue ? "text-red-600 font-medium" : nextAction.kind === "none" ? "text-slate-400" : "text-slate-600"}`}>
          {nextAction.label}
        </div>
      </div>
    </div>
  );
}

export const DealNode = memo(DealNodeComponent);
