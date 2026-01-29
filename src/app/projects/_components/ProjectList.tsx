"use client";

import { useState } from "react";
import {
  FolderKanban,
  MoreHorizontal,
  CheckSquare,
  Clock,
  AlertTriangle,
  ChevronRight,
  User,
  LayoutGrid,
  List,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type Project,
  type ProjectTask,
  getStatusColor,
  getStatusDotColor,
  getStatusLabel,
  getProjectProgress,
  getProjectHealth,
  formatRelativeDate,
  isOverdue,
  getPriorityColor,
  getPriorityLabel,
} from "@/lib/projects-api";

interface ProjectListProps {
  projects: Project[];
  loading?: boolean;
  selectedProjectId: number | null;
  onSelectProject: (projectId: number | null) => void;
  viewMode: "cards" | "list";
  onViewModeChange: (mode: "cards" | "list") => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onStatusChange: (project: Project, status: string) => void;
  nextTasks?: Record<number, ProjectTask | null>;
}

function ProjectCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-slate-200/60 bg-white animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-slate-100 rounded-full" />
      </div>
      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-4">
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  nextTask,
}: {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  nextTask?: ProjectTask | null;
}) {
  const progress = getProjectProgress(project);
  const health = getProjectHealth(project);
  const totalTasks = project.openTasksCount + project.completedTasksCount;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full text-left p-5 rounded-2xl border transition-all duration-200",
        isSelected
          ? "bg-gradient-to-br from-cyan-50 to-white border-cyan-200 shadow-lg ring-1 ring-cyan-200"
          : "bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
              isSelected
                ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white"
                : "bg-cyan-50 text-cyan-600"
            )}
          >
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {project.name}
            </h3>
            {project.owner && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <User className="h-3 w-3" />
                {project.owner.firstName} {project.owner.lastName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-[10px] font-medium", getStatusColor(project.status))}
          >
            {getStatusLabel(project.status)}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onStatusChange("active"); }}
                disabled={project.status === "active"}
              >
                <Play className="h-4 w-4 mr-2" />
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onStatusChange("paused"); }}
                disabled={project.status === "paused"}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onStatusChange("complete"); }}
                disabled={project.status === "complete"}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description preview */}
      {project.description && (
        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600">
          <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
          {project.openTasksCount} open
        </span>
        {project.overdueTasksCount > 0 && (
          <span className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {project.overdueTasksCount} overdue
          </span>
        )}
        <span className="flex items-center gap-1.5 text-slate-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {project.completedTasksCount} done
        </span>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 ? (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-500">Progress</span>
            <span className="text-[10px] font-medium text-slate-600">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className={cn(
              "h-1.5",
              health === "critical"
                ? "[&>div]:bg-red-500"
                : health === "warning"
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-cyan-500"
            )}
          />
        </div>
      ) : (
        <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-dashed border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            No tasks yet. Add tasks to track progress.
          </p>
        </div>
      )}

      {/* Next task preview */}
      {nextTask && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex-shrink-0">
                Next:
              </span>
              <span
                className={cn(
                  "text-xs truncate",
                  isOverdue(nextTask.dueAt) ? "text-red-600 font-medium" : "text-slate-700"
                )}
              >
                {nextTask.subject}
              </span>
            </div>
            {nextTask.dueAt && (
              <span
                className={cn(
                  "text-[10px] flex-shrink-0 ml-2",
                  isOverdue(nextTask.dueAt) ? "text-red-500" : "text-slate-400"
                )}
              >
                {formatRelativeDate(nextTask.dueAt)}
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

function ProjectRow({
  project,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}) {
  const progress = getProjectProgress(project);
  const health = getProjectHealth(project);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full flex items-center gap-4 px-4 py-3 text-left transition-all duration-150",
        "border-b border-slate-100 last:border-b-0",
        isSelected
          ? "bg-cyan-50/50"
          : "hover:bg-slate-50"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
          isSelected ? "bg-cyan-100 text-cyan-600" : "bg-slate-100 text-slate-500"
        )}
      >
        <FolderKanban className="h-4 w-4" />
      </div>

      {/* Name & Owner */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-slate-900 truncate">{project.name}</h3>
        {project.owner && (
          <p className="text-xs text-slate-500">
            {project.owner.firstName} {project.owner.lastName}
          </p>
        )}
      </div>

      {/* Status */}
      <Badge
        variant="outline"
        className={cn("text-[10px] font-medium flex-shrink-0", getStatusColor(project.status))}
      >
        {getStatusLabel(project.status)}
      </Badge>

      {/* Tasks */}
      <div className="flex items-center gap-3 text-xs flex-shrink-0 w-32">
        <span className="text-slate-600">{project.openTasksCount} open</span>
        {project.overdueTasksCount > 0 && (
          <span className="text-red-600">{project.overdueTasksCount} overdue</span>
        )}
      </div>

      {/* Progress */}
      <div className="w-24 flex-shrink-0">
        <Progress
          value={progress}
          className={cn(
            "h-1.5",
            health === "critical"
              ? "[&>div]:bg-red-500"
              : health === "warning"
              ? "[&>div]:bg-amber-500"
              : "[&>div]:bg-cyan-500"
          )}
        />
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onStatusChange("active"); }}
            disabled={project.status === "active"}
          >
            <Play className="h-4 w-4 mr-2" />
            Set Active
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onStatusChange("paused"); }}
            disabled={project.status === "paused"}
          >
            <Pause className="h-4 w-4 mr-2" />
            Pause Project
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onStatusChange("complete"); }}
            disabled={project.status === "complete"}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark Complete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
    </button>
  );
}

export function ProjectList({
  projects,
  loading,
  selectedProjectId,
  onSelectProject,
  viewMode,
  onViewModeChange,
  onEditProject,
  onDeleteProject,
  onStatusChange,
  nextTasks = {},
}: ProjectListProps) {
  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-end mb-4">
          <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className={cn(
          viewMode === "cards"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            : "bg-white rounded-xl border border-slate-200/60 overflow-hidden"
        )}>
          {viewMode === "cards" ? (
            <>
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </>
          ) : (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="h-9 w-9 rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-slate-100 rounded-full" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-1.5 w-24 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No projects found</h3>
          <p className="text-sm text-slate-500 mb-4">
            Create your first project to start organizing work.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* View toggle */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
        <p className="text-sm text-slate-500">
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("cards")}
            className={cn(
              "h-7 w-7 p-0 rounded-md",
              viewMode === "cards"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "h-7 w-7 p-0 rounded-md",
              viewMode === "list"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project list */}
      <ScrollArea className="flex-1">
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelected={selectedProjectId === project.id}
                onSelect={() => onSelectProject(project.id)}
                onEdit={() => onEditProject(project)}
                onDelete={() => onDeleteProject(project)}
                onStatusChange={(status) => onStatusChange(project, status)}
                nextTask={nextTasks[project.id]}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden mx-6 my-6">
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                isSelected={selectedProjectId === project.id}
                onSelect={() => onSelectProject(project.id)}
                onEdit={() => onEditProject(project)}
                onDelete={() => onDeleteProject(project)}
                onStatusChange={(status) => onStatusChange(project, status)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
