"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  User,
  Inbox,
  CheckCircle,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Building2,
  FolderKanban,
  Calendar,
  ListFilter,
  Check,
  Loader2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TasksSlideOut } from "./_components/TasksSlideOut";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Task {
  id: number;
  subject: string;
  body?: string | null;
  dueAt: string | null;
  completed: boolean;
  completedAt: string | null;
  overdue: boolean;
  dueToday: boolean;
  dueThisWeek: boolean;
  priority: number;
  priorityLabel: string;
  status: string;
  assignedTo: Owner | null;
  createdBy: Owner | null;
  parentTaskId: number | null;
  isSubtask: boolean;
  subtaskCount: number;
  completedSubtaskCount: number;
  subtaskCompletionPercent: number;
  attachmentType: string;
  attachmentName: string | null;
  dealId: number | null;
  projectId: number | null;
  organizationId: number | null;
  personId: number | null;
  deal?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
  subtasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

interface TaskStats {
  total: number;
  open: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueSoon: number;
  unassigned: number;
  byAttachment: {
    deal: number;
    project: number;
    general: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byStatus: {
    open: number;
    inProgress: number;
    blocked: number;
    waiting: number;
  };
}

type ViewType = "my" | "all" | "overdue" | "due-soon" | "unassigned" | "completed";
type AttachmentFilter = "all" | "deal" | "project" | "general";

interface ViewConfig {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  countKey?: keyof TaskStats | string;
  color?: string;
}

const VIEWS: ViewConfig[] = [
  { id: "my", label: "My Tasks", icon: User, countKey: "open" },
  { id: "all", label: "All Open", icon: Inbox, countKey: "open" },
  { id: "overdue", label: "Overdue", icon: AlertCircle, countKey: "overdue", color: "text-red-600" },
  { id: "due-soon", label: "Due Soon", icon: Clock, countKey: "dueSoon", color: "text-amber-600" },
  { id: "unassigned", label: "Unassigned", icon: User, countKey: "unassigned" },
  { id: "completed", label: "Completed", icon: CheckCircle, countKey: "completed" },
];

const ATTACHMENT_FILTERS: { id: AttachmentFilter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: ListFilter },
  { id: "deal", label: "Deal Tasks", icon: Building2 },
  { id: "project", label: "Project Tasks", icon: FolderKanban },
  { id: "general", label: "General", icon: CheckSquare },
];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function TaskRow({
  task,
  users,
  onToggleComplete,
  onClick,
  onAssigneeChange,
  onRefresh,
  showAttachment = true,
}: {
  task: Task;
  users: User[];
  onToggleComplete: (task: Task) => void;
  onClick: (task: Task) => void;
  onAssigneeChange: (taskId: number, userId: number | null) => void;
  onRefresh: () => void;
  showAttachment?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localSubtasks, setLocalSubtasks] = useState<Task[]>(task.subtasks || []);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskSubject, setNewSubtaskSubject] = useState("");
  const [savingSubtask, setSavingSubtask] = useState(false);

  const priorityColors: Record<number, string> = {
    3: "bg-red-100 text-red-700",
    2: "bg-amber-100 text-amber-700",
    1: "bg-slate-100 text-slate-600",
  };

  // Fetch subtasks when expanded
  useEffect(() => {
    if (expanded && task.subtaskCount > 0 && localSubtasks.length === 0) {
      fetchSubtasks();
    }
  }, [expanded]);

  const fetchSubtasks = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setLocalSubtasks(data.subtasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch subtasks:", err);
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    const endpoint = subtask.completed ? "uncomplete" : "complete";
    setTogglingId(subtask.id);

    // Optimistic update
    setLocalSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtask.id ? { ...st, completed: !st.completed } : st
      )
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${subtask.id}/${endpoint}`,
        { method: "POST" }
      );
      if (!res.ok) {
        // Revert on failure
        setLocalSubtasks((prev) =>
          prev.map((st) =>
            st.id === subtask.id ? { ...st, completed: subtask.completed } : st
          )
        );
      } else {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
      setLocalSubtasks((prev) =>
        prev.map((st) =>
          st.id === subtask.id ? { ...st, completed: subtask.completed } : st
        )
      );
    }
    setTogglingId(null);
  };

  const handleSubtaskAssigneeChange = async (subtaskId: number, userId: number | null) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${subtaskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: { assigned_to_id: userId } }),
        }
      );
      // Update local state
      setLocalSubtasks((prev) =>
        prev.map((st) =>
          st.id === subtaskId
            ? {
                ...st,
                assignedTo: userId
                  ? users.find((u) => u.id === userId)
                    ? {
                        id: userId,
                        firstName: users.find((u) => u.id === userId)!.firstName,
                        lastName: users.find((u) => u.id === userId)!.lastName,
                      }
                    : null
                  : null,
              }
            : st
        )
      );
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskSubject.trim()) return;
    setSavingSubtask(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            subject: newSubtaskSubject.trim(),
            parent_task_id: task.id,
            priority: 2,
          },
        }),
      });

      if (res.ok) {
        const newSubtask = await res.json();
        setLocalSubtasks((prev) => [...prev, newSubtask]);
        setNewSubtaskSubject("");
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
    setSavingSubtask(false);
  };

  const completedSubtaskCount = localSubtasks.filter((st) => st.completed).length;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Main Task Row */}
      <div
        className="group flex items-center gap-2 px-4 py-3 hover:bg-slate-50 cursor-pointer"
        onClick={() => onClick(task)}
      >
        {/* Expand Arrow */}
        {task.subtaskCount > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-slate-300 hover:border-green-400 hover:bg-green-50 group-hover:border-green-400"
          }`}
        >
          {task.completed ? (
            <Check className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3 opacity-0 group-hover:opacity-30 text-green-500" />
          )}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium truncate ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.subject}
            </span>
            {task.subtaskCount > 0 && (
              <span className="text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                {completedSubtaskCount}/{task.subtaskCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {showAttachment && task.attachmentName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {task.attachmentType === "deal" ? (
                  <Building2 className="h-3 w-3" />
                ) : task.attachmentType === "project" ? (
                  <FolderKanban className="h-3 w-3" />
                ) : null}
                {task.attachmentName}
              </span>
            )}
          </div>
        </div>

        {/* Inline Assignee */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
              task.assignedTo
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            }`}
          >
            {task.assignedTo ? (
              <>
                <User className="h-3 w-3" />
                {task.assignedTo.firstName}
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3" />
                <span className="hidden group-hover:inline">Assign</span>
              </>
            )}
          </button>
          {showAssigneeDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={() => {
                  onAssigneeChange(task.id, null);
                  setShowAssigneeDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 text-slate-500"
              >
                Unassigned
              </button>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onAssigneeChange(task.id, user.id);
                    setShowAssigneeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    task.assignedTo?.id === user.id ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  {user.firstName} {user.lastName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority */}
        {task.priority > 1 && (
          <Badge className={`text-xs ${priorityColors[task.priority]}`}>
            {task.priorityLabel}
          </Badge>
        )}

        {/* Due date */}
        <div className="flex-shrink-0 text-right w-20">
          {task.dueAt && (
            <span
              className={`text-sm ${
                task.overdue
                  ? "text-red-600 font-medium"
                  : task.dueToday
                  ? "text-amber-600 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {formatDate(task.dueAt)}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Subtasks */}
      {expanded && (
        <div className="bg-slate-50 border-t border-slate-100">
          {localSubtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="group flex items-center gap-2 pl-12 pr-4 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-b-0"
              onClick={() => onClick(subtask)}
            >
              {/* Subtask checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSubtask(subtask);
                }}
                disabled={togglingId === subtask.id}
                className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  subtask.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-slate-300 hover:border-green-400 hover:bg-green-50 group-hover:border-green-400"
                } ${togglingId === subtask.id ? "opacity-50" : ""}`}
              >
                {togglingId === subtask.id ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : subtask.completed ? (
                  <Check className="h-2.5 w-2.5" />
                ) : (
                  <Check className="h-2.5 w-2.5 opacity-0 group-hover:opacity-30 text-green-500" />
                )}
              </button>

              {/* Subtask subject */}
              <span
                className={`flex-1 text-sm ${
                  subtask.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {subtask.subject}
              </span>

              {/* Subtask assignee - inline dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <select
                  value={subtask.assignedTo?.id || ""}
                  onChange={(e) =>
                    handleSubtaskAssigneeChange(
                      subtask.id,
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="text-xs bg-transparent border-0 text-slate-500 hover:text-slate-700 cursor-pointer focus:ring-0 py-0 pr-6 pl-1"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtask due date */}
              {subtask.dueAt && (
                <span
                  className={`text-xs w-16 text-right ${
                    subtask.overdue ? "text-red-600" : "text-muted-foreground"
                  }`}
                >
                  {formatDate(subtask.dueAt)}
                </span>
              )}
            </div>
          ))}

          {/* Add subtask form */}
          {addingSubtask ? (
            <div className="flex items-center gap-2 pl-12 pr-4 py-2 bg-white border-t border-slate-200">
              <div className="w-4 h-4 rounded border-2 border-slate-300 flex items-center justify-center">
                <Plus className="h-2.5 w-2.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={newSubtaskSubject}
                onChange={(e) => setNewSubtaskSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubtask();
                  if (e.key === "Escape") {
                    setAddingSubtask(false);
                    setNewSubtaskSubject("");
                  }
                }}
                placeholder="Add a subtask..."
                className="flex-1 text-sm bg-transparent outline-none"
                autoFocus
                disabled={savingSubtask}
              />
              {newSubtaskSubject.trim() && (
                <button
                  onClick={handleAddSubtask}
                  disabled={savingSubtask}
                  className="px-2 py-1 text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 rounded disabled:opacity-50"
                >
                  {savingSubtask ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                </button>
              )}
              <button
                onClick={() => {
                  setAddingSubtask(false);
                  setNewSubtaskSubject("");
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAddingSubtask(true);
              }}
              className="w-full flex items-center gap-2 pl-12 pr-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  users,
  defaultExpanded = true,
  onToggleComplete,
  onTaskClick,
  onAssigneeChange,
  onRefresh,
  showAttachment = true,
  variant = "default",
}: {
  title: string;
  tasks: Task[];
  users: User[];
  defaultExpanded?: boolean;
  onToggleComplete: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  onAssigneeChange: (taskId: number, userId: number | null) => void;
  onRefresh: () => void;
  showAttachment?: boolean;
  variant?: "default" | "danger" | "warning";
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const bgColors = {
    default: "bg-slate-50",
    danger: "bg-red-50",
    warning: "bg-amber-50",
  };

  const textColors = {
    default: "text-slate-700",
    danger: "text-red-700",
    warning: "text-amber-700",
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-2 ${bgColors[variant]}`}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className={`font-medium ${textColors[variant]}`}>{title}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </button>
      {expanded && (
        <div>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              users={users}
              onToggleComplete={onToggleComplete}
              onClick={onTaskClick}
              onAssigneeChange={onAssigneeChange}
              onRefresh={onRefresh}
              showAttachment={showAttachment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState<ViewType>("all");
  const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [slideOutOpen, setSlideOutOpen] = useState(false);

  // Fetch data
  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();

    // Build query params based on current view and filters
    if (currentView === "overdue") params.append("status", "overdue");
    if (currentView === "due-soon") params.append("status", "due_soon");
    if (currentView === "completed") params.append("status", "completed");
    if (currentView !== "completed") params.append("status", "open");
    if (currentView === "unassigned") params.append("unassigned", "true");

    if (attachmentFilter !== "all") params.append("attachment", attachmentFilter);
    if (assigneeFilter) params.append("assigned_to_id", assigneeFilter);
    if (priorityFilter) params.append("priority", priorityFilter);

    // Only root tasks by default
    params.append("root_only", "true");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks?${params.toString()}`
      );
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setTasks([]);
    }
  }, [currentView, attachmentFilter, assigneeFilter, priorityFilter]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    Promise.all([fetchTasks(), fetchStats(), fetchUsers()]).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = async (task: Task) => {
    const endpoint = task.completed ? "uncomplete" : "complete";
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}/${endpoint}`,
        { method: "POST" }
      );
      if (res.ok) {
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSlideOutOpen(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setSlideOutOpen(true);
  };

  const handleTaskSave = () => {
    setSlideOutOpen(false);
    setSelectedTask(null);
    fetchTasks();
    fetchStats();
  };

  const handleTaskDelete = () => {
    setSlideOutOpen(false);
    setSelectedTask(null);
    fetchTasks();
    fetchStats();
  };

  const handleAssigneeChange = async (taskId: number, userId: number | null) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: { assigned_to_id: userId } }),
        }
      );
      fetchTasks();
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  };

  const handleRefresh = () => {
    fetchTasks();
    fetchStats();
  };

  // Filter tasks by search
  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.subject.toLowerCase().includes(query) ||
      task.attachmentName?.toLowerCase().includes(query) ||
      task.assignedTo?.firstName.toLowerCase().includes(query) ||
      task.assignedTo?.lastName.toLowerCase().includes(query)
    );
  });

  // Group tasks for display
  const overdueTasks = filteredTasks.filter((t) => t.overdue && !t.completed);
  const dueTodayTasks = filteredTasks.filter(
    (t) => t.dueToday && !t.overdue && !t.completed
  );
  const upcomingTasks = filteredTasks.filter(
    (t) => !t.overdue && !t.dueToday && !t.completed && t.dueAt
  );
  const noDueDateTasks = filteredTasks.filter(
    (t) => !t.dueAt && !t.completed
  );
  const completedTasks = filteredTasks.filter((t) => t.completed);

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left Sidebar - Views */}
      <div className="w-64 flex-shrink-0 space-y-6">
        {/* Views */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Views
          </h3>
          <div className="space-y-1">
            {VIEWS.map((view) => {
              const Icon = view.icon;
              const count = stats
                ? view.countKey
                  ? stats[view.countKey as keyof TaskStats]
                  : 0
                : 0;

              return (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    currentView === view.id
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${view.color || ""}`} />
                    <span>{view.label}</span>
                  </div>
                  {typeof count === "number" && count > 0 && (
                    <span
                      className={`text-xs ${
                        currentView === view.id
                          ? "text-slate-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Attachment Filter */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Type
          </h3>
          <div className="space-y-1">
            {ATTACHMENT_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const count = stats?.byAttachment
                ? filter.id === "all"
                  ? stats.open
                  : stats.byAttachment[filter.id as keyof typeof stats.byAttachment]
                : 0;

              return (
                <button
                  key={filter.id}
                  onClick={() => setAttachmentFilter(filter.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    attachmentFilter === filter.id
                      ? "bg-slate-100 font-medium"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{filter.label}</span>
                  </div>
                  {typeof count === "number" && count > 0 && (
                    <span className="text-xs text-muted-foreground">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignee Filter */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Assignee
          </h3>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md"
          >
            <option value="">All team members</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Priority
          </h3>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md"
          >
            <option value="">All priorities</option>
            <option value="3">High</option>
            <option value="2">Medium</option>
            <option value="1">Low</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              {VIEWS.find((v) => v.id === currentView)?.label}
              {attachmentFilter !== "all" && ` - ${ATTACHMENT_FILTERS.find((f) => f.id === attachmentFilter)?.label}`}
            </p>
          </div>
          <button
            onClick={handleCreateTask}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Loading...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>No tasks found</p>
              <button
                onClick={handleCreateTask}
                className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline"
              >
                Create your first task
              </button>
            </div>
          ) : currentView === "completed" ? (
            // Show completed tasks as a simple list
            <div className="border rounded-lg overflow-hidden">
              {completedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  users={users}
                  onToggleComplete={handleToggleComplete}
                  onClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          ) : (
            // Grouped view for open tasks
            <>
              {overdueTasks.length > 0 && (
                <TaskGroup
                  title="Overdue"
                  tasks={overdueTasks}
                  users={users}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                  variant="danger"
                />
              )}
              {dueTodayTasks.length > 0 && (
                <TaskGroup
                  title="Due Today"
                  tasks={dueTodayTasks}
                  users={users}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                  variant="warning"
                />
              )}
              {upcomingTasks.length > 0 && (
                <TaskGroup
                  title="Upcoming"
                  tasks={upcomingTasks}
                  users={users}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                />
              )}
              {noDueDateTasks.length > 0 && (
                <TaskGroup
                  title="No Due Date"
                  tasks={noDueDateTasks}
                  users={users}
                  defaultExpanded={overdueTasks.length === 0 && dueTodayTasks.length === 0}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Task SlideOut */}
      {slideOutOpen && (
        <TasksSlideOut
          task={selectedTask}
          users={users}
          existingTasks={tasks}
          onClose={() => {
            setSlideOutOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
}
