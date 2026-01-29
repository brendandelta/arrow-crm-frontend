"use client";

import { useState } from "react";
import { ChevronDown, X, Filter } from "lucide-react";

interface DealsFiltersProps {
  stages: string[];
  statuses: string[];
  owners: { id: number; firstName: string; lastName: string }[];
  activeFilters: {
    stages: string[];
    statuses: string[];
    owners: number[];
    closeWindow: number | null;
    needsOutreach: boolean;
    needsDocs: boolean;
    pricingStale: boolean;
  };
  onFiltersChange: (filters: DealsFiltersProps["activeFilters"]) => void;
}

export function DealsFilters({
  stages,
  statuses,
  owners,
  activeFilters,
  onFiltersChange,
}: DealsFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const closeWindows = [
    { value: 7, label: "7 days" },
    { value: 14, label: "14 days" },
    { value: 30, label: "30 days" },
    { value: 60, label: "60 days" },
  ];

  const toggleFilter = (type: "stages" | "statuses" | "owners", value: string | number) => {
    const currentValues = activeFilters[type] as (string | number)[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...activeFilters,
      [type]: newValues,
    });
  };

  const toggleBooleanFilter = (key: "needsOutreach" | "needsDocs" | "pricingStale") => {
    onFiltersChange({
      ...activeFilters,
      [key]: !activeFilters[key],
    });
  };

  const setCloseWindow = (days: number | null) => {
    onFiltersChange({
      ...activeFilters,
      closeWindow: days,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      stages: [],
      statuses: [],
      owners: [],
      closeWindow: null,
      needsOutreach: false,
      needsDocs: false,
      pricingStale: false,
    });
  };

  const activeCount =
    activeFilters.stages.length +
    activeFilters.statuses.length +
    activeFilters.owners.length +
    (activeFilters.closeWindow ? 1 : 0) +
    (activeFilters.needsOutreach ? 1 : 0) +
    (activeFilters.needsDocs ? 1 : 0) +
    (activeFilters.pricingStale ? 1 : 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status Multi-select */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
            activeFilters.statuses.length > 0
              ? "bg-slate-100 border-slate-300"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          Status
          {activeFilters.statuses.length > 0 && (
            <span className="bg-slate-600 text-white text-xs px-1.5 rounded-full">
              {activeFilters.statuses.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {openDropdown === "status" && (
          <DropdownMenu onClose={() => setOpenDropdown(null)}>
            {statuses.map((status) => (
              <label key={status} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeFilters.statuses.includes(status)}
                  onChange={() => toggleFilter("statuses", status)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm capitalize">{status}</span>
              </label>
            ))}
          </DropdownMenu>
        )}
      </div>

      {/* Stage Multi-select */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === "stage" ? null : "stage")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
            activeFilters.stages.length > 0
              ? "bg-slate-100 border-slate-300"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          Stage
          {activeFilters.stages.length > 0 && (
            <span className="bg-slate-600 text-white text-xs px-1.5 rounded-full">
              {activeFilters.stages.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {openDropdown === "stage" && (
          <DropdownMenu onClose={() => setOpenDropdown(null)}>
            {stages.map((stage) => (
              <label key={stage} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeFilters.stages.includes(stage)}
                  onChange={() => toggleFilter("stages", stage)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm">{stage}</span>
              </label>
            ))}
          </DropdownMenu>
        )}
      </div>

      {/* Owner Select */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === "owner" ? null : "owner")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
            activeFilters.owners.length > 0
              ? "bg-slate-100 border-slate-300"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          Owner
          {activeFilters.owners.length > 0 && (
            <span className="bg-slate-600 text-white text-xs px-1.5 rounded-full">
              {activeFilters.owners.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {openDropdown === "owner" && (
          <DropdownMenu onClose={() => setOpenDropdown(null)}>
            {owners.map((owner) => (
              <label key={owner.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeFilters.owners.includes(owner.id)}
                  onChange={() => toggleFilter("owners", owner.id)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm">
                  {owner.firstName} {owner.lastName}
                </span>
              </label>
            ))}
          </DropdownMenu>
        )}
      </div>

      {/* Close Window */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === "close" ? null : "close")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
            activeFilters.closeWindow
              ? "bg-slate-100 border-slate-300"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          Close Window
          {activeFilters.closeWindow && (
            <span className="text-xs text-slate-600">({activeFilters.closeWindow}d)</span>
          )}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {openDropdown === "close" && (
          <DropdownMenu onClose={() => setOpenDropdown(null)}>
            <button
              onClick={() => {
                setCloseWindow(null);
                setOpenDropdown(null);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                !activeFilters.closeWindow ? "bg-slate-100" : ""
              }`}
            >
              Any time
            </button>
            {closeWindows.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setCloseWindow(option.value);
                  setOpenDropdown(null);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                  activeFilters.closeWindow === option.value ? "bg-slate-100" : ""
                }`}
              >
                Within {option.label}
              </button>
            ))}
          </DropdownMenu>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200" />

      {/* Toggle Filters */}
      <button
        onClick={() => toggleBooleanFilter("needsOutreach")}
        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
          activeFilters.needsOutreach
            ? "bg-amber-100 border-amber-300 text-amber-700"
            : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
        }`}
      >
        Needs Outreach
      </button>

      <button
        onClick={() => toggleBooleanFilter("needsDocs")}
        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
          activeFilters.needsDocs
            ? "bg-orange-100 border-orange-300 text-orange-700"
            : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
        }`}
      >
        Needs Docs
      </button>

      <button
        onClick={() => toggleBooleanFilter("pricingStale")}
        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
          activeFilters.pricingStale
            ? "bg-red-100 border-red-300 text-red-700"
            : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
        }`}
      >
        Pricing Stale
      </button>

      {/* Clear All */}
      {activeCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}

// Dropdown menu component
function DropdownMenu({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
        {children}
      </div>
    </>
  );
}

// Compact filter indicator
export function ActiveFiltersBar({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: { type: string; value: string; label: string }[];
  onRemove: (type: string, value: string) => void;
  onClearAll: () => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 py-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1.5 flex-wrap">
        {filters.map((filter, idx) => (
          <span
            key={`${filter.type}-${filter.value}-${idx}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-sm"
          >
            <span className="text-muted-foreground text-xs">{filter.type}:</span>
            {filter.label}
            <button
              onClick={() => onRemove(filter.type, filter.value)}
              className="text-slate-400 hover:text-slate-600 ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <button
          onClick={onClearAll}
          className="text-xs text-slate-500 hover:text-slate-700 ml-2"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
