"use client";

import { ListFilter, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableHead } from "@/components/ui/table";
import type { ColumnDef, FilterValue, SortDirection } from "./types";
import { TextFilter } from "./TextFilter";
import { EnumFilter } from "./EnumFilter";
import { RangeFilter } from "./RangeFilter";
import { DatePresetFilter } from "./DatePresetFilter";
import { BooleanFilter } from "./BooleanFilter";

interface FilterableHeaderProps<T> {
  column: ColumnDef<T>;
  filterValue?: FilterValue;
  sortDirection: SortDirection;
  enumCounts: Map<string, number>;
  datePresetCounts?: Map<string, number>;
  onFilterChange: (columnId: string, value: FilterValue | null) => void;
  onSortToggle: (columnId: string) => void;
  onSortSet: (columnId: string, direction: SortDirection) => void;
}

export function FilterableHeader<T>({
  column,
  filterValue,
  sortDirection,
  enumCounts,
  datePresetCounts,
  onFilterChange,
  onSortToggle,
  onSortSet,
}: FilterableHeaderProps<T>) {
  const hasFilter = !!filterValue;
  const isSorted = sortDirection !== null;
  const isActive = hasFilter || isSorted;

  const sortLabels = column.sortLabels ?? ["A → Z", "Z → A"];

  const renderFilter = () => {
    switch (column.filterType) {
      case "text":
        return (
          <TextFilter
            value={filterValue?.type === "text" ? filterValue.query : ""}
            onChange={(query) => {
              if (query.trim()) {
                onFilterChange(column.id, { type: "text", query });
              } else {
                onFilterChange(column.id, null);
              }
            }}
          />
        );

      case "enum":
        return (
          <EnumFilter
            options={column.enumOptions ?? []}
            selected={filterValue?.type === "enum" ? filterValue.selected : new Set()}
            counts={enumCounts}
            onChange={(selected) => {
              if (selected.size === 0 || selected.size === (column.enumOptions?.length ?? 0)) {
                onFilterChange(column.id, null);
              } else {
                onFilterChange(column.id, { type: "enum", selected });
              }
            }}
          />
        );

      case "currency":
      case "number":
        return (
          <RangeFilter
            min={
              filterValue?.type === "currency" || filterValue?.type === "number"
                ? filterValue.min
                : undefined
            }
            max={
              filterValue?.type === "currency" || filterValue?.type === "number"
                ? filterValue.max
                : undefined
            }
            filterType={column.filterType}
            onChange={(min, max) => {
              if (min === undefined && max === undefined) {
                onFilterChange(column.id, null);
              } else {
                onFilterChange(column.id, {
                  type: column.filterType as "currency" | "number",
                  min,
                  max,
                });
              }
            }}
          />
        );

      case "datePreset":
        return (
          <DatePresetFilter
            presets={column.datePresets ?? []}
            selected={filterValue?.type === "datePreset" ? filterValue.selected : new Set()}
            counts={datePresetCounts ?? new Map()}
            onChange={(selected) => {
              if (selected.size === 0) {
                onFilterChange(column.id, null);
              } else {
                onFilterChange(column.id, { type: "datePreset", selected });
              }
            }}
          />
        );

      case "boolean":
        return (
          <BooleanFilter
            value={filterValue?.type === "boolean" ? filterValue.value : null}
            hasLabel={column.booleanLabels?.[0]}
            lacksLabel={column.booleanLabels?.[1]}
            onChange={(value) => {
              if (value === null) {
                onFilterChange(column.id, null);
              } else {
                onFilterChange(column.id, { type: "boolean", value });
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  const sortable = column.sortable !== false;
  const filterable = column.filterable !== false;

  return (
    <TableHead className={column.align === "right" ? "text-right" : ""}>
      <div
        className={`group/header flex items-center gap-1 ${
          column.align === "right" ? "justify-end" : ""
        }`}
      >
        {/* Sort-toggle label */}
        {sortable ? (
          <button
            onClick={() => onSortToggle(column.id)}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              isActive
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{column.label}</span>
            {sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
            {sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
          </button>
        ) : (
          <span className={`text-xs font-medium ${isActive ? "text-slate-900" : "text-slate-500"}`}>
            {column.label}
          </span>
        )}

        {/* Filter dropdown */}
        {filterable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`relative p-0.5 rounded transition-all ${
                  hasFilter
                    ? "text-slate-900"
                    : "text-slate-300 opacity-0 group-hover/header:opacity-100 hover:text-slate-500"
                }`}
              >
                <ListFilter className="h-3 w-3" />
                {hasFilter && (
                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-slate-900" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={column.align === "right" ? "end" : "start"}
              className="w-56 rounded-lg border border-slate-200 shadow-md p-0"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {/* Sort section */}
              {sortable && (
                <div className="px-3 py-2.5 border-b border-slate-100">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">
                    Sort
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() =>
                        onSortSet(column.id, sortDirection === "asc" ? null : "asc")
                      }
                      className={`flex-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                        sortDirection === "asc"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {sortLabels[0]}
                    </button>
                    <button
                      onClick={() =>
                        onSortSet(column.id, sortDirection === "desc" ? null : "desc")
                      }
                      className={`flex-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                        sortDirection === "desc"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {sortLabels[1]}
                    </button>
                  </div>
                </div>
              )}

              {/* Filter section */}
              <div className="px-3 py-2.5 space-y-2">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Filter
                </div>
                {renderFilter()}
                {hasFilter && (
                  <button
                    onClick={() => onFilterChange(column.id, null)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TableHead>
  );
}
