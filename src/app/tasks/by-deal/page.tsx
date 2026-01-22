"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  Plus,
  ExternalLink,
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

interface DealGroup {
  deal: {
    id: number;
    name: string;
    status: string;
    company?: string;
  } | null;
  groupName?: string;
  openCount: number;
  overdueCount: number;
  tasks: Task[];
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
    1: "bg-slate-100 text-slate-600",
  };

  return (
    <div
      className="group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 cursor-pointer"
      onClick={() => onClick(task)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          task.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        {task.completed && <CheckSquare className="h-2.5 w-2.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${
            task.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {task.subject}
        </span>
      </div>

      {task.assignedTo && (
        <span className="text-xs text-muted-foreground">
          {task.assignedTo.firstName}
        </span>
      )}

      {task.priority > 1 && (
        <Badge className={`text-xs py-0 ${priorityColors[task.priority]}`}>
          {task.priorityLabel}
        </Badge>
      )}

      {task.dueAt && (
        <span
          className={`text-xs ${
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
  );
}

function DealGroupCard({
  group,
  onToggleComplete,
  onTaskClick,
  onNavigateToDeal,
}: {
  group: DealGroup;
  onToggleComplete: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  onNavigateToDeal: (dealId: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const title = group.deal?.name || group.groupName || "General";
  const subtitle = group.deal?.company;

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
          group.overdueCount > 0 ? "bg-red-50" : "bg-slate-50"
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          <Building2 className="h-4 w-4 text-slate-400" />
          <div>
            <div className="font-medium text-sm">{title}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {group.overdueCount > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs">
              {group.overdueCount} overdue
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {group.openCount} task{group.openCount !== 1 ? "s" : ""}
          </Badge>
          {group.deal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToDeal(group.deal!.id);
              }}
              className="p-1 hover:bg-slate-200 rounded"
              title="View deal"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div>
          {group.tasks.map((task) => (
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

export default function TasksByDealPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<DealGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [slideOutOpen, setSlideOutOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [groupsRes, usersRes, tasksRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/grouped_by_deal`),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks?root_only=true`),
      ]);
      const [groupsData, usersData, tasksData] = await Promise.all([
        groupsRes.json(),
        usersRes.json(),
        tasksRes.json(),
      ]);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setAllTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleComplete = async (task: Task) => {
    const endpoint = task.completed ? "uncomplete" : "complete";
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}/${endpoint}`,
        { method: "POST" }
      );
      if (res.ok) {
        fetchData();
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
    fetchData();
  };

  const handleTaskDelete = () => {
    setSlideOutOpen(false);
    setSelectedTask(null);
    fetchData();
  };

  const handleNavigateToDeal = (dealId: number) => {
    router.push(`/deals/${dealId}`);
  };

  const totalTasks = groups.reduce((sum, g) => sum + g.openCount, 0);
  const totalOverdue = groups.reduce((sum, g) => sum + g.overdueCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tasks by Deal</h1>
          <p className="text-sm text-muted-foreground">
            {totalTasks} open task{totalTasks !== 1 ? "s" : ""} across{" "}
            {groups.length} deal{groups.length !== 1 ? "s" : ""}
            {totalOverdue > 0 && (
              <span className="text-red-600 ml-2">
                ({totalOverdue} overdue)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedTask(null);
            setSlideOutOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Groups */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Building2 className="h-12 w-12 mb-4 opacity-50" />
          <p>No deal tasks found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, idx) => (
            <DealGroupCard
              key={group.deal?.id || `general-${idx}`}
              group={group}
              onToggleComplete={handleToggleComplete}
              onTaskClick={handleTaskClick}
              onNavigateToDeal={handleNavigateToDeal}
            />
          ))}
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
