"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  Check,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  type Project,
  type ProjectTask,
  getStatusColor,
  getStatusLabel,
  getProjectProgress,
  formatRelativeDate,
  isOverdue,
  isDueSoon,
  getPriorityLabel,
  fetchProjectTasks,
  completeTask,
  uncompleteTask,
  deleteTask,
} from "@/lib/projects-api";

interface WorkQueueViewProps {
  projects: Project[];
  loading?: boolean;
  onTasksChange?: () => void;
}

interface ProjectTaskGroup {
  project: Project;
  overdueTasks: ProjectTask[];
  dueSoonTasks: ProjectTask[];
  openTasks: ProjectTask[];
}

function TaskRow({
  task,
  onComplete,
  onUncomplete,
  onDelete,
}: {
  task: ProjectTask;
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
}) {
  const taskIsOverdue = !task.completed && isOverdue(task.dueAt);
  const taskIsDueSoon = !task.completed && isDueSoon(task.dueAt);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 transition-colors",
        "border-b border-slate-100 last:border-b-0",
        taskIsOverdue ? "bg-red-50/30" : "hover:bg-slate-50"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={task.completed ? onUncomplete : onComplete}
        className={cn(
          "flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
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
            "text-sm truncate",
            task.completed
              ? "text-slate-500 line-through"
              : taskIsOverdue
              ? "text-red-700 font-medium"
              : "text-slate-900"
          )}
        >
          {task.subject}
        </p>
      </div>

      {/* Priority */}
      {task.priority === 0 && (
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 h-5 bg-red-50 text-red-600 border-red-200 flex-shrink-0"
        >
          <Flag className="h-3 w-3 mr-0.5" />
          High
        </Badge>
      )}

      {/* Due date */}
      {task.dueAt && (
        <span
          className={cn(
            "text-xs flex items-center gap-1 flex-shrink-0 w-20",
            taskIsOverdue
              ? "text-red-600 font-medium"
              : taskIsDueSoon
              ? "text-amber-600"
              : "text-slate-400"
          )}
        >
          <Calendar className="h-3 w-3" />
          {formatRelativeDate(task.dueAt)}
        </span>
      )}

      {/* Assignee */}
      {task.assignee && (
        <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0 w-24 truncate">
          <User className="h-3 w-3 flex-shrink-0" />
          {task.assignee.firstName}
        </span>
      )}

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

function ProjectTaskGroupCard({
  group,
  onCompleteTask,
  onUncompleteTask,
  onDeleteTask,
}: {
  group: ProjectTaskGroup;
  onCompleteTask: (taskId: number) => void;
  onUncompleteTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const { project } = group;
  const progress = getProjectProgress(project);
  const totalTasks = group.overdueTasks.length + group.dueSoonTasks.length + group.openTasks.length;

  if (totalTasks === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* Project Header */}
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center flex-shrink-0">
              <FolderKanban className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {project.name}
                </h3>
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", getStatusColor(project.status))}
                >
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
              {project.owner && (
                <p className="text-xs text-slate-500">
                  {project.owner.firstName} {project.owner.lastName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-slate-500">{totalTasks} tasks</p>
                <p className="text-xs font-medium text-slate-700">{progress}% done</p>
              </div>
              <Progress
                value={progress}
                className="h-1.5 w-20 [&>div]:bg-cyan-500"
              />
              {open ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Overdue Tasks */}
          {group.overdueTasks.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-red-50/50 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs font-medium text-red-700">
                    Overdue ({group.overdueTasks.length})
                  </span>
                </div>
              </div>
              {group.overdueTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={() => onCompleteTask(task.id)}
                  onUncomplete={() => onUncompleteTask(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))}
            </div>
          )}

          {/* Due Soon Tasks */}
          {group.dueSoonTasks.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-amber-50/50 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-700">
                    Due Soon ({group.dueSoonTasks.length})
                  </span>
                </div>
              </div>
              {group.dueSoonTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={() => onCompleteTask(task.id)}
                  onUncomplete={() => onUncompleteTask(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))}
            </div>
          )}

          {/* Open Tasks */}
          {group.openTasks.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600">
                    Open ({group.openTasks.length})
                  </span>
                </div>
              </div>
              {group.openTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={() => onCompleteTask(task.id)}
                  onUncomplete={() => onUncompleteTask(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function WorkQueueView({ projects, loading, onTasksChange }: WorkQueueViewProps) {
  const [tasksByProject, setTasksByProject] = useState<Record<number, ProjectTask[]>>({});
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Fetch all tasks for all projects
  const loadAllTasks = useCallback(async () => {
    setLoadingTasks(true);
    const tasksMap: Record<number, ProjectTask[]> = {};

    await Promise.all(
      projects.map(async (project) => {
        const tasks = await fetchProjectTasks(project.id);
        tasksMap[project.id] = tasks;
      })
    );

    setTasksByProject(tasksMap);
    setLoadingTasks(false);
  }, [projects]);

  useEffect(() => {
    if (projects.length > 0) {
      loadAllTasks();
    } else {
      setTasksByProject({});
      setLoadingTasks(false);
    }
  }, [projects, loadAllTasks]);

  // Build grouped task list
  const projectGroups = useMemo(() => {
    const groups: ProjectTaskGroup[] = [];

    for (const project of projects) {
      const tasks = tasksByProject[project.id] || [];
      const incompleteTasks = tasks.filter((t) => !t.completed);

      const overdueTasks = incompleteTasks.filter((t) => isOverdue(t.dueAt));
      const dueSoonTasks = incompleteTasks.filter((t) => !isOverdue(t.dueAt) && isDueSoon(t.dueAt));
      const openTasks = incompleteTasks.filter(
        (t) => !isOverdue(t.dueAt) && !isDueSoon(t.dueAt)
      );

      // Sort by priority within each group
      const sortByPriority = (a: ProjectTask, b: ProjectTask) => a.priority - b.priority;
      overdueTasks.sort(sortByPriority);
      dueSoonTasks.sort(sortByPriority);
      openTasks.sort(sortByPriority);

      if (overdueTasks.length > 0 || dueSoonTasks.length > 0 || openTasks.length > 0) {
        groups.push({
          project,
          overdueTasks,
          dueSoonTasks,
          openTasks,
        });
      }
    }

    // Sort projects by urgency (most overdue first, then most due soon)
    groups.sort((a, b) => {
      if (a.overdueTasks.length !== b.overdueTasks.length) {
        return b.overdueTasks.length - a.overdueTasks.length;
      }
      if (a.dueSoonTasks.length !== b.dueSoonTasks.length) {
        return b.dueSoonTasks.length - a.dueSoonTasks.length;
      }
      return 0;
    });

    return groups;
  }, [projects, tasksByProject]);

  // Task actions
  const handleCompleteTask = async (taskId: number) => {
    const updated = await completeTask(taskId);
    if (updated) {
      setTasksByProject((prev) => {
        const newMap = { ...prev };
        for (const projectId in newMap) {
          newMap[projectId] = newMap[projectId].map((t) =>
            t.id === taskId ? { ...t, completed: true } : t
          );
        }
        return newMap;
      });
      onTasksChange?.();
    }
  };

  const handleUncompleteTask = async (taskId: number) => {
    const updated = await uncompleteTask(taskId);
    if (updated) {
      setTasksByProject((prev) => {
        const newMap = { ...prev };
        for (const projectId in newMap) {
          newMap[projectId] = newMap[projectId].map((t) =>
            t.id === taskId ? { ...t, completed: false } : t
          );
        }
        return newMap;
      });
      onTasksChange?.();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const success = await deleteTask(taskId);
    if (success) {
      setTasksByProject((prev) => {
        const newMap = { ...prev };
        for (const projectId in newMap) {
          newMap[projectId] = newMap[projectId].filter((t) => t.id !== taskId);
        }
        return newMap;
      });
      onTasksChange?.();
    }
  };

  // Stats
  const stats = useMemo(() => {
    let totalOverdue = 0;
    let totalDueSoon = 0;
    let totalOpen = 0;

    for (const group of projectGroups) {
      totalOverdue += group.overdueTasks.length;
      totalDueSoon += group.dueSoonTasks.length;
      totalOpen += group.openTasks.length;
    }

    return { totalOverdue, totalDueSoon, totalOpen };
  }, [projectGroups]);

  if (loading || loadingTasks) {
    return (
      <div className="flex-1 p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200/60 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-100 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-md bg-slate-100" />
                  <div className="h-4 w-48 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projectGroups.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">All caught up!</h3>
          <p className="text-sm text-slate-500">
            No open tasks across your projects. Great work!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Stats bar */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm">
            <span className="font-semibold text-red-600">{stats.totalOverdue}</span>
            <span className="text-slate-500 ml-1">overdue</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-sm">
            <span className="font-semibold text-amber-600">{stats.totalDueSoon}</span>
            <span className="text-slate-500 ml-1">due soon</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-slate-400" />
          <span className="text-sm">
            <span className="font-semibold text-slate-700">{stats.totalOpen}</span>
            <span className="text-slate-500 ml-1">open</span>
          </span>
        </div>
      </div>

      {/* Task groups */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {projectGroups.map((group) => (
            <ProjectTaskGroupCard
              key={group.project.id}
              group={group}
              onCompleteTask={handleCompleteTask}
              onUncompleteTask={handleUncompleteTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
