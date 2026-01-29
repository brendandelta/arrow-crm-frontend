"use client";

import { useState, useCallback, useEffect } from "react";
import {
  X,
  FolderKanban,
  Pencil,
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  Plus,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Check,
  MoreHorizontal,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  type Project,
  type ProjectTask,
  type UpdateTaskData,
  type User as UserType,
  getStatusColor,
  getStatusLabel,
  getProjectProgress,
  getProjectHealth,
  formatRelativeDate,
  isOverdue,
  isDueSoon,
  getPriorityColor,
  getPriorityLabel,
  groupTasksByStatus,
  TASK_PRIORITIES,
  fetchProjectTasks,
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
} from "@/lib/projects-api";

interface ProjectDetailPanelProps {
  project: Project;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  users: UserType[];
  onTasksChange?: () => void;
}

interface TaskRowProps {
  task: ProjectTask;
  onComplete: () => void;
  onUncomplete: () => void;
  onEdit: (updates: UpdateTaskData) => void;
  onDelete: () => void;
}

function TaskRow({ task, onComplete, onUncomplete, onEdit, onDelete }: TaskRowProps) {
  const taskIsOverdue = !task.completed && isOverdue(task.dueAt);
  const taskIsDueSoon = !task.completed && isDueSoon(task.dueAt);

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors",
        task.completed
          ? "opacity-60"
          : taskIsOverdue
          ? "bg-red-50/50"
          : "hover:bg-slate-50"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={task.completed ? onUncomplete : onComplete}
        className={cn(
          "flex-shrink-0 h-5 w-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors",
          task.completed
            ? "bg-cyan-500 border-cyan-500 text-white"
            : "border-slate-300 hover:border-cyan-500"
        )}
      >
        {task.completed && <Check className="h-3 w-3" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm",
            task.completed
              ? "text-slate-500 line-through"
              : taskIsOverdue
              ? "text-red-700 font-medium"
              : "text-slate-900"
          )}
        >
          {task.subject}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.priority === 0 && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 h-4 bg-red-50 text-red-600 border-red-200"
            >
              High
            </Badge>
          )}
          {task.dueAt && (
            <span
              className={cn(
                "text-[10px] flex items-center gap-1",
                taskIsOverdue
                  ? "text-red-600"
                  : taskIsDueSoon
                  ? "text-amber-600"
                  : "text-slate-400"
              )}
            >
              <Clock className="h-3 w-3" />
              {formatRelativeDate(task.dueAt)}
            </span>
          )}
          {task.assignee && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assignee.firstName}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={task.completed ? onUncomplete : onComplete}>
            <Check className="h-4 w-4 mr-2" />
            {task.completed ? "Reopen" : "Complete"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface TaskGroupProps {
  title: string;
  tasks: ProjectTask[];
  icon: React.ReactNode;
  variant?: "default" | "warning" | "danger";
  defaultOpen?: boolean;
  onCompleteTask: (taskId: number) => void;
  onUncompleteTask: (taskId: number) => void;
  onEditTask: (taskId: number, updates: UpdateTaskData) => void;
  onDeleteTask: (taskId: number) => void;
}

function TaskGroup({
  title,
  tasks,
  icon,
  variant = "default",
  defaultOpen = true,
  onCompleteTask,
  onUncompleteTask,
  onEditTask,
  onDeleteTask,
}: TaskGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (tasks.length === 0) return null;

  const variantStyles = {
    default: "text-slate-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
        <div className="flex items-center gap-2">
          <span className={variantStyles[variant]}>{icon}</span>
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {tasks.length}
          </Badge>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={() => onCompleteTask(task.id)}
            onUncomplete={() => onUncompleteTask(task.id)}
            onEdit={(updates) => onEditTask(task.id, updates)}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProjectDetailPanel({
  project,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
  users,
  onTasksChange,
}: ProjectDetailPanelProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTaskSubject, setNewTaskSubject] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(1);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const progress = getProjectProgress(project);
  const health = getProjectHealth(project);
  const groupedTasks = groupTasksByStatus(tasks);

  // Fetch tasks
  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    const fetchedTasks = await fetchProjectTasks(project.id);
    setTasks(fetchedTasks);
    setLoadingTasks(false);
  }, [project.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Task actions
  const handleCreateTask = async () => {
    if (!newTaskSubject.trim()) return;

    setCreatingTask(true);
    const task = await createTask({
      subject: newTaskSubject.trim(),
      priority: newTaskPriority,
      dueAt: newTaskDueDate || undefined,
      taskableType: "Project",
      taskableId: project.id,
    });

    if (task) {
      setTasks((prev) => [...prev, task]);
      setNewTaskSubject("");
      setNewTaskPriority(1);
      setNewTaskDueDate("");
      onTasksChange?.();
    }
    setCreatingTask(false);
  };

  const handleCompleteTask = async (taskId: number) => {
    const updated = await completeTask(taskId);
    if (updated) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t))
      );
      onTasksChange?.();
    }
  };

  const handleUncompleteTask = async (taskId: number) => {
    const updated = await uncompleteTask(taskId);
    if (updated) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: false, completedAt: null } : t))
      );
      onTasksChange?.();
    }
  };

  const handleEditTask = async (taskId: number, updates: UpdateTaskData) => {
    const updated = await updateTask(taskId, updates);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)));
      onTasksChange?.();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const success = await deleteTask(taskId);
    if (success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      onTasksChange?.();
    }
  };

  return (
    <div className="w-[420px] bg-white border-l border-slate-200/80 flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{project.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", getStatusColor(project.status))}
                >
                  {getStatusLabel(project.status)}
                </Badge>
                {project.owner && (
                  <span className="text-xs text-slate-500">
                    {project.owner.firstName} {project.owner.lastName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 text-xs"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Status
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => onStatusChange("active")}
                disabled={project.status === "active"}
              >
                <Play className="h-4 w-4 mr-2" />
                Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange("open")}
                disabled={project.status === "open"}
              >
                <FolderKanban className="h-4 w-4 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange("paused")}
                disabled={project.status === "paused"}
              >
                <Pause className="h-4 w-4 mr-2" />
                Paused
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange("complete")}
                disabled={project.status === "complete"}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* Description */}
          {project.description && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-sm text-slate-700">{project.description}</p>
            </div>
          )}

          {/* Progress & Health */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Progress
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-600">
                    {project.completedTasksCount} of{" "}
                    {project.openTasksCount + project.completedTasksCount} tasks complete
                  </span>
                  <span className="text-sm font-medium text-slate-900">{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  className={cn(
                    "h-2",
                    health === "critical"
                      ? "[&>div]:bg-red-500"
                      : health === "warning"
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-cyan-500"
                  )}
                />
              </div>

              {/* Health callout */}
              {health === "critical" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">
                      Blocked by {project.overdueTasksCount} overdue tasks
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Address these to get the project back on track.
                    </p>
                  </div>
                </div>
              )}
              {health === "warning" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <Clock className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700">
                      {project.overdueTasksCount} overdue task{project.overdueTasksCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Complete these soon to stay on schedule.
                    </p>
                  </div>
                </div>
              )}
              {health === "empty" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 border-dashed">
                  <FolderKanban className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">No tasks yet</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add tasks below to define this project&apos;s work.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tasks Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Tasks
            </h3>

            {/* Quick add task */}
            <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Input
                  placeholder="Add a task..."
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateTask();
                    }
                  }}
                  className="h-8 text-sm flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleCreateTask}
                  disabled={!newTaskSubject.trim() || creatingTask}
                  className="h-8 bg-cyan-600 hover:bg-cyan-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Flag className="h-3 w-3 mr-1.5" />
                      {getPriorityLabel(newTaskPriority)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-1" align="start">
                    {TASK_PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setNewTaskPriority(p.value)}
                        className={cn(
                          "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-slate-100",
                          newTaskPriority === p.value && "bg-slate-100"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="h-7 text-xs w-32"
                />
              </div>
            </div>

            {/* Task list */}
            {loadingTasks ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 animate-pulse"
                  >
                    <div className="h-5 w-5 rounded-md bg-slate-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-40 bg-slate-100 rounded" />
                      <div className="h-3 w-24 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">
                No tasks yet. Add your first task above.
              </div>
            ) : (
              <div className="space-y-4">
                <TaskGroup
                  title="Overdue"
                  tasks={groupedTasks.overdue}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  variant="danger"
                  onCompleteTask={handleCompleteTask}
                  onUncompleteTask={handleUncompleteTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
                <TaskGroup
                  title="Due Soon"
                  tasks={groupedTasks.dueSoon}
                  icon={<Clock className="h-4 w-4" />}
                  variant="warning"
                  onCompleteTask={handleCompleteTask}
                  onUncompleteTask={handleUncompleteTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
                <TaskGroup
                  title="Open"
                  tasks={groupedTasks.open}
                  icon={<FolderKanban className="h-4 w-4" />}
                  onCompleteTask={handleCompleteTask}
                  onUncompleteTask={handleUncompleteTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
                <TaskGroup
                  title="Completed"
                  tasks={groupedTasks.completed}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  defaultOpen={false}
                  onCompleteTask={handleCompleteTask}
                  onUncompleteTask={handleUncompleteTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
