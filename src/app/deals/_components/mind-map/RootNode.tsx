import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface RootNodeData {
  label: string;
  dealCount: number;
  [key: string]: unknown;
}

function RootNodeComponent({ data }: NodeProps) {
  const { label, dealCount } = data as RootNodeData;

  return (
    <div className="bg-slate-900 text-white rounded-lg px-5 py-3 min-w-[160px] flex items-center justify-between gap-3 shadow-md">
      <span className="text-sm font-semibold">{label}</span>
      <span className="bg-slate-700 text-slate-200 text-xs font-medium px-2 py-0.5 rounded-full">
        {dealCount}
      </span>
      <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 !h-2" />
    </div>
  );
}

export const RootNode = memo(RootNodeComponent);
