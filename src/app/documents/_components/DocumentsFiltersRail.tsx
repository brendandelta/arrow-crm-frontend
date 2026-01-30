"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  User,
  Shield,
  Lock,
  FileWarning,
  ChevronRight,
  X,
  Calendar,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { DocumentFilters, FacetItem } from "@/lib/documents-api";

interface QuickScope {
  id: string;
  label: string;
  icon: React.ReactNode;
  filters: Partial<DocumentFilters>;
}

const QUICK_SCOPES: QuickScope[] = [
  { id: "all", label: "All Documents", icon: null, filters: {} },
  {
    id: "deals",
    label: "Deals",
    icon: <Briefcase className="h-4 w-4" />,
    filters: { linkableType: "Deal" },
  },
  {
    id: "entities",
    label: "Internal Entities",
    icon: <Shield className="h-4 w-4" />,
    filters: { linkableType: "InternalEntity" },
  },
  {
    id: "organizations",
    label: "Organizations",
    icon: <Building2 className="h-4 w-4" />,
    filters: { linkableType: "Organization" },
  },
  {
    id: "people",
    label: "People",
    icon: <User className="h-4 w-4" />,
    filters: { linkableType: "Person" },
  },
  {
    id: "confidential",
    label: "Confidential",
    icon: <Lock className="h-4 w-4" />,
    filters: { confidential: true },
  },
  {
    id: "needs_review",
    label: "Needs Review",
    icon: <FileWarning className="h-4 w-4" />,
    filters: { needsReview: true },
  },
];

interface DocumentsFiltersRailProps {
  filters: DocumentFilters;
  onFiltersChange: (filters: DocumentFilters) => void;
  facets: {
    category: FacetItem[];
    docType: FacetItem[];
    status: FacetItem[];
    sensitivity: FacetItem[];
    linkableType: FacetItem[];
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function DocumentsFiltersRail({
  filters,
  onFiltersChange,
  facets,
  isCollapsed,
  onToggleCollapse,
}: DocumentsFiltersRailProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["category", "status"])
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
        linkableType: undefined,
        confidential: undefined,
        needsReview: undefined,
      });
    } else {
      onFiltersChange({ ...filters, ...scope.filters });
    }
  };

  const isQuickScopeActive = (scope: QuickScope): boolean => {
    if (scope.id === "all") {
      return !filters.linkableType && !filters.confidential && !filters.needsReview;
    }
    if (scope.filters.linkableType) {
      return filters.linkableType === scope.filters.linkableType;
    }
    if (scope.filters.confidential) {
      return filters.confidential === true;
    }
    if (scope.filters.needsReview) {
      return filters.needsReview === true;
    }
    return false;
  };

  const toggleFacetValue = (
    key: "category" | "docType" | "status" | "sensitivity",
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
    filters.category?.length ||
    filters.docType?.length ||
    filters.status?.length ||
    filters.sensitivity?.length ||
    filters.linkableType ||
    filters.confidential ||
    filters.needsReview ||
    filters.updatedAfter ||
    filters.updatedBefore;

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-slate-200/60 bg-slate-50/50 flex flex-col items-center py-4 gap-2">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          title="Expand filters"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {QUICK_SCOPES.slice(1).map((scope) => (
          <button
            key={scope.id}
            onClick={() => handleQuickScopeClick(scope)}
            className={`p-2 rounded-lg transition-colors ${
              isQuickScopeActive(scope)
                ? "bg-indigo-100 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100"
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
    <div className="w-[260px] border-r border-slate-200/60 bg-slate-50/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Filters
        </span>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
            title="Collapse filters"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Quick Scopes */}
        <div className="px-3 py-3 border-b border-slate-200/60">
          <div className="space-y-1">
            {QUICK_SCOPES.map((scope) => (
              <button
                key={scope.id}
                onClick={() => handleQuickScopeClick(scope)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isQuickScopeActive(scope)
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {scope.icon}
                <span>{scope.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Facet Sections */}
        <div className="px-3 py-3 space-y-2">
          {/* Category */}
          <FacetSection
            title="Category"
            items={facets.category}
            selectedValues={filters.category || []}
            onToggle={(value) => toggleFacetValue("category", value)}
            isOpen={openSections.has("category")}
            onToggleOpen={() => toggleSection("category")}
          />

          {/* Doc Type */}
          <FacetSection
            title="Document Type"
            items={facets.docType}
            selectedValues={filters.docType || []}
            onToggle={(value) => toggleFacetValue("docType", value)}
            isOpen={openSections.has("docType")}
            onToggleOpen={() => toggleSection("docType")}
          />

          {/* Status */}
          <FacetSection
            title="Status"
            items={facets.status}
            selectedValues={filters.status || []}
            onToggle={(value) => toggleFacetValue("status", value)}
            isOpen={openSections.has("status")}
            onToggleOpen={() => toggleSection("status")}
          />

          {/* Sensitivity */}
          <FacetSection
            title="Sensitivity"
            items={facets.sensitivity}
            selectedValues={filters.sensitivity || []}
            onToggle={(value) => toggleFacetValue("sensitivity", value)}
            isOpen={openSections.has("sensitivity")}
            onToggleOpen={() => toggleSection("sensitivity")}
          />

          {/* Date Range */}
          <Collapsible
            open={openSections.has("dateRange")}
            onOpenChange={() => toggleSection("dateRange")}
          >
            <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Date Range</span>
              </div>
              <ChevronRight
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  openSections.has("dateRange") ? "rotate-90" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 pt-2 pb-1 space-y-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Updated after</label>
                <input
                  type="date"
                  value={filters.updatedAfter?.split("T")[0] || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      updatedAfter: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Updated before</label>
                <input
                  type="date"
                  value={filters.updatedBefore?.split("T")[0] || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      updatedBefore: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

interface FacetSectionProps {
  title: string;
  items: FacetItem[];
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
      <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {selectedCount > 0 && (
            <span className="flex items-center justify-center h-5 min-w-[20px] px-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
              {selectedCount}
            </span>
          )}
        </div>
        <ChevronRight
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pt-1 pb-1 space-y-0.5">
        {items.map((item) => (
          <label
            key={item.value}
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded cursor-pointer"
          >
            <Checkbox
              checked={selectedValues.includes(item.value)}
              onCheckedChange={() => onToggle(item.value)}
            />
            <span className="flex-1 truncate">{item.label}</span>
            <span className="text-xs text-slate-400">{item.count}</span>
          </label>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
