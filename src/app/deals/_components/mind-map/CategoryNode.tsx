import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Plus, ChevronRight, ChevronDown } from "lucide-react";

interface CategoryNodeData {
  label: string;
  count: number;
  dealId: number;
  categoryType: string;
  expanded: boolean;
  onAdd: (dealId: number, type: string) => void;
  onToggle: (dealId: number, categoryType: string) => void;
  [key: string]: unknown;
}

function CategoryNodeComponent({ data }: NodeProps) {
  const { label, count, dealId, categoryType, expanded, onAdd, onToggle } =
    data as CategoryNodeData;

  return (
    <div
      className="relative px-3 py-1.5 rounded-lg select-none flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-slate-100"
      style={{
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
      }}
      onClick={() => onToggle(dealId, categoryType)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1.5 !h-1.5 !bg-slate-300 !border-0"
      />

      {/* Expand/collapse arrow */}
      {count > 0 ? (
        expanded ? (
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
        )
      ) : null}

      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded-full">
        {count}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd(dealId, categoryType);
        }}
        className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
        title={`Add ${label.toLowerCase()}`}
      >
        <Plus className="w-3 h-3" />
      </button>

      {(count > 0 && expanded) && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-1.5 !h-1.5 !bg-slate-300 !border-0"
        />
      )}
    </div>
  );
}

export const CategoryNode = memo(CategoryNodeComponent);
