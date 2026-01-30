"use client";

import { Search, X, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { MindMapFilters } from "./types";

interface MindMapFilterRailProps {
  filters: MindMapFilters;
  onFiltersChange: (filters: MindMapFilters) => void;
  owners: { id: number; firstName: string; lastName: string }[];
}

const STAGES = [
  { value: "sourcing", label: "Sourcing" },
  { value: "live", label: "Live" },
  { value: "closing", label: "Closing" },
  { value: "closed", label: "Closed" },
  { value: "dead", label: "Dead" },
];

const BUCKETS: { value: MindMapFilters["bucket"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "arrow", label: "Arrow" },
  { value: "liberator", label: "Liberator" },
];

export function MindMapFilterRail({
  filters,
  onFiltersChange,
  owners,
}: MindMapFilterRailProps) {
  const [stageOpen, setStageOpen] = useState(true);
  const [ownerOpen, setOwnerOpen] = useState(true);

  const hasActiveFilters =
    filters.bucket !== "all" ||
    filters.stages.size > 0 ||
    filters.owner !== "all" ||
    filters.risk ||
    filters.search.trim() !== "";

  const update = (partial: Partial<MindMapFilters>) =>
    onFiltersChange({ ...filters, ...partial });

  const toggleStage = (stage: string) => {
    const next = new Set(filters.stages);
    if (next.has(stage)) next.delete(stage);
    else next.add(stage);
    update({ stages: next });
  };

  const clearAll = () =>
    onFiltersChange({
      bucket: "all",
      stages: new Set(),
      owner: "all",
      risk: false,
      search: "",
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

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
        {/* Search */}
        <div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals..."
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

        {/* Bucket */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Bucket
          </label>
          <div className="flex gap-1">
            {BUCKETS.map((b) => (
              <button
                key={b.value}
                onClick={() => update({ bucket: b.value })}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-md border transition-colors ${
                  filters.bucket === b.value
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stages */}
        <div>
          <button
            onClick={() => setStageOpen(!stageOpen)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 w-full"
          >
            {stageOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Stage
          </button>
          {stageOpen && (
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => toggleStage(s.value)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                    filters.stages.has(s.value)
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Owner */}
        <div>
          <button
            onClick={() => setOwnerOpen(!ownerOpen)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 w-full"
          >
            {ownerOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Owner
          </button>
          {ownerOpen && (
            <select
              value={filters.owner}
              onChange={(e) => update({ owner: e.target.value })}
              className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            >
              <option value="all">All owners</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id.toString()}>
                  {o.firstName} {o.lastName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Risk toggle */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            At risk only
          </span>
          <button
            onClick={() => update({ risk: !filters.risk })}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              filters.risk ? "bg-indigo-500" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                filters.risk ? "translate-x-4" : ""
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
