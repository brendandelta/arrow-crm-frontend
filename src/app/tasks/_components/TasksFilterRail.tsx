"use client";

import { useState } from "react";
import {
  User,
  Users,
  AlertTriangle,
  Clock,
  Calendar,
  Inbox,
  CheckCircle,
  Pause,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  Filter,
  X,
  Building2,
  FolderKanban,
  CheckSquare,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AssigneeSelect } from "./AssigneeSelect";
import { PrioritySelect } from "./PrioritySelect";
import { StatusSelect } from "./StatusSelect";
import { type TaskStats, type UserOption, type AttachmentType } from "@/lib/tasks-api";

export type ViewType = "my" | "team" | "overdue" | "dueToday" | "dueThisWeek" | "unassigned" | "waiting" | "blocked" | "completed";

interface TasksFilterRailProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  attachmentFilter: AttachmentType | "all";
  onAttachmentFilterChange: (filter: AttachmentType | "all") => void;
  stats: TaskStats | null;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  // Advanced filters
  assigneeId?: number | null;
  onAssigneeChange?: (id: number | null) => void;
  priorityFilter?: number | null;
  onPriorityChange?: (priority: number | null) => void;
  statusFilter?: string | null;
  onStatusChange?: (status: string | null) => void;
  users?: UserOption[];
  currentUserId?: number;
}

interface QuickViewProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}

function QuickView({ icon, label, count, active, onClick, color }: QuickViewProps) {
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
      <span className={cn("flex-shrink-0", active ? "text-cyan-600" : color || "text-slate-400")}>
        {icon}
      </span>
      <span className="flex-1 text-sm truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge
          variant="secondary"
          className={cn(
            "h-5 px-1.5 text-[10px]",
            active
              ? "bg-cyan-100 text-cyan-700"
              : color?.includes("red")
              ? "bg-red-100 text-red-700"
              : color?.includes("amber")
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-600"
          )}
        >
          {count}
        </Badge>
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

export function TasksFilterRail({
  activeView,
  onViewChange,
  attachmentFilter,
  onAttachmentFilterChange,
  stats,
  collapsed,
  onCollapsedChange,
  assigneeId,
  onAssigneeChange,
  priorityFilter,
  onPriorityChange,
  statusFilter,
  onStatusChange,
  users,
  currentUserId,
}: TasksFilterRailProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAdvancedFilters = assigneeId || priorityFilter || statusFilter;
  const advancedFilterCount = [assigneeId, priorityFilter, statusFilter].filter(Boolean).length;

  const clearAdvancedFilters = () => {
    onAssigneeChange?.(null);
    onPriorityChange?.(null);
    onStatusChange?.(null);
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
        {(activeView !== "my" || attachmentFilter !== "all" || hasAdvancedFilters) && (
          <Badge
            variant="secondary"
            className="mt-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-cyan-100 text-cyan-700"
          >
            {1 + advancedFilterCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="w-56 bg-white border-r border-slate-200/80 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">Views</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapsedChange(true)}
          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Quick Views */}
        <div className="space-y-0.5">
          <QuickView
            icon={<User className="h-4 w-4" />}
            label="My Queue"
            count={stats?.open}
            active={activeView === "my"}
            onClick={() => onViewChange("my")}
          />
          <QuickView
            icon={<Users className="h-4 w-4" />}
            label="Team Queue"
            active={activeView === "team"}
            onClick={() => onViewChange("team")}
          />
        </div>

        <Separator />

        {/* Urgency Views */}
        <FilterSection title="Urgency">
          <QuickView
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Overdue"
            count={stats?.overdue}
            active={activeView === "overdue"}
            onClick={() => onViewChange("overdue")}
            color="text-red-500"
          />
          <QuickView
            icon={<Clock className="h-4 w-4" />}
            label="Due Today"
            count={stats?.dueToday}
            active={activeView === "dueToday"}
            onClick={() => onViewChange("dueToday")}
            color="text-amber-500"
          />
          <QuickView
            icon={<Calendar className="h-4 w-4" />}
            label="Due This Week"
            count={stats?.dueSoon}
            active={activeView === "dueThisWeek"}
            onClick={() => onViewChange("dueThisWeek")}
          />
        </FilterSection>

        <Separator />

        {/* Status Views */}
        <FilterSection title="Status">
          <QuickView
            icon={<Inbox className="h-4 w-4" />}
            label="Unassigned"
            count={stats?.unassigned}
            active={activeView === "unassigned"}
            onClick={() => onViewChange("unassigned")}
          />
          <QuickView
            icon={<Pause className="h-4 w-4" />}
            label="Waiting"
            count={stats?.byStatus?.waiting}
            active={activeView === "waiting"}
            onClick={() => onViewChange("waiting")}
          />
          <QuickView
            icon={<AlertCircle className="h-4 w-4" />}
            label="Blocked"
            count={stats?.byStatus?.blocked}
            active={activeView === "blocked"}
            onClick={() => onViewChange("blocked")}
          />
          <QuickView
            icon={<CheckCircle className="h-4 w-4" />}
            label="Completed"
            count={stats?.completed}
            active={activeView === "completed"}
            onClick={() => onViewChange("completed")}
          />
        </FilterSection>

        <Separator />

        {/* Attachment Filter */}
        <FilterSection title="Type">
          <QuickView
            icon={<Inbox className="h-4 w-4" />}
            label="All Tasks"
            active={attachmentFilter === "all"}
            onClick={() => onAttachmentFilterChange("all")}
          />
          <QuickView
            icon={<Building2 className="h-4 w-4" />}
            label="Deal Tasks"
            count={stats?.byAttachment?.deal}
            active={attachmentFilter === "deal"}
            onClick={() => onAttachmentFilterChange("deal")}
            color="text-blue-500"
          />
          <QuickView
            icon={<FolderKanban className="h-4 w-4" />}
            label="Project Tasks"
            count={stats?.byAttachment?.project}
            active={attachmentFilter === "project"}
            onClick={() => onAttachmentFilterChange("project")}
            color="text-purple-500"
          />
          <QuickView
            icon={<CheckSquare className="h-4 w-4" />}
            label="General"
            count={stats?.byAttachment?.general}
            active={attachmentFilter === "general"}
            onClick={() => onAttachmentFilterChange("general")}
          />
        </FilterSection>

        <Separator />

        {/* Advanced Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Filters
            </span>
            {hasAdvancedFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAdvancedFilters}
                className="h-6 px-1.5 text-[10px] text-slate-400 hover:text-slate-600"
              >
                Clear
              </Button>
            )}
          </div>

          <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full justify-start text-sm font-normal",
                  hasAdvancedFilters && "border-cyan-200 bg-cyan-50"
                )}
              >
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                {hasAdvancedFilters ? (
                  <span className="text-cyan-700">{advancedFilterCount} active</span>
                ) : (
                  <span className="text-slate-500">Add filters...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Assignee</label>
                  <AssigneeSelect
                    value={assigneeId || null}
                    onChange={(id) => onAssigneeChange?.(id)}
                    users={users}
                    size="sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Priority</label>
                  <PrioritySelect
                    value={priorityFilter || 2}
                    onChange={(p) => onPriorityChange?.(p)}
                    size="sm"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
