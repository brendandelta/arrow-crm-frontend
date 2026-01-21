"use client";

import { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, Filter } from "lucide-react";
import {
  FilterOperator,
  ColumnType,
  ColumnFilter,
  SortDirection,
  OPERATORS_BY_TYPE,
  DATE_RELATIVE_OPTIONS,
  WARMTH_OPTIONS_FILTER,
} from "@/lib/table-filters";

// Sort icon component
function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc") {
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12l7-7 7 7" />
      </svg>
    );
  }
  if (direction === "desc") {
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7 7 7-7" />
      </svg>
    );
  }
  return null;
}

export interface FilterableColumnHeaderProps {
  label: string;
  columnId: string;
  columnType: ColumnType;
  values: string[];
  filter: ColumnFilter | undefined;
  onFilterChange: (columnId: string, filter: ColumnFilter | undefined) => void;
  sortDirection: SortDirection;
  onSortChange: (columnId: string, direction: SortDirection) => void;
  className?: string;
}

export function FilterableColumnHeader({
  label,
  columnId,
  columnType,
  values,
  filter,
  onFilterChange,
  sortDirection,
  onSortChange,
  className = "",
}: FilterableColumnHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Local draft state - initialized from filter prop
  const [draftOperator, setDraftOperator] = useState<FilterOperator>(
    OPERATORS_BY_TYPE[columnType][0].value
  );
  const [draftValue, setDraftValue] = useState("");
  const [draftSecondValue, setDraftSecondValue] = useState("");
  const [draftSelectedValues, setDraftSelectedValues] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const operators = OPERATORS_BY_TYPE[columnType];
  const hasActiveFilter = !!filter;
  const isSorted = sortDirection !== null;

  // Get unique values for select-type filters
  const uniqueValues = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const filteredUniqueValues = uniqueValues.filter((v) =>
    v.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset draft state when dropdown opens
  const handleOpenDropdown = () => {
    if (!isOpen) {
      // Sync draft state from filter prop when opening
      setDraftOperator(filter?.operator || OPERATORS_BY_TYPE[columnType][0].value);
      setDraftValue(filter?.value || "");
      setDraftSecondValue(filter?.secondValue || "");
      setDraftSelectedValues(new Set(filter?.values || []));
    }
    setIsOpen(!isOpen);
  };

  const applyFilter = () => {
    // Check if filter should be cleared
    const needsValue = !["is_empty", "is_not_empty"].includes(draftOperator);
    const needsMultiValue = ["is_any_of", "is_none_of"].includes(draftOperator);

    if (needsMultiValue && draftSelectedValues.size === 0) {
      onFilterChange(columnId, undefined);
    } else if (needsValue && !draftValue && !needsMultiValue) {
      onFilterChange(columnId, undefined);
    } else {
      onFilterChange(columnId, {
        operator: draftOperator,
        value: draftValue,
        values: needsMultiValue ? Array.from(draftSelectedValues) : undefined,
        secondValue: draftOperator === "between" ? draftSecondValue : undefined,
      });
    }
    setIsOpen(false);
  };

  const clearFilter = () => {
    onFilterChange(columnId, undefined);
    setDraftValue("");
    setDraftSecondValue("");
    setDraftSelectedValues(new Set());
    setDraftOperator(OPERATORS_BY_TYPE[columnType][0].value);
    setIsOpen(false);
  };

  const toggleValue = (value: string) => {
    const newSelected = new Set(draftSelectedValues);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setDraftSelectedValues(newSelected);
  };

  const handleSort = (direction: SortDirection) => {
    onSortChange(columnId, sortDirection === direction ? null : direction);
    setIsOpen(false);
  };

  const renderFilterInput = () => {
    const operator = draftOperator;

    // No input needed for empty checks
    if (operator === "is_empty" || operator === "is_not_empty") {
      return (
        <div className="py-2 px-3 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">
          No additional input needed
        </div>
      );
    }

    // Multi-value selection (is_any_of, is_none_of)
    if (operator === "is_any_of" || operator === "is_none_of") {
      const displayValues = columnType === "warmth" ? WARMTH_OPTIONS_FILTER : filteredUniqueValues.map(v => ({ value: v, label: v }));
      const valuesList = columnType === "warmth" ? WARMTH_OPTIONS_FILTER : uniqueValues.map(v => ({ value: v, label: v }));

      return (
        <div className="space-y-2">
          {valuesList.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search values..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          )}
          <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg bg-white">
            {(columnType === "warmth" ? WARMTH_OPTIONS_FILTER : displayValues).map((item, index) => {
              const val = typeof item === "string" ? item : item.value;
              const lbl = typeof item === "string" ? item : item.label;
              const isChecked = draftSelectedValues.has(val);
              return (
                <button
                  key={val}
                  onClick={() => toggleValue(val)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                    isChecked ? "bg-blue-50" : "hover:bg-slate-50"
                  } ${index !== 0 ? "border-t border-slate-100" : ""}`}
                >
                  <div className={`flex items-center justify-center w-4 h-4 rounded border-2 transition-colors ${
                    isChecked
                      ? "bg-blue-600 border-blue-600"
                      : "border-slate-300 bg-white"
                  }`}>
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`truncate ${isChecked ? "font-medium text-blue-900" : "text-slate-700"}`}>
                    {lbl}
                  </span>
                </button>
              );
            })}
          </div>
          {draftSelectedValues.size > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {Array.from(draftSelectedValues).slice(0, 3).map((v) => (
                <span key={v} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                  {columnType === "warmth"
                    ? WARMTH_OPTIONS_FILTER.find((o) => o.value === v)?.label || v
                    : v}
                </span>
              ))}
              {draftSelectedValues.size > 3 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-md">
                  +{draftSelectedValues.size - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    // Date relative selection
    if (operator === "is_relative") {
      return (
        <div className="relative">
          <select
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="">Select time period...</option>
            {DATE_RELATIVE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      );
    }

    // Date inputs
    if (columnType === "date") {
      if (operator === "between") {
        return (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <span className="text-slate-400 text-sm font-medium">to</span>
            <input
              type="date"
              value={draftSecondValue}
              onChange={(e) => setDraftSecondValue(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        );
      }
      return (
        <input
          type="date"
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      );
    }

    // Number between
    if (columnType === "number" && operator === "between") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            placeholder="Min"
            className="flex-1 px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <span className="text-slate-400 text-sm font-medium">to</span>
          <input
            type="number"
            value={draftSecondValue}
            onChange={(e) => setDraftSecondValue(e.target.value)}
            placeholder="Max"
            className="flex-1 px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      );
    }

    // Number input
    if (columnType === "number") {
      return (
        <input
          type="number"
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          placeholder="Enter a number..."
          className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        placeholder="Type to filter..."
        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        autoFocus
      />
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={handleOpenDropdown}
        className={`flex items-center gap-1.5 text-left font-medium text-xs uppercase tracking-wide transition-colors group ${
          hasActiveFilter || isSorted ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <span>{label}</span>
        {isSorted && <SortIcon direction={sortDirection} />}
        {hasActiveFilter && (
          <Filter className="h-3 w-3" />
        )}
        <ChevronDown
          className={`h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="fixed z-[9999] w-72 bg-white rounded-xl border border-slate-200 overflow-hidden"
          style={{
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 8 : 0,
            left: dropdownRef.current ? Math.min(dropdownRef.current.getBoundingClientRect().left, window.innerWidth - 300) : 0,
          }}
        >
          {/* Sort Section */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Sort by {label}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSort("asc")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  sortDirection === "asc"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12l7-7 7 7" />
                </svg>
                A → Z
              </button>
              <button
                onClick={() => handleSort("desc")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  sortDirection === "desc"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 19V5M5 12l7 7 7-7" />
                </svg>
                Z → A
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="p-3 space-y-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Filter {label}
            </div>

            {/* Operator Selector */}
            <div className="relative">
              <select
                value={draftOperator}
                onChange={(e) => {
                  setDraftOperator(e.target.value as FilterOperator);
                  setDraftValue("");
                  setDraftSecondValue("");
                  setDraftSelectedValues(new Set());
                }}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:border-slate-300 transition-colors"
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter Value Input */}
            <div className="min-h-[40px]">
              {renderFilterInput()}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={applyFilter}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Apply Filter
              </button>
              {hasActiveFilter && (
                <button
                  onClick={clearFilter}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
