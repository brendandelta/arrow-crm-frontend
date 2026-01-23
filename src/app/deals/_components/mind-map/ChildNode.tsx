import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ChildNodeData {
  name: string;
  nextAction: string;
  isOverdue: boolean;
  dealId: number;
  onNavigate: (dealId: number) => void;
  [key: string]: unknown;
}

function ChildNodeComponent({ data }: NodeProps) {
  const { name, nextAction, isOverdue, dealId, onNavigate } = data as ChildNodeData;

  return (
    <div
      onClick={() => onNavigate(dealId)}
      className="relative pl-3.5 pr-3 py-2 rounded-lg cursor-pointer select-none transition-all duration-150 hover:-translate-y-0.5"
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderLeft: isOverdue ? "3px solid #ef4444" : "3px solid #a5b4fc",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        maxWidth: 220,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1.5 !h-1.5 !bg-slate-300 !border-0"
      />
      <div className="text-[12px] font-medium text-slate-700 truncate leading-tight">
        {name}
      </div>
      <div
        className={`text-[11px] mt-0.5 truncate leading-tight ${
          isOverdue ? "text-red-500 font-medium" : "text-slate-400"
        }`}
      >
        {nextAction}
      </div>
    </div>
  );
}

export const ChildNode = memo(ChildNodeComponent);
