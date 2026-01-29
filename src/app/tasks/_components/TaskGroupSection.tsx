"use client";

import { useState, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  Calendar,
  CalendarDays,
  Inbox,
  Plus,
  Building2,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TaskRow, TaskRowSkeleton } from "./TaskRow";
import { type Task, createTask } from "@/lib/tasks-api";

type GroupVariant = "overdue" | "dueToday" | "dueThisWeek" | "upcoming" | "noDueDate" | "deal" | "project" | "default";

const GROUP_STYLES: Record<GroupVariant, { icon: React.ElementType; color: string; bgColor: string }> = {
  overdue: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  dueToday: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  dueThisWeek: {
    icon: Calendar,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
  },
  upcoming: {
    icon: CalendarDays,
    color: "text-slate-500",
    bgColor: "bg-slate-50",
  },
  noDueDate: {
    icon: Inbox,
    color: "text-slate-400",
    bgColor: "bg-slate-50",
  },
  deal: {
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  project: {
    icon: FolderKanban,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  default: {
    icon: Inbox,
    color: "text-slate-500",
    bgColor: "bg-slate-50",
  },
};

interface TaskGroupSectionProps {
  title: string;
  tasks: Task[];
  variant?: GroupVariant;
  defaultOpen?: boolean;
  overdueCount?: number;
  showAddTask?: boolean;
  // For inline task creation with pre-attached context
  dealId?: number;
  projectId?: number;
  taskableType?: string;
  taskableId?: number;
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (task: Task) => void;
  onTaskUncomplete?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskCreated?: (task: Task) => void;
  loading?: boolean;
}

export function TaskGroupSection({
  title,
  tasks,
  variant = "default",
  defaultOpen = true,
  overdueCount,
  showAddTask = false,
  dealId,
  projectId,
  taskableType,
  taskableId,
  onTaskClick,
  onTaskComplete,
  onTaskUncomplete,
  onTaskDelete,
  onTaskCreated,
  loading = false,
}: TaskGroupSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTaskSubject, setNewTaskSubject] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const style = GROUP_STYLES[variant];
  const Icon = style.icon;

  const handleAddTask = useCallback(async () => {
    if (!newTaskSubject.trim() || creating) return;

    setCreating(true);
    try {
      const newTask = await createTask({
        subject: newTaskSubject.trim(),
        dealId,
        projectId,
        taskableType,
        taskableId,
      });
      onTaskCreated?.(newTask);
      setNewTaskSubject("");
      setShowAddInput(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setCreating(false);
    }
  }, [newTaskSubject, creating, dealId, projectId, taskableType, taskableId, onTaskCreated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    } else if (e.key === "Escape") {
      setShowAddInput(false);
      setNewTaskSubject("");
    }
  };

  // Don't render if no tasks and not showing add input
  if (tasks.length === 0 && !showAddInput && !loading) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full group">
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          <div className={cn("p-1 rounded", style.bgColor)}>
            <Icon className={cn("h-4 w-4", style.color)} />
          </div>
          <span className="text-sm font-medium text-slate-700">{title}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-slate-100 text-slate-600">
            {tasks.length}
          </Badge>
          {overdueCount && overdueCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-red-100 text-red-700">
              {overdueCount} overdue
            </Badge>
          )}
        </div>
        {showAddTask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddInput(true);
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add task
          </Button>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1 space-y-0.5">
        {loading ? (
          <>
            <TaskRowSkeleton />
            <TaskRowSkeleton />
            <TaskRowSkeleton />
          </>
        ) : (
          <>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={onTaskClick}
                onComplete={onTaskComplete}
                onUncomplete={onTaskUncomplete}
                onDelete={onTaskDelete}
                onEdit={onTaskClick}
              />
            ))}

            {/* Inline add task input */}
            {showAddInput && (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="h-5 w-5 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0" />
                <Input
                  ref={inputRef}
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    if (!newTaskSubject.trim()) {
                      setShowAddInput(false);
                    }
                  }}
                  placeholder="Task name..."
                  className="h-8 border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
                  disabled={creating}
                />
                {creating && (
                  <span className="text-xs text-slate-400">Creating...</span>
                )}
              </div>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// For grouped views (by Deal/Project)
interface EntityGroupSectionProps {
  id: number | string;
  name: string;
  subtitle?: string;
  status?: string;
  tasks: Task[];
  variant: "deal" | "project";
  overdueCount?: number;
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (task: Task) => void;
  onTaskUncomplete?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskCreated?: (task: Task) => void;
}

export function EntityGroupSection({
  id,
  name,
  subtitle,
  status,
  tasks,
  variant,
  overdueCount,
  onTaskClick,
  onTaskComplete,
  onTaskUncomplete,
  onTaskDelete,
  onTaskCreated,
}: EntityGroupSectionProps) {
  const [open, setOpen] = useState(true);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTaskSubject, setNewTaskSubject] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const style = GROUP_STYLES[variant];
  const Icon = style.icon;

  const handleAddTask = useCallback(async () => {
    if (!newTaskSubject.trim() || creating) return;

    setCreating(true);
    try {
      const createData = variant === "deal"
        ? { subject: newTaskSubject.trim(), dealId: Number(id) }
        : { subject: newTaskSubject.trim(), projectId: Number(id) };

      const newTask = await createTask(createData);
      onTaskCreated?.(newTask);
      setNewTaskSubject("");
      setShowAddInput(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setCreating(false);
    }
  }, [newTaskSubject, creating, variant, id, onTaskCreated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    } else if (e.key === "Escape") {
      setShowAddInput(false);
      setNewTaskSubject("");
    }
  };

  return (
    <div className="border border-slate-200/60 rounded-xl bg-white overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 group hover:bg-slate-50/50 transition-colors">
          <div className="flex items-center gap-3">
            {open ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
            <div className={cn("p-1.5 rounded-lg", style.bgColor)}>
              <Icon className={cn("h-4 w-4", style.color)} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{name}</span>
                {status && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] capitalize">
                    {status}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <span className="text-xs text-slate-500">{subtitle}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-slate-100 text-slate-600">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </Badge>
            {overdueCount && overdueCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-red-100 text-red-700">
                {overdueCount} overdue
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddInput(true);
                setOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-slate-100 px-2 py-1">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={onTaskClick}
                onComplete={onTaskComplete}
                onUncomplete={onTaskUncomplete}
                onDelete={onTaskDelete}
                onEdit={onTaskClick}
                showAttachment={false}
              />
            ))}

            {/* Inline add task input */}
            {showAddInput && (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="h-5 w-5 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0" />
                <Input
                  ref={inputRef}
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    if (!newTaskSubject.trim()) {
                      setShowAddInput(false);
                    }
                  }}
                  placeholder="Task name..."
                  className="h-8 border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
                  disabled={creating}
                />
                {creating && (
                  <span className="text-xs text-slate-400">Creating...</span>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
