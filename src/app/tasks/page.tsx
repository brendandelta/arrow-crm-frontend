"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  User,
  Inbox,
  CheckCircle,
  Plus,
  Search,
  Filter,
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TasksSlideOut } from "./_components/TasksSlideOut";

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

interface ViewConfig {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  countKey?: keyof TaskStats | string;
  color?: string;
}

const VIEWS: ViewConfig[] = [
  { id: "my", label: "My Tasks", icon: User, countKey: "open" },
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
  { id: "general", label: "Get Shit Done", icon: CheckSquare },
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
  users: User[];
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
  users: User[];
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
        setLocalSubtasks((prev) =>
          prev.map((st) =>
            st.id === subtask.id ? { ...st, completed: subtask.completed } : st
          )
        );
      } else {
        onRefresh();
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
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  {task.attachmentType === "deal" ? (
                    <Building2 className="h-3 w-3" />
                  ) : task.attachmentType === "project" ? (
                    <FolderKanban className="h-3 w-3" />
                  ) : null}
                  {task.attachmentName}
                </span>
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
  users: User[];
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

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState<ViewType>("all");
  const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [slideOutOpen, setSlideOutOpen] = useState(false);

  // Fetch data
  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();

    // Build query params based on current view and filters
    if (currentView === "overdue") params.append("status", "overdue");
    if (currentView === "due-soon") params.append("status", "due_soon");
    if (currentView === "completed") params.append("status", "completed");
    if (currentView !== "completed") params.append("status", "open");
    if (currentView === "unassigned") params.append("unassigned", "true");

    if (attachmentFilter !== "all") params.append("attachment", attachmentFilter);
    if (assigneeFilter) params.append("assigned_to_id", assigneeFilter);
    if (priorityFilter) params.append("priority", priorityFilter);

    // Only root tasks by default
    params.append("root_only", "true");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks?${params.toString()}`
      );
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setTasks([]);
    }
  }, [currentView, attachmentFilter, assigneeFilter, priorityFilter]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

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
    Promise.all([fetchTasks(), fetchStats(), fetchUsers()]).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = async (task: Task) => {
    const endpoint = task.completed ? "uncomplete" : "complete";
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}/${endpoint}`,
        { method: "POST" }
      );
      if (res.ok) {
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
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

  // Filter tasks by search
  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.subject.toLowerCase().includes(query) ||
      task.attachmentName?.toLowerCase().includes(query) ||
      task.assignedTo?.firstName.toLowerCase().includes(query) ||
      task.assignedTo?.lastName.toLowerCase().includes(query)
    );
  });

  // Group tasks for display
  const overdueTasks = filteredTasks.filter((t) => t.overdue && !t.completed);
  const dueTodayTasks = filteredTasks.filter(
    (t) => t.dueToday && !t.overdue && !t.completed
  );
  const upcomingTasks = filteredTasks.filter(
    (t) => !t.overdue && !t.dueToday && !t.completed && t.dueAt
  );
  const noDueDateTasks = filteredTasks.filter(
    (t) => !t.dueAt && !t.completed
  );
  const completedTasks = filteredTasks.filter((t) => t.completed);

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left Sidebar - Views */}
      <div className="w-64 flex-shrink-0 space-y-6">
        {/* Views */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Views
          </h3>
          <div className="space-y-1">
            {VIEWS.map((view) => {
              const Icon = view.icon;
              const count = stats
                ? view.countKey
                  ? stats[view.countKey as keyof TaskStats]
                  : 0
                : 0;

              return (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    currentView === view.id
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
                        currentView === view.id
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

        {/* Attachment Filter */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Type
          </h3>
          <div className="space-y-1">
            {ATTACHMENT_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const count = stats?.byAttachment
                ? filter.id === "all"
                  ? stats.open
                  : stats.byAttachment[filter.id as keyof typeof stats.byAttachment]
                : 0;

              return (
                <button
                  key={filter.id}
                  onClick={() => setAttachmentFilter(filter.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    attachmentFilter === filter.id
                      ? "bg-slate-100 font-medium"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{filter.label}</span>
                  </div>
                  {typeof count === "number" && count > 0 && (
                    <span className="text-xs text-muted-foreground">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignee Filter */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Assignee
          </h3>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md"
          >
            <option value="">All team members</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Priority
          </h3>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md"
          >
            <option value="">All priorities</option>
            <option value="3">High</option>
            <option value="2">Medium</option>
            <option value="1">Low</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              {VIEWS.find((v) => v.id === currentView)?.label}
              {attachmentFilter !== "all" && ` - ${ATTACHMENT_FILTERS.find((f) => f.id === attachmentFilter)?.label}`}
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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Loading...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>No tasks found</p>
              <button
                onClick={handleCreateTask}
                className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline"
              >
                Create your first task
              </button>
            </div>
          ) : currentView === "completed" ? (
            // Show completed tasks as a simple list
            <div className="border rounded-lg overflow-hidden">
              {completedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  users={users}
                  onToggleComplete={handleToggleComplete}
                  onClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          ) : (
            // Grouped view for open tasks
            <>
              {overdueTasks.length > 0 && (
                <TaskGroup
                  title="Overdue"
                  tasks={overdueTasks}
                  users={users}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                  variant="danger"
                />
              )}
              {dueTodayTasks.length > 0 && (
                <TaskGroup
                  title="Due Today"
                  tasks={dueTodayTasks}
                  users={users}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                  variant="warning"
                />
              )}
              {upcomingTasks.length > 0 && (
                <TaskGroup
                  title="Upcoming"
                  tasks={upcomingTasks}
                  users={users}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                />
              )}
              {noDueDateTasks.length > 0 && (
                <TaskGroup
                  title="No Due Date"
                  tasks={noDueDateTasks}
                  users={users}
                  defaultExpanded={overdueTasks.length === 0 && dueTodayTasks.length === 0}
                  onToggleComplete={handleToggleComplete}
                  onTaskClick={handleTaskClick}
                  onAssigneeChange={handleAssigneeChange}
                  onRefresh={handleRefresh}
                />
              )}
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
