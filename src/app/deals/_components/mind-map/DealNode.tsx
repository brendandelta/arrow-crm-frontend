import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface DealNodeData {
  dealId: number;
  name: string;
  hasTargets: boolean;
  onNavigate: (dealId: number) => void;
  [key: string]: unknown;
}

function DealNodeComponent({ data }: NodeProps) {
  const { dealId, name, hasTargets, onNavigate } = data as DealNodeData;

  return (
    <div
      onClick={() => onNavigate(dealId)}
      className="relative px-4 py-2.5 rounded-xl bg-white cursor-pointer select-none transition-all duration-150 hover:-translate-y-0.5"
      style={{
        border: "1.5px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-300 !border-2 !border-white"
      />
      <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap">
        {name}
      </span>
      {hasTargets && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-2 !bg-slate-300 !border-2 !border-white"
        />
      )}
    </div>
  );
}

export const DealNode = memo(DealNodeComponent);
