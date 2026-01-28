"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  FileText,
  Shield,
  ChevronDown,
  ChevronRight,
  Check,
  Plus,
  Upload,
  CalendarDays,
  MessageSquare,
  Mail,
  Phone,
  Video,
  FileEdit,
  Users,
  Briefcase,
  Target,
  Lightbulb,
  Zap,
  Circle,
  Pause,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ============ Shared Types ============

export interface Task {
  id: number;
  subject: string;
  body?: string | null;
  dueAt: string | null;
  completed: boolean;
  overdue: boolean;
  status?: "open" | "waiting" | "completed";
  taskType?: "outreach" | "interest" | "block" | "internal" | "edge";
  priority?: "high" | "medium" | "low" | number | null;
  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  parentTaskId?: number | null;
  isSubtask?: boolean;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  dealId?: number;
  taskableType?: string | null;
  taskableId?: number | null;
  relatedBlockId?: number | null;
  relatedInterestId?: number | null;
  relatedTargetId?: number | null;
}

interface DocumentItem {
  kind: string;
  label: string;
  category: string;
  present: boolean;
  document?: {
    id: number;
    name: string;
    url: string;
    uploadedAt: string;
  } | null;
}

export interface EdgePerson {
  id: number;
  firstName: string;
  lastName: string;
  title?: string | null;
  organization?: string | null;
  role?: string | null;
  context?: string | null;
}

export interface Edge {
  id: number;
  title: string;
  edgeType: "information" | "relationship" | "structural" | "timing";
  confidence: number; // 1-5
  timeliness: number; // 1-5
  notes?: string | null;
  relatedPersonId?: number | null;
  relatedOrgId?: number | null;
  people?: EdgePerson[];
  createdBy?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

export interface Activity {
  id: number;
  kind: string;
  subject: string | null;
  body?: string | null;
  occurredAt: string;
  startsAt?: string | null;
  endsAt?: string | null;
  outcome?: string | null;
  direction?: string | null;
  isTask?: boolean;
  taskCompleted?: boolean;
  taskDueAt?: string | null;
  performedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

// ============ Constants ============

const CRITICAL_DOC_KINDS = [
  "subscription_agreement",
  "wire_instructions",
  "kyc_aml",
  "purchase_agreement",
  "nda",
  "loi_term_sheet",
  "cap_table",
  "consent_to_transfer",
  "rofr_waiver",
];

const TASK_TYPE_CONFIG: Record<string, { label: string; icon: typeof Target; color: string }> = {
  outreach: { label: "Outreach", icon: Target, color: "text-blue-600 bg-blue-50" },
  interest: { label: "Interest", icon: Users, color: "text-green-600 bg-green-50" },
  block: { label: "Block", icon: Briefcase, color: "text-purple-600 bg-purple-50" },
  internal: { label: "Internal", icon: CheckSquare, color: "text-slate-600 bg-slate-50" },
  edge: { label: "Edge", icon: Lightbulb, color: "text-amber-600 bg-amber-50" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  high: { label: "High", color: "text-red-600", dot: "bg-red-500" },
  medium: { label: "Med", color: "text-amber-600", dot: "bg-amber-500" },
  low: { label: "Low", color: "text-slate-500", dot: "bg-slate-400" },
};

const EDGE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  information: { label: "Information", color: "text-blue-600 bg-blue-50 border-blue-200" },
  relationship: { label: "Relationship", color: "text-purple-600 bg-purple-50 border-purple-200" },
  structural: { label: "Structural", color: "text-green-600 bg-green-50 border-green-200" },
  timing: { label: "Timing", color: "text-amber-600 bg-amber-50 border-amber-200" },
};

// ============ ActionsTab Component (Unified Tasks) ============

interface ActionsTabProps {
  tasks: {
    overdue: Task[];
    dueThisWeek: Task[];
    backlog: Task[];
    completed: Task[];
  };
  currentUserId?: number | null;
  onTaskToggle?: (taskId: number, currentlyCompleted: boolean) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
  onStatusChange?: (taskId: number, status: "open" | "waiting" | "completed") => void;
}

function ActionsTab({ tasks, currentUserId, onTaskToggle, onTaskClick, onAddTask, onStatusChange }: ActionsTabProps) {
  const [ownerFilter, setOwnerFilter] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string | "all">("all");
  const [showBacklog, setShowBacklog] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Derive unique assignees from all tasks
  const assignees = useMemo(() => {
    const allTasks = [...tasks.overdue, ...tasks.dueThisWeek, ...tasks.backlog, ...tasks.completed];
    const map = new Map<number, { id: number; firstName: string; lastName: string }>();
    allTasks.forEach((t) => {
      if (t.assignedTo) map.set(t.assignedTo.id, t.assignedTo);
    });
    return Array.from(map.values());
  }, [tasks]);

  const filterTasks = (taskList: Task[]): Task[] => {
    let filtered = taskList;
    if (ownerFilter !== "all") {
      filtered = filtered.filter((t) => t.assignedTo?.id === ownerFilter);
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.taskType === typeFilter);
    }
    return filtered;
  };

  const filteredOverdue = filterTasks(tasks.overdue);
  const filteredDueThisWeek = filterTasks(tasks.dueThisWeek);
  const filteredBacklog = filterTasks(tasks.backlog);
  const filteredCompleted = filterTasks(tasks.completed);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No date";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPriorityFromNumber = (priority?: number | null): "high" | "medium" | "low" => {
    if (priority === 0) return "high";
    if (priority === 1) return "medium";
    return "low";
  };

  const TaskRow = ({ task, variant }: { task: Task; variant: "overdue" | "upcoming" | "backlog" | "completed" }) => {
    const priorityKey = typeof task.priority === "string" ? task.priority : getPriorityFromNumber(task.priority as number);
    const priorityConfig = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.low;
    const typeConfig = TASK_TYPE_CONFIG[task.taskType || "internal"] || TASK_TYPE_CONFIG.internal;
    const TypeIcon = typeConfig.icon;
    const status = task.status || (task.completed ? "completed" : "open");

    return (
      <div
        className={`group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
          variant === "overdue" ? "bg-red-50/50 border-red-200 hover:border-red-300" :
          variant === "upcoming" ? "bg-white border-slate-200 hover:border-slate-300" :
          variant === "completed" ? "bg-slate-50 border-slate-200 opacity-60" :
          "bg-white border-slate-200 hover:border-slate-300"
        }`}
        onClick={() => onTaskClick?.(task)}
      >
        {/* Status Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (status === "completed") {
              onStatusChange?.(task.id, "open");
            } else if (status === "waiting") {
              onStatusChange?.(task.id, "completed");
            } else {
              onTaskToggle?.(task.id, task.completed);
            }
          }}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            status === "completed" ? "bg-green-500 border-green-500" :
            status === "waiting" ? "bg-amber-100 border-amber-400" :
            "border-slate-300 hover:border-slate-400"
          }`}
        >
          {status === "completed" && <Check className="h-3 w-3 text-white" />}
          {status === "waiting" && <Pause className="h-2.5 w-2.5 text-amber-600" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}>
              {task.subject}
            </span>
          </div>

          {/* Meta Row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Type Badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${typeConfig.color}`}>
              <TypeIcon className="h-2.5 w-2.5" />
              {typeConfig.label}
            </span>

            {/* Priority */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${priorityConfig.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`} />
              {priorityConfig.label}
            </span>

            {/* Due Date */}
            <span className={`text-[11px] ${variant === "overdue" ? "text-red-600 font-medium" : "text-slate-500"}`}>
              {formatDate(task.dueAt)}
            </span>

            {/* Assignee */}
            {task.assignedTo && (
              <span className="text-[11px] text-slate-400">
                @{task.assignedTo.firstName}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const totalOpen = filteredOverdue.length + filteredDueThisWeek.length + filteredBacklog.length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-2">
        {/* Owner Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setOwnerFilter("all")}
            className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
              ownerFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {currentUserId && assignees.some((a) => a.id === currentUserId) && (
            <button
              onClick={() => setOwnerFilter(currentUserId)}
              className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                ownerFilter === currentUserId ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Mine
            </button>
          )}
          {assignees
            .filter((a) => a.id !== currentUserId)
            .slice(0, 3)
            .map((a) => (
              <button
                key={a.id}
                onClick={() => setOwnerFilter(a.id)}
                className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                  ownerFilter === a.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {a.firstName}
              </button>
            ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTypeFilter("all")}
            className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
              typeFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Types
          </button>
          {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                typeFilter === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task */}
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      )}

      {/* Task Groups */}
      <div className="space-y-4">
        {/* Overdue */}
        {filteredOverdue.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                Overdue · {filteredOverdue.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {filteredOverdue.map((task) => (
                <TaskRow key={task.id} task={task} variant="overdue" />
              ))}
            </div>
          </div>
        )}

        {/* Due This Week */}
        {filteredDueThisWeek.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Due This Week · {filteredDueThisWeek.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {filteredDueThisWeek.map((task) => (
                <TaskRow key={task.id} task={task} variant="upcoming" />
              ))}
            </div>
          </div>
        )}

        {/* Backlog (No Due Date) */}
        {filteredBacklog.length > 0 && (
          <div>
            <button
              onClick={() => setShowBacklog(!showBacklog)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700"
            >
              {showBacklog ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Circle className="h-3 w-3" />
              No Due Date · {filteredBacklog.length}
            </button>
            {showBacklog && (
              <div className="space-y-1.5 mt-2">
                {filteredBacklog.map((task) => (
                  <TaskRow key={task.id} task={task} variant="backlog" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed */}
        {filteredCompleted.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-600"
            >
              {showCompleted ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Check className="h-3 w-3" />
              Completed · {filteredCompleted.length}
            </button>
            {showCompleted && (
              <div className="space-y-1.5 mt-2">
                {filteredCompleted.map((task) => (
                  <TaskRow key={task.id} task={task} variant="completed" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalOpen === 0 && filteredCompleted.length === 0 && (
        <div className="text-center py-8">
          <CheckSquare className="h-8 w-8 mx-auto text-green-300 mb-2" />
          <p className="text-sm text-slate-500">All clear</p>
        </div>
      )}
    </div>
  );
}

// ============ DiligenceTab Component (Documents Only) ============

interface DiligenceTabProps {
  checklist: {
    total: number;
    completed: number;
    completionPercent: number;
    items: DocumentItem[];
  };
  onUpload?: (kind: string) => void;
  onAddDocument?: () => void;
}

function DiligenceTab({ checklist, onUpload, onAddDocument }: DiligenceTabProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const missingCritical = useMemo(() =>
    checklist.items.filter((item) => !item.present && CRITICAL_DOC_KINDS.includes(item.kind)),
    [checklist.items]);

  const recentlyUpdated = useMemo(() =>
    checklist.items
      .filter((item) => item.present && item.document?.uploadedAt)
      .sort((a, b) => {
        const dateA = a.document?.uploadedAt ? new Date(a.document.uploadedAt).getTime() : 0;
        const dateB = b.document?.uploadedAt ? new Date(b.document.uploadedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3),
    [checklist.items]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, DocumentItem[]> = {};
    checklist.items.forEach((item) => {
      const cat = item.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [checklist.items]);

  const formatUploadDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-700">{checklist.completionPercent}% Complete</span>
          <span className="text-xs text-slate-500">{checklist.completed}/{checklist.total} docs</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              checklist.completionPercent === 100
                ? "bg-green-500"
                : checklist.completionPercent >= 50
                ? "bg-blue-500"
                : "bg-amber-500"
            }`}
            style={{ width: `${checklist.completionPercent}%` }}
          />
        </div>
      </div>

      {/* Upload Button */}
      {onAddDocument && (
        <button
          onClick={onAddDocument}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      )}

      {/* Missing Critical */}
      {missingCritical.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
              Missing Critical · {missingCritical.length}
            </span>
          </div>
          <div className="space-y-1">
            {missingCritical.map((item) => (
              <div key={item.kind} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100">
                <span className="text-sm text-red-800">{item.label}</span>
                <button
                  onClick={() => onUpload?.(item.kind)}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Updated */}
      {recentlyUpdated.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent</span>
          </div>
          <div className="space-y-1">
            {recentlyUpdated.map((item) => (
              <div key={item.kind} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-sm text-slate-700">{item.label}</span>
                <span className="text-[11px] text-slate-400">
                  {item.document?.uploadedAt ? formatUploadDate(item.document.uploadedAt) : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Checklist */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Checklist</span>
        </div>
        <div className="space-y-1">
          {Object.entries(groupedByCategory).map(([category, items]) => {
            const isExpanded = expandedCategory === category;
            const completedInCategory = items.filter((i) => i.present).length;

            return (
              <div key={category} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="w-full flex items-center justify-between p-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                    <span className="text-sm text-slate-700">{category}</span>
                  </div>
                  <span className="text-xs text-slate-400">{completedInCategory}/{items.length}</span>
                </button>

                {isExpanded && (
                  <div className="px-2.5 pb-2.5 space-y-1 border-t border-slate-100">
                    {items.map((item) => (
                      <div
                        key={item.kind}
                        className={`flex items-center gap-2 p-2 rounded text-sm mt-1 ${item.present ? "bg-green-50" : "bg-slate-50"}`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${item.present ? "bg-green-500 text-white" : "border border-slate-300"}`}>
                          {item.present && <Check className="h-3 w-3" />}
                        </div>
                        <span className="flex-1 truncate text-slate-700">{item.label}</span>
                        {!item.present && (
                          <button onClick={() => onUpload?.(item.kind)} className="text-xs text-blue-600 hover:text-blue-800">
                            Upload
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ ActivityTab Component (Read-Only Feed) ============

interface ActivityTabProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
}

function ActivityTab({ activities, onActivityClick }: ActivityTabProps) {
  const kindIcons: Record<string, typeof Mail> = {
    email: Mail,
    call: Phone,
    meeting: Video,
    video_call: Video,
    in_person_meeting: Users,
    note: FileEdit,
    task_created: CheckSquare,
    task_completed: Check,
    interest_added: Users,
    block_updated: Briefcase,
    document_uploaded: Upload,
  };

  const kindLabels: Record<string, string> = {
    email: "Email",
    call: "Call",
    meeting: "Meeting",
    video_call: "Video Call",
    in_person_meeting: "In-Person",
    note: "Note",
    task_created: "Task Created",
    task_completed: "Task Completed",
    interest_added: "Interest Added",
    block_updated: "Block Updated",
    document_uploaded: "Document",
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">No activity yet</p>
        <p className="text-xs text-slate-400 mt-1">Activity is automatically logged</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Read-only indicator */}
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-3">Auto-generated feed</p>

      {/* Activity Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200" />

        <div className="space-y-0">
          {activities.slice(0, 15).map((activity, idx) => {
            const Icon = kindIcons[activity.kind] || MessageSquare;
            return (
              <div
                key={activity.id}
                onClick={() => onActivityClick?.(activity)}
                className="relative flex items-start gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-lg px-1 -mx-1 transition-colors"
              >
                {/* Icon */}
                <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 z-10">
                  <Icon className="h-3 w-3 text-slate-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">
                      {kindLabels[activity.kind] || activity.kind}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDate(activity.occurredAt)}
                    </span>
                  </div>
                  {activity.subject && (
                    <p className="text-sm text-slate-700 truncate mt-0.5">{activity.subject}</p>
                  )}
                  {activity.performedBy && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      by {activity.performedBy.firstName}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activities.length > 15 && (
        <p className="text-xs text-center text-slate-400 pt-2">
          Showing 15 of {activities.length}
        </p>
      )}
    </div>
  );
}

// ============ EdgesTab Component (Redesigned) ============

interface EdgesTabProps {
  edges: Edge[];
  onAddEdge?: () => void;
  onEdgeClick?: (edge: Edge) => void;
  onActOnEdge?: (edge: Edge) => void;
}

function EdgesTab({ edges, onAddEdge, onEdgeClick, onActOnEdge }: EdgesTabProps) {
  // Sort by (confidence * timeliness) score descending
  const sortedEdges = useMemo(() => {
    return [...edges].sort((a, b) => {
      const scoreA = (a.confidence || 1) * (a.timeliness || 1);
      const scoreB = (b.confidence || 1) * (b.timeliness || 1);
      return scoreB - scoreA;
    });
  }, [edges]);

  const ConfidenceDots = ({ value }: { value: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= value ? "bg-blue-500" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );

  const TimelinessDots = ({ value }: { value: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= value ? "bg-green-500" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );

  if (edges.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">No edges documented</p>
        <p className="text-xs text-slate-400 mt-1">Edges are rare, valuable insights</p>
        {onAddEdge && (
          <button
            onClick={onAddEdge}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Edge
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Edge */}
      {onAddEdge && (
        <button
          onClick={onAddEdge}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Edge
        </button>
      )}

      {/* Edge List */}
      <div className="space-y-2">
        {sortedEdges.map((edge) => {
          const typeConfig = EDGE_TYPE_CONFIG[edge.edgeType] || EDGE_TYPE_CONFIG.information;

          return (
            <div
              key={edge.id}
              onClick={() => onEdgeClick?.(edge)}
              className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{edge.title}</p>
                </div>
              </div>

              {/* Scores */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Confidence</span>
                  <ConfidenceDots value={edge.confidence} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Freshness</span>
                  <TimelinessDots value={edge.timeliness} />
                </div>
              </div>

              {/* Linked People */}
              {edge.people && edge.people.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Users className="h-3 w-3 text-slate-400" />
                  {edge.people.map((person, idx) => (
                    <span key={person.id} className="inline-flex items-center gap-1">
                      <span className="text-xs text-slate-600">
                        {person.firstName} {person.lastName}
                        {person.role && (
                          <span className="text-slate-400 ml-0.5">({person.role})</span>
                        )}
                      </span>
                      {idx < edge.people!.length - 1 && (
                        <span className="text-slate-300">·</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Notes Preview */}
              {edge.notes && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{edge.notes}</p>
              )}

              {/* Act on Edge */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  {edge.createdBy ? `by ${edge.createdBy.firstName}` : ""}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onActOnEdge?.(edge);
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Zap className="h-3 w-3" />
                  Act on Edge
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Combined DealSidebar Component ============

interface DealSidebarProps {
  tasks: {
    overdue: Task[];
    dueThisWeek: Task[];
    backlog: Task[];
    completed: Task[];
  };
  dealId?: number;
  documentChecklist: {
    total: number;
    completed: number;
    completionPercent: number;
    items: DocumentItem[];
  };
  edges: Edge[];
  activities: Activity[];
  lpMode: boolean;
  currentUserId?: number | null;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onTaskToggle?: (taskId: number, currentlyCompleted: boolean) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
  onTaskStatusChange?: (taskId: number, status: "open" | "waiting" | "completed") => void;
  onDocumentUpload?: (kind: string) => void;
  onAddDocument?: () => void;
  onAddEdge?: () => void;
  onEdgeClick?: (edge: Edge) => void;
  onActOnEdge?: (edge: Edge) => void;
  onActivityClick?: (activity: Activity) => void;
}

export function DealSidebar({
  tasks,
  dealId,
  documentChecklist,
  edges,
  activities,
  lpMode,
  currentUserId,
  activeSection,
  onSectionChange,
  onTaskToggle,
  onTaskClick,
  onAddTask,
  onTaskStatusChange,
  onDocumentUpload,
  onAddDocument,
  onAddEdge,
  onEdgeClick,
  onActOnEdge,
  onActivityClick,
}: DealSidebarProps) {
  const [internalSection, setInternalSection] = useState<string>("actions");

  useEffect(() => {
    if (activeSection) setInternalSection(activeSection);
  }, [activeSection]);

  const handleSectionChange = (section: string) => {
    setInternalSection(section);
    onSectionChange?.(section);
  };

  // Count open tasks
  const openTaskCount = tasks.overdue.length + tasks.dueThisWeek.length + tasks.backlog.length;

  const sections = [
    { key: "actions", label: "Actions", icon: CheckSquare, count: openTaskCount },
    { key: "diligence", label: "Diligence", icon: FileText },
    { key: "activity", label: "Activity", icon: Clock },
    ...(!lpMode ? [{ key: "edges", label: "Edges", icon: Shield, count: edges.length }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = internalSection === section.key;
          return (
            <button
              key={section.key}
              onClick={() => handleSectionChange(section.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-slate-900 text-slate-900 font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.label}
              {section.count !== undefined && section.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"}`}>
                  {section.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="min-h-[300px]">
        {internalSection === "actions" && (
          <ActionsTab
            tasks={tasks}
            currentUserId={currentUserId}
            onTaskToggle={onTaskToggle}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            onStatusChange={onTaskStatusChange}
          />
        )}
        {internalSection === "diligence" && (
          <DiligenceTab
            checklist={documentChecklist}
            onUpload={onDocumentUpload}
            onAddDocument={onAddDocument}
          />
        )}
        {internalSection === "activity" && (
          <ActivityTab
            activities={activities}
            onActivityClick={onActivityClick}
          />
        )}
        {internalSection === "edges" && !lpMode && (
          <EdgesTab
            edges={edges}
            onAddEdge={onAddEdge}
            onEdgeClick={onEdgeClick}
            onActOnEdge={onActOnEdge}
          />
        )}
      </div>
    </div>
  );
}
