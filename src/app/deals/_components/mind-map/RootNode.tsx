import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface RootNodeData {
  label: string;
  [key: string]: unknown;
}

function RootNodeComponent({ data }: NodeProps) {
  const { label } = data as RootNodeData;

  return (
    <div
      className="relative px-6 py-3 rounded-2xl text-white font-bold text-[15px] tracking-wide select-none"
      style={{
        background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.08), 0 4px 14px rgba(99,102,241,0.25), 0 12px 28px rgba(99,102,241,0.12)",
      }}
    >
      {label}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-indigo-300 !border-2 !border-white"
      />
    </div>
  );
}

export const RootNode = memo(RootNodeComponent);
