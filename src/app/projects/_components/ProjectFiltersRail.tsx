"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Play,
  FolderOpen,
  Pause,
  CheckCircle2,
  User,
  Users,
  AlertTriangle,
  FileQuestion,
  Clock,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  type ProjectFilters,
  type ProjectStatus,
  PROJECT_STATUSES,
  getStatusDotColor,
} from "@/lib/projects-api";

interface ProjectFiltersRailProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  counts: {
    total: number;
    active: number;
    open: number;
    paused: number;
    complete: number;
    withOverdue: number;
    noTasks: number;
  };
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  currentUserId?: number;
}

interface QuickScopeProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

function QuickScope({ icon, label, count, active, onClick }: QuickScopeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150",
        active
          ? "bg-cyan-50 text-cyan-700 font-medium"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn("flex-shrink-0", active ? "text-cyan-600" : "text-slate-400")}>
        {icon}
      </span>
      <span className="flex-1 text-sm truncate">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-xs tabular-nums",
            active ? "text-cyan-600" : "text-slate-400"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pb-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function ProjectFiltersRail({
  filters,
  onFiltersChange,
  counts,
  collapsed,
  onCollapsedChange,
  currentUserId,
}: ProjectFiltersRailProps) {
  const hasActiveFilters =
    (filters.status && filters.status.length > 0) ||
    filters.ownerId ||
    filters.hasOverdueTasks ||
    filters.hasNoTasks;

  const activeFilterCount = [
    filters.status?.length ? 1 : 0,
    filters.ownerId ? 1 : 0,
    filters.hasOverdueTasks ? 1 : 0,
    filters.hasNoTasks ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    onFiltersChange({
      q: filters.q, // Keep search
      sort: filters.sort,
    });
  };

  const toggleStatus = (status: ProjectStatus) => {
    const current = filters.status || [];
    if (current.includes(status)) {
      onFiltersChange({
        ...filters,
        status: current.filter((s) => s !== status),
      });
    } else {
      onFiltersChange({
        ...filters,
        status: [...current, status],
      });
    }
  };

  const setStatusFilter = (status: ProjectStatus | null) => {
    if (status === null) {
      onFiltersChange({
        ...filters,
        status: undefined,
      });
    } else {
      onFiltersChange({
        ...filters,
        status: [status],
      });
    }
  };

  const toggleOwnership = (mine: boolean) => {
    if (mine && currentUserId) {
      onFiltersChange({
        ...filters,
        ownerId: filters.ownerId === currentUserId ? undefined : currentUserId,
      });
    } else {
      onFiltersChange({
        ...filters,
        ownerId: undefined,
      });
    }
  };

  const toggleHealthFilter = (filterKey: "hasOverdueTasks" | "hasNoTasks") => {
    onFiltersChange({
      ...filters,
      [filterKey]: filters[filterKey] ? undefined : true,
    });
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-white border-r border-slate-200/80 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapsedChange(false)}
          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Badge
            variant="secondary"
            className="mt-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-cyan-100 text-cyan-700"
          >
            {activeFilterCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-slate-200/80 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">Filters</span>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] bg-cyan-100 text-cyan-700"
            >
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange(true)}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4">
        {/* Quick Scopes */}
        <div className="space-y-0.5">
          <QuickScope
            icon={<FolderKanban className="h-4 w-4" />}
            label="All Projects"
            count={counts.total}
            active={!filters.status?.length && !filters.hasOverdueTasks && !filters.hasNoTasks}
            onClick={() => clearAllFilters()}
          />
        </div>

        <Separator />

        {/* Status */}
        <FilterSection title="Status">
          <QuickScope
            icon={<Play className="h-4 w-4" />}
            label="Active"
            count={counts.active}
            active={filters.status?.length === 1 && filters.status[0] === "active"}
            onClick={() => setStatusFilter(filters.status?.length === 1 && filters.status[0] === "active" ? null : "active")}
          />
          <QuickScope
            icon={<FolderOpen className="h-4 w-4" />}
            label="Open"
            count={counts.open}
            active={filters.status?.length === 1 && filters.status[0] === "open"}
            onClick={() => setStatusFilter(filters.status?.length === 1 && filters.status[0] === "open" ? null : "open")}
          />
          <QuickScope
            icon={<Pause className="h-4 w-4" />}
            label="Paused"
            count={counts.paused}
            active={filters.status?.length === 1 && filters.status[0] === "paused"}
            onClick={() => setStatusFilter(filters.status?.length === 1 && filters.status[0] === "paused" ? null : "paused")}
          />
          <QuickScope
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Complete"
            count={counts.complete}
            active={filters.status?.length === 1 && filters.status[0] === "complete"}
            onClick={() => setStatusFilter(filters.status?.length === 1 && filters.status[0] === "complete" ? null : "complete")}
          />
        </FilterSection>

        <Separator />

        {/* Ownership */}
        {currentUserId && (
          <>
            <FilterSection title="Ownership">
              <QuickScope
                icon={<User className="h-4 w-4" />}
                label="My Projects"
                active={filters.ownerId === currentUserId}
                onClick={() => toggleOwnership(true)}
              />
              <QuickScope
                icon={<Users className="h-4 w-4" />}
                label="All Owners"
                active={!filters.ownerId}
                onClick={() => toggleOwnership(false)}
              />
            </FilterSection>
            <Separator />
          </>
        )}

        {/* Health */}
        <FilterSection title="Health">
          <QuickScope
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Has Overdue Tasks"
            count={counts.withOverdue}
            active={filters.hasOverdueTasks === true}
            onClick={() => toggleHealthFilter("hasOverdueTasks")}
          />
          <QuickScope
            icon={<FileQuestion className="h-4 w-4" />}
            label="No Tasks Yet"
            count={counts.noTasks}
            active={filters.hasNoTasks === true}
            onClick={() => toggleHealthFilter("hasNoTasks")}
          />
        </FilterSection>
      </div>
    </div>
  );
}
