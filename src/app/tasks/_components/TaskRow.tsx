"use client";

import { useState, useCallback, memo } from "react";
import { Check, MoreHorizontal, Loader2, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DueDateBadge } from "./DueDatePicker";
import { PriorityBadge } from "./PrioritySelect";
import { StatusBadge } from "./StatusSelect";
import { AttachmentBadge } from "./AttachmentSelector";
import { AssigneePill } from "./AssigneeSelect";
import {
  type Task,
  type AttachmentType,
  completeTask,
  uncompleteTask,
} from "@/lib/tasks-api";

interface TaskRowProps {
  task: Task;
  onClick?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onUncomplete?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  showAttachment?: boolean;
  showAssignee?: boolean;
  compact?: boolean;
}

export const TaskRow = memo(function TaskRow({
  task,
  onClick,
  onComplete,
  onUncomplete,
  onDelete,
  onEdit,
  showAttachment = true,
  showAssignee = true,
  compact = false,
}: TaskRowProps) {
  const [completing, setCompleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggleComplete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (completing) return;

      setCompleting(true);
      try {
        if (task.completed) {
          await uncompleteTask(task.id);
          onUncomplete?.(task);
        } else {
          await completeTask(task.id);
          onComplete?.(task);
        }
      } catch (error) {
        console.error("Failed to toggle task completion:", error);
      } finally {
        setCompleting(false);
      }
    },
    [task, completing, onComplete, onUncomplete]
  );

  const handleClick = useCallback(() => {
    onClick?.(task);
  }, [task, onClick]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(task);
    },
    [task, onDelete]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit?.(task);
    },
    [task, onEdit]
  );

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150",
        "hover:bg-slate-50/80",
        task.completed && "opacity-60",
        compact && "py-2"
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        className={cn(
          "flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
          task.completed
            ? "bg-cyan-600 border-cyan-600"
            : "border-slate-300 hover:border-cyan-500",
          completing && "opacity-50"
        )}
      >
        {completing ? (
          <Loader2 className="h-3 w-3 animate-spin text-white" />
        ) : task.completed ? (
          <Check className="h-3 w-3 text-white" />
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Subject */}
          <span
            className={cn(
              "text-sm font-medium text-slate-900 truncate",
              task.completed && "line-through text-slate-500"
            )}
          >
            {task.subject}
          </span>

          {/* Subtask indicator */}
          {task.subtaskCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <ListTree className="h-3 w-3" />
              {task.completedSubtaskCount}/{task.subtaskCount}
            </span>
          )}
        </div>
      </div>

      {/* Meta chips - only show on hover or when populated */}
      <div className={cn(
        "flex items-center gap-1.5 flex-shrink-0 transition-opacity",
        !isHovered && "opacity-80"
      )}>
        {/* Attachment */}
        {showAttachment && task.attachmentType !== "general" && (
          <AttachmentBadge
            type={task.attachmentType as AttachmentType}
            name={task.attachmentName}
            size="sm"
          />
        )}

        {/* Due date */}
        {task.dueAt && (
          <DueDateBadge dueAt={task.dueAt} task={task} size="sm" />
        )}

        {/* Priority - only show for high */}
        {task.priority === 3 && (
          <PriorityBadge priority={task.priority} size="sm" showLabel={false} />
        )}

        {/* Status - only show for non-open */}
        {task.status !== "open" && (
          <StatusBadge status={task.status} size="sm" />
        )}

        {/* Assignee */}
        {showAssignee && task.assignedTo && (
          <AssigneePill user={task.assignedTo} size="sm" />
        )}
      </div>

      {/* More menu - show on hover */}
      <div className={cn(
        "flex-shrink-0 transition-opacity",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleEdit}>
              Edit task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleComplete}>
              {task.completed ? "Mark incomplete" : "Mark complete"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

// Skeleton loader for TaskRow
export function TaskRowSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg animate-pulse",
      compact && "py-2"
    )}>
      <div className="h-5 w-5 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-1">
        <div className="h-4 bg-slate-200 rounded w-2/3" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
        <div className="h-5 w-5 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}
