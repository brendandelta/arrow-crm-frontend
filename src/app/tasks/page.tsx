"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  User,
  Inbox,
  CheckCircle,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Building2,
  FolderKanban,
  Calendar,
  ListFilter,
  Check,
  Loader2,
  UserPlus,
  FileText,
  X,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TasksSlideOut } from "./_components/TasksSlideOut";
import { useAuth } from "@/contexts/AuthContext";

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

interface BackendUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

interface TaskStats {
  total: number;
  open: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueSoon: number;
  unassigned: number;
  byAttachment: {
    deal: number;
    project: number;
    general: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byStatus: {
    open: number;
    inProgress: number;
    blocked: number;
    waiting: number;
  };
}

type ViewType = "my" | "all" | "overdue" | "due-soon" | "unassigned" | "completed";
type AttachmentFilter = "all" | "deal" | "project" | "general";
type GroupBy = "dueDate" | "priority" | "assignee" | "type" | "none";
type SortBy = "priority" | "dueDate" | "created" | "alpha";

interface ViewConfig {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  countKey?: keyof TaskStats | string;
  color?: string;
}

const VIEWS: ViewConfig[] = [
  { id: "my", label: "My Tasks", icon: User },
  { id: "all", label: "All Open", icon: Inbox, countKey: "open" },
  { id: "overdue", label: "Overdue", icon: AlertCircle, countKey: "overdue", color: "text-red-600" },
  { id: "due-soon", label: "Due Soon", icon: Clock, countKey: "dueSoon", color: "text-amber-600" },
  { id: "unassigned", label: "Unassigned", icon: User, countKey: "unassigned" },
  { id: "completed", label: "Completed", icon: CheckCircle, countKey: "completed" },
];

const ATTACHMENT_FILTERS: { id: AttachmentFilter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: ListFilter },
  { id: "deal", label: "Deal Tasks", icon: Building2 },
  { id: "project", label: "Project Tasks", icon: FolderKanban },
  { id: "general", label: "General", icon: CheckSquare },
];

const GROUP_BY_OPTIONS: { id: GroupBy; label: string }[] = [
  { id: "dueDate", label: "Due Date" },
  { id: "priority", label: "Priority" },
  { id: "assignee", label: "Assignee" },
  { id: "type", label: "Type" },
  { id: "none", label: "None" },
];

const SORT_BY_OPTIONS: { id: SortBy; label: string }[] = [
  { id: "priority", label: "Priority" },
  { id: "dueDate", label: "Due Date" },
  { id: "created", label: "Created" },
  { id: "alpha", label: "Alphabetical" },
];

const PRIORITY_OPTIONS = [
  { value: 3, label: "High", dotColor: "bg-red-500" },
  { value: 2, label: "Medium", dotColor: "bg-amber-500" },
  { value: 1, label: "Low", dotColor: "bg-slate-400" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-700" },
  { value: "in_progress", label: "In Progress", color: "bg-purple-100 text-purple-700" },
  { value: "blocked", label: "Blocked", color: "bg-red-100 text-red-700" },
  { value: "waiting", label: "Waiting", color: "bg-amber-100 text-amber-700" },
];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function SubtaskRow({
  subtask,
  users,
  onToggle,
  onAssigneeChange,
  onDateChange,
  onClick,
  isToggling,
  onRefresh,
}: {
  subtask: Task;
  users: BackendUser[];
  onToggle: () => void;
  onAssigneeChange: (userId: number | null) => void;
  onDateChange: (date: string) => void;
  onClick: () => void;
  isToggling: boolean;
  onRefresh: () => void;
}) {
  const [editingSubject, setEditingSubject] = useState(false);
  const [editedSubject, setEditedSubject] = useState(subtask.subject);
  const [editingDate, setEditingDate] = useState(false);
  const [datePosition, setDatePosition] = useState({ top: 0, left: 0 });
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editingSubject && subjectInputRef.current) {
      subjectInputRef.current.focus();
      subjectInputRef.current.select();
    }
  }, [editingSubject]);

  const handleSubjectSave = async () => {
    if (editedSubject.trim() && editedSubject !== subtask.subject) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${subtask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: { subject: editedSubject.trim() } }),
        });
        onRefresh();
      } catch (err) {
        console.error("Failed to update subtask:", err);
        setEditedSubject(subtask.subject);
      }
    } else {
      setEditedSubject(subtask.subject);
    }
    setEditingSubject(false);
  };

  return (
    <div className="group flex items-center gap-2 pl-12 pr-4 py-2 hover:bg-slate-100 border-b border-slate-100 last:border-b-0">
      {/* Subtask checkbox */}
      <button
        onClick={onToggle}
        disabled={isToggling}
        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
          subtask.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-slate-300 hover:border-green-400 hover:bg-green-50 group-hover:border-green-400"
        } ${isToggling ? "opacity-50" : ""}`}
      >
        {isToggling ? (
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
        ) : subtask.completed ? (
          <Check className="h-2.5 w-2.5" />
        ) : (
          <Check className="h-2.5 w-2.5 opacity-0 group-hover:opacity-30 text-green-500" />
        )}
      </button>

      {/* Editable subject */}
      {editingSubject ? (
        <input
          ref={subjectInputRef}
          type="text"
          value={editedSubject}
          onChange={(e) => setEditedSubject(e.target.value)}
          onBlur={handleSubjectSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubjectSave();
            if (e.key === "Escape") {
              setEditedSubject(subtask.subject);
              setEditingSubject(false);
            }
          }}
          className="flex-1 text-sm bg-white border border-blue-400 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-blue-200"
        />
      ) : (
        <span
          onClick={() => {
            setEditingSubject(true);
            setEditedSubject(subtask.subject);
          }}
          className={`flex-1 text-sm cursor-text hover:bg-blue-50 hover:text-blue-700 px-1 -mx-1 rounded transition-colors ${
            subtask.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {subtask.subject}
        </span>
      )}

      {/* Subtask assignee */}
      <select
        value={subtask.assignedTo?.id || ""}
        onChange={(e) => onAssigneeChange(e.target.value ? parseInt(e.target.value) : null)}
        onClick={(e) => e.stopPropagation()}
        className="text-xs bg-transparent border-0 text-slate-500 hover:text-slate-700 cursor-pointer focus:ring-0 py-0 pr-6 pl-1 hover:bg-slate-200 rounded"
      >
        <option value="">Unassigned</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.firstName}
          </option>
        ))}
      </select>

      {/* Subtask due date */}
      <div className="relative">
        <button
          ref={dateButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            if (!editingDate && dateButtonRef.current) {
              const rect = dateButtonRef.current.getBoundingClientRect();
              setDatePosition({
                top: rect.bottom + 4,
                left: rect.left - 100,
              });
            }
            setEditingDate(!editingDate);
          }}
          className={`text-xs w-16 text-right hover:bg-blue-50 px-1 rounded transition-colors ${
            subtask.overdue ? "text-red-600" : subtask.dueAt ? "text-muted-foreground" : "text-slate-400"
          }`}
        >
          {subtask.dueAt ? formatDate(subtask.dueAt) : (
            <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 justify-end">
              <Calendar className="h-3 w-3" />
            </span>
          )}
        </button>
        {editingDate && (
          <div
            className="fixed z-50 bg-white border rounded-lg shadow-lg p-2"
            style={{ top: datePosition.top, left: datePosition.left }}
          >
            <input
              type="date"
              value={subtask.dueAt?.split("T")[0] || ""}
              onChange={(e) => {
                onDateChange(e.target.value);
                setEditingDate(false);
              }}
              onBlur={() => setTimeout(() => setEditingDate(false), 150)}
              className="text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
            <div className="flex gap-1 mt-1.5">
              <button
                onClick={() => {
                  onDateChange(new Date().toISOString().split("T")[0]);
                  setEditingDate(false);
                }}
                className="px-1.5 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 rounded"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  onDateChange(tomorrow.toISOString().split("T")[0]);
                  setEditingDate(false);
                }}
                className="px-1.5 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 rounded"
              >
                Tmrw
              </button>
              {subtask.dueAt && (
                <button
                  onClick={() => {
                    onDateChange("");
                    setEditingDate(false);
                  }}
                  className="px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Open detail */}
      <button
        onClick={onClick}
        className="p-0.5 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function TaskRow({
  task,
  users,
  onToggleComplete,
  onClick,
  onAssigneeChange,
  onRefresh,
  showAttachment = true,
}: {
  task: Task;
  users: BackendUser[];
  onToggleComplete: (task: Task) => void;
  onClick: (task: Task) => void;
  onAssigneeChange: (taskId: number, userId: number | null) => void;
  onRefresh: () => void;
  showAttachment?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localSubtasks, setLocalSubtasks] = useState<Task[]>(task.subtasks || []);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Inline editing states
  const [editingSubject, setEditingSubject] = useState(false);
  const [editedSubject, setEditedSubject] = useState(task.subject);
  const [editingDate, setEditingDate] = useState(false);
  const [editedDate, setEditedDate] = useState(task.dueAt?.split("T")[0] || "");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task.body || "");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [priorityPosition, setPriorityPosition] = useState({ top: 0, left: 0 });
  const [datePosition, setDatePosition] = useState({ top: 0, left: 0 });
  const [statusPosition, setStatusPosition] = useState({ top: 0, left: 0 });
  const [descriptionPosition, setDescriptionPosition] = useState({ top: 0, left: 0 });

  const assigneeButtonRef = useRef<HTMLButtonElement>(null);
  const priorityButtonRef = useRef<HTMLButtonElement>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const descriptionButtonRef = useRef<HTMLButtonElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskSubject, setNewSubtaskSubject] = useState("");
  const [savingSubtask, setSavingSubtask] = useState(false);

  const priorityColors: Record<number, string> = {
    3: "bg-red-100 text-red-700 hover:bg-red-200",
    2: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    1: "bg-slate-100 text-slate-600 hover:bg-slate-200",
  };

  const priorityOptions = [
    { value: 3, label: "High", color: "text-red-600" },
    { value: 2, label: "Medium", color: "text-amber-600" },
    { value: 1, label: "Low", color: "text-slate-500" },
  ];

  const statusOptions = [
    { value: "open", label: "Open", color: "bg-blue-100 text-blue-700" },
    { value: "in_progress", label: "In Progress", color: "bg-purple-100 text-purple-700" },
    { value: "blocked", label: "Blocked", color: "bg-red-100 text-red-700" },
    { value: "waiting", label: "Waiting", color: "bg-amber-100 text-amber-700" },
  ];

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || "bg-slate-100 text-slate-600";
  };

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingSubject && subjectInputRef.current) {
      subjectInputRef.current.focus();
      subjectInputRef.current.select();
    }
  }, [editingSubject]);

  useEffect(() => {
    if (editingDate && dateInputRef.current) {
      dateInputRef.current.showPicker?.();
    }
  }, [editingDate]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!showAssigneeDropdown && !showPriorityDropdown && !showStatusDropdown && !editingDescription) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (showAssigneeDropdown && assigneeButtonRef.current && !assigneeButtonRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (showPriorityDropdown && priorityButtonRef.current && !priorityButtonRef.current.contains(e.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (showStatusDropdown && statusButtonRef.current && !statusButtonRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showAssigneeDropdown, showPriorityDropdown, showStatusDropdown, editingDescription]);

  // Focus description when editing
  useEffect(() => {
    if (editingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [editingDescription]);

  const handleAssigneeButtonClick = () => {
    if (!showAssigneeDropdown && assigneeButtonRef.current) {
      const rect = assigneeButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - 192),
      });
    }
    setShowAssigneeDropdown(!showAssigneeDropdown);
    setShowPriorityDropdown(false);
  };

  const handlePriorityButtonClick = () => {
    if (!showPriorityDropdown && priorityButtonRef.current) {
      const rect = priorityButtonRef.current.getBoundingClientRect();
      setPriorityPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left),
      });
    }
    setShowPriorityDropdown(!showPriorityDropdown);
    setShowAssigneeDropdown(false);
    setShowStatusDropdown(false);
  };

  const handleStatusButtonClick = () => {
    if (!showStatusDropdown && statusButtonRef.current) {
      const rect = statusButtonRef.current.getBoundingClientRect();
      setStatusPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left),
      });
    }
    setShowStatusDropdown(!showStatusDropdown);
    setShowAssigneeDropdown(false);
    setShowPriorityDropdown(false);
  };

  const handleDescriptionButtonClick = () => {
    if (!editingDescription && descriptionButtonRef.current) {
      const rect = descriptionButtonRef.current.getBoundingClientRect();
      setDescriptionPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left - 150),
      });
    }
    setEditedDescription(task.body || "");
    setEditingDescription(!editingDescription);
  };

  const handleStatusChange = (status: string) => {
    updateTask({ status });
    setShowStatusDropdown(false);
  };

  const handleDescriptionSave = () => {
    if (editedDescription !== (task.body || "")) {
      updateTask({ body: editedDescription || null });
    }
    setEditingDescription(false);
  };

  const updateTask = async (updates: Record<string, unknown>) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: updates }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleSubjectSave = () => {
    if (editedSubject.trim() && editedSubject !== task.subject) {
      updateTask({ subject: editedSubject.trim() });
    } else {
      setEditedSubject(task.subject);
    }
    setEditingSubject(false);
  };

  const handleDateSave = (newDate: string) => {
    updateTask({ due_at: newDate || null });
    setEditingDate(false);
  };

  const handlePriorityChange = (priority: number) => {
    updateTask({ priority });
    setShowPriorityDropdown(false);
  };

  // Fetch subtasks when expanded
  useEffect(() => {
    if (expanded && task.subtaskCount > 0 && localSubtasks.length === 0) {
      fetchSubtasks();
    }
  }, [expanded]);

  const fetchSubtasks = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setLocalSubtasks(data.subtasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch subtasks:", err);
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    const endpoint = subtask.completed ? "uncomplete" : "complete";
    setTogglingId(subtask.id);

    // Optimistic update - subtask stays in place with checkmark shown
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
      setLocalSubtasks((prev) =>
        prev.map((st) =>
          st.id === subtask.id ? { ...st, completed: subtask.completed } : st
        )
      );
    }
    setTogglingId(null);
  };

  const handleSubtaskAssigneeChange = async (subtaskId: number, userId: number | null) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${subtaskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: { assigned_to_id: userId } }),
        }
      );
      setLocalSubtasks((prev) =>
        prev.map((st) =>
          st.id === subtaskId
            ? {
                ...st,
                assignedTo: userId
                  ? users.find((u) => u.id === userId)
                    ? {
                        id: userId,
                        firstName: users.find((u) => u.id === userId)!.firstName,
                        lastName: users.find((u) => u.id === userId)!.lastName,
                      }
                    : null
                  : null,
              }
            : st
        )
      );
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  };

  const handleSubtaskDateChange = async (subtaskId: number, newDate: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: { due_at: newDate || null } }),
      });
      setLocalSubtasks((prev) =>
        prev.map((st) =>
          st.id === subtaskId ? { ...st, dueAt: newDate || null } : st
        )
      );
    } catch (err) {
      console.error("Failed to update subtask date:", err);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskSubject.trim()) return;
    setSavingSubtask(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            subject: newSubtaskSubject.trim(),
            parent_task_id: task.id,
            priority: 2,
          },
        }),
      });

      if (res.ok) {
        const newSubtask = await res.json();
        setLocalSubtasks((prev) => [...prev, newSubtask]);
        setNewSubtaskSubject("");
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
    setSavingSubtask(false);
  };

  const completedSubtaskCount = localSubtasks.filter((st) => st.completed).length;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Main Task Row */}
      <div className="group flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50">
        {/* Expand Arrow */}
        {task.subtaskCount > 0 ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(task)}
          className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-slate-300 hover:border-green-400 hover:bg-green-50 group-hover:border-green-400"
          }`}
        >
          {task.completed ? (
            <Check className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3 opacity-0 group-hover:opacity-30 text-green-500" />
          )}
        </button>

        {/* Editable Subject */}
        <div className="flex-1 min-w-0">
          {editingSubject ? (
            <input
              ref={subjectInputRef}
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              onBlur={handleSubjectSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubjectSave();
                if (e.key === "Escape") {
                  setEditedSubject(task.subject);
                  setEditingSubject(false);
                }
              }}
              className="w-full font-medium text-sm bg-white border border-blue-400 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
            />
          ) : (
            <div
              onClick={() => {
                setEditingSubject(true);
                setEditedSubject(task.subject);
              }}
              className="cursor-text"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`font-medium text-sm hover:bg-blue-50 hover:text-blue-700 px-1 -mx-1 rounded transition-colors ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.subject}
                </span>
                {task.subtaskCount > 0 && (
                  <span className="text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                    {completedSubtaskCount}/{task.subtaskCount}
                  </span>
                )}
              </div>
              {showAttachment && task.attachmentName && (
                <a
                  href={
                    task.attachmentType === "deal" && task.dealId
                      ? `/deals/${task.dealId}`
                      : task.attachmentType === "project" && task.projectId
                      ? `/projects/${task.projectId}`
                      : undefined
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                >
                  {task.attachmentType === "deal" ? (
                    <Building2 className="h-3 w-3" />
                  ) : task.attachmentType === "project" ? (
                    <FolderKanban className="h-3 w-3" />
                  ) : null}
                  {task.attachmentName}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Inline Assignee */}
        <div>
          <button
            ref={assigneeButtonRef}
            onClick={handleAssigneeButtonClick}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
              task.assignedTo
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            }`}
          >
            {task.assignedTo ? (
              <>
                <User className="h-3 w-3" />
                {task.assignedTo.firstName}
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3" />
                <span className="hidden group-hover:inline">Assign</span>
              </>
            )}
          </button>
          {showAssigneeDropdown && (
            <div
              className="fixed w-48 bg-white border rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto"
              style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
            >
              <button
                onClick={() => {
                  onAssigneeChange(task.id, null);
                  setShowAssigneeDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 text-slate-500"
              >
                Unassigned
              </button>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onAssigneeChange(task.id, user.id);
                    setShowAssigneeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    task.assignedTo?.id === user.id ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  {user.firstName} {user.lastName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Inline Priority */}
        <div>
          <button
            ref={priorityButtonRef}
            onClick={handlePriorityButtonClick}
            className={`px-2 py-1 text-xs rounded-full transition-colors cursor-pointer ${
              priorityColors[task.priority] || priorityColors[2]
            }`}
          >
            {task.priorityLabel || "Medium"}
          </button>
          {showPriorityDropdown && (
            <div
              className="fixed w-32 bg-white border rounded-lg shadow-lg z-50 py-1"
              style={{ top: priorityPosition.top, left: priorityPosition.left }}
            >
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePriorityChange(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                    task.priority === option.value ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    option.value === 3 ? "bg-red-500" : option.value === 2 ? "bg-amber-500" : "bg-slate-400"
                  }`} />
                  <span className={option.color}>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Inline Status */}
        <div>
          <button
            ref={statusButtonRef}
            onClick={handleStatusButtonClick}
            className={`px-2 py-1 text-xs rounded-full transition-colors cursor-pointer ${getStatusColor(task.status)}`}
          >
            {getStatusLabel(task.status)}
          </button>
          {showStatusDropdown && (
            <div
              className="fixed w-36 bg-white border rounded-lg shadow-lg z-50 py-1"
              style={{ top: statusPosition.top, left: statusPosition.left }}
            >
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                    task.status === option.value ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-xs ${option.color}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Inline Description */}
        <div>
          <button
            ref={descriptionButtonRef}
            onClick={handleDescriptionButtonClick}
            className={`p-1 rounded transition-colors ${
              task.body
                ? "text-slate-500 hover:bg-slate-100"
                : "text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100"
            }`}
            title={task.body || "Add description"}
          >
            <FileText className="h-4 w-4" />
          </button>
          {editingDescription && (
            <div
              className="fixed z-50 bg-white border rounded-lg shadow-lg p-3 w-80"
              style={{ top: descriptionPosition.top, left: descriptionPosition.left }}
            >
              <textarea
                ref={descriptionInputRef}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setEditedDescription(task.body || "");
                    setEditingDescription(false);
                  }
                  if (e.key === "Enter" && e.metaKey) {
                    handleDescriptionSave();
                  }
                }}
                placeholder="Add a description..."
                className="w-full text-sm border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 min-h-[80px] resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-slate-400">⌘+Enter to save</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditedDescription(task.body || "");
                      setEditingDescription(false);
                    }}
                    className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDescriptionSave}
                    className="px-2 py-1 text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Inline Due Date */}
        <div className="flex-shrink-0 w-24 relative">
          <button
            ref={dateButtonRef}
            onClick={() => {
              if (!editingDate && dateButtonRef.current) {
                const rect = dateButtonRef.current.getBoundingClientRect();
                setDatePosition({
                  top: rect.bottom + 4,
                  left: rect.left,
                });
              }
              setEditedDate(task.dueAt?.split("T")[0] || "");
              setEditingDate(!editingDate);
            }}
            className={`w-full text-left text-sm px-2 py-1 rounded transition-colors hover:bg-blue-50 ${
              task.overdue
                ? "text-red-600 font-medium"
                : task.dueToday
                ? "text-amber-600 font-medium"
                : task.dueAt
                ? "text-muted-foreground"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {task.dueAt ? formatDate(task.dueAt) : (
              <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">Add</span>
              </span>
            )}
          </button>
          {editingDate && (
            <div
              className="fixed z-50 bg-white border rounded-lg shadow-lg p-3"
              style={{ top: datePosition.top, left: datePosition.left }}
            >
              <input
                ref={dateInputRef}
                type="date"
                value={editedDate}
                onChange={(e) => {
                  setEditedDate(e.target.value);
                  handleDateSave(e.target.value);
                }}
                onBlur={() => setTimeout(() => setEditingDate(false), 150)}
                className="text-sm border border-slate-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                autoFocus
              />
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    setEditedDate(today);
                    handleDateSave(today);
                  }}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const date = tomorrow.toISOString().split("T")[0];
                    setEditedDate(date);
                    handleDateSave(date);
                  }}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    const date = nextWeek.toISOString().split("T")[0];
                    setEditedDate(date);
                    handleDateSave(date);
                  }}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Next week
                </button>
                {task.dueAt && (
                  <button
                    onClick={() => {
                      handleDateSave("");
                    }}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Open detail button */}
        <button
          onClick={() => onClick(task)}
          className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Open details"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded Subtasks */}
      {expanded && (
        <div className="bg-slate-50 border-t border-slate-100">
          {localSubtasks.map((subtask) => (
            <SubtaskRow
              key={subtask.id}
              subtask={subtask}
              users={users}
              onToggle={() => handleToggleSubtask(subtask)}
              onAssigneeChange={(userId) => handleSubtaskAssigneeChange(subtask.id, userId)}
              onDateChange={(date) => handleSubtaskDateChange(subtask.id, date)}
              onClick={() => onClick(subtask)}
              isToggling={togglingId === subtask.id}
              onRefresh={onRefresh}
            />
          ))}

          {/* Add subtask form */}
          {addingSubtask ? (
            <div className="flex items-center gap-2 pl-12 pr-4 py-2 bg-white border-t border-slate-200">
              <div className="w-4 h-4 rounded border-2 border-slate-300 flex items-center justify-center">
                <Plus className="h-2.5 w-2.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={newSubtaskSubject}
                onChange={(e) => setNewSubtaskSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubtask();
                  if (e.key === "Escape") {
                    setAddingSubtask(false);
                    setNewSubtaskSubject("");
                  }
                }}
                placeholder="Add a subtask..."
                className="flex-1 text-sm bg-transparent outline-none"
                autoFocus
                disabled={savingSubtask}
              />
              {newSubtaskSubject.trim() && (
                <button
                  onClick={handleAddSubtask}
                  disabled={savingSubtask}
                  className="px-2 py-1 text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 rounded disabled:opacity-50"
                >
                  {savingSubtask ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                </button>
              )}
              <button
                onClick={() => {
                  setAddingSubtask(false);
                  setNewSubtaskSubject("");
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAddingSubtask(true);
              }}
              className="w-full flex items-center gap-2 pl-12 pr-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  users,
  defaultExpanded = true,
  onToggleComplete,
  onTaskClick,
  onAssigneeChange,
  onRefresh,
  showAttachment = true,
  variant = "default",
}: {
  title: string;
  tasks: Task[];
  users: BackendUser[];
  defaultExpanded?: boolean;
  onToggleComplete: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  onAssigneeChange: (taskId: number, userId: number | null) => void;
  onRefresh: () => void;
  showAttachment?: boolean;
  variant?: "default" | "danger" | "warning";
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const bgColors = {
    default: "bg-slate-50",
    danger: "bg-red-50",
    warning: "bg-amber-50",
  };

  const textColors = {
    default: "text-slate-700",
    danger: "text-red-700",
    warning: "text-amber-700",
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-2 ${bgColors[variant]}`}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className={`font-medium ${textColors[variant]}`}>{title}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </button>
      {expanded && (
        <div>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              users={users}
              onToggleComplete={onToggleComplete}
              onClick={onTaskClick}
              onAssigneeChange={onAssigneeChange}
              onRefresh={onRefresh}
              showAttachment={showAttachment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  onClear,
  children,
  open,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  onClear?: () => void;
  children?: React.ReactNode;
  open: boolean;
}) {
  const chipRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        chipRef.current && !chipRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        onClick(); // close
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClick]);

  return (
    <div className="relative" ref={chipRef}>
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all ${
          active
            ? "bg-slate-100 border-slate-300 text-slate-900 font-medium"
            : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <span>{label}</span>
        {active && onClear ? (
          <X
            className="h-3 w-3 text-slate-400 hover:text-slate-600"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {open && children && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function sortTasks(tasks: Task[], sortBy: SortBy): Task[] {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        return b.priority - a.priority;
      case "dueDate": {
        if (!a.dueAt && !b.dueAt) return 0;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "alpha":
        return a.subject.localeCompare(b.subject);
      default:
        return 0;
    }
  });
}

function groupTasks(
  tasks: Task[],
  groupBy: GroupBy,
  recentlyCompletedIds: Set<number>
): { title: string; tasks: Task[]; variant?: "default" | "danger" | "warning" }[] {
  const isEffectivelyCompleted = (t: Task) => t.completed && !recentlyCompletedIds.has(t.id);

  switch (groupBy) {
    case "dueDate": {
      const overdue = tasks.filter((t) => t.overdue && !isEffectivelyCompleted(t));
      const dueToday = tasks.filter((t) => t.dueToday && !t.overdue && !isEffectivelyCompleted(t));
      const upcoming = tasks.filter((t) => !t.overdue && !t.dueToday && !isEffectivelyCompleted(t) && t.dueAt);
      const noDate = tasks.filter((t) => !t.dueAt && !isEffectivelyCompleted(t));
      const completed = tasks.filter((t) => isEffectivelyCompleted(t));
      const groups: { title: string; tasks: Task[]; variant?: "default" | "danger" | "warning" }[] = [];
      if (overdue.length > 0) groups.push({ title: "Overdue", tasks: overdue, variant: "danger" });
      if (dueToday.length > 0) groups.push({ title: "Due Today", tasks: dueToday, variant: "warning" });
      if (upcoming.length > 0) groups.push({ title: "Upcoming", tasks: upcoming, variant: "default" });
      if (noDate.length > 0) groups.push({ title: "No Due Date", tasks: noDate, variant: "default" });
      if (completed.length > 0) groups.push({ title: "Completed", tasks: completed, variant: "default" });
      return groups;
    }
    case "priority": {
      const high = tasks.filter((t) => t.priority === 3);
      const medium = tasks.filter((t) => t.priority === 2);
      const low = tasks.filter((t) => t.priority === 1);
      const groups: { title: string; tasks: Task[]; variant?: "default" | "danger" | "warning" }[] = [];
      if (high.length > 0) groups.push({ title: "High Priority", tasks: high, variant: "danger" });
      if (medium.length > 0) groups.push({ title: "Medium Priority", tasks: medium, variant: "warning" });
      if (low.length > 0) groups.push({ title: "Low Priority", tasks: low, variant: "default" });
      return groups;
    }
    case "assignee": {
      const grouped: Record<string, Task[]> = {};
      tasks.forEach((t) => {
        const key = t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : "Unassigned";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t);
      });
      return Object.entries(grouped).map(([title, tasks]) => ({ title, tasks, variant: "default" as const }));
    }
    case "type": {
      const deals = tasks.filter((t) => t.attachmentType === "deal");
      const projects = tasks.filter((t) => t.attachmentType === "project");
      const general = tasks.filter((t) => t.attachmentType !== "deal" && t.attachmentType !== "project");
      const groups: { title: string; tasks: Task[]; variant?: "default" | "danger" | "warning" }[] = [];
      if (deals.length > 0) groups.push({ title: "Deal Tasks", tasks: deals, variant: "default" });
      if (projects.length > 0) groups.push({ title: "Project Tasks", tasks: projects, variant: "default" });
      if (general.length > 0) groups.push({ title: "General Tasks", tasks: general, variant: "default" });
      return groups;
    }
    case "none":
    default:
      return [{ title: "All Tasks", tasks, variant: "default" as const }];
  }
}

export default function TasksPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Set<number>>(new Set());
  const recentlyCompletedRef = useRef<Set<number>>(new Set());
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [myTasksCount, setMyTasksCount] = useState<number | null>(null);
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState<ViewType>("all");
  const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<number[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("dueDate");
  const [sortBy, setSortBy] = useState<SortBy>("priority");

  // Filter bar dropdown states
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [slideOutOpen, setSlideOutOpen] = useState(false);

  // Fetch data
  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();

    // Build query params based on current view
    switch (currentView) {
      case "overdue":
        params.append("status", "overdue");
        break;
      case "due-soon":
        params.append("status", "due_soon");
        break;
      case "completed":
        params.append("status", "completed");
        break;
      case "unassigned":
        params.append("status", "open");
        params.append("unassigned", "true");
        break;
      case "my":
        params.append("status", "open");
        if (user?.backendUserId) {
          params.append("assigned_to_id", String(user.backendUserId));
        }
        break;
      default: // "all"
        params.append("status", "open");
        break;
    }

    if (attachmentFilter !== "all") params.append("attachment", attachmentFilter);

    // Only root tasks by default
    params.append("root_only", "true");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks?${params.toString()}`
      );
      const data = await res.json();
      const fetchedTasks: Task[] = Array.isArray(data) ? data : [];

      // Preserve recently-completed tasks that won't be in the API response
      // (since API returns only open tasks when not viewing completed view)
      setTasks((prevTasks) => {
        const fetchedIds = new Set(fetchedTasks.map((t) => t.id));
        const preservedTasks = prevTasks.filter(
          (t) => recentlyCompletedRef.current.has(t.id) && !fetchedIds.has(t.id)
        );
        return [...fetchedTasks, ...preservedTasks];
      });
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setTasks([]);
    }
  }, [currentView, attachmentFilter, user?.backendUserId]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchMyTasksCount = useCallback(async () => {
    if (!user?.backendUserId) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks?status=open&assigned_to_id=${user.backendUserId}&root_only=true`
      );
      const data = await res.json();
      setMyTasksCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error("Failed to fetch my tasks count:", err);
    }
  }, [user?.backendUserId]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    Promise.all([fetchTasks(), fetchStats(), fetchUsers(), fetchMyTasksCount()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Re-fetch my tasks count when backend user ID is resolved
  useEffect(() => {
    if (user?.backendUserId) {
      fetchMyTasksCount();
    }
  }, [user?.backendUserId, fetchMyTasksCount]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = async (task: Task) => {
    const isCompleting = !task.completed;
    const endpoint = task.completed ? "uncomplete" : "complete";

    // Optimistic update: toggle completed flag locally
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: isCompleting } : t
      )
    );

    // Track recently completed tasks so they stay in their current group
    if (isCompleting) {
      setRecentlyCompletedIds((prev) => {
        const next = new Set([...prev, task.id]);
        recentlyCompletedRef.current = next;
        return next;
      });
    } else {
      setRecentlyCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        recentlyCompletedRef.current = next;
        return next;
      });
    }

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}/${endpoint}`,
        { method: "POST" }
      );
      fetchStats();
    } catch (err) {
      console.error("Failed to toggle task:", err);
      // Revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: !isCompleting } : t
        )
      );
      if (isCompleting) {
        setRecentlyCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          recentlyCompletedRef.current = next;
          return next;
        });
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSlideOutOpen(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setSlideOutOpen(true);
  };

  const handleTaskSave = () => {
    setSlideOutOpen(false);
    setSelectedTask(null);
    fetchTasks();
    fetchStats();
  };

  const handleTaskDelete = () => {
    setSlideOutOpen(false);
    setSelectedTask(null);
    fetchTasks();
    fetchStats();
  };

  const handleAssigneeChange = async (taskId: number, userId: number | null) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: { assigned_to_id: userId } }),
        }
      );
      fetchTasks();
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  };

  const handleRefresh = () => {
    fetchTasks();
    fetchStats();
  };

  // Filter tasks client-side (search + multi-select filters)
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        task.subject.toLowerCase().includes(query) ||
        task.attachmentName?.toLowerCase().includes(query) ||
        task.assignedTo?.firstName.toLowerCase().includes(query) ||
        task.assignedTo?.lastName.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Priority multi-select
    if (priorityFilter.length > 0 && !priorityFilter.includes(task.priority)) {
      return false;
    }

    // Status multi-select
    if (statusFilter.length > 0 && !statusFilter.includes(task.status)) {
      return false;
    }

    // Assignee multi-select
    if (assigneeFilter.length > 0) {
      if (!task.assignedTo || !assigneeFilter.includes(task.assignedTo.id)) {
        return false;
      }
    }

    return true;
  });

  // Group and sort tasks for display
  const taskGroups = groupTasks(
    sortTasks(filteredTasks, sortBy),
    currentView === "completed" ? "none" : groupBy,
    recentlyCompletedIds
  );

  const hasActiveFilters = priorityFilter.length > 0 || statusFilter.length > 0 || assigneeFilter.length > 0 || attachmentFilter !== "all";

  const clearAllFilters = () => {
    setPriorityFilter([]);
    setStatusFilter([]);
    setAssigneeFilter([]);
    setAttachmentFilter("all");
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left Sidebar */}
      <div className="w-48 flex-shrink-0 space-y-5">
        {/* Views */}
        <div className="space-y-1">
          {VIEWS.map((view) => {
            const Icon = view.icon;
            const count = view.id === "my"
              ? myTasksCount
              : stats
                ? view.countKey
                  ? stats[view.countKey as keyof TaskStats]
                  : 0
                : 0;

            return (
              <button
                key={view.id}
                onClick={() => {
                  setCurrentView(view.id);
                  setAttachmentFilter("all");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  currentView === view.id && attachmentFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${view.color || ""}`} />
                  <span>{view.label}</span>
                </div>
                {typeof count === "number" && count > 0 && (
                  <span
                    className={`text-xs ${
                      currentView === view.id && attachmentFilter === "all"
                        ? "text-slate-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Type Views */}
        <div>
          <div className="h-px bg-slate-200 mb-3" />
          <div className="space-y-1">
            {ATTACHMENT_FILTERS.filter(f => f.id !== "all").map((filter) => {
              const Icon = filter.icon;
              const count = stats?.byAttachment
                ? stats.byAttachment[filter.id as keyof typeof stats.byAttachment]
                : 0;

              return (
                <button
                  key={filter.id}
                  onClick={() => {
                    setAttachmentFilter(filter.id);
                    setCurrentView("all");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    attachmentFilter === filter.id
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{filter.label}</span>
                  </div>
                  {typeof count === "number" && count > 0 && (
                    <span
                      className={`text-xs ${
                        attachmentFilter === filter.id
                          ? "text-slate-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              {attachmentFilter !== "all"
                ? ATTACHMENT_FILTERS.find((f) => f.id === attachmentFilter)?.label
                : VIEWS.find((v) => v.id === currentView)?.label}
            </p>
          </div>
          <button
            onClick={handleCreateTask}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Type Filter */}
          <FilterChip
            label={attachmentFilter === "all" ? "Type" : ATTACHMENT_FILTERS.find(f => f.id === attachmentFilter)?.label || "Type"}
            active={attachmentFilter !== "all"}
            open={openFilter === "type"}
            onClick={() => setOpenFilter(openFilter === "type" ? null : "type")}
            onClear={() => setAttachmentFilter("all")}
          >
            {ATTACHMENT_FILTERS.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => {
                    setAttachmentFilter(filter.id);
                    setOpenFilter(null);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                    attachmentFilter === filter.id ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                  {filter.label}
                </button>
              );
            })}
          </FilterChip>

          {/* Assignee Filter */}
          <FilterChip
            label={
              assigneeFilter.length === 0
                ? "Assignee"
                : assigneeFilter.length === 1
                  ? users.find(u => u.id === assigneeFilter[0])?.firstName || "1 person"
                  : `${assigneeFilter.length} people`
            }
            active={assigneeFilter.length > 0}
            open={openFilter === "assignee"}
            onClick={() => setOpenFilter(openFilter === "assignee" ? null : "assignee")}
            onClear={() => setAssigneeFilter([])}
          >
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setAssigneeFilter((prev) =>
                    prev.includes(u.id)
                      ? prev.filter((id) => id !== u.id)
                      : [...prev, u.id]
                  );
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                  assigneeFilter.includes(u.id) ? "bg-slate-100" : ""
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium ${
                  assigneeFilter.includes(u.id) ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {u.firstName[0]}
                </span>
                <span>{u.firstName} {u.lastName}</span>
                {assigneeFilter.includes(u.id) && <Check className="h-3 w-3 ml-auto text-slate-600" />}
              </button>
            ))}
          </FilterChip>

          {/* Priority Filter */}
          <FilterChip
            label={
              priorityFilter.length === 0
                ? "Priority"
                : priorityFilter.map(p => PRIORITY_OPTIONS.find(o => o.value === p)?.label).join(", ")
            }
            active={priorityFilter.length > 0}
            open={openFilter === "priority"}
            onClick={() => setOpenFilter(openFilter === "priority" ? null : "priority")}
            onClear={() => setPriorityFilter([])}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setPriorityFilter((prev) =>
                    prev.includes(option.value)
                      ? prev.filter((v) => v !== option.value)
                      : [...prev, option.value]
                  );
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                  priorityFilter.includes(option.value) ? "bg-slate-100" : ""
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${option.dotColor}`} />
                <span>{option.label}</span>
                {priorityFilter.includes(option.value) && <Check className="h-3 w-3 ml-auto text-slate-600" />}
              </button>
            ))}
          </FilterChip>

          {/* Status Filter */}
          <FilterChip
            label={
              statusFilter.length === 0
                ? "Status"
                : statusFilter.map(s => STATUS_OPTIONS.find(o => o.value === s)?.label).join(", ")
            }
            active={statusFilter.length > 0}
            open={openFilter === "status"}
            onClick={() => setOpenFilter(openFilter === "status" ? null : "status")}
            onClear={() => setStatusFilter([])}
          >
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setStatusFilter((prev) =>
                    prev.includes(option.value)
                      ? prev.filter((v) => v !== option.value)
                      : [...prev, option.value]
                  );
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                  statusFilter.includes(option.value) ? "bg-slate-100" : ""
                }`}
              >
                <span className={`px-1.5 py-0.5 rounded text-xs ${option.color}`}>{option.label}</span>
                {statusFilter.includes(option.value) && <Check className="h-3 w-3 ml-auto text-slate-600" />}
              </button>
            ))}
          </FilterChip>

          {/* Separator */}
          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Group By */}
          <FilterChip
            label={`Group: ${GROUP_BY_OPTIONS.find(o => o.id === groupBy)?.label}`}
            active={groupBy !== "dueDate"}
            open={openFilter === "groupBy"}
            onClick={() => setOpenFilter(openFilter === "groupBy" ? null : "groupBy")}
          >
            {GROUP_BY_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setGroupBy(option.id);
                  setOpenFilter(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                  groupBy === option.id ? "bg-slate-100 font-medium" : ""
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                {option.label}
                {groupBy === option.id && <Check className="h-3 w-3 ml-auto text-slate-600" />}
              </button>
            ))}
          </FilterChip>

          {/* Sort By */}
          <FilterChip
            label={`Sort: ${SORT_BY_OPTIONS.find(o => o.id === sortBy)?.label}`}
            active={sortBy !== "priority"}
            open={openFilter === "sortBy"}
            onClick={() => setOpenFilter(openFilter === "sortBy" ? null : "sortBy")}
          >
            {SORT_BY_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setSortBy(option.id);
                  setOpenFilter(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                  sortBy === option.id ? "bg-slate-100 font-medium" : ""
                }`}
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                {option.label}
                {sortBy === option.id && <Check className="h-3 w-3 ml-auto text-slate-600" />}
              </button>
            ))}
          </FilterChip>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-slate-500 hover:text-slate-700 ml-1"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Loading...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center pt-12 text-muted-foreground">
              <CheckSquare className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">No tasks found</p>
              <button
                onClick={handleCreateTask}
                className="mt-2 text-sm text-slate-600 hover:text-slate-900 underline"
              >
                Create your first task
              </button>
            </div>
          ) : (
            <>
              {taskGroups.map((group) => (
                <TaskGroup
                  key={group.title}
                  title={group.title}
                  tasks={group.tasks}
                  users={users}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                  variant={group.variant}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Task SlideOut */}
      {slideOutOpen && (
        <TasksSlideOut
          task={selectedTask}
          users={users}
          existingTasks={tasks}
          onClose={() => {
            setSlideOutOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
}
