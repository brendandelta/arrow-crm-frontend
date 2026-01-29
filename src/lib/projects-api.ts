/**
 * Projects API - Types, constants, and CRUD operations
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectOwner {
  id: number;
  firstName: string;
  lastName: string;
}

export interface ProjectTask {
  id: number;
  subject: string;
  description: string | null;
  status: string;
  priority: number; // 0 = high, 1 = normal, 2 = low
  dueAt: string | null;
  completed: boolean;
  completedAt: string | null;
  assigneeId: number | null;
  assignee: ProjectOwner | null;
  taskableType: string;
  taskableId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: number | null;
  owner: ProjectOwner | null;
  createdById: number | null;
  createdBy: ProjectOwner | null;
  openTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithTasks extends Project {
  tasks: ProjectTask[];
  nextTask: ProjectTask | null;
}

export interface ProjectListResponse {
  projects: Project[];
  meta?: {
    total: number;
    page: number;
    perPage: number;
  };
}

export interface ProjectFilters {
  q?: string;
  status?: ProjectStatus[];
  ownerId?: number;
  hasOverdueTasks?: boolean;
  hasNoTasks?: boolean;
  sort?: ProjectSortOption;
}

export type ProjectStatus = "open" | "active" | "paused" | "complete";

export type ProjectSortOption = "name" | "updatedAt" | "createdAt" | "status";

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: number;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: number;
}

export interface CreateTaskData {
  subject: string;
  description?: string;
  priority?: number;
  dueAt?: string;
  assigneeId?: number;
  taskableType: string;
  taskableId: number;
}

export interface UpdateTaskData {
  subject?: string;
  description?: string;
  priority?: number;
  dueAt?: string;
  assigneeId?: number;
  completed?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "complete", label: "Complete" },
];

export const TASK_PRIORITIES: { value: number; label: string }[] = [
  { value: 0, label: "High" },
  { value: 1, label: "Normal" },
  { value: 2, label: "Low" },
];

export function getStatusColor(status: ProjectStatus | string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "open":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "paused":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "complete":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function getStatusDotColor(status: ProjectStatus | string): string {
  switch (status) {
    case "active":
      return "bg-emerald-500";
    case "open":
      return "bg-sky-500";
    case "paused":
      return "bg-amber-500";
    case "complete":
      return "bg-slate-400";
    default:
      return "bg-slate-400";
  }
}

export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 0:
      return "bg-red-100 text-red-700 border-red-200";
    case 1:
      return "bg-slate-100 text-slate-600 border-slate-200";
    case 2:
      return "bg-slate-50 text-slate-500 border-slate-100";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function getPriorityLabel(priority: number): string {
  const found = TASK_PRIORITIES.find((p) => p.value === priority);
  return found?.label || "Normal";
}

export function getStatusLabel(status: ProjectStatus | string): string {
  const found = PROJECT_STATUSES.find((s) => s.value === status);
  return found?.label || status;
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const session = localStorage.getItem("arrow_session");
  if (!session) return {};

  try {
    const data = JSON.parse(session);
    if (data.backendUserId) {
      return { "X-User-Id": data.backendUserId.toString() };
    }
  } catch {
    console.error("[Projects API] Invalid session data");
  }
  return {};
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

// ============================================================================
// PROJECT CRUD
// ============================================================================

export async function fetchProjects(
  filters: ProjectFilters = {}
): Promise<ProjectListResponse> {
  const params = new URLSearchParams();

  if (filters.q) params.append("q", filters.q);
  if (filters.status?.length) {
    filters.status.forEach((s) => params.append("status[]", s));
  }
  if (filters.ownerId) params.append("owner_id", filters.ownerId.toString());
  if (filters.hasOverdueTasks) params.append("has_overdue_tasks", "true");
  if (filters.hasNoTasks) params.append("has_no_tasks", "true");
  if (filters.sort) params.append("sort", filters.sort);

  const url = `${API_BASE}/api/projects${params.toString() ? `?${params}` : ""}`;

  try {
    const res = await authFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch projects: ${res.status}`);
    }
    const data = await res.json();

    // Handle array or object response
    if (Array.isArray(data)) {
      return { projects: data };
    }
    return data;
  } catch (error) {
    console.error("[Projects API] Fetch error:", error);
    return { projects: [] };
  }
}

export async function fetchProject(id: number): Promise<Project | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/projects/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch project: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("[Projects API] Fetch project error:", error);
    return null;
  }
}

export async function createProject(
  data: CreateProjectData
): Promise<Project | null> {
  try {
    const payload: Record<string, unknown> = {
      name: data.name,
    };
    if (data.description !== undefined) payload.description = data.description;
    if (data.status !== undefined) payload.status = data.status;
    if (data.ownerId !== undefined) payload.owner_id = data.ownerId;

    const res = await authFetch(`${API_BASE}/api/projects`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to create project: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("[Projects API] Create error:", error);
    return null;
  }
}

export async function updateProject(
  id: number,
  data: UpdateProjectData
): Promise<Project | null> {
  try {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.status !== undefined) payload.status = data.status;
    if (data.ownerId !== undefined) payload.owner_id = data.ownerId;

    const res = await authFetch(`${API_BASE}/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to update project: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("[Projects API] Update error:", error);
    return null;
  }
}

export async function deleteProject(id: number): Promise<boolean> {
  try {
    const res = await authFetch(`${API_BASE}/api/projects/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error("[Projects API] Delete error:", error);
    return false;
  }
}

// ============================================================================
// TASK CRUD (for project tasks)
// ============================================================================

export async function fetchProjectTasks(projectId: number): Promise<ProjectTask[]> {
  try {
    // Fetch tasks where taskableType=Project and taskableId=projectId
    const params = new URLSearchParams();
    params.append("taskable_type", "Project");
    params.append("taskable_id", projectId.toString());

    const res = await authFetch(`${API_BASE}/api/tasks?${params}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch project tasks: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : data.tasks || [];
  } catch (error) {
    console.error("[Projects API] Fetch tasks error:", error);
    return [];
  }
}

export async function createTask(data: CreateTaskData): Promise<ProjectTask | null> {
  try {
    const payload: Record<string, unknown> = {
      subject: data.subject,
      taskable_type: data.taskableType,
      taskable_id: data.taskableId,
    };
    if (data.description !== undefined) payload.description = data.description;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.dueAt !== undefined) payload.due_at = data.dueAt;
    if (data.assigneeId !== undefined) payload.assignee_id = data.assigneeId;

    const res = await authFetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to create task: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("[Projects API] Create task error:", error);
    return null;
  }
}

export async function updateTask(
  id: number,
  data: UpdateTaskData
): Promise<ProjectTask | null> {
  try {
    const payload: Record<string, unknown> = {};
    if (data.subject !== undefined) payload.subject = data.subject;
    if (data.description !== undefined) payload.description = data.description;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.dueAt !== undefined) payload.due_at = data.dueAt;
    if (data.assigneeId !== undefined) payload.assignee_id = data.assigneeId;
    if (data.completed !== undefined) payload.completed = data.completed;

    const res = await authFetch(`${API_BASE}/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to update task: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("[Projects API] Update task error:", error);
    return null;
  }
}

export async function deleteTask(id: number): Promise<boolean> {
  try {
    const res = await authFetch(`${API_BASE}/api/tasks/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error("[Projects API] Delete task error:", error);
    return false;
  }
}

export async function completeTask(id: number): Promise<ProjectTask | null> {
  return updateTask(id, { completed: true });
}

export async function uncompleteTask(id: number): Promise<ProjectTask | null> {
  return updateTask(id, { completed: false });
}

// ============================================================================
// USERS (for owner/assignee selection)
// ============================================================================

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await authFetch(`${API_BASE}/api/users`);
    if (!res.ok) {
      throw new Error(`Failed to fetch users: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : data.users || [];
  } catch (error) {
    console.error("[Projects API] Fetch users error:", error);
    return [];
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

export function getProjectProgress(project: Project): number {
  const total = project.openTasksCount + project.completedTasksCount;
  if (total === 0) return 0;
  return Math.round((project.completedTasksCount / total) * 100);
}

export function getProjectHealth(project: Project): "healthy" | "warning" | "critical" | "empty" {
  if (project.openTasksCount === 0 && project.completedTasksCount === 0) {
    return "empty";
  }
  if (project.overdueTasksCount > 3) {
    return "critical";
  }
  if (project.overdueTasksCount > 0) {
    return "warning";
  }
  return "healthy";
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false;
  const dueDate = new Date(dueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export function isDueSoon(dueAt: string | null, days: number = 3): boolean {
  if (!dueAt) return false;
  const dueDate = new Date(dueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);
  return dueDate >= today && dueDate <= futureDate;
}

export function groupTasksByStatus(tasks: ProjectTask[]): {
  overdue: ProjectTask[];
  dueSoon: ProjectTask[];
  open: ProjectTask[];
  completed: ProjectTask[];
} {
  const overdue: ProjectTask[] = [];
  const dueSoon: ProjectTask[] = [];
  const open: ProjectTask[] = [];
  const completed: ProjectTask[] = [];

  for (const task of tasks) {
    if (task.completed) {
      completed.push(task);
    } else if (isOverdue(task.dueAt)) {
      overdue.push(task);
    } else if (isDueSoon(task.dueAt)) {
      dueSoon.push(task);
    } else {
      open.push(task);
    }
  }

  // Sort each group
  const sortByDue = (a: ProjectTask, b: ProjectTask) => {
    if (!a.dueAt && !b.dueAt) return a.priority - b.priority;
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  };

  overdue.sort(sortByDue);
  dueSoon.sort(sortByDue);
  open.sort((a, b) => a.priority - b.priority);
  completed.sort(
    (a, b) =>
      new Date(b.completedAt || b.updatedAt).getTime() -
      new Date(a.completedAt || a.updatedAt).getTime()
  );

  return { overdue, dueSoon, open, completed };
}

export function getNextTask(tasks: ProjectTask[]): ProjectTask | null {
  const incompleteTasks = tasks.filter((t) => !t.completed);
  if (incompleteTasks.length === 0) return null;

  // Sort by: overdue first, then by due date, then by priority
  incompleteTasks.sort((a, b) => {
    const aOverdue = isOverdue(a.dueAt);
    const bOverdue = isOverdue(b.dueAt);

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    if (a.dueAt && b.dueAt) {
      const dateDiff =
        new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (dateDiff !== 0) return dateDiff;
    }
    if (a.dueAt && !b.dueAt) return -1;
    if (!a.dueAt && b.dueAt) return 1;

    return a.priority - b.priority;
  });

  return incompleteTasks[0];
}

// ============================================================================
// LOCAL STORAGE
// ============================================================================

const STORAGE_KEYS = {
  filters: "arrow-crm-projects-filters",
  filtersCollapsed: "arrow-crm-projects-filters-collapsed",
  viewMode: "arrow-crm-projects-view-mode",
  activeTab: "arrow-crm-projects-active-tab",
};

export function saveProjectFilters(filters: ProjectFilters): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
  } catch (e) {
    console.error("[Projects] Failed to save filters:", e);
  }
}

export function loadProjectFilters(): ProjectFilters {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.filters);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("[Projects] Failed to load filters:", e);
  }
  return {};
}

export function saveFiltersCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.filtersCollapsed, JSON.stringify(collapsed));
  } catch (e) {
    console.error("[Projects] Failed to save collapsed state:", e);
  }
}

export function loadFiltersCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.filtersCollapsed);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("[Projects] Failed to load collapsed state:", e);
  }
  return false;
}

export function saveViewMode(mode: "cards" | "list"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.viewMode, mode);
  } catch (e) {
    console.error("[Projects] Failed to save view mode:", e);
  }
}

export function loadViewMode(): "cards" | "list" {
  if (typeof window === "undefined") return "cards";
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.viewMode);
    if (stored === "list" || stored === "cards") {
      return stored;
    }
  } catch (e) {
    console.error("[Projects] Failed to load view mode:", e);
  }
  return "cards";
}

export function saveActiveTab(tab: "projects" | "work-queue"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.activeTab, tab);
  } catch (e) {
    console.error("[Projects] Failed to save active tab:", e);
  }
}

export function loadActiveTab(): "projects" | "work-queue" {
  if (typeof window === "undefined") return "projects";
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.activeTab);
    if (stored === "projects" || stored === "work-queue") {
      return stored;
    }
  } catch (e) {
    console.error("[Projects] Failed to load active tab:", e);
  }
  return "projects";
}
