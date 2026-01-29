"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Check,
  ChevronDown,
  ChevronRight,
  Building2,
  Plus,
  ExternalLink,
  X,
  Calendar,
  User,
  Loader2,
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
  isToggling,
}: {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onClick: (task: Task) => void;
  isToggling: boolean;
}) {
  const priorityColors: Record<number, string> = {
    3: "bg-red-100 text-red-700",
    2: "bg-amber-100 text-amber-700",
    1: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-muted border-b border-border last:border-b-0 cursor-pointer transition-all ${
        task.completed ? "opacity-60" : ""
      }`}
      onClick={() => onClick(task)}
    >
      {/* Enhanced Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isToggling) onToggleComplete(task);
        }}
        disabled={isToggling}
        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          task.completed
            ? "bg-green-500 border-green-500 text-white scale-100"
            : "border-border hover:border-green-400 hover:bg-green-50 group-hover:border-green-400"
        } ${isToggling ? "opacity-50" : ""}`}
      >
        {isToggling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : task.completed ? (
          <Check className="h-3 w-3" />
        ) : (
          <Check className="h-3 w-3 opacity-0 group-hover:opacity-30 text-green-500" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className={`text-sm transition-all ${
            task.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {task.subject}
        </span>
      </div>

      {task.assignedTo && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
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
          className={`text-xs font-medium ${
            task.overdue
              ? "text-red-600"
              : task.dueToday
              ? "text-amber-600"
              : "text-muted-foreground"
          }`}
        >
          {formatDate(task.dueAt)}
        </span>
      )}
    </div>
  );
}

function InlineTaskForm({
  dealId,
  users,
  onSave,
  onCancel,
}: {
  dealId: number | null;
  users: User[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            subject: subject.trim(),
            deal_id: dealId,
            due_at: dueAt || null,
            assigned_to_id: assignedToId ? parseInt(assignedToId) : null,
            priority: 2,
          },
        }),
      });

      if (res.ok) {
        setSubject("");
        setDueAt("");
        setAssignedToId("");
        setShowOptions(false);
        onSave();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 bg-blue-50 border-t border-blue-100">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md border-2 border-blue-300 flex items-center justify-center">
          <Plus className="h-3 w-3 text-blue-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-blue-400"
          disabled={saving}
        />
        {subject.trim() && (
          <>
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showOptions ? "Less" : "More"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-muted-foreground hover:text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Optional fields */}
      {showOptions && subject.trim() && (
        <div className="flex items-center gap-3 mt-2 ml-7">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="text-xs border rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </form>
  );
}

function DealGroupCard({
  group,
  users,
  onToggleComplete,
  onTaskClick,
  onNavigateToDeal,
  onTaskCreated,
  togglingTaskId,
}: {
  group: DealGroup;
  users: User[];
  onToggleComplete: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  onNavigateToDeal: (dealId: number) => void;
  onTaskCreated: () => void;
  togglingTaskId: number | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showInlineForm, setShowInlineForm] = useState(false);

  const title = group.deal?.name || group.groupName || "General";
  const subtitle = group.deal?.company;

  return (
    <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
          group.overdueCount > 0 ? "bg-red-50 hover:bg-red-100" : "bg-muted hover:bg-muted"
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="transition-transform duration-200">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">{title}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {group.overdueCount > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs">
              {group.overdueCount} overdue
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {group.openCount} task{group.openCount !== 1 ? "s" : ""}
          </Badge>

          {/* Add Task Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
              setShowInlineForm(true);
            }}
            className="p-1.5 hover:bg-card rounded transition-colors"
            title="Add task"
          >
            <Plus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>

          {group.deal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToDeal(group.deal!.id);
              }}
              className="p-1.5 hover:bg-card rounded transition-colors"
              title="View deal"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Tasks */}
      {expanded && (
        <div>
          {group.tasks.length === 0 && !showInlineForm ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">No tasks yet</p>
              <button
                onClick={() => setShowInlineForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add first task
              </button>
            </div>
          ) : (
            <>
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onClick={onTaskClick}
                  isToggling={togglingTaskId === task.id}
                />
              ))}
            </>
          )}

          {/* Inline Task Form */}
          {showInlineForm ? (
            <InlineTaskForm
              dealId={group.deal?.id || null}
              users={users}
              onSave={() => {
                onTaskCreated();
                // Keep form open for rapid entry
              }}
              onCancel={() => setShowInlineForm(false)}
            />
          ) : group.tasks.length > 0 ? (
            <button
              onClick={() => setShowInlineForm(true)}
              className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted border-t border-border flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
          ) : null}
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
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);

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
    setTogglingTaskId(task.id);

    // Optimistic update
    setGroups((prevGroups) =>
      prevGroups.map((group) => ({
        ...group,
        tasks: group.tasks.map((t) =>
          t.id === task.id ? { ...t, completed: !t.completed } : t
        ),
        openCount: group.tasks.some((t) => t.id === task.id)
          ? task.completed
            ? group.openCount + 1
            : group.openCount - 1
          : group.openCount,
      }))
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}/${endpoint}`,
        { method: "POST" }
      );
      if (res.ok) {
        // Refetch to get accurate data
        fetchData();
      } else {
        // Revert on error
        fetchData();
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
      fetchData();
    }
    setTogglingTaskId(null);
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
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Groups */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
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
              users={users}
              onToggleComplete={handleToggleComplete}
              onTaskClick={handleTaskClick}
              onNavigateToDeal={handleNavigateToDeal}
              onTaskCreated={fetchData}
              togglingTaskId={togglingTaskId}
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
