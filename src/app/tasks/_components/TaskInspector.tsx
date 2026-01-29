"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Check,
  Loader2,
  Trash2,
  ListTree,
  Plus,
  ChevronDown,
  ChevronRight,
  Building2,
  FolderKanban,
  ExternalLink,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssigneeSelect } from "./AssigneeSelect";
import { DueDatePicker } from "./DueDatePicker";
import { PrioritySelect } from "./PrioritySelect";
import { StatusSelect } from "./StatusSelect";
import { AttachmentSelector } from "./AttachmentSelector";
import {
  type Task,
  type TaskStatus,
  type AttachmentType,
  type UserOption,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  createTask,
  fetchTask,
  formatRelativeDate,
} from "@/lib/tasks-api";

interface TaskInspectorProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onTaskUpdate?: (task: Task) => void;
  onTaskDelete?: (taskId: number) => void;
  users?: UserOption[];
  // Mode for embedded use (in deals, projects)
  embedded?: boolean;
}

export function TaskInspector({
  task: initialTask,
  open,
  onClose,
  onTaskUpdate,
  onTaskDelete,
  users,
  embedded = false,
}: TaskInspectorProps) {
  const [task, setTask] = useState<Task | null>(initialTask);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(true);
  const [metadataOpen, setMetadataOpen] = useState(false);

  // Editable fields
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [priority, setPriority] = useState(2);
  const [status, setStatus] = useState<TaskStatus>("open");
  const [assigneeId, setAssigneeId] = useState<number | null>(null);

  // Subtask creation
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskSubject, setNewSubtaskSubject] = useState("");
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // Sync state with task prop
  useEffect(() => {
    if (initialTask) {
      setTask(initialTask);
      setSubject(initialTask.subject);
      setBody(initialTask.body || "");
      setDueAt(initialTask.dueAt);
      setPriority(initialTask.priority);
      setStatus(initialTask.status as TaskStatus);
      setAssigneeId(initialTask.assignedTo?.id || null);
    }
  }, [initialTask]);

  // Auto-save subject on blur
  const handleSubjectBlur = useCallback(async () => {
    if (!task || subject === task.subject) return;
    if (!subject.trim()) {
      setSubject(task.subject);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateTask(task.id, { subject: subject.trim() });
      setTask(updated);
      onTaskUpdate?.(updated);
    } catch (error) {
      console.error("Failed to update subject:", error);
      setSubject(task.subject);
    } finally {
      setSaving(false);
    }
  }, [task, subject, onTaskUpdate]);

  // Auto-save body on blur
  const handleBodyBlur = useCallback(async () => {
    if (!task || body === (task.body || "")) return;

    setSaving(true);
    try {
      const updated = await updateTask(task.id, { body: body || undefined });
      setTask(updated);
      onTaskUpdate?.(updated);
    } catch (error) {
      console.error("Failed to update body:", error);
      setBody(task.body || "");
    } finally {
      setSaving(false);
    }
  }, [task, body, onTaskUpdate]);

  // Field update handlers
  const handleDueDateChange = useCallback(async (date: string | null) => {
    if (!task) return;
    setDueAt(date);
    setSaving(true);
    try {
      const updated = await updateTask(task.id, { dueAt: date });
      setTask(updated);
      onTaskUpdate?.(updated);
    } catch (error) {
      console.error("Failed to update due date:", error);
      setDueAt(task.dueAt);
    } finally {
      setSaving(false);
    }
  }, [task, onTaskUpdate]);

  const handlePriorityChange = useCallback(async (newPriority: number) => {
    if (!task) return;
    setPriority(newPriority);
    setSaving(true);
    try {
      const updated = await updateTask(task.id, { priority: newPriority });
      setTask(updated);
      onTaskUpdate?.(updated);
    } catch (error) {
      console.error("Failed to update priority:", error);
      setPriority(task.priority);
    } finally {
      setSaving(false);
    }
  }, [task, onTaskUpdate]);

  const handleStatusChange = useCallback(async (newStatus: TaskStatus) => {
    if (!task) return;
    setStatus(newStatus);
    setSaving(true);
    try {
      const updated = await updateTask(task.id, { status: newStatus });
      setTask(updated);
      onTaskUpdate?.(updated);
    } catch (error) {
      console.error("Failed to update status:", error);
      setStatus(task.status as TaskStatus);
    } finally {
      setSaving(false);
    }
  }, [task, onTaskUpdate]);

  const handleAssigneeChange = useCallback(async (userId: number | null) => {
    if (!task) return;
    setAssigneeId(userId);
    setSaving(true);
    try {
      const updated = await updateTask(task.id, { assignedToId: userId });
      setTask(updated);
      onTaskUpdate?.(updated);
    } catch (error) {
      console.error("Failed to update assignee:", error);
      setAssigneeId(task.assignedTo?.id || null);
    } finally {
      setSaving(false);
    }
  }, [task, onTaskUpdate]);

  // Toggle completion
  const handleToggleComplete = useCallback(async () => {
    if (!task || completing) return;
    setCompleting(true);
    try {
      const updated = task.completed
        ? await uncompleteTask(task.id)
        : await completeTask(task.id);
      setTask(updated);
      onTaskUpdate?.(updated);
    } catch (error) {
      console.error("Failed to toggle completion:", error);
    } finally {
      setCompleting(false);
    }
  }, [task, completing, onTaskUpdate]);

  // Delete task
  const handleDelete = useCallback(async () => {
    if (!task || deleting) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      onTaskDelete?.(task.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [task, deleting, onTaskDelete, onClose]);

  // Create subtask
  const handleCreateSubtask = useCallback(async () => {
    if (!task || !newSubtaskSubject.trim() || creatingSubtask) return;
    setCreatingSubtask(true);
    try {
      const newSubtask = await createTask({
        subject: newSubtaskSubject.trim(),
        parentTaskId: task.id,
        dealId: task.dealId || undefined,
        projectId: task.projectId || undefined,
      });
      // Refresh task to get updated subtasks
      const refreshed = await fetchTask(task.id);
      setTask(refreshed);
      onTaskUpdate?.(refreshed);
      setNewSubtaskSubject("");
      setShowAddSubtask(false);
    } catch (error) {
      console.error("Failed to create subtask:", error);
    } finally {
      setCreatingSubtask(false);
    }
  }, [task, newSubtaskSubject, creatingSubtask, onTaskUpdate]);

  // Toggle subtask completion
  const handleToggleSubtask = useCallback(async (subtask: Task) => {
    try {
      subtask.completed
        ? await uncompleteTask(subtask.id)
        : await completeTask(subtask.id);
      // Refresh parent task
      if (task) {
        const refreshed = await fetchTask(task.id);
        setTask(refreshed);
        onTaskUpdate?.(refreshed);
      }
    } catch (error) {
      console.error("Failed to toggle subtask:", error);
    }
  }, [task, onTaskUpdate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || !task) return;

      if (e.key === "Escape") {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleToggleComplete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, task, onClose, handleToggleComplete]);

  if (!task) return null;

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          {/* Complete checkbox */}
          <button
            onClick={handleToggleComplete}
            disabled={completing}
            className={cn(
              "flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5",
              task.completed
                ? "bg-cyan-600 border-cyan-600"
                : "border-slate-300 hover:border-cyan-500",
              completing && "opacity-50"
            )}
          >
            {completing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : task.completed ? (
              <Check className="h-3.5 w-3.5 text-white" />
            ) : null}
          </button>

          {/* Subject */}
          <div className="flex-1 min-w-0">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={handleSubjectBlur}
              className={cn(
                "text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-0",
                task.completed && "line-through text-slate-500"
              )}
              placeholder="Task name"
            />
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Saving indicator */}
        {saving && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-5">
          {/* Quick fields row */}
          <div className="flex flex-wrap gap-2">
            <StatusSelect
              value={status}
              onChange={handleStatusChange}
              variant="badge"
              size="sm"
            />
            <PrioritySelect
              value={priority}
              onChange={handlePriorityChange}
              variant="badge"
              size="sm"
            />
            <DueDatePicker
              value={dueAt}
              onChange={handleDueDateChange}
              task={task}
              variant="badge"
              size="sm"
            />
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />
              Assignee
            </label>
            <AssigneeSelect
              value={assigneeId}
              onChange={handleAssigneeChange}
              users={users}
              variant="minimal"
            />
          </div>

          {/* Attachment */}
          {(task.dealId || task.projectId || task.attachmentType !== "general") && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Attached to
              </label>
              <div className="flex items-center gap-2">
                {task.deal ? (
                  <Link
                    href={`/deals/${task.deal.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm transition-colors"
                  >
                    <Building2 className="h-4 w-4" />
                    {task.deal.name}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                ) : task.project ? (
                  <Link
                    href={`/projects?id=${task.project.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm transition-colors"
                  >
                    <FolderKanban className="h-4 w-4" />
                    {task.project.name}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                ) : null}
              </div>
            </div>
          )}

          <Separator />

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Description
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={handleBodyBlur}
              placeholder="Add a description..."
              className="min-h-[100px] resize-none border-slate-200 focus:border-cyan-300"
            />
          </div>

          <Separator />

          {/* Subtasks */}
          <Collapsible open={subtasksOpen} onOpenChange={setSubtasksOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                {subtasksOpen ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
                <ListTree className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Subtasks
                </span>
                {task.subtaskCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {task.completedSubtaskCount}/{task.subtaskCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddSubtask(true);
                  setSubtasksOpen(true);
                  setTimeout(() => subtaskInputRef.current?.focus(), 0);
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 space-y-1">
              {/* Progress bar */}
              {task.subtaskCount > 0 && (
                <div className="mb-3">
                  <Progress
                    value={task.subtaskCompletionPercent}
                    className="h-1.5"
                  />
                </div>
              )}

              {/* Subtask list */}
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 group"
                >
                  <button
                    onClick={() => handleToggleSubtask(subtask)}
                    className={cn(
                      "flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                      subtask.completed
                        ? "bg-cyan-600 border-cyan-600"
                        : "border-slate-300 hover:border-cyan-500"
                    )}
                  >
                    {subtask.completed && (
                      <Check className="h-2.5 w-2.5 text-white" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      subtask.completed && "line-through text-slate-400"
                    )}
                  >
                    {subtask.subject}
                  </span>
                </div>
              ))}

              {/* Add subtask input */}
              {showAddSubtask && (
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="h-4 w-4 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0" />
                  <Input
                    ref={subtaskInputRef}
                    value={newSubtaskSubject}
                    onChange={(e) => setNewSubtaskSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCreateSubtask();
                      } else if (e.key === "Escape") {
                        setShowAddSubtask(false);
                        setNewSubtaskSubject("");
                      }
                    }}
                    onBlur={() => {
                      if (!newSubtaskSubject.trim()) {
                        setShowAddSubtask(false);
                      }
                    }}
                    placeholder="Subtask name..."
                    className="h-7 border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
                    disabled={creatingSubtask}
                  />
                </div>
              )}

              {/* Empty state */}
              {task.subtaskCount === 0 && !showAddSubtask && (
                <button
                  onClick={() => {
                    setShowAddSubtask(true);
                    setTimeout(() => subtaskInputRef.current?.focus(), 0);
                  }}
                  className="w-full text-left px-2 py-2 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 inline mr-1" />
                  Add a subtask
                </button>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Metadata */}
          <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              {metadataOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Details
              </span>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 space-y-2 text-sm text-slate-500">
              {task.createdBy && (
                <div className="flex justify-between">
                  <span>Created by</span>
                  <span className="text-slate-700">
                    {task.createdBy.firstName} {task.createdBy.lastName}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-slate-700">{formatRelativeDate(task.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span className="text-slate-700">{formatRelativeDate(task.updatedAt)}</span>
              </div>
              {task.completedAt && (
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="text-slate-700">{formatRelativeDate(task.completedAt)}</span>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete task
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{task.subject}" and all its subtasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // For embedded use, just return the content
  if (embedded) {
    return open ? content : null;
  }

  // For standalone use, wrap in Sheet
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] p-0">
        {content}
      </SheetContent>
    </Sheet>
  );
}
