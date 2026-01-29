"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  Loader2,
  Trash2,
  CheckSquare,
  Calendar,
  User,
  FileText,
  ListTree,
  Check,
} from "lucide-react";

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
  overdue: boolean;
  assignedTo?: Owner | null;
  parentTaskId?: number | null;
  isSubtask?: boolean;
  dealId?: number;
}

interface TaskSlideOutProps {
  task: Task | null;
  dealId: number;
  existingTasks?: Task[];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: number) => void;
}

const TEAM_MEMBERS = [
  { id: 22, firstName: "Gabe", lastName: "Borden" },
  { id: 23, firstName: "Chris", lastName: "Clifford" },
  { id: 24, firstName: "Brendan", lastName: "Conn" },
];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

// Notion-style input classes: invisible borders until hover/focus
const inputClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-muted hover:border-border focus:bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text";
const selectClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-muted hover:border-border focus:bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-pointer appearance-none";
const textareaClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-muted hover:border-border focus:bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text resize-none min-h-[80px]";

export function TaskSlideOut({
  task,
  dealId,
  existingTasks = [],
  onClose,
  onSave,
  onDelete,
}: TaskSlideOutProps) {
  const isNew = !task;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    subject: task?.subject || "",
    body: task?.body || "",
    dueAt: formatDate(task?.dueAt),
    completed: task?.completed || false,
    assignedToId: task?.assignedTo?.id?.toString() || "",
    isSubtask: task?.isSubtask || false,
    parentTaskId: task?.parentTaskId?.toString() || "",
  });

  useEffect(() => {
    setFormData({
      subject: task?.subject || "",
      body: task?.body || "",
      dueAt: formatDate(task?.dueAt),
      completed: task?.completed || false,
      assignedToId: task?.assignedTo?.id?.toString() || "",
      isSubtask: task?.isSubtask || false,
      parentTaskId: task?.parentTaskId?.toString() || "",
    });
    setShowDeleteConfirm(false);
  }, [task]);

  const handleSave = async () => {
    if (!formData.subject.trim()) return;
    setSaving(true);
    try {
      const payload = {
        task: {
          deal_id: dealId,
          subject: formData.subject,
          body: formData.body || null,
          due_at: formData.dueAt || null,
          completed: formData.completed,
          assigned_to_id: formData.assignedToId ? parseInt(formData.assignedToId) : null,
          parent_task_id: formData.isSubtask && formData.parentTaskId ? parseInt(formData.parentTaskId) : null,
        },
      };

      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        const savedTask: Task = {
          id: updated.id,
          subject: updated.subject,
          body: updated.body,
          dueAt: updated.dueAt,
          completed: updated.completed,
          overdue: updated.overdue,
          assignedTo: updated.assignedTo,
          isSubtask: updated.isSubtask,
          parentTaskId: updated.parentTaskId,
          dealId: updated.dealId,
        };
        onSave(savedTask);
      } else {
        console.error("Failed to save task:", await res.text());
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onDelete(task.id);
        onClose();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeleting(false);
  };

  const parentTaskOptions = existingTasks.filter(
    (t) => !t.isSubtask && (!task || t.id !== task.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-card shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${formData.completed ? "bg-green-100" : "bg-orange-100"}`}>
              <CheckSquare className={`h-5 w-5 ${formData.completed ? "text-green-600" : "text-orange-600"}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {isNew ? "New Task" : "Task"}
              </h2>
              {!isNew && task?.overdue && !formData.completed && (
                <Badge className="bg-red-100 text-red-700 text-xs">Overdue</Badge>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-1">
            {/* Completed toggle */}
            {!isNew && (
              <div className="flex items-center gap-3 pb-4 mb-2">
                <button
                  onClick={() => setFormData({ ...formData, completed: !formData.completed })}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                    formData.completed
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    formData.completed ? "bg-green-500 border-green-500 text-white" : "border-border"
                  }`}>
                    {formData.completed && <Check className="h-3 w-3" />}
                  </div>
                  {formData.completed ? "Completed" : "Mark complete"}
                </button>
              </div>
            )}

            {/* Task Name */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task Name</span>
              </div>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={`${inputClass} font-medium`}
                placeholder="What needs to be done?"
                autoFocus={isNew}
              />
            </div>

            {/* Due Date */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</span>
              </div>
              <input
                type="date"
                value={formData.dueAt}
                onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                className={selectClass}
              />
            </div>

            {/* Assigned To */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned To</span>
              </div>
              <select
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                className={selectClass}
              >
                <option value="">Unassigned</option>
                {TEAM_MEMBERS.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
              {/* Quick assign pills */}
              <div className="flex items-center gap-1.5 mt-2 px-3">
                {TEAM_MEMBERS.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setFormData({ ...formData, assignedToId: member.id.toString() })}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                      formData.assignedToId === member.id.toString()
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {member.firstName}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Type */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <ListTree className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</span>
              </div>
              <div className="flex gap-2 px-3">
                <button
                  onClick={() => setFormData({ ...formData, isSubtask: false, parentTaskId: "" })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    !formData.isSubtask
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  Task
                </button>
                <button
                  onClick={() => setFormData({ ...formData, isSubtask: true })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    formData.isSubtask
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  Sub-task
                </button>
              </div>
              {formData.isSubtask && (
                <div className="mt-2">
                  <select
                    value={formData.parentTaskId}
                    onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Select parent task...</option>
                    {parentTaskOptions.map((t) => (
                      <option key={t.id} value={t.id}>{t.subject}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</span>
              </div>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className={textareaClass}
                placeholder="Add details..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t px-6 py-4 flex items-center justify-between">
          {!isNew && onDelete && (
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm text-muted-foreground hover:bg-muted rounded"
                  >
                    No
                  </button>
                </div>
              )}
            </>
          )}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={handleSave}
                disabled={saving || !formData.subject.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-md disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isNew ? "Create" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
