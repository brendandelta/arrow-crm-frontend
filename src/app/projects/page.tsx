"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  CheckSquare,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { PageHeader, PageSearch } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";

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
  { value: "complete", label: "Complete", color: "bg-muted text-muted-foreground" },
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
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
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
            className="p-1 hover:bg-muted rounded"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-card border rounded-md shadow-lg py-1 z-20 w-32">
                <button
                  onClick={() => {
                    onEdit(project);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
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
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
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
          <div className="h-2 bg-muted rounded-full overflow-hidden">
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
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isNew ? "Create Project" : "Edit Project"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
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
            <label className="block text-sm font-medium text-foreground mb-1">
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
              <label className="block text-sm font-medium text-foreground mb-1">
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
              <label className="block text-sm font-medium text-foreground mb-1">
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
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-md disabled:opacity-50"
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
    <div className="flex flex-col">
      <PageHeader
        subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
        primaryActionLabel="New Project"
        onPrimaryAction={handleCreate}
        search={
          <PageSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search projects..."
          />
        }
      />

      <div className="px-8 py-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FolderKanban className="h-12 w-12 mb-4 opacity-50" />
          <p>No projects found</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
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
    </div>
  );
}
