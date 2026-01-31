"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  X,
  ListTodo,
  Layers,
  CheckCircle2,
  Building2,
  FolderKanban,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPageIdentity } from "@/lib/page-registry";
import { type TaskStats } from "@/lib/tasks-api";

const pageIdentity = getPageIdentity("tasks");
const theme = pageIdentity?.theme;
const PageIcon = pageIdentity?.icon;

export type TasksTab = "queue" | "grouped" | "completed";
export type GroupByType = "deal" | "project";

interface TasksHeaderProps {
  stats: TaskStats | null;
  statsLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: TasksTab;
  onTabChange: (tab: TasksTab) => void;
  onCreateTask: () => void;
  onCreateProject?: () => void;
  groupBy?: GroupByType;
  onGroupByChange?: (groupBy: GroupByType) => void;
  subGroupByAssociation?: boolean;
  onSubGroupChange?: (enabled: boolean) => void;
}

export function TasksHeader({
  stats,
  statsLoading,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onCreateTask,
  onCreateProject,
  groupBy = "deal",
  onGroupByChange,
  subGroupByAssociation = false,
  onSubGroupChange,
}: TasksHeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Sync from parent
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const clearSearch = () => {
    setLocalSearch("");
    onSearchChange("");
  };

  const tabs = [
    {
      id: "queue" as TasksTab,
      label: "Queue",
      icon: ListTodo,
      count: stats?.open,
    },
    {
      id: "grouped" as TasksTab,
      label: "Grouped",
      icon: Layers,
    },
    {
      id: "completed" as TasksTab,
      label: "Completed",
      icon: CheckCircle2,
      count: stats?.completed,
    },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      {/* Top bar with title and actions */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Icon, Title, Stats */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                theme?.bgLight || "bg-cyan-100"
              )}
            >
              {PageIcon && (
                <PageIcon className={cn("h-5 w-5", theme?.text || "text-cyan-600")} />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
              <div className="flex items-center gap-3 mt-0.5">
                {statsLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : stats ? (
                  <>
                    <span className="text-sm text-slate-500">
                      {stats.open} open
                    </span>
                    {stats.overdue > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] bg-red-100 text-red-700"
                      >
                        {stats.overdue} overdue
                      </Badge>
                    )}
                    {stats.dueToday > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700"
                      >
                        {stats.dueToday} due today
                      </Badge>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right: Search and Create */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-64 pl-9 pr-8 h-9 bg-slate-50 border-slate-200 focus:bg-white"
              />
              {localSearch && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Create buttons */}
            {activeTab === "grouped" && groupBy === "project" && onCreateProject && (
              <Button
                onClick={onCreateProject}
                variant="outline"
                className="gap-1.5"
              >
                <FolderKanban className="h-4 w-4" />
                New Project
              </Button>
            )}
            <Button
              onClick={onCreateTask}
              className={cn(
                "gap-1.5",
                theme?.solid || "bg-cyan-600",
                "hover:opacity-90 text-white"
              )}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Premium pill-style tabs */}
      <div className="px-6 pb-4 flex items-center gap-4">
        <div className="inline-flex items-center rounded-lg bg-slate-100/80 p-1 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-cyan-600" : "text-slate-400")} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "ml-1 px-1.5 py-0.5 rounded-full text-xs tabular-nums",
                      isActive
                        ? "bg-cyan-100 text-cyan-700"
                        : "bg-slate-200/80 text-slate-500"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Group by toggle - only show when grouped tab is active */}
        {activeTab === "grouped" && onGroupByChange && (
          <div className="inline-flex items-center rounded-lg bg-slate-100/80 p-1 gap-1">
            <button
              onClick={() => onGroupByChange("deal")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                groupBy === "deal"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Building2 className={cn("h-3.5 w-3.5", groupBy === "deal" ? "text-blue-600" : "text-slate-400")} />
              Deals
            </button>
            <button
              onClick={() => onGroupByChange("project")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                groupBy === "project"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <FolderKanban className={cn("h-3.5 w-3.5", groupBy === "project" ? "text-purple-600" : "text-slate-400")} />
              Projects
            </button>
          </div>
        )}

        {/* Sub-group toggle - only show when grouped by deals */}
        {activeTab === "grouped" && groupBy === "deal" && onSubGroupChange && (
          <button
            onClick={() => onSubGroupChange(!subGroupByAssociation)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              subGroupByAssociation
                ? "bg-slate-900 text-white"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Sub-group
          </button>
        )}
      </div>
    </div>
  );
}
