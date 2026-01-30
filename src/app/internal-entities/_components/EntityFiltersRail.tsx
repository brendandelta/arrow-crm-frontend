"use client";

import { useState } from "react";
import {
  Building2,
  FileCheck,
  Landmark,
  Users,
  Wallet,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Clock,
  Filter,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import type { EntityFilters, FacetItem, EntityFacets } from "@/lib/internal-entities-api";
import { ENTITY_TYPES, ENTITY_STATUSES, US_STATES } from "@/lib/internal-entities-api";

interface QuickScope {
  id: string;
  label: string;
  icon: React.ReactNode;
  filters: Partial<EntityFilters>;
}

const QUICK_SCOPES: QuickScope[] = [
  { id: "all", label: "All Entities", icon: <Landmark className="h-4 w-4" />, filters: {} },
  {
    id: "active",
    label: "Active",
    icon: <CheckCircle className="h-4 w-4" />,
    filters: { status: ["active"] },
  },
  {
    id: "inactive",
    label: "Inactive",
    icon: <Clock className="h-4 w-4" />,
    filters: { status: ["inactive"] },
  },
  {
    id: "has_bank",
    label: "Has Bank Accounts",
    icon: <Wallet className="h-4 w-4" />,
    filters: { hasBankAccounts: true },
  },
  {
    id: "has_signers",
    label: "Has Signers",
    icon: <Users className="h-4 w-4" />,
    filters: { hasSigners: true },
  },
  {
    id: "has_docs",
    label: "Has Documents",
    icon: <FileCheck className="h-4 w-4" />,
    filters: { hasDocuments: true },
  },
];

interface EntityFiltersRailProps {
  filters: EntityFilters;
  onFiltersChange: (filters: EntityFilters) => void;
  facets: EntityFacets;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function EntityFiltersRail({
  filters,
  onFiltersChange,
  facets,
  isCollapsed,
  onToggleCollapse,
}: EntityFiltersRailProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["entityType", "status"])
  );

  const toggleSection = (section: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(section)) {
      newOpen.delete(section);
    } else {
      newOpen.add(section);
    }
    setOpenSections(newOpen);
  };

  const handleQuickScopeClick = (scope: QuickScope) => {
    if (scope.id === "all") {
      onFiltersChange({
        ...filters,
        status: undefined,
        hasBankAccounts: undefined,
        hasSigners: undefined,
        hasDocuments: undefined,
      });
    } else {
      // Clear conflicting filters and apply new ones
      const newFilters = { ...filters };
      if (scope.filters.status) {
        newFilters.status = scope.filters.status;
        newFilters.hasBankAccounts = undefined;
        newFilters.hasSigners = undefined;
        newFilters.hasDocuments = undefined;
      } else if (scope.filters.hasBankAccounts !== undefined) {
        newFilters.hasBankAccounts = scope.filters.hasBankAccounts;
        newFilters.status = undefined;
        newFilters.hasSigners = undefined;
        newFilters.hasDocuments = undefined;
      } else if (scope.filters.hasSigners !== undefined) {
        newFilters.hasSigners = scope.filters.hasSigners;
        newFilters.status = undefined;
        newFilters.hasBankAccounts = undefined;
        newFilters.hasDocuments = undefined;
      } else if (scope.filters.hasDocuments !== undefined) {
        newFilters.hasDocuments = scope.filters.hasDocuments;
        newFilters.status = undefined;
        newFilters.hasBankAccounts = undefined;
        newFilters.hasSigners = undefined;
      }
      onFiltersChange(newFilters);
    }
  };

  const isQuickScopeActive = (scope: QuickScope): boolean => {
    if (scope.id === "all") {
      return (
        !filters.status?.length &&
        filters.hasBankAccounts === undefined &&
        filters.hasSigners === undefined &&
        filters.hasDocuments === undefined
      );
    }
    if (scope.filters.status) {
      return JSON.stringify(filters.status) === JSON.stringify(scope.filters.status);
    }
    if (scope.filters.hasBankAccounts !== undefined) {
      return filters.hasBankAccounts === scope.filters.hasBankAccounts;
    }
    if (scope.filters.hasSigners !== undefined) {
      return filters.hasSigners === scope.filters.hasSigners;
    }
    if (scope.filters.hasDocuments !== undefined) {
      return filters.hasDocuments === scope.filters.hasDocuments;
    }
    return false;
  };

  const toggleFacetValue = (
    key: "entityType" | "status" | "jurisdictionState",
    value: string
  ) => {
    const current = filters[key] || [];
    const newValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: newValues.length > 0 ? newValues : undefined });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.entityType?.length ||
    filters.status?.length ||
    filters.jurisdictionState?.length ||
    filters.hasBankAccounts !== undefined ||
    filters.hasSigners !== undefined ||
    filters.hasDocuments !== undefined;

  // Convert facet values to display format
  const entityTypeFacets: FacetItem[] = (facets?.entityType ?? []).map((f) => ({
    value: f.value,
    count: f.count,
    label: ENTITY_TYPES.find((t) => t.value === f.value)?.label || f.value,
  }));

  const statusFacets: FacetItem[] = (facets?.status ?? []).map((f) => ({
    value: f.value,
    count: f.count,
    label: ENTITY_STATUSES.find((s) => s.value === f.value)?.label || f.value,
  }));

  const jurisdictionFacets: FacetItem[] = (facets?.jurisdictionState ?? []).map((f) => ({
    value: f.value,
    count: f.count,
    label: US_STATES.find((s) => s.value === f.value)?.label || f.value,
  }));

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-slate-200/80 flex flex-col items-center py-6 gap-2">
        <button
          onClick={onToggleCollapse}
          className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors mb-4"
          title="Expand filters"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="w-8 h-px bg-slate-200 mb-4" />
        {QUICK_SCOPES.slice(1).map((scope) => (
          <button
            key={scope.id}
            onClick={() => handleQuickScopeClick(scope)}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isQuickScopeActive(scope)
                ? "bg-indigo-100 text-indigo-600 shadow-sm"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            }`}
            title={scope.label}
          >
            {scope.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-slate-200/80 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            title="Collapse filters"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Quick Scopes */}
        <div className="px-4 py-4 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 px-1">Quick Filters</p>
          <div className="space-y-1">
            {QUICK_SCOPES.map((scope) => (
              <button
                key={scope.id}
                onClick={() => handleQuickScopeClick(scope)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                  isQuickScopeActive(scope)
                    ? "bg-gradient-to-r from-indigo-50 to-indigo-50/50 text-indigo-700 font-medium shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`transition-colors ${isQuickScopeActive(scope) ? "text-indigo-500" : "text-slate-400"}`}>
                  {scope.icon}
                </span>
                <span>{scope.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Facet Sections */}
        <div className="px-4 py-4 space-y-2">
          {/* Entity Type */}
          <FacetSection
            title="Entity Type"
            items={entityTypeFacets}
            selectedValues={filters.entityType || []}
            onToggle={(value) => toggleFacetValue("entityType", value)}
            isOpen={openSections.has("entityType")}
            onToggleOpen={() => toggleSection("entityType")}
          />

          {/* Status */}
          <FacetSection
            title="Status"
            items={statusFacets}
            selectedValues={filters.status || []}
            onToggle={(value) => toggleFacetValue("status", value)}
            isOpen={openSections.has("status")}
            onToggleOpen={() => toggleSection("status")}
          />

          {/* Jurisdiction */}
          {jurisdictionFacets.length > 0 && (
            <FacetSection
              title="Jurisdiction"
              items={jurisdictionFacets}
              selectedValues={filters.jurisdictionState || []}
              onToggle={(value) => toggleFacetValue("jurisdictionState", value)}
              isOpen={openSections.has("jurisdiction")}
              onToggleOpen={() => toggleSection("jurisdiction")}
            />
          )}

          {/* Sort Options */}
          <Collapsible
            open={openSections.has("sort")}
            onOpenChange={() => toggleSection("sort")}
          >
            <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
              <span>Sort by</span>
              <ChevronRight
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  openSections.has("sort") ? "rotate-90" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-1 pb-2 space-y-0.5">
              {[
                { value: "name", label: "Name" },
                { value: "updatedAt", label: "Last Updated" },
                { value: "formationDate", label: "Formation Date" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      sort: option.value as EntityFilters["sort"],
                    })
                  }
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                    (filters.sort || "name") === option.value
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

interface FacetSectionProps {
  title: string;
  items: (FacetItem & { label?: string })[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

function FacetSection({
  title,
  items,
  selectedValues,
  onToggle,
  isOpen,
  onToggleOpen,
}: FacetSectionProps) {
  if (items.length === 0) return null;

  const selectedCount = selectedValues.length;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggleOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {selectedCount > 0 && (
            <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
              {selectedCount}
            </span>
          )}
        </div>
        <ChevronRight
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 pb-2 space-y-0.5">
        {items.map((item) => (
          <label
            key={item.value}
            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
          >
            <Checkbox
              checked={selectedValues.includes(item.value)}
              onCheckedChange={() => onToggle(item.value)}
              className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <span className="flex-1 truncate">{item.label || item.value}</span>
            <span className="text-xs text-slate-400 tabular-nums">{item.count}</span>
          </label>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
