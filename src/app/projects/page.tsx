"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  CheckSquare,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPageIdentity } from "@/lib/page-registry";
import { cn } from "@/lib/utils";

// Get page identity for theming
const pageIdentity = getPageIdentity("projects");
const theme = pageIdentity?.theme;
const PageIcon = pageIdentity?.icon || FolderKanban;

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  owner: Owner | null;
  createdBy: Owner | null;
  openTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
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

const STATUS_OPTIONS = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-700" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-700" },
  { value: "paused", label: "Paused", color: "bg-amber-100 text-amber-700" },
  { value: "complete", label: "Complete", color: "bg-slate-100 text-slate-600" },
];

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: number) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = STATUS_OPTIONS.find((s) => s.value === project.status) || STATUS_OPTIONS[1];
  const totalTasks = project.openTasksCount + project.completedTasksCount;
  const completionPercent =
    totalTasks > 0 ? Math.round((project.completedTasksCount / totalTasks) * 100) : 0;

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <FolderKanban className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-medium">{project.name}</h3>
            <Badge className={`text-xs mt-1 ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <MoreHorizontal className="h-4 w-4 text-slate-400" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg py-1 z-20 w-32">
                <button
                  onClick={() => {
                    onEdit(project);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this project?")) {
                      onDelete(project.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Task Stats */}
      <div className="flex items-center gap-4 text-sm mb-3">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="h-4 w-4 text-slate-400" />
          <span>{project.openTasksCount} open</span>
        </div>
        {project.overdueTasksCount > 0 && (
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{project.overdueTasksCount} overdue</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Owner */}
      {project.owner && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm text-muted-foreground">
          <span>Owner:</span>
          <span className="font-medium text-foreground">
            {project.owner.firstName} {project.owner.lastName}
          </span>
        </div>
      )}
    </div>
  );
}

function ProjectModal({
  project,
  users,
  onClose,
  onSave,
}: {
  project: Project | null;
  users: User[];
  onClose: () => void;
  onSave: () => void;
}) {
  const isNew = !project;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "active",
    ownerId: project?.owner?.id?.toString() || "",
  });

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        project: {
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          owner_id: formData.ownerId ? parseInt(formData.ownerId) : null,
        },
      };

      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSave();
      } else {
        console.error("Failed to save project");
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isNew ? "Create Project" : "Edit Project"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Project name"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[80px]"
              placeholder="What is this project about?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Owner
              </label>
              <select
                value={formData.ownerId}
                onChange={(e) =>
                  setFormData({ ...formData, ownerId: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">No owner</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects`),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`),
      ]);
      const [projectsData, usersData] = await Promise.all([
        projectsRes.json(),
        usersRes.json(),
      ]);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (projectId: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${projectId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    setModalOpen(false);
    setEditingProject(null);
    fetchData();
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeProjects = filteredProjects.filter(
    (p) => p.status === "active" || p.status === "open"
  );
  const pausedProjects = filteredProjects.filter((p) => p.status === "paused");
  const completedProjects = filteredProjects.filter(
    (p) => p.status === "complete"
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#FAFBFC]">
      {/* Premium Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="relative px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )} />
                <div className={cn(
                  "relative h-11 w-11 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-[1.02]",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )}>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
                  <PageIcon className="relative h-5 w-5 text-white drop-shadow-sm" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Projects
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {loading ? (
                    <span className="inline-block w-24 h-4 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-green-600">{activeProjects.length} active</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity",
                  theme && `bg-gradient-to-r ${theme.gradient}`
                )} style={{ opacity: 0.15 }} />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "w-72 h-11 pl-11 pr-4 text-sm rounded-xl transition-all duration-200",
                      "bg-slate-50 border border-slate-200/80",
                      "placeholder:text-slate-400",
                      "focus:outline-none focus:bg-white focus:border-cyan-300 focus:ring-4 focus:ring-cyan-500/10"
                    )}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 px-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* New Project Button */}
              <button
                onClick={handleCreate}
                className={cn(
                  "group relative flex items-center gap-2.5 h-11 px-5",
                  "text-white text-sm font-medium rounded-xl",
                  "shadow-lg active:scale-[0.98] transition-all duration-200",
                  theme && `bg-gradient-to-b ${theme.gradient} ${theme.shadow}`,
                  theme && "hover:shadow-xl"
                )}
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              Loading projects...
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mb-4 opacity-50" />
            <p>No projects found</p>
            <button
              onClick={handleCreate}
              className="mt-4 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Active Projects */}
          {activeProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Active ({activeProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused Projects */}
          {pausedProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Paused ({pausedProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pausedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Projects */}
          {completedProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Completed ({completedProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Project Modal */}
      {modalOpen && (
        <ProjectModal
          project={editingProject}
          users={users}
          onClose={() => {
            setModalOpen(false);
            setEditingProject(null);
          }}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
