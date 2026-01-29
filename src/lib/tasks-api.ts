/**
 * Tasks API - Unified types, constants, and CRUD operations
 * Provides a clean API layer for all task-related functionality
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ============================================================================
// TYPES
// ============================================================================

export interface TaskOwner {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  fullName?: string;
}

export interface Task {
  id: number;
  subject: string;
  body: string | null;
  dueAt: string | null;
  completed: boolean;
  completedAt: string | null;
  overdue: boolean;
  dueToday: boolean;
  dueThisWeek: boolean;
  priority: number; // 1=Low, 2=Medium, 3=High
  priorityLabel: string;
  status: TaskStatus;
  assignedTo: TaskOwner | null;
  createdBy: TaskOwner | null;
  parentTaskId: number | null;
  isSubtask: boolean;
  subtaskCount: number;
  completedSubtaskCount: number;
  subtaskCompletionPercent: number;
  attachmentType: AttachmentType;
  attachmentName: string | null;
  dealId: number | null;
  projectId: number | null;
  personId: number | null;
  organizationId: number | null;
  deal: { id: number; name: string } | null;
  project: { id: number; name: string } | null;
  subtasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
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

export interface TaskGroup {
  id: number | string;
  name: string;
  company?: string;
  status?: string;
  taskCount: number;
  overdueCount: number;
  tasks: Task[];
}

export interface GroupedTasksResponse {
  groups: TaskGroup[];
}

export interface MyTasksResponse {
  overdue: Task[];
  dueToday: Task[];
  dueThisWeek: Task[];
  upcoming: Task[];
  noDueDate: Task[];
}

export type TaskStatus = "open" | "in_progress" | "blocked" | "waiting";
export type AttachmentType = "general" | "deal" | "project";
export type TaskPriority = 1 | 2 | 3; // 1=Low, 2=Medium, 3=High

export interface TaskFilters {
  status?: "open" | "overdue" | "due_soon" | "completed";
  attachment?: AttachmentType;
  assignedToId?: number;
  unassigned?: boolean;
  rootOnly?: boolean;
  q?: string;
}

export interface CreateTaskData {
  subject: string;
  body?: string;
  dueAt?: string;
  priority?: number;
  status?: TaskStatus;
  assignedToId?: number;
  dealId?: number;
  projectId?: number;
  parentTaskId?: number;
  // Polymorphic attachment (for projects)
  taskableType?: string;
  taskableId?: number;
}

export interface UpdateTaskData {
  subject?: string;
  body?: string;
  dueAt?: string | null;
  priority?: number;
  status?: TaskStatus;
  assignedToId?: number | null;
  dealId?: number | null;
  projectId?: number | null;
  completed?: boolean;
}

// For attachment selection UI
export interface AttachmentOption {
  type: AttachmentType;
  id?: number;
  name?: string;
}

export interface DealOption {
  id: number;
  name: string;
  company?: string;
}

export interface ProjectOption {
  id: number;
  name: string;
  status?: string;
}

export interface UserOption {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  fullName?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-700" },
  { value: "in_progress", label: "In Progress", color: "bg-purple-100 text-purple-700" },
  { value: "blocked", label: "Blocked", color: "bg-red-100 text-red-700" },
  { value: "waiting", label: "Waiting", color: "bg-amber-100 text-amber-700" },
];

export const TASK_PRIORITIES: { value: number; label: string; color: string }[] = [
  { value: 3, label: "High", color: "bg-red-100 text-red-700" },
  { value: 2, label: "Medium", color: "bg-amber-100 text-amber-700" },
  { value: 1, label: "Low", color: "bg-slate-100 text-slate-600" },
];

export const ATTACHMENT_TYPES: { value: AttachmentType; label: string; icon: string }[] = [
  { value: "general", label: "General", icon: "CheckSquare" },
  { value: "deal", label: "Deal", icon: "Building2" },
  { value: "project", label: "Project", icon: "FolderKanban" },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });
}

export function getStatusColor(status: TaskStatus): string {
  const found = TASK_STATUSES.find((s) => s.value === status);
  return found?.color || "bg-slate-100 text-slate-600";
}

export function getStatusLabel(status: TaskStatus): string {
  const found = TASK_STATUSES.find((s) => s.value === status);
  return found?.label || status;
}

export function getPriorityColor(priority: number): string {
  const found = TASK_PRIORITIES.find((p) => p.value === priority);
  return found?.color || "bg-slate-100 text-slate-600";
}

export function getPriorityLabel(priority: number): string {
  const found = TASK_PRIORITIES.find((p) => p.value === priority);
  return found?.label || "Medium";
}

export function getAttachmentLabel(type: AttachmentType): string {
  const found = ATTACHMENT_TYPES.find((a) => a.value === type);
  return found?.label || "General";
}

export function isOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false;
  const due = new Date(dueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function isDueToday(dueAt: string | null): boolean {
  if (!dueAt) return false;
  const due = new Date(dueAt);
  const today = new Date();
  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  );
}

export function isDueThisWeek(dueAt: string | null): boolean {
  if (!dueAt) return false;
  const due = new Date(dueAt);
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  return due >= today && due <= weekEnd;
}

export function getDueDateColor(task: Task): string {
  if (task.completed) return "text-slate-400";
  if (task.overdue) return "text-red-600";
  if (task.dueToday) return "text-amber-600";
  return "text-slate-600";
}

export function getDueDateBadgeColor(task: Task): string {
  if (task.completed) return "bg-slate-100 text-slate-500";
  if (task.overdue) return "bg-red-50 text-red-700";
  if (task.dueToday) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function formatDueDate(dueAt: string | null): string {
  if (!dueAt) return "";
  const date = new Date(dueAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return "Today";
  }

  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Group tasks by urgency for Queue view
export function groupTasksByUrgency(tasks: Task[]): {
  overdue: Task[];
  dueToday: Task[];
  dueThisWeek: Task[];
  upcoming: Task[];
  noDueDate: Task[];
} {
  const overdue: Task[] = [];
  const dueToday: Task[] = [];
  const dueThisWeek: Task[] = [];
  const upcoming: Task[] = [];
  const noDueDate: Task[] = [];

  for (const task of tasks) {
    if (!task.dueAt) {
      noDueDate.push(task);
    } else if (task.overdue) {
      overdue.push(task);
    } else if (task.dueToday) {
      dueToday.push(task);
    } else if (task.dueThisWeek) {
      dueThisWeek.push(task);
    } else {
      upcoming.push(task);
    }
  }

  return { overdue, dueToday, dueThisWeek, upcoming, noDueDate };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export async function fetchTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.attachment) params.append("attachment", filters.attachment);
  if (filters.assignedToId) params.append("assigned_to_id", filters.assignedToId.toString());
  if (filters.unassigned) params.append("unassigned", "true");
  if (filters.rootOnly) params.append("root_only", "true");
  if (filters.q) params.append("q", filters.q);

  const res = await authFetch(`${API_BASE}/api/tasks?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function fetchTask(id: number): Promise<Task> {
  const res = await authFetch(`${API_BASE}/api/tasks/${id}`);
  if (!res.ok) throw new Error("Failed to fetch task");
  return res.json();
}

export async function fetchTaskStats(): Promise<TaskStats> {
  const res = await authFetch(`${API_BASE}/api/tasks/stats`);
  if (!res.ok) throw new Error("Failed to fetch task stats");
  return res.json();
}

export async function fetchMyTasks(userId?: number): Promise<MyTasksResponse> {
  const params = userId ? `?user_id=${userId}` : "";
  const res = await authFetch(`${API_BASE}/api/tasks/my_tasks${params}`);
  if (!res.ok) throw new Error("Failed to fetch my tasks");
  return res.json();
}

export async function fetchTasksByDeal(): Promise<TaskGroup[]> {
  const res = await authFetch(`${API_BASE}/api/tasks/grouped_by_deal`);
  if (!res.ok) throw new Error("Failed to fetch tasks by deal");
  const data = await res.json();
  return data.groups || data;
}

export async function fetchTasksByProject(): Promise<TaskGroup[]> {
  const res = await authFetch(`${API_BASE}/api/tasks/grouped_by_project`);
  if (!res.ok) throw new Error("Failed to fetch tasks by project");
  const data = await res.json();
  return data.groups || data;
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const payload: Record<string, unknown> = {
    subject: data.subject,
  };

  if (data.body !== undefined) payload.body = data.body;
  if (data.dueAt !== undefined) payload.due_at = data.dueAt;
  if (data.priority !== undefined) payload.priority = data.priority;
  if (data.status !== undefined) payload.status = data.status;
  if (data.assignedToId !== undefined) payload.assigned_to_id = data.assignedToId;
  if (data.dealId !== undefined) payload.deal_id = data.dealId;
  if (data.projectId !== undefined) payload.project_id = data.projectId;
  if (data.parentTaskId !== undefined) payload.parent_task_id = data.parentTaskId;
  if (data.taskableType !== undefined) payload.taskable_type = data.taskableType;
  if (data.taskableId !== undefined) payload.taskable_id = data.taskableId;

  const res = await authFetch(`${API_BASE}/api/tasks`, {
    method: "POST",
    body: JSON.stringify({ task: payload }),
  });

  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(id: number, data: UpdateTaskData): Promise<Task> {
  const payload: Record<string, unknown> = {};

  if (data.subject !== undefined) payload.subject = data.subject;
  if (data.body !== undefined) payload.body = data.body;
  if (data.dueAt !== undefined) payload.due_at = data.dueAt;
  if (data.priority !== undefined) payload.priority = data.priority;
  if (data.status !== undefined) payload.status = data.status;
  if (data.assignedToId !== undefined) payload.assigned_to_id = data.assignedToId;
  if (data.dealId !== undefined) payload.deal_id = data.dealId;
  if (data.projectId !== undefined) payload.project_id = data.projectId;
  if (data.completed !== undefined) payload.completed = data.completed;

  const res = await authFetch(`${API_BASE}/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ task: payload }),
  });

  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/tasks/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete task");
}

export async function completeTask(id: number): Promise<Task> {
  const res = await authFetch(`${API_BASE}/api/tasks/${id}/complete`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("Failed to complete task");
  return res.json();
}

export async function uncompleteTask(id: number): Promise<Task> {
  const res = await authFetch(`${API_BASE}/api/tasks/${id}/uncomplete`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("Failed to uncomplete task");
  return res.json();
}

// ============================================================================
// REFERENCE DATA FETCHING
// ============================================================================

export async function fetchUsers(): Promise<UserOption[]> {
  const res = await authFetch(`${API_BASE}/api/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchDeals(): Promise<DealOption[]> {
  const res = await authFetch(`${API_BASE}/api/deals`);
  if (!res.ok) throw new Error("Failed to fetch deals");
  const data = await res.json();
  // Handle both array and { deals: [] } response formats
  return Array.isArray(data) ? data : data.deals || [];
}

export async function fetchProjects(): Promise<ProjectOption[]> {
  const res = await authFetch(`${API_BASE}/api/projects`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  const data = await res.json();
  // Handle both array and { projects: [] } response formats
  return Array.isArray(data) ? data : data.projects || [];
}

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

const STORAGE_KEYS = {
  activeView: "arrow-tasks-active-view",
  activeTab: "arrow-tasks-active-tab",
  filterRailCollapsed: "arrow-tasks-filter-rail-collapsed",
  groupBy: "arrow-tasks-group-by",
};

export function saveTasksView(view: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.activeView, view);
  }
}

export function loadTasksView(): string {
  if (typeof window === "undefined") return "my";
  return localStorage.getItem(STORAGE_KEYS.activeView) || "my";
}

export function saveTasksTab(tab: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.activeTab, tab);
  }
}

export function loadTasksTab(): string {
  if (typeof window === "undefined") return "queue";
  return localStorage.getItem(STORAGE_KEYS.activeTab) || "queue";
}

export function saveFilterRailCollapsed(collapsed: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.filterRailCollapsed, JSON.stringify(collapsed));
  }
}

export function loadFilterRailCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.filterRailCollapsed);
    return stored ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
}

export function saveGroupBy(groupBy: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.groupBy, groupBy);
  }
}

export function loadGroupBy(): string {
  if (typeof window === "undefined") return "deal";
  return localStorage.getItem(STORAGE_KEYS.groupBy) || "deal";
}
