"use client";

import { X } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import type { ActiveFilter } from "./types";

interface ActiveFiltersBarProps {
  filters: ActiveFilter[];
  colSpan: number;
  onClearFilter: (columnId: string) => void;
  onClearAll: () => void;
}

export function ActiveFiltersBar({
  filters,
  colSpan,
  onClearFilter,
  onClearAll,
}: ActiveFiltersBarProps) {
  if (filters.length === 0) return null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-2 px-4 bg-slate-50/50">
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.map((f) => (
            <span
              key={f.columnId}
              className="inline-flex items-center gap-1 bg-white text-slate-700 border border-slate-200 rounded-md px-2 py-1 text-xs"
            >
              <span className="font-medium text-slate-500">{f.columnLabel}:</span>
              <span>{f.summary}</span>
              <button
                onClick={() => onClearFilter(f.columnId)}
                className="ml-0.5 p-0.5 rounded hover:bg-slate-100 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={onClearAll}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium ml-1 transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
