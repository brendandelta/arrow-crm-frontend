import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Building2, Users, User } from "lucide-react";
import type { NextAction } from "./types";

interface ChildNodeData {
  childId: number;
  name: string;
  childType: "block" | "interest" | "target";
  status: string;
  nextAction: NextAction;
  // Block-specific
  sizeCents?: number | null;
  priceCents?: number | null;
  constraints?: string[];
  // Interest-specific
  committedCents?: number | null;
  blockName?: string | null;
  // Target-specific
  lastActivityAt?: string | null;
  isStale?: boolean;
  dealId: number;
  onNavigate: (dealId: number) => void;
  [key: string]: unknown;
}

const typeIcons = {
  block: Building2,
  interest: Users,
  target: User,
};

const statusStyles: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  reserved: "bg-blue-100 text-blue-700",
  sold: "bg-slate-100 text-slate-600",
  withdrawn: "bg-red-100 text-red-700",
  soft_circled: "bg-amber-100 text-amber-700",
  committed: "bg-green-100 text-green-700",
  funded: "bg-emerald-100 text-emerald-700",
  prospecting: "bg-blue-50 text-blue-600",
  contacted: "bg-blue-100 text-blue-700",
  allocated: "bg-purple-100 text-purple-700",
  not_started: "bg-slate-100 text-slate-600",
  engaged: "bg-indigo-100 text-indigo-700",
  negotiating: "bg-violet-100 text-violet-700",
  passed: "bg-red-50 text-red-600",
};

function formatCentsCompact(cents: number | null | undefined): string {
  if (!cents) return "";
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(0)}K`;
  return `$${dollars.toFixed(0)}`;
}

function ChildNodeComponent({ data }: NodeProps) {
  const { childId, name, childType, status, nextAction, sizeCents, priceCents, constraints, committedCents, blockName, lastActivityAt, isStale, dealId, onNavigate } = data as ChildNodeData;

  const Icon = typeIcons[childType];
  const statusLabel = status.replace(/_/g, " ");

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm w-[200px] cursor-pointer hover:shadow-md transition-shadow ${isStale ? "border-amber-300" : "border-slate-200"}`}
      onClick={() => onNavigate(dealId)}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />

      <div className="p-2.5">
        {/* Header: icon + name + status */}
        <div className="flex items-start gap-2">
          <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isStale ? "text-amber-500" : "text-slate-400"}`} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-slate-900 truncate">{name}</div>
            <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0 rounded-full capitalize ${statusStyles[status] || "bg-slate-100 text-slate-600"}`}>
              {statusLabel}
            </span>
          </div>
          {isStale && (
            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" title="Stale" />
          )}
        </div>

        {/* Type-specific details */}
        <div className="mt-1.5 text-[10px] text-slate-500 space-y-0.5">
          {childType === "block" && (
            <>
              {(sizeCents || priceCents) && (
                <div className="truncate">
                  {sizeCents ? formatCentsCompact(sizeCents) : ""}
                  {sizeCents && priceCents ? " @ " : ""}
                  {priceCents ? `${formatCentsCompact(priceCents)}/sh` : ""}
                </div>
              )}
              {constraints && constraints.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {constraints.map((c) => (
                    <span key={c} className="bg-slate-100 text-slate-600 px-1 py-0 rounded text-[9px]">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
          {childType === "interest" && (
            <>
              {committedCents && <div>{formatCentsCompact(committedCents)} committed</div>}
              {blockName && <div className="truncate">Block: {blockName}</div>}
            </>
          )}
          {childType === "target" && lastActivityAt && (
            <div>Last: {new Date(lastActivityAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
          )}
        </div>

        {/* Next Action */}
        <div className={`mt-1.5 text-[10px] truncate ${nextAction.isOverdue ? "text-red-600 font-medium" : nextAction.kind === "none" ? "text-slate-300" : "text-slate-500"}`}>
          {nextAction.label}
        </div>
      </div>
    </div>
  );
}

export const ChildNode = memo(ChildNodeComponent);
