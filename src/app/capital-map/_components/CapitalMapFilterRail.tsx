"use client";

import { Search, X, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CapitalMapFilters } from "./types";
import { formatCapital } from "@/lib/capital-map-api";

interface CapitalMapFilterRailProps {
  filters: CapitalMapFilters;
  onFiltersChange: (filters: CapitalMapFilters) => void;
  entityTypes: string[];
  dealStatuses: string[];
}

const CAPITAL_THRESHOLDS = [
  { value: null, label: "Any" },
  { value: 10000_00, label: "$10K+" },
  { value: 50000_00, label: "$50K+" },
  { value: 100000_00, label: "$100K+" },
  { value: 500000_00, label: "$500K+" },
  { value: 1000000_00, label: "$1M+" },
];

function formatEntityType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDealStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function CapitalMapFilterRail({
  filters,
  onFiltersChange,
  entityTypes,
  dealStatuses,
}: CapitalMapFilterRailProps) {
  const [entityTypesOpen, setEntityTypesOpen] = useState(true);
  const [dealStatusOpen, setDealStatusOpen] = useState(true);
  const [capitalOpen, setCapitalOpen] = useState(true);

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.entityTypes.size > 0 ||
    filters.dealStatuses.size > 0 ||
    !filters.showInactive ||
    filters.minCapitalCents !== null;

  const update = (partial: Partial<CapitalMapFilters>) =>
    onFiltersChange({ ...filters, ...partial });

  const toggleEntityType = (type: string) => {
    const next = new Set(filters.entityTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    update({ entityTypes: next });
  };

  const toggleDealStatus = (status: string) => {
    const next = new Set(filters.dealStatuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    update({ dealStatuses: next });
  };

  const clearAll = () =>
    onFiltersChange({
      search: "",
      entityTypes: new Set(),
      dealStatuses: new Set(),
      showInactive: false,
      minCapitalCents: null,
      filterMode: filters.filterMode,
    });

  return (
    <div className="w-[240px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-[11px] text-indigo-500 hover:text-indigo-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Search */}
        <div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search entities, deals..."
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            />
            {filters.search && (
              <button
                onClick={() => update({ search: "" })}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-3 w-3 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* Entity Types */}
        {entityTypes.length > 0 && (
          <div>
            <button
              onClick={() => setEntityTypesOpen(!entityTypesOpen)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 w-full"
            >
              {entityTypesOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Entity Types
            </button>
            {entityTypesOpen && (
              <div className="flex flex-wrap gap-1.5">
                {entityTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleEntityType(type)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                      filters.entityTypes.has(type)
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {formatEntityType(type)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deal Status */}
        {dealStatuses.length > 0 && (
          <div>
            <button
              onClick={() => setDealStatusOpen(!dealStatusOpen)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 w-full"
            >
              {dealStatusOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Deal Status
            </button>
            {dealStatusOpen && (
              <div className="flex flex-wrap gap-1.5">
                {dealStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleDealStatus(status)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                      filters.dealStatuses.has(status)
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {formatDealStatus(status)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Capital Threshold */}
        <div>
          <button
            onClick={() => setCapitalOpen(!capitalOpen)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 w-full"
          >
            {capitalOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Min Capital
          </button>
          {capitalOpen && (
            <div className="flex flex-wrap gap-1.5">
              {CAPITAL_THRESHOLDS.map((threshold) => (
                <button
                  key={threshold.label}
                  onClick={() => update({ minCapitalCents: threshold.value })}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                    filters.minCapitalCents === threshold.value
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {threshold.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Show Inactive toggle */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Show Inactive
          </span>
          <button
            onClick={() => update({ showInactive: !filters.showInactive })}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              filters.showInactive ? "bg-indigo-500" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                filters.showInactive ? "translate-x-4" : ""
              }`}
            />
          </button>
        </div>

        {/* Filter mode */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Non-matching
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => update({ filterMode: "dim" })}
              className={`flex-1 py-1.5 text-[11px] font-medium rounded-md border transition-colors ${
                filters.filterMode === "dim"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Dim
            </button>
            <button
              onClick={() => update({ filterMode: "hide" })}
              className={`flex-1 py-1.5 text-[11px] font-medium rounded-md border transition-colors ${
                filters.filterMode === "hide"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Hide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
