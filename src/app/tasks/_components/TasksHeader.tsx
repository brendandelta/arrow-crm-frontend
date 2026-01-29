"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPageIdentity } from "@/lib/page-registry";
import { type TaskStats } from "@/lib/tasks-api";

const pageIdentity = getPageIdentity("tasks");
const theme = pageIdentity?.theme;
const PageIcon = pageIdentity?.icon;

export type TasksTab = "queue" | "grouped" | "completed";

interface TasksHeaderProps {
  stats: TaskStats | null;
  statsLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: TasksTab;
  onTabChange: (tab: TasksTab) => void;
  onCreateTask: () => void;
}

export function TasksHeader({
  stats,
  statsLoading,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onCreateTask,
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

            {/* Create button */}
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

      {/* Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TasksTab)}>
          <TabsList className="bg-transparent p-0 h-auto gap-6">
            <TabsTrigger
              value="queue"
              className={cn(
                "bg-transparent px-0 pb-3 pt-0 rounded-none border-b-2 border-transparent",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                "data-[state=active]:border-cyan-600 data-[state=active]:text-slate-900",
                "text-slate-500 hover:text-slate-700"
              )}
            >
              Queue
            </TabsTrigger>
            <TabsTrigger
              value="grouped"
              className={cn(
                "bg-transparent px-0 pb-3 pt-0 rounded-none border-b-2 border-transparent",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                "data-[state=active]:border-cyan-600 data-[state=active]:text-slate-900",
                "text-slate-500 hover:text-slate-700"
              )}
            >
              Grouped
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className={cn(
                "bg-transparent px-0 pb-3 pt-0 rounded-none border-b-2 border-transparent",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                "data-[state=active]:border-cyan-600 data-[state=active]:text-slate-900",
                "text-slate-500 hover:text-slate-700"
              )}
            >
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
