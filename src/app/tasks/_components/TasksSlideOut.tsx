"use client";

import { useState, useEffect, useRef } from "react";
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
  Check,
  Building2,
  FolderKanban,
  Plus,
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

interface Deal {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

interface TasksSlideOutProps {
  task: Task | null;
  users: User[];
  existingTasks?: Task[];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: number) => void;
}

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
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
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

function InlineSubtaskForm({
  parentTaskId,
  onSave,
  onCancel,
}: {
  parentTaskId: number;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState("");

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
            parent_task_id: parentTaskId,
            priority: 2,
          },
        }),
      });

      if (res.ok) {
        setSubject("");
        onSave();
        // Keep form open for rapid entry - focus again
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch (err) {
      console.error("Failed to create subtask:", err);
    }
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2 bg-muted rounded-md p-2">
      <div className="w-4 h-4 rounded border border-border flex items-center justify-center">
        <Plus className="h-2.5 w-2.5 text-muted-foreground" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a subtask..."
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        disabled={saving}
      />
      {subject.trim() && (
        <button
          type="submit"
          disabled={saving}
          className="px-2 py-1 text-xs font-medium text-background bg-muted-foreground hover:bg-foreground/90 rounded disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="p-1 text-muted-foreground hover:text-muted-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

export function TasksSlideOut({
  task,
  users,
  existingTasks = [],
  onClose,
  onSave,
  onDelete,
}: TasksSlideOutProps) {
  const isNew = !task;
  const [editing, setEditing] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [togglingSubtaskId, setTogglingSubtaskId] = useState<number | null>(null);
  const [localSubtasks, setLocalSubtasks] = useState<Task[]>(task?.subtasks || []);

  const [formData, setFormData] = useState({
    subject: task?.subject || "",
    body: task?.body || "",
    dueAt: formatDate(task?.dueAt),
    completed: task?.completed || false,
    assignedToId: task?.assignedTo?.id?.toString() || "",
    isSubtask: task?.isSubtask || false,
    parentTaskId: task?.parentTaskId?.toString() || "",
    priority: task?.priority?.toString() || "2",
    status: task?.status || "open",
    attachmentType: task?.attachmentType || "general",
    dealId: task?.dealId?.toString() || "",
    projectId: task?.projectId?.toString() || "",
  });

  // Fetch deals and projects for dropdown
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, projectsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals`),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects`),
        ]);
        const dealsData = await dealsRes.json();
        const projectsData = await projectsRes.json();
        setDeals(Array.isArray(dealsData) ? dealsData : []);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (err) {
        console.error("Failed to fetch deals/projects:", err);
      }
    };
    fetchData();
  }, []);

  // Reset form when task changes
  useEffect(() => {
    setFormData({
      subject: task?.subject || "",
      body: task?.body || "",
      dueAt: formatDate(task?.dueAt),
      completed: task?.completed || false,
      assignedToId: task?.assignedTo?.id?.toString() || "",
      isSubtask: task?.isSubtask || false,
      parentTaskId: task?.parentTaskId?.toString() || "",
      priority: task?.priority?.toString() || "2",
      status: task?.status || "open",
      attachmentType: task?.attachmentType || "general",
      dealId: task?.dealId?.toString() || "",
      projectId: task?.projectId?.toString() || "",
    });
    setEditing(!task);
    setShowDeleteConfirm(false);
    setShowSubtaskForm(false);
    setLocalSubtasks(task?.subtasks || []);
  }, [task]);

  const handleToggleSubtask = async (subtask: Task) => {
    const endpoint = subtask.completed ? "uncomplete" : "complete";
    setTogglingSubtaskId(subtask.id);

    // Optimistic update
    setLocalSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtask.id ? { ...st, completed: !st.completed } : st
      )
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${subtask.id}/${endpoint}`,
        { method: "POST" }
      );
      if (!res.ok) {
        // Revert on failure
        setLocalSubtasks((prev) =>
          prev.map((st) =>
            st.id === subtask.id ? { ...st, completed: subtask.completed } : st
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
      // Revert on error
      setLocalSubtasks((prev) =>
        prev.map((st) =>
          st.id === subtask.id ? { ...st, completed: subtask.completed } : st
        )
      );
    }
    setTogglingSubtaskId(null);
  };

  const handleSubtaskCreated = async () => {
    // Refresh task to get updated subtasks
    if (task) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}`
        );
        if (res.ok) {
          const updated = await res.json();
          setLocalSubtasks(updated.subtasks || []);
        }
      } catch (err) {
        console.error("Failed to refresh subtasks:", err);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.subject.trim()) return;

    setSaving(true);
    try {
      const payload = {
        task: {
          subject: formData.subject,
          body: formData.body || null,
          due_at: formData.dueAt || null,
          completed: formData.completed,
          assigned_to_id: formData.assignedToId ? parseInt(formData.assignedToId) : null,
          parent_task_id:
            formData.isSubtask && formData.parentTaskId
              ? parseInt(formData.parentTaskId)
              : null,
          priority: parseInt(formData.priority),
          status: formData.status,
          deal_id: formData.attachmentType === "deal" && formData.dealId ? parseInt(formData.dealId) : null,
          project_id: formData.attachmentType === "project" && formData.projectId ? parseInt(formData.projectId) : null,
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
        onSave(updated);
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
      <div className="relative w-full max-w-xl bg-card shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                task?.completed ? "bg-green-100" : "bg-orange-100"
              }`}
            >
              <CheckSquare
                className={`h-5 w-5 ${
                  task?.completed ? "text-green-600" : "text-orange-600"
                }`}
              />
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
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-muted rounded">
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
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Task Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFormData({ ...formData, isSubtask: false, parentTaskId: "" })
                    }
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded border transition-colors ${
                      !formData.isSubtask
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    Task
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, isSubtask: true })}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded border transition-colors ${
                      formData.isSubtask
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
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
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Parent Task
                  </label>
                  <select
                    value={formData.parentTaskId}
                    onChange={(e) =>
                      setFormData({ ...formData, parentTaskId: e.target.value })
                    }
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

              {/* Attachment Type */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Attach To
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        attachmentType: "general",
                        dealId: "",
                        projectId: "",
                      })
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors ${
                      formData.attachmentType === "general"
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    Get Shit Done
                  </button>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        attachmentType: "deal",
                        projectId: "",
                      })
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors ${
                      formData.attachmentType === "deal"
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    Deal
                  </button>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        attachmentType: "project",
                        dealId: "",
                      })
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors ${
                      formData.attachmentType === "project"
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <FolderKanban className="h-4 w-4" />
                    Project
                  </button>
                </div>

                {/* Deal Selector */}
                {formData.attachmentType === "deal" && (
                  <select
                    value={formData.dealId}
                    onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="">Select deal...</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Project Selector */}
                {formData.attachmentType === "project" && (
                  <select
                    value={formData.projectId}
                    onChange={(e) =>
                      setFormData({ ...formData, projectId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="">Select project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subject */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>

              {/* Due Date & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="3">High</option>
                    <option value="2">Medium</option>
                    <option value="1">Low</option>
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Assign To
                </label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedToId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Assign Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Quick assign:</span>
                {users.slice(0, 5).map((user) => (
                  <button
                    key={user.id}
                    onClick={() =>
                      setFormData({ ...formData, assignedToId: user.id.toString() })
                    }
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      formData.assignedToId === user.id.toString()
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {user.firstName}
                  </button>
                ))}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="waiting">Waiting</option>
                </select>
              </div>

              {/* Completed Toggle */}
              {!isNew && (
                <div className="pt-4 border-t">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        formData.completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border hover:border-muted-foreground"
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, completed: !formData.completed })
                      }
                    >
                      {formData.completed && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Mark as completed
                    </span>
                  </label>
                </div>
              )}

              {/* Description */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Description
                </label>
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
              {/* Status Badges */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b flex-wrap">
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
                {task?.priority === 3 && (
                  <Badge className="bg-red-100 text-red-700">High Priority</Badge>
                )}
                {task?.attachmentType !== "general" && (
                  <Badge variant="outline">
                    {task?.attachmentType === "deal" ? (
                      <Building2 className="h-3 w-3 mr-1" />
                    ) : (
                      <FolderKanban className="h-3 w-3 mr-1" />
                    )}
                    {task?.attachmentName}
                  </Badge>
                )}
              </div>

              {/* Subject */}
              <FieldRow label="Task" icon={CheckSquare}>
                <span
                  className={`font-medium ${
                    task?.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
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

              {/* Subtasks - always show for non-subtasks so user can add */}
              {task && !task.isSubtask && (
                <FieldRow label="Subtasks" icon={ListTree}>
                  <div className="space-y-2">
                    {localSubtasks.length > 0 && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{
                                width: `${
                                  localSubtasks.length > 0
                                    ? (localSubtasks.filter((st) => st.completed).length /
                                        localSubtasks.length) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {localSubtasks.filter((st) => st.completed).length}/{localSubtasks.length}
                          </span>
                        </div>
                        <div className="space-y-1 mt-2">
                          {localSubtasks.map((st) => (
                            <div
                              key={st.id}
                              className="group flex items-center gap-2 text-sm py-1.5 px-2 -mx-2 rounded hover:bg-muted transition-colors"
                            >
                              <button
                                onClick={() => handleToggleSubtask(st)}
                                disabled={togglingSubtaskId === st.id}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                  st.completed
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-border hover:border-green-400 hover:bg-green-50 group-hover:border-green-400"
                                } ${togglingSubtaskId === st.id ? "opacity-50" : ""}`}
                              >
                                {togglingSubtaskId === st.id ? (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                ) : st.completed ? (
                                  <Check className="h-2.5 w-2.5" />
                                ) : (
                                  <Check className="h-2.5 w-2.5 opacity-0 group-hover:opacity-30 text-green-500" />
                                )}
                              </button>
                              <span
                                className={`flex-1 ${
                                  st.completed ? "line-through text-muted-foreground" : ""
                                }`}
                              >
                                {st.subject}
                              </span>
                              {st.dueAt && (
                                <span
                                  className={`text-xs ${
                                    st.overdue ? "text-red-600" : "text-muted-foreground"
                                  }`}
                                >
                                  {formatDateDisplay(st.dueAt)?.split(",")[0]}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Inline subtask form */}
                    {showSubtaskForm ? (
                      <InlineSubtaskForm
                        parentTaskId={task.id}
                        onSave={handleSubtaskCreated}
                        onCancel={() => setShowSubtaskForm(false)}
                      />
                    ) : (
                      <button
                        onClick={() => setShowSubtaskForm(true)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add subtask
                      </button>
                    )}
                  </div>
                </FieldRow>
              )}

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
        <div className="sticky bottom-0 bg-card border-t px-6 py-4 flex items-center justify-between">
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
                className="px-3 py-1 text-sm text-muted-foreground hover:bg-muted rounded"
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
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                >
                  Cancel
                </button>
              )}
              {editing ? (
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.subject.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-md disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isNew ? "Create Task" : "Save Changes"}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
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
