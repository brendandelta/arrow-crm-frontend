import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface DealNodeData {
  dealId: number;
  name: string;
  company: string | null;
  status: string;
  priority: number;
  riskLevel: "danger" | "warning" | "ok";
  targetCount: number;
  interestCount: number;
  coverageRatio: number | null;
  hasTargets: boolean;
  onNavigate: (dealId: number) => void;
  onSelect: (nodeId: string, nodeType: string, data: Record<string, unknown>) => void;
  [key: string]: unknown;
}

const PRIORITY_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: "bg-red-50", text: "text-red-700", label: "Now" },
  1: { bg: "bg-orange-50", text: "text-orange-700", label: "High" },
  2: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Med" },
  3: { bg: "bg-slate-100", text: "text-slate-500", label: "Low" },
};

const RISK_DOT: Record<string, string> = {
  danger: "bg-red-500",
  warning: "bg-amber-400",
  ok: "",
};

function DealNodeComponent({ id, data }: NodeProps) {
  const {
    dealId,
    name,
    company,
    priority,
    riskLevel,
    targetCount,
    interestCount,
    coverageRatio,
    hasTargets,
    onSelect,
  } = data as DealNodeData;

  const pCfg = PRIORITY_COLORS[priority] || PRIORITY_COLORS[3];
  const coveragePct = coverageRatio != null ? Math.min(coverageRatio, 100) : 0;

  return (
    <div
      onClick={() => onSelect(id, "deal", data as unknown as Record<string, unknown>)}
      className="relative px-4 py-2.5 rounded-xl bg-white cursor-pointer select-none transition-all duration-150 hover:-translate-y-0.5"
      style={{
        border: "1.5px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
        minWidth: 160,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-300 !border-2 !border-white"
      />

      {/* Header row: name + priority + risk */}
      <div className="flex items-center gap-1.5">
        {riskLevel !== "ok" && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${RISK_DOT[riskLevel]}`} />
        )}
        <span className="text-[13px] font-semibold text-slate-800 truncate leading-tight">
          {name}
        </span>
        <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${pCfg.bg} ${pCfg.text} shrink-0`}>
          {pCfg.label}
        </span>
      </div>

      {/* Company */}
      {company && (
        <div className="text-[11px] text-slate-400 truncate mt-0.5">{company}</div>
      )}

      {/* Chips row */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
          {targetCount} T
        </span>
        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
          {interestCount} I
        </span>
      </div>

      {/* Coverage bar */}
      {coverageRatio != null && (
        <div className="mt-1.5">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                coveragePct >= 100 ? "bg-emerald-500" : coveragePct >= 50 ? "bg-blue-500" : "bg-amber-400"
              }`}
              style={{ width: `${coveragePct}%` }}
            />
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-300 !border-2 !border-white"
      />
    </div>
  );
}

export const DealNode = memo(DealNodeComponent);
