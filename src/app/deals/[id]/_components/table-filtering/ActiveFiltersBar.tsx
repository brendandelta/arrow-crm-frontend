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
      <TableCell colSpan={colSpan} className="py-2 px-4">
        <div className="flex items-center gap-1.5 flex-wrap animate-in fade-in slide-in-from-top-1 duration-200">
          {filters.map((f) => (
            <span
              key={f.columnId}
              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 text-xs"
            >
              <span className="font-medium">{f.columnLabel}:</span>
              <span>{f.summary}</span>
              <button
                onClick={() => onClearFilter(f.columnId)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-blue-100 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={onClearAll}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium ml-1 transition-colors"
          >
            Clear all
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
