"use client";

import { useEffect, useState } from "react";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  FolderKanban,
  Plus,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TasksSlideOut } from "../_components/TasksSlideOut";

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

interface MyTasksResponse {
  overdue: Task[];
  dueToday: Task[];
  dueThisWeek: Task[];
  upcoming: Task[];
  noDueDate: Task[];
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function TaskRow({
  task,
  onToggleComplete,
  onClick,
}: {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onClick: (task: Task) => void;
}) {
  const priorityColors: Record<number, string> = {
    3: "bg-red-100 text-red-700",
    2: "bg-amber-100 text-amber-700",
    1: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 hover:bg-muted border-b border-border last:border-b-0 cursor-pointer"
      onClick={() => onClick(task)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          task.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-border hover:border-muted-foreground"
        }`}
      >
        {task.completed && <CheckSquare className="h-3 w-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{task.subject}</span>
          {task.subtaskCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({task.completedSubtaskCount}/{task.subtaskCount})
            </span>
          )}
        </div>
        {task.attachmentName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            {task.attachmentType === "deal" ? (
              <Building2 className="h-3 w-3" />
            ) : task.attachmentType === "project" ? (
              <FolderKanban className="h-3 w-3" />
            ) : null}
            {task.attachmentName}
          </div>
        )}
      </div>

      {task.priority > 1 && (
        <Badge className={`text-xs ${priorityColors[task.priority]}`}>
          {task.priorityLabel}
        </Badge>
      )}

      {task.dueAt && (
        <span
          className={`text-sm flex items-center gap-1 ${
            task.overdue
              ? "text-red-600 font-medium"
              : task.dueToday
              ? "text-amber-600 font-medium"
              : "text-muted-foreground"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(task.dueAt)}
        </span>
      )}
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  icon: Icon,
  variant = "default",
  defaultExpanded = true,
  onToggleComplete,
  onTaskClick,
}: {
  title: string;
  tasks: Task[];
  icon: React.ElementType;
  variant?: "default" | "danger" | "warning" | "success";
  defaultExpanded?: boolean;
  onToggleComplete: (task: Task) => void;
  onTaskClick: (task: Task) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (tasks.length === 0) return null;

  const bgColors = {
    default: "bg-muted",
    danger: "bg-red-50",
    warning: "bg-amber-50",
    success: "bg-green-50",
  };

  const textColors = {
    default: "text-foreground",
    danger: "text-red-700",
    warning: "text-amber-700",
    success: "text-green-700",
  };

  const iconColors = {
    default: "text-muted-foreground",
    danger: "text-red-500",
    warning: "text-amber-500",
    success: "text-green-500",
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 ${bgColors[variant]}`}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Icon className={`h-4 w-4 ${iconColors[variant]}`} />
          <span className={`font-medium ${textColors[variant]}`}>{title}</span>
        </div>
        <Badge
          variant="secondary"
          className={`text-xs ${variant === "danger" ? "bg-red-100 text-red-700" : ""}`}
        >
          {tasks.length}
        </Badge>
      </button>
      {expanded && (
        <div className="bg-card">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onClick={onTaskClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyTasksPage() {
  const [data, setData] = useState<MyTasksResponse | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [slideOutOpen, setSlideOutOpen] = useState(false);

  const fetchData = async (userId?: string) => {
    try {
      const params = userId ? `?user_id=${userId}` : "";
      const [myTasksRes, usersRes, allTasksRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/my_tasks${params}`),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks?root_only=true`),
      ]);
      const [myTasksData, usersData, allTasksData] = await Promise.all([
        myTasksRes.json(),
        usersRes.json(),
        allTasksRes.json(),
      ]);
      setData(myTasksData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setAllTasks(Array.isArray(allTasksData) ? allTasksData : []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(currentUserId);
  }, [currentUserId]);

  const handleToggleComplete = async (task: Task) => {
    const endpoint = task.completed ? "uncomplete" : "complete";
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}/${endpoint}`,
        { method: "POST" }
      );
      if (res.ok) {
        fetchData(currentUserId);
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSlideOutOpen(true);
  };

  const handleTaskSave = () => {
    setSlideOutOpen(false);
    setSelectedTask(null);
    fetchData(currentUserId);
  };

  const handleTaskDelete = () => {
    setSlideOutOpen(false);
    setSelectedTask(null);
    fetchData(currentUserId);
  };

  const totalTasks = data
    ? data.overdue.length +
      data.dueToday.length +
      data.dueThisWeek.length +
      data.upcoming.length +
      data.noDueDate.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {totalTasks} open task{totalTasks !== 1 ? "s" : ""}
            {data && data.overdue.length > 0 && (
              <span className="text-red-600 ml-2">
                ({data.overdue.length} overdue)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md"
          >
            <option value="">All team members</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSelectedTask(null);
              setSlideOutOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Task Sections */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      ) : !data || totalTasks === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
          <p>No tasks found</p>
          <button
            onClick={() => {
              setSelectedTask(null);
              setSlideOutOpen(true);
            }}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <TaskSection
            title="Overdue"
            tasks={data.overdue}
            icon={AlertCircle}
            variant="danger"
            onToggleComplete={handleToggleComplete}
            onTaskClick={handleTaskClick}
          />
          <TaskSection
            title="Due Today"
            tasks={data.dueToday}
            icon={Clock}
            variant="warning"
            onToggleComplete={handleToggleComplete}
            onTaskClick={handleTaskClick}
          />
          <TaskSection
            title="Due This Week"
            tasks={data.dueThisWeek}
            icon={Calendar}
            onToggleComplete={handleToggleComplete}
            onTaskClick={handleTaskClick}
          />
          <TaskSection
            title="Upcoming"
            tasks={data.upcoming}
            icon={Calendar}
            defaultExpanded={
              data.overdue.length === 0 &&
              data.dueToday.length === 0 &&
              data.dueThisWeek.length === 0
            }
            onToggleComplete={handleToggleComplete}
            onTaskClick={handleTaskClick}
          />
          <TaskSection
            title="No Due Date"
            tasks={data.noDueDate}
            icon={CheckSquare}
            defaultExpanded={
              data.overdue.length === 0 &&
              data.dueToday.length === 0 &&
              data.dueThisWeek.length === 0 &&
              data.upcoming.length === 0
            }
            onToggleComplete={handleToggleComplete}
            onTaskClick={handleTaskClick}
          />
        </div>
      )}

      {/* Task SlideOut */}
      {slideOutOpen && (
        <TasksSlideOut
          task={selectedTask}
          users={users}
          existingTasks={allTasks}
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
