"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Phone,
  Mail,
  StickyNote,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageSquare,
  Video,
  Plus,
  Check,
  Circle,
  User,
  Pencil,
  Trash2,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTableFiltering } from "./table-filtering/useTableFiltering";
import { FilterableHeader } from "./table-filtering/FilterableHeader";
import { ActiveFiltersBar } from "./table-filtering/ActiveFiltersBar";
import type { ColumnDef } from "./table-filtering/types";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

interface Activity {
  id: number;
  kind: string;
  subject: string | null;
  occurredAt: string;
  outcome?: string | null;
}

interface TaskInfo {
  id: number;
  subject: string;
  dueAt: string | null;
  overdue: boolean;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
}

interface DealTarget {
  id: number;
  targetType: string;
  targetId: number;
  targetName: string;
  status: string;
  role: string | null;
  priority: number;
  lastActivityAt: string | null;
  activityCount: number;
  firstContactedAt?: string | null;
  lastContactedAt?: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  notes?: string | null;
  isStale: boolean;
  daysSinceContact: number | null;
  owner?: Owner | null;
  recentActivities?: Activity[];
  tasks?: TaskInfo[];
  nextTask?: TaskInfo | null;
}

interface DealTargetsSectionProps {
  targets: DealTarget[];
  dealId: number;
  onTargetUpdated: () => void;
  onAddTarget: () => void;
  onTargetClick?: (target: DealTarget) => void;
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "contacted", label: "Contacted" },
  { value: "engaged", label: "Engaged" },
  { value: "negotiating", label: "Negotiating" },
  { value: "committed", label: "Committed" },
  { value: "passed", label: "Passed" },
  { value: "on_hold", label: "On Hold" },
];

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  contacted: "bg-sky-50 text-sky-700",
  engaged: "bg-indigo-50 text-indigo-700",
  negotiating: "bg-violet-50 text-violet-700",
  committed: "bg-emerald-50 text-emerald-700",
  passed: "bg-rose-50 text-rose-600",
  on_hold: "bg-amber-50 text-amber-700",
};

const ACTIVITY_KINDS = [
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Video },
  { value: "whatsapp", label: "Message", icon: MessageSquare },
  { value: "note", label: "Note", icon: StickyNote },
];

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Video,
  whatsapp: MessageSquare,
  sms: MessageSquare,
  linkedin_message: MessageSquare,
  note: StickyNote,
  video_call: Video,
};

const TARGET_COLUMNS: ColumnDef<DealTarget>[] = [
  {
    id: "target",
    label: "Target",
    filterType: "text",
    accessor: (row) => row.targetName,
    sortLabels: ["A → Z", "Z → A"],
  },
  {
    id: "status",
    label: "Status",
    filterType: "enum",
    accessor: (row) => row.status,
    enumOptions: STATUS_OPTIONS.map((s) => ({
      value: s.value,
      label: s.label,
      color: STATUS_COLORS[s.value],
    })),
    sortLabels: ["A → Z", "Z → A"],
  },
  {
    id: "role",
    label: "Role",
    filterType: "text",
    accessor: (row) => row.role?.replace(/_/g, " ") ?? null,
    sortLabels: ["A → Z", "Z → A"],
  },
  {
    id: "lastContact",
    label: "Last Contact",
    filterType: "datePreset",
    accessor: (row) => row.lastContactedAt ?? null,
    sortAccessor: (row) => {
      if (!row.lastContactedAt) return null;
      return new Date(row.lastContactedAt).getTime();
    },
    datePresets: [
      { value: "today", label: "Today" },
      { value: "this_week", label: "This week" },
      { value: "7plus_days", label: "7+ days" },
      { value: "never", label: "Never" },
    ],
    sortLabels: ["Recent first", "Oldest first"],
  },
  {
    id: "owner",
    label: "Owner",
    filterType: "text",
    accessor: (row) => (row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : null),
    sortAccessor: (row) => row.owner?.firstName ?? null,
    sortLabels: ["A → Z", "Z → A"],
  },
  {
    id: "nextStep",
    label: "Next Step",
    filterType: "text",
    accessor: (row) => row.nextStep ?? null,
    sortLabels: ["A → Z", "Z → A"],
  },
];

export function DealTargetsSection({ targets, dealId, onTargetUpdated, onAddTarget, onTargetClick }: DealTargetsSectionProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [expandedTimelines, setExpandedTimelines] = useState<Set<number>>(new Set());
  const [loggingEventFor, setLoggingEventFor] = useState<{ targetId: number; kind: string } | null>(null);
  const [addingTaskFor, setAddingTaskFor] = useState<number | null>(null);

  const {
    filteredData,
    activeFilters,
    hasActiveFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    toggleSort,
    setSort,
    getSortDirection,
    getEnumCounts,
    getDatePresetCounts,
  } = useTableFiltering(targets, TARGET_COLUMNS);

  const statusCounts = targets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const staleCount = targets.filter((t) => t.isStale).length;

  const toggleTimeline = (targetId: number) => {
    setExpandedTimelines((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };

  const handleStatusChange = async (targetId: number, newStatus: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onTargetUpdated();
    } catch (err) {
      console.error("Failed to update target status:", err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_OPTIONS.filter((s) => statusCounts[s.value]).map((s) => (
              <span
                key={s.value}
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.value]}`}
              >
                {statusCounts[s.value]} {s.label}
              </span>
            ))}
            {staleCount > 0 && (
              <Badge className="bg-amber-50 text-amber-600 text-[11px] border border-amber-200">
                {staleCount} stale
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 ${viewMode === "card" ? "bg-muted" : "hover:bg-muted"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 ${viewMode === "table" ? "bg-muted" : "hover:bg-muted"}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onAddTarget}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-background bg-foreground hover:bg-foreground/90 rounded-md transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Target
          </button>
        </div>
      </div>

      {/* Content */}
      {targets.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No outreach targets for this deal
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {TARGET_COLUMNS.map((col) => (
                  <FilterableHeader
                    key={col.id}
                    column={col}
                    filterValue={activeFilters.find((f) => f.columnId === col.id)?.filterValue}
                    sortDirection={getSortDirection(col.id)}
                    enumCounts={getEnumCounts(col.id)}
                    datePresetCounts={getDatePresetCounts(col.id)}
                    onFilterChange={setFilter}
                    onSortToggle={toggleSort}
                    onSortSet={setSort}
                  />
                ))}
              </TableRow>
              <ActiveFiltersBar
                filters={activeFilters}
                colSpan={TARGET_COLUMNS.length}
                onClearFilter={clearFilter}
                onClearAll={clearAllFilters}
              />
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 && hasActiveFilters ? (
                <TableRow>
                  <TableCell colSpan={TARGET_COLUMNS.length} className="text-center py-8">
                    <div className="text-sm text-muted-foreground">No results match your filters</div>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Clear filters
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
              filteredData.map((target) => {
                const isStale = target.isStale || (target.daysSinceContact !== null && target.daysSinceContact > 7);
                return (
                  <TableRow
                    key={target.id}
                    className={`cursor-pointer hover:bg-muted ${isStale ? "bg-amber-50/50" : ""}`}
                    onClick={() => onTargetClick?.(target)}
                  >
                    <TableCell>
                      <div className="font-medium">{target.targetName}</div>
                      <div className="text-xs text-muted-foreground">{target.activityCount} events</div>
                    </TableCell>
                    <TableCell>
                      <select
                        value={target.status}
                        onChange={(e) => { e.stopPropagation(); handleStatusChange(target.id, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-[11px] px-2 py-0.5 rounded-full border-0 font-medium cursor-pointer appearance-none ${STATUS_COLORS[target.status] || "bg-muted text-muted-foreground"}`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {target.role?.replace(/_/g, " ") || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {target.daysSinceContact !== null
                          ? target.daysSinceContact === 0
                            ? "Today"
                            : `${target.daysSinceContact}d ago`
                          : "Never"}
                      </div>
                      {isStale && (
                        <span className="text-[11px] text-amber-600 font-medium">Stale</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {target.owner ? `${target.owner.firstName}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {target.nextStep || (target.nextStepAt ? formatDate(target.nextStepAt) : "—")}
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredData.map((target) => (
            <TargetRow
              key={target.id}
              target={target}
              dealId={dealId}
              isTimelineExpanded={expandedTimelines.has(target.id)}
              isLoggingEvent={loggingEventFor?.targetId === target.id}
              loggingKind={loggingEventFor?.targetId === target.id ? loggingEventFor.kind : undefined}
              isAddingTask={addingTaskFor === target.id}
              onToggleTimeline={() => toggleTimeline(target.id)}
              onStartLogEvent={(kind: string) => setLoggingEventFor({ targetId: target.id, kind })}
              onCancelLogEvent={() => setLoggingEventFor(null)}
              onStartAddTask={() => setAddingTaskFor(target.id)}
              onCancelAddTask={() => setAddingTaskFor(null)}
              onStatusChange={handleStatusChange}
              onTargetUpdated={onTargetUpdated}
              onTargetClick={onTargetClick}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ TargetRow Component ============

interface TargetRowProps {
  target: DealTarget;
  dealId: number;
  isTimelineExpanded: boolean;
  isLoggingEvent: boolean;
  loggingKind?: string;
  isAddingTask: boolean;
  onToggleTimeline: () => void;
  onStartLogEvent: (kind: string) => void;
  onCancelLogEvent: () => void;
  onStartAddTask: () => void;
  onCancelAddTask: () => void;
  onStatusChange: (targetId: number, status: string) => void;
  onTargetUpdated: () => void;
  onTargetClick?: (target: DealTarget) => void;
  formatDate: (date: string | null) => string;
}

function TargetRow({
  target,
  dealId,
  isTimelineExpanded,
  isLoggingEvent,
  loggingKind,
  isAddingTask,
  onToggleTimeline,
  onStartLogEvent,
  onCancelLogEvent,
  onStartAddTask,
  onCancelAddTask,
  onStatusChange,
  onTargetUpdated,
  onTargetClick,
  formatDate,
}: TargetRowProps) {
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(target.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isStale = target.isStale || (target.daysSinceContact !== null && target.daysSinceContact > 7);

  // Sync notes when prop changes (e.g., edited via modal)
  useEffect(() => {
    setNotesValue(target.notes || "");
  }, [target.notes]);

  const saveNotes = async (value: string) => {
    const trimmed = value.trim();
    if (trimmed === (target.notes || "").trim()) {
      setEditingNotes(false);
      return;
    }
    setSavingNotes(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: trimmed || null }),
      });
      onTargetUpdated();
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
    setSavingNotes(false);
    setEditingNotes(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets/${target.id}`, {
        method: "DELETE",
      });
      onTargetUpdated();
    } catch (err) {
      console.error("Failed to delete target:", err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      id={`target-card-${target.id}`}
      className={`group/card rounded-lg border bg-card transition-all hover:shadow-sm ${
        isStale
          ? "border-l-[3px] border-l-amber-400 border-t-slate-200 border-r-slate-200 border-b-slate-200"
          : "border-border hover:border-border"
      }`}
    >
      {/* Card Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onTargetClick?.(target)}
                className="text-[15px] font-semibold text-foreground hover:text-indigo-600 transition-colors text-left leading-tight"
              >
                {target.targetName}
              </button>
              <select
                value={target.status}
                onChange={(e) => onStatusChange(target.id, e.target.value)}
                className={`text-[11px] px-2 py-0.5 rounded-full border-0 font-medium cursor-pointer appearance-none ${STATUS_COLORS[target.status] || "bg-muted text-muted-foreground"}`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {target.role && (
                <span className="text-[11px] text-muted-foreground capitalize">
                  {target.role.replace(/_/g, " ")}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">
                {target.daysSinceContact !== null
                  ? target.daysSinceContact === 0
                    ? "Contacted today"
                    : `${target.daysSinceContact}d since contact`
                  : "No contact yet"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {target.owner && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <User className="h-3 w-3" />
                {target.owner.firstName}
              </div>
            )}
            {confirmDelete ? (
              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-200">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors shadow-sm disabled:opacity-50"
                >
                  {deleting ? "..." : "Remove"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] text-muted-foreground hover:text-muted-foreground px-1.5 py-1 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="opacity-0 group-hover/card:opacity-100 p-1.5 rounded-md text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Remove target"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Body — Two columns */}
      <div className="flex border-t border-border">
        {/* Left: Activity / Events */}
        <div className="flex-1 min-w-0 px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Activity</span>
            {!isLoggingEvent && (
              <button
                onClick={() => onStartLogEvent("call")}
                className="opacity-0 group-hover/card:opacity-100 flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 transition-all"
              >
                <Plus className="h-3 w-3" />
                Log
              </button>
            )}
          </div>

          {target.recentActivities && target.recentActivities.length > 0 ? (
            <div>
              <button
                onClick={onToggleTimeline}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors w-full text-left"
              >
                {isTimelineExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="font-medium">{target.recentActivities.length}</span>
                <span className="text-muted-foreground">event{target.recentActivities.length !== 1 ? "s" : ""}</span>
              </button>

              {isTimelineExpanded && (
                <div className="mt-2 ml-1 space-y-1 border-l-2 border-border pl-3">
                  {target.recentActivities.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.kind] || Clock;
                    return (
                      <div key={activity.id} className="flex items-center gap-2 py-0.5">
                        <Icon className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        <span className="text-[12px] text-muted-foreground truncate flex-1">
                          {activity.subject || activity.kind}
                        </span>
                        <span className="text-[11px] text-muted-foreground/60 shrink-0 tabular-nums">
                          {formatDate(activity.occurredAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/60 italic">No activity recorded</p>
          )}

          {isLoggingEvent && (
            <InlineLogEventForm
              dealId={dealId}
              targetId={target.id}
              initialKind={loggingKind || "call"}
              onCancel={onCancelLogEvent}
              onSuccess={() => { onCancelLogEvent(); onTargetUpdated(); }}
            />
          )}
        </div>

        {/* Divider */}
        <div className="w-px bg-muted my-3" />

        {/* Right: Target Tasks */}
        <div className="w-[280px] shrink-0 px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Target Tasks</span>
            {!isAddingTask && (
              <button
                onClick={onStartAddTask}
                className="opacity-0 group-hover/card:opacity-100 flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 transition-all"
              >
                <Plus className="h-3 w-3" />
                Task
              </button>
            )}
          </div>

          {target.tasks && target.tasks.length > 0 ? (
            <div className="space-y-0.5">
              {/* Primary task — always visible */}
              <TaskCheckboxItem
                task={target.tasks[0]}
                formatDate={formatDate}
                onComplete={onTargetUpdated}
                isPrimary
              />

              {/* Additional tasks */}
              {target.tasks.length > 1 && (
                <>
                  <button
                    onClick={() => setTasksExpanded(!tasksExpanded)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-muted-foreground mt-1 ml-6 transition-colors"
                  >
                    {tasksExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {target.tasks.length - 1} more
                  </button>
                  {tasksExpanded && (
                    <div className="space-y-0.5 mt-0.5">
                      {target.tasks.slice(1).map((task) => (
                        <TaskCheckboxItem
                          key={task.id}
                          task={task}
                          formatDate={formatDate}
                          onComplete={onTargetUpdated}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : !isAddingTask ? (
            <p className="text-[12px] text-muted-foreground/60 italic">No tasks yet</p>
          ) : null}

          {isAddingTask && (
            <InlineAddTaskForm
              dealId={dealId}
              targetId={target.id}
              onCancel={onCancelAddTask}
              onSuccess={() => { onCancelAddTask(); onTargetUpdated(); }}
            />
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Notes</span>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="opacity-0 group-hover/card:opacity-100 text-muted-foreground hover:text-indigo-500 transition-all"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
        {editingNotes ? (
          <textarea
            autoFocus
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            onBlur={() => saveNotes(notesValue)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setNotesValue(target.notes || "");
                setEditingNotes(false);
              }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                saveNotes(notesValue);
              }
            }}
            placeholder="Add a note..."
            className="w-full text-[13px] text-foreground bg-muted border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none min-h-[60px] placeholder:text-muted-foreground/60"
          />
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="w-full text-left"
          >
            {notesValue ? (
              <p className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{notesValue}</p>
            ) : (
              <p className="text-[12px] text-muted-foreground/60 italic">Add a note...</p>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ============ TaskCheckboxItem Component ============

function TaskCheckboxItem({ task, formatDate, onComplete, isPrimary }: {
  task: TaskInfo;
  formatDate: (date: string | null) => string;
  onComplete: () => void;
  isPrimary?: boolean;
}) {
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCompleting(true);
    setCompleted(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}/complete`, {
        method: "POST",
      });
      onComplete();
    } catch (err) {
      console.error("Failed to complete task:", err);
      setCompleted(false);
    }
    setCompleting(false);
  };

  if (completed) {
    return (
      <div className="flex items-center gap-2 py-1 px-1.5 rounded">
        <div className="w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <Check className="h-3 w-3 text-white" />
        </div>
        <span className="text-[12px] text-muted-foreground line-through truncate">{task.subject}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 py-1 px-1.5 rounded-md group/task hover:bg-muted transition-colors ${isPrimary ? "" : ""}`}>
      <button
        onClick={handleComplete}
        disabled={completing}
        className="mt-[2px] w-[18px] h-[18px] rounded-full border-[1.5px] border-border group-hover/task:border-emerald-400 flex items-center justify-center shrink-0 transition-all hover:bg-emerald-50 disabled:opacity-50"
      >
        <Check className="h-3 w-3 text-emerald-500 opacity-0 group-hover/task:opacity-60 transition-opacity" />
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] leading-tight truncate ${
          task.overdue ? "text-rose-600 font-medium" : "text-foreground"
        }`}>
          {task.subject}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {task.dueAt && (
            <span className={`text-[11px] ${task.overdue ? "text-rose-500 font-medium" : "text-muted-foreground"}`}>
              {formatDate(task.dueAt)}
            </span>
          )}
          {task.assignedTo && (
            <span className="text-[11px] text-muted-foreground/60 flex items-center gap-0.5">
              <Circle className="h-2 w-2 fill-slate-300 text-muted-foreground/60" />
              {task.assignedTo.firstName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ InlineLogEventForm Component ============

interface InlineLogEventFormProps {
  dealId: number;
  targetId: number;
  initialKind?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const DIRECTIONS = [
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
];

const CALL_OUTCOMES = [
  { value: "connected", label: "Connected" },
  { value: "no_answer", label: "No Answer" },
  { value: "left_voicemail", label: "Left Voicemail" },
  { value: "scheduled_followup", label: "Scheduled Follow-up" },
];

const MEETING_OUTCOMES = [
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No Show" },
  { value: "cancelled", label: "Cancelled" },
  { value: "scheduled_followup", label: "Scheduled Follow-up" },
];

const KINDS_WITH_DIRECTION = ["call", "email", "whatsapp", "sms", "linkedin_message"];
const KINDS_WITH_OUTCOME = ["call", "meeting"];
const KINDS_WITH_TIME = ["meeting"];

function InlineLogEventForm({ dealId, targetId, initialKind = "call", onCancel, onSuccess }: InlineLogEventFormProps) {
  const [kind, setKind] = useState(initialKind);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [direction, setDirection] = useState("outbound");
  const [outcome, setOutcome] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showDirection = KINDS_WITH_DIRECTION.includes(kind);
  const showOutcome = KINDS_WITH_OUTCOME.includes(kind);
  const showTime = KINDS_WITH_TIME.includes(kind);
  const outcomeOptions = kind === "meeting" ? MEETING_OUTCOMES : CALL_OUTCOMES;

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      kind,
      subject: subject.trim(),
      body: body.trim() || null,
      regarding_type: "DealTarget",
      regarding_id: targetId,
      deal_target_id: targetId,
      deal_id: dealId,
      occurred_at: new Date().toISOString(),
    };

    if (showDirection) payload.direction = direction;
    if (showOutcome && outcome) payload.outcome = outcome;
    if (showTime && startsAt) payload.starts_at = startsAt;
    if (showTime && endsAt) payload.ends_at = endsAt;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to log event:", err);
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-3 p-3 bg-muted/80 rounded-lg border border-border space-y-2.5">
      {/* Kind selector */}
      <div className="flex items-center gap-1">
        {ACTIVITY_KINDS.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-all ${
                kind === k.value
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3 w-3" />
              {k.label}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        placeholder="What happened?"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full text-[13px] px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-muted-foreground/60"
        autoFocus
      />

      {/* Type-specific fields */}
      <div className="flex items-center gap-2 flex-wrap">
        {showDirection && (
          <div className="flex items-center rounded-md overflow-hidden border border-border">
            {DIRECTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDirection(d.value)}
                className={`text-[11px] px-2.5 py-1 transition-colors ${
                  direction === d.value ? "bg-indigo-500 text-white" : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
        {showOutcome && (
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="text-[11px] bg-card border border-border rounded-md px-2 py-1"
          >
            <option value="">Outcome...</option>
            {outcomeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
      </div>

      {showTime && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Start:</span>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="text-[11px] bg-card border border-border rounded-md px-2 py-1" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">End:</span>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="text-[11px] bg-card border border-border rounded-md px-2 py-1" />
          </div>
        </div>
      )}

      <textarea
        placeholder="Notes (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full text-[13px] px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none placeholder:text-muted-foreground/60"
      />

      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={handleSubmit}
          disabled={!subject.trim() || submitting}
          className="px-3 py-1.5 text-[12px] font-medium text-background bg-foreground rounded-md hover:bg-foreground/80 disabled:opacity-40 transition-colors shadow-sm"
        >
          {submitting ? "Saving..." : "Log Event"}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-[12px] text-muted-foreground hover:text-muted-foreground transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ============ InlineAddTaskForm Component ============

interface InlineAddTaskFormProps {
  dealId: number;
  targetId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

function InlineAddTaskForm({ dealId, targetId, onCancel, onSuccess }: InlineAddTaskFormProps) {
  const [subject, setSubject] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("normal");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [users, setUsers] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    setSubmitting(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            subject: subject.trim(),
            due_at: dueAt || null,
            priority: priority === "high" ? 2 : priority === "low" ? 0 : 1,
            assigned_to_id: assignedToId ? Number(assignedToId) : null,
            deal_id: dealId,
            taskable_type: "DealTarget",
            taskable_id: targetId,
          },
        }),
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && subject.trim()) handleSubmit();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="mt-2 p-3 bg-muted/80 rounded-lg border border-border space-y-2">
      <input
        type="text"
        placeholder="What needs to be done?"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full text-[13px] px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-muted-foreground/60"
        autoFocus
      />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3 w-3 text-muted-foreground/60" />
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="text-[11px] bg-card border border-border rounded-md px-2 py-1 text-muted-foreground"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-[11px] bg-card border border-border rounded-md px-2 py-1 text-muted-foreground"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
        <select
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          className="text-[11px] bg-card border border-border rounded-md px-2 py-1 text-muted-foreground"
        >
          <option value="">Assign to...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={handleSubmit}
          disabled={!subject.trim() || submitting}
          className="px-3 py-1.5 text-[12px] font-medium text-background bg-foreground rounded-md hover:bg-foreground/80 disabled:opacity-40 transition-colors shadow-sm"
        >
          {submitting ? "Saving..." : "Add Task"}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-[12px] text-muted-foreground hover:text-muted-foreground transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
