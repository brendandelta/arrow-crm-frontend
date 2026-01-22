"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Pencil,
  Save,
  Loader2,
  Trash2,
  AlertCircle,
  CheckSquare,
  Calendar,
  User,
  FileText,
  ListTree,
  Clock,
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
  existingTasks?: Task[]; // For subtask parent selection
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: number) => void;
}

// Team members - in a real app these would come from an API
const TEAM_MEMBERS = [
  { id: 1, firstName: "Chris", lastName: "Hartley" },
  { id: 2, firstName: "Gabe", lastName: "Santos" },
  { id: 3, firstName: "Brendan", lastName: "Conn" },
];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

function formatDateDisplay(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function FieldRow({
  label,
  children,
  missing = false,
  icon: Icon,
}: {
  label: string;
  children: React.ReactNode;
  missing?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <label className="text-sm font-medium text-slate-500">{label}</label>
        {missing && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Missing
          </span>
        )}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function TaskSlideOut({
  task,
  dealId,
  existingTasks = [],
  onClose,
  onSave,
  onDelete,
}: TaskSlideOutProps) {
  const isNew = !task;
  const [editing, setEditing] = useState(isNew);
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

  const handleSave = async () => {
    if (!formData.subject.trim()) return;

    setSaving(true);
    try {
      // Use the dedicated tasks API
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
        // Map API response to our Task interface
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
        if (!isNew) setEditing(false);
      } else {
        const errorText = await res.text();
        console.error("Failed to save task:", errorText);
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

  // Filter out current task from parent options
  const parentTaskOptions = existingTasks.filter(
    (t) => !t.isSubtask && (!task || t.id !== task.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${task?.completed ? "bg-green-100" : "bg-orange-100"}`}>
              <CheckSquare className={`h-5 w-5 ${task?.completed ? "text-green-600" : "text-orange-600"}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {isNew ? "Create Task" : task?.subject || "Task Details"}
              </h2>
              {!isNew && task?.overdue && (
                <p className="text-xs text-red-600 font-medium">Overdue</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editing ? (
            <div className="space-y-4">
              {/* Task Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Task Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, isSubtask: false, parentTaskId: "" })}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded border transition-colors ${
                      !formData.isSubtask
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    Task
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, isSubtask: true })}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded border transition-colors ${
                      formData.isSubtask
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <ListTree className="h-4 w-4" />
                    Sub-task
                  </button>
                </div>
              </div>

              {/* Parent Task (for subtasks) */}
              {formData.isSubtask && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Parent Task</label>
                  <select
                    value={formData.parentTaskId}
                    onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="">Select parent task...</option>
                    {parentTaskOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.subject}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>

              {/* Due Date & Assignee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Assign To</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="">Unassigned</option>
                    {TEAM_MEMBERS.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Assign Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Quick assign:</span>
                {TEAM_MEMBERS.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setFormData({ ...formData, assignedToId: member.id.toString() })}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      formData.assignedToId === member.id.toString()
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {member.firstName}
                  </button>
                ))}
              </div>

              {/* Completed Toggle */}
              {!isNew && (
                <div className="pt-4 border-t">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        formData.completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                      onClick={() => setFormData({ ...formData, completed: !formData.completed })}
                    >
                      {formData.completed && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <span className="text-sm font-medium text-slate-700">Mark as completed</span>
                  </label>
                </div>
              )}

              {/* Description */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-slate-500 mb-1">Description</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[100px]"
                  placeholder="Add more details about this task..."
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-1">
              {/* Status Badge */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b">
                <Badge
                  className={
                    task?.completed
                      ? "bg-green-100 text-green-700"
                      : task?.overdue
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                  }
                >
                  {task?.completed ? "Completed" : task?.overdue ? "Overdue" : "Open"}
                </Badge>
                {task?.isSubtask && (
                  <Badge variant="outline">
                    <ListTree className="h-3 w-3 mr-1" />
                    Sub-task
                  </Badge>
                )}
              </div>

              {/* Subject */}
              <FieldRow label="Task" icon={CheckSquare}>
                <span className={`font-medium ${task?.completed ? "line-through text-muted-foreground" : ""}`}>
                  {task?.subject}
                </span>
              </FieldRow>

              {/* Due Date */}
              <FieldRow label="Due Date" missing={!task?.dueAt} icon={Calendar}>
                {task?.dueAt ? (
                  <span className={task?.overdue ? "text-red-600 font-medium" : ""}>
                    {formatDateDisplay(task.dueAt)}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">No due date</span>
                )}
              </FieldRow>

              {/* Assigned To */}
              <FieldRow label="Assigned To" missing={!task?.assignedTo} icon={User}>
                {task?.assignedTo ? (
                  <span className="font-medium">
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Unassigned</span>
                )}
              </FieldRow>

              {/* Description */}
              <FieldRow label="Description" missing={!task?.body} icon={FileText}>
                {task?.body ? (
                  <p className="whitespace-pre-wrap">{task.body}</p>
                ) : (
                  <span className="text-muted-foreground italic">No description</span>
                )}
              </FieldRow>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          {!isNew && onDelete && !editing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Delete this task?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
            </div>
          )}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3 ml-auto">
              {editing && !isNew && (
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
              )}
              {editing ? (
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.subject.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isNew ? "Create Task" : "Save Changes"}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
