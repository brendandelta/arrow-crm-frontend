"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  ChevronDown,
  X,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPageIdentity } from "@/lib/page-registry";
import {
  type Project,
  type ProjectFilters,
  type ProjectStatus,
  type ProjectTask,
  type User,
  PROJECT_STATUSES,
  fetchProjects,
  fetchUsers,
  fetchProjectTasks,
  createProject,
  updateProject,
  deleteProject,
  getNextTask,
  loadProjectFilters,
  saveProjectFilters,
  loadFiltersCollapsed,
  saveFiltersCollapsed,
  loadViewMode,
  saveViewMode,
  loadActiveTab,
  saveActiveTab,
} from "@/lib/projects-api";
import { ProjectFiltersRail } from "./_components/ProjectFiltersRail";
import { ProjectList } from "./_components/ProjectList";
import { ProjectDetailPanel } from "./_components/ProjectDetailPanel";
import { WorkQueueView } from "./_components/WorkQueueView";

// Get page identity for theming
const pageIdentity = getPageIdentity("projects");
const theme = pageIdentity?.theme;

export default function ProjectsPage() {
  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextTasks, setNextTasks] = useState<Record<number, ProjectTask | null>>({});

  // UI state
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [activeTab, setActiveTab] = useState<"projects" | "work-queue">("projects");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Modal state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    description: "",
    status: "open" as ProjectStatus,
    ownerId: undefined as number | undefined,
  });
  const [savingProject, setSavingProject] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Current user ID (from session)
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);

  // Load saved preferences
  useEffect(() => {
    const savedFilters = loadProjectFilters();
    if (savedFilters.q) {
      setSearchQuery(savedFilters.q);
    }
    setFilters(savedFilters);
    setFiltersCollapsed(loadFiltersCollapsed());
    setViewMode(loadViewMode());
    setActiveTab(loadActiveTab());

    // Get current user ID
    try {
      const session = localStorage.getItem("arrow_session");
      if (session) {
        const data = JSON.parse(session);
        if (data.backendUserId) {
          setCurrentUserId(data.backendUserId);
        }
      }
    } catch (e) {
      console.error("Failed to get user ID:", e);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update filters with search
  useEffect(() => {
    const newFilters = { ...filters, q: debouncedQuery || undefined };
    setFilters(newFilters);
    saveProjectFilters(newFilters);
  }, [debouncedQuery]);

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    const [projectsResult, usersResult] = await Promise.all([
      fetchProjects(filters),
      fetchUsers(),
    ]);
    setProjects(projectsResult.projects);
    setUsers(usersResult);
    setLoading(false);

    // Fetch next tasks for each project
    const tasksMap: Record<number, ProjectTask | null> = {};
    await Promise.all(
      projectsResult.projects.map(async (project) => {
        const tasks = await fetchProjectTasks(project.id);
        tasksMap[project.id] = getNextTask(tasks);
      })
    );
    setNextTasks(tasksMap);
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // URL state sync for selected project
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedProjectId) {
      url.searchParams.set("id", selectedProjectId.toString());
    } else {
      url.searchParams.delete("id");
    }
    window.history.replaceState({}, "", url.toString());
  }, [selectedProjectId]);

  // Load project from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("id");
    if (id) {
      setSelectedProjectId(parseInt(id, 10));
    }
  }, []);

  // Handlers
  const handleFiltersChange = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
    saveProjectFilters(newFilters);
  }, []);

  const handleFiltersCollapsedChange = useCallback((collapsed: boolean) => {
    setFiltersCollapsed(collapsed);
    saveFiltersCollapsed(collapsed);
  }, []);

  const handleViewModeChange = useCallback((mode: "cards" | "list") => {
    setViewMode(mode);
    saveViewMode(mode);
  }, []);

  const handleActiveTabChange = useCallback((tab: "projects" | "work-queue") => {
    setActiveTab(tab);
    saveActiveTab(tab);
  }, []);

  const handleSelectProject = useCallback((projectId: number | null) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleCreateProject = useCallback(() => {
    setEditingProject(null);
    setProjectFormData({
      name: "",
      description: "",
      status: "open",
      ownerId: currentUserId,
    });
    setShowProjectModal(true);
  }, [currentUserId]);

  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setProjectFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
      ownerId: project.ownerId || undefined,
    });
    setShowProjectModal(true);
  }, []);

  const handleSaveProject = async () => {
    if (!projectFormData.name.trim()) return;

    setSavingProject(true);
    try {
      if (editingProject) {
        const updated = await updateProject(editingProject.id, {
          name: projectFormData.name.trim(),
          description: projectFormData.description.trim() || undefined,
          status: projectFormData.status,
          ownerId: projectFormData.ownerId,
        });
        if (updated) {
          setProjects((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }
      } else {
        const created = await createProject({
          name: projectFormData.name.trim(),
          description: projectFormData.description.trim() || undefined,
          status: projectFormData.status,
          ownerId: projectFormData.ownerId,
        });
        if (created) {
          setProjects((prev) => [...prev, created]);
          // Select the new project
          setSelectedProjectId(created.id);
        }
      }
      setShowProjectModal(false);
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = useCallback((project: Project) => {
    setDeletingProject(project);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteProject = async () => {
    if (!deletingProject) return;

    const success = await deleteProject(deletingProject.id);
    if (success) {
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      if (selectedProjectId === deletingProject.id) {
        setSelectedProjectId(null);
      }
    }
    setShowDeleteConfirm(false);
    setDeletingProject(null);
  };

  const handleStatusChange = async (project: Project, status: string) => {
    const updated = await updateProject(project.id, { status: status as ProjectStatus });
    if (updated) {
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  };

  const handleTasksChange = useCallback(() => {
    // Reload data to get updated counts
    loadData();
  }, [loadData]);

  // Computed values
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const counts = useMemo(() => {
    const all = projects;
    return {
      total: all.length,
      active: all.filter((p) => p.status === "active").length,
      open: all.filter((p) => p.status === "open").length,
      paused: all.filter((p) => p.status === "paused").length,
      complete: all.filter((p) => p.status === "complete").length,
      withOverdue: all.filter((p) => p.overdueTasksCount > 0).length,
      noTasks: all.filter((p) => p.openTasksCount === 0 && p.completedTasksCount === 0).length,
    };
  }, [projects]);

  // Filter projects for display (excluding those that don't match quick filters)
  const displayedProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.hasOverdueTasks && p.overdueTasksCount === 0) return false;
      if (filters.hasNoTasks && (p.openTasksCount > 0 || p.completedTasksCount > 0)) return false;
      return true;
    });
  }, [projects, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 relative">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-sky-500/5 to-cyan-500/5" />

        <div className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Title section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-2xl blur-md opacity-40" />
                  <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-lg">
                    <FolderKanban className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
                  <p className="text-sm text-slate-500">
                    {counts.total} project{counts.total !== 1 ? "s" : ""}{" "}
                    <span className="text-cyan-600 font-medium">{counts.active} active</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "w-64 pl-9 h-9 bg-white/80 border-slate-200 rounded-lg",
                      "focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                    )}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Status filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      {filters.status?.length === 1
                        ? PROJECT_STATUSES.find((s) => s.value === filters.status?.[0])?.label
                        : "All statuses"}
                      <ChevronDown className="h-4 w-4 ml-2 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleFiltersChange({ ...filters, status: undefined })}
                    >
                      All statuses
                    </DropdownMenuItem>
                    {PROJECT_STATUSES.map((status) => (
                      <DropdownMenuItem
                        key={status.value}
                        onClick={() => handleFiltersChange({ ...filters, status: [status.value] })}
                      >
                        {status.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* New Project button */}
                <Button
                  onClick={handleCreateProject}
                  className="h-9 bg-gradient-to-b from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/25"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Project
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={(v) => handleActiveTabChange(v as "projects" | "work-queue")}>
                <TabsList className="bg-slate-100/80 h-9">
                  <TabsTrigger value="projects" className="text-sm px-4">
                    <FolderKanban className="h-4 w-4 mr-1.5" />
                    Projects
                  </TabsTrigger>
                  <TabsTrigger value="work-queue" className="text-sm px-4">
                    <ListTodo className="h-4 w-4 mr-1.5" />
                    Work Queue
                    {counts.withOverdue > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 px-1.5 text-[10px] bg-red-100 text-red-700"
                      >
                        {counts.withOverdue}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Filter rail */}
        {activeTab === "projects" && (
          <ProjectFiltersRail
            filters={filters}
            onFiltersChange={handleFiltersChange}
            counts={counts}
            collapsed={filtersCollapsed}
            onCollapsedChange={handleFiltersCollapsedChange}
            currentUserId={currentUserId}
          />
        )}

        {/* Content area */}
        {activeTab === "projects" ? (
          <ProjectList
            projects={displayedProjects}
            loading={loading}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onStatusChange={handleStatusChange}
            nextTasks={nextTasks}
          />
        ) : (
          <WorkQueueView
            projects={projects.filter((p) => p.status !== "complete")}
            loading={loading}
            onTasksChange={handleTasksChange}
          />
        )}

        {/* Detail panel */}
        {activeTab === "projects" && selectedProject && (
          <ProjectDetailPanel
            project={selectedProject}
            onClose={() => setSelectedProjectId(null)}
            onEdit={() => handleEditProject(selectedProject)}
            onStatusChange={(status) => handleStatusChange(selectedProject, status)}
            onDelete={() => handleDeleteProject(selectedProject)}
            users={users}
            onTasksChange={handleTasksChange}
          />
        )}
      </div>

      {/* Project Modal */}
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "New Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update the project details below."
                : "Create a new project to organize your work."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Project name"
                value={projectFormData.name}
                onChange={(e) =>
                  setProjectFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="h-10"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Description
              </label>
              <textarea
                placeholder="What is this project about?"
                value={projectFormData.description}
                onChange={(e) =>
                  setProjectFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Status
                </label>
                <Select
                  value={projectFormData.status}
                  onValueChange={(value: ProjectStatus) =>
                    setProjectFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Owner
                </label>
                <Select
                  value={projectFormData.ownerId?.toString() || ""}
                  onValueChange={(value) =>
                    setProjectFormData((prev) => ({
                      ...prev,
                      ownerId: value ? parseInt(value, 10) : undefined,
                    }))
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProjectModal(false)}
              disabled={savingProject}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={!projectFormData.name.trim() || savingProject}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {savingProject ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingProject?.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingProject(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteProject}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
