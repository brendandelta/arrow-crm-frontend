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
  onToggleComplete,
  onClick,
  showAttachment = true,
}: {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onClick: (task: Task) => void;
  showAttachment?: boolean;
}) {
  const priorityColors: Record<number, string> = {
    3: "bg-red-100 text-red-700",
    2: "bg-amber-100 text-amber-700",
    1: "bg-slate-100 text-slate-600",
  };

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer"
      onClick={() => onClick(task)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          task.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        {task.completed && <CheckSquare className="h-3 w-3" />}
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
            <span className="text-xs text-muted-foreground">
              ({task.completedSubtaskCount}/{task.subtaskCount})
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
          {task.assignedTo && (
            <span className="text-xs text-muted-foreground">
              {task.assignedTo.firstName} {task.assignedTo.lastName[0]}.
            </span>
          )}
        </div>
      </div>

      {/* Priority */}
      {task.priority > 1 && (
        <Badge className={`text-xs ${priorityColors[task.priority]}`}>
          {task.priorityLabel}
        </Badge>
      )}

      {/* Due date */}
      <div className="flex-shrink-0 text-right">
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
  );
}

function TaskGroup({
  title,
  tasks,
  defaultExpanded = true,
  onToggleComplete,
  onTaskClick,
  showAttachment = true,
  variant = "default",
}: {
  title: string;
  tasks: Task[];
  defaultExpanded?: boolean;
  onToggleComplete: (task: Task) => void;
  onTaskClick: (task: Task) => void;
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
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onClick={onTaskClick}
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
                  onToggleComplete={handleToggleComplete}
                  onClick={handleTaskClick}
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
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  variant="danger"
                />
              )}
              {dueTodayTasks.length > 0 && (
                <TaskGroup
                  title="Due Today"
                  tasks={dueTodayTasks}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  variant="warning"
                />
              )}
              {upcomingTasks.length > 0 && (
                <TaskGroup
                  title="Upcoming"
                  tasks={upcomingTasks}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                />
              )}
              {noDueDateTasks.length > 0 && (
                <TaskGroup
                  title="No Due Date"
                  tasks={noDueDateTasks}
                  defaultExpanded={overdueTasks.length === 0 && dueTodayTasks.length === 0}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
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
