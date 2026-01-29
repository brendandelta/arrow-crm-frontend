"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentSelector } from "./AttachmentSelector";
import { AssigneeSelect } from "./AssigneeSelect";
import { DueDatePicker } from "./DueDatePicker";
import { PrioritySelect } from "./PrioritySelect";
import { StatusSelect } from "./StatusSelect";
import {
  type Task,
  type AttachmentType,
  type TaskStatus,
  type DealOption,
  type ProjectOption,
  type UserOption,
  createTask,
} from "@/lib/tasks-api";

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
  // Pre-fill options
  defaultDealId?: number;
  defaultProjectId?: number;
  deals?: DealOption[];
  projects?: ProjectOption[];
  users?: UserOption[];
  // For polymorphic pattern
  usePolymorphicForProjects?: boolean;
}

export function CreateTaskDialog({
  open,
  onClose,
  onTaskCreated,
  defaultDealId,
  defaultProjectId,
  deals,
  projects,
  users,
  usePolymorphicForProjects = false,
}: CreateTaskDialogProps) {
  const [subject, setSubject] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [creating, setCreating] = useState(false);

  // Attachment
  const [attachment, setAttachment] = useState<{
    type: AttachmentType;
    dealId?: number;
    projectId?: number;
    taskableType?: string;
    taskableId?: number;
  }>({ type: "general" });

  // Optional fields
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [priority, setPriority] = useState(2);
  const [status, setStatus] = useState<TaskStatus>("open");

  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with defaults
  useEffect(() => {
    if (open) {
      setSubject("");
      setShowMore(false);
      setDueAt(null);
      setAssigneeId(null);
      setPriority(2);
      setStatus("open");

      if (defaultDealId) {
        setAttachment({ type: "deal", dealId: defaultDealId });
      } else if (defaultProjectId) {
        if (usePolymorphicForProjects) {
          setAttachment({ type: "project", taskableType: "Project", taskableId: defaultProjectId });
        } else {
          setAttachment({ type: "project", projectId: defaultProjectId });
        }
      } else {
        setAttachment({ type: "general" });
      }

      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, defaultDealId, defaultProjectId, usePolymorphicForProjects]);

  const handleCreate = async () => {
    if (!subject.trim() || creating) return;

    setCreating(true);
    try {
      const newTask = await createTask({
        subject: subject.trim(),
        dueAt: dueAt || undefined,
        priority,
        status,
        assignedToId: assigneeId || undefined,
        dealId: attachment.dealId,
        projectId: attachment.projectId,
        taskableType: attachment.taskableType,
        taskableId: attachment.taskableId,
      });
      onTaskCreated?.(newTask);
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Subject */}
          <div className="space-y-1.5">
            <Input
              ref={inputRef}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="text-base"
              autoFocus
            />
          </div>

          {/* Attachment */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Attach to</label>
            <AttachmentSelector
              value={attachment}
              onChange={setAttachment}
              deals={deals}
              projects={projects}
              usePolymorphicForProjects={usePolymorphicForProjects}
            />
          </div>

          {/* More options toggle */}
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            {showMore ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showMore ? "Less options" : "More options"}
          </button>

          {/* Optional fields */}
          {showMore && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Due date</label>
                  <DueDatePicker
                    value={dueAt}
                    onChange={setDueAt}
                    size="sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Assignee</label>
                  <AssigneeSelect
                    value={assigneeId}
                    onChange={setAssigneeId}
                    users={users}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Priority</label>
                  <PrioritySelect
                    value={priority}
                    onChange={setPriority}
                    size="sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Status</label>
                  <StatusSelect
                    value={status}
                    onChange={setStatus}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!subject.trim() || creating}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Task"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
