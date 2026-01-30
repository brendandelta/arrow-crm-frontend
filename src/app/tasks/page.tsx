"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, FolderKanban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  TasksHeader,
  type TasksTab,
} from "./_components/TasksHeader";
import {
  TasksFilterRail,
  type ViewType,
} from "./_components/TasksFilterRail";
import { TaskGroupSection, EntityGroupSection } from "./_components/TaskGroupSection";
import { TaskRow, TaskRowSkeleton } from "./_components/TaskRow";
import { TaskInspector } from "./_components/TaskInspector";
import { CreateTaskDialog } from "./_components/CreateTaskDialog";
import {
  type Task,
  type TaskStats,
  type TaskGroup,
  type UserOption,
  type AttachmentType,
  fetchTasks,
  fetchTaskStats,
  fetchMyTasks,
  fetchTasksByDeal,
  fetchTasksByProject,
  fetchUsers,
  groupTasksByUrgency,
  loadTasksTab,
  saveTasksTab,
  loadTasksView,
  saveTasksView,
  loadFilterRailCollapsed,
  saveFilterRailCollapsed,
  loadGroupBy,
  saveGroupBy,
} from "@/lib/tasks-api";

type GroupByType = "deal" | "project";

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Core state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Grouped mode state
  const [dealGroups, setDealGroups] = useState<TaskGroup[]>([]);
  const [projectGroups, setProjectGroups] = useState<TaskGroup[]>([]);
  const [groupedLoading, setGroupedLoading] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<TasksTab>("queue");
  const [activeView, setActiveView] = useState<ViewType>("my");
  const [attachmentFilter, setAttachmentFilter] = useState<AttachmentType | "all">("all");
  const [filterRailCollapsed, setFilterRailCollapsed] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByType>("deal");
  const [subGroupByAssociation, setSubGroupByAssociation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Inspector state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Initialize from URL params (for redirects) or localStorage
  useEffect(() => {
    // URL params take precedence (for legacy route redirects)
    const urlTab = searchParams.get("tab") as TasksTab | null;
    const urlView = searchParams.get("view") as ViewType | null;
    const urlGroupBy = searchParams.get("groupBy") as GroupByType | null;

    // Load from localStorage as fallback
    const storedTab = loadTasksTab() as TasksTab;
    const storedView = loadTasksView() as ViewType;
    const storedCollapsed = loadFilterRailCollapsed();
    const storedGroupBy = loadGroupBy() as GroupByType;

    // Apply URL params if present, otherwise use stored values
    setActiveTab(urlTab || storedTab);
    setActiveView(urlView || storedView);
    setFilterRailCollapsed(storedCollapsed);
    setGroupBy(urlGroupBy || storedGroupBy);

    // Check URL for task ID
    const taskId = searchParams.get("task");
    if (taskId) {
      // Will be handled after tasks load
    }
  }, [searchParams]);

  // Persist state changes
  useEffect(() => {
    saveTasksTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveTasksView(activeView);
  }, [activeView]);

  useEffect(() => {
    saveFilterRailCollapsed(filterRailCollapsed);
  }, [filterRailCollapsed]);

  useEffect(() => {
    saveGroupBy(groupBy);
  }, [groupBy]);

  // Fetch stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await fetchTaskStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch users for assignee selection
  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  // Fetch tasks based on current view and filters
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "completed") {
        // Completed tab
        const data = await fetchTasks({
          status: "completed",
          attachment: attachmentFilter !== "all" ? attachmentFilter : undefined,
          q: searchQuery || undefined,
        });
        setTasks(data);
      } else if (activeTab === "queue") {
        // Queue tab - fetch based on view
        let data: Task[] = [];

        switch (activeView) {
          case "my":
            // Use my_tasks endpoint which returns grouped
            const myTasks = await fetchMyTasks(user?.id);
            data = [
              ...(myTasks.overdue || []),
              ...(myTasks.dueToday || []),
              ...(myTasks.dueThisWeek || []),
              ...(myTasks.upcoming || []),
              ...(myTasks.noDueDate || []),
            ];
            break;
          case "team":
            data = await fetchTasks({
              status: "open",
              rootOnly: true,
              attachment: attachmentFilter !== "all" ? attachmentFilter : undefined,
              q: searchQuery || undefined,
            });
            break;
          case "overdue":
            data = await fetchTasks({
              status: "overdue",
              rootOnly: true,
              attachment: attachmentFilter !== "all" ? attachmentFilter : undefined,
              q: searchQuery || undefined,
            });
            break;
          case "dueToday":
            data = await fetchTasks({
              status: "open",
              rootOnly: true,
              attachment: attachmentFilter !== "all" ? attachmentFilter : undefined,
              q: searchQuery || undefined,
            });
            // Filter to due today client-side
            data = data.filter((t) => t.dueToday);
            break;
          case "dueThisWeek":
            data = await fetchTasks({
              status: "due_soon",
              rootOnly: true,
              attachment: attachmentFilter !== "all" ? attachmentFilter : undefined,
              q: searchQuery || undefined,
            });
            break;
          case "unassigned":
            data = await fetchTasks({
              status: "open",
              unassigned: true,
              rootOnly: true,
              attachment: attachmentFilter !== "all" ? attachmentFilter : undefined,
              q: searchQuery || undefined,
            });
            break;
          case "waiting":
          case "blocked":
            data = await fetchTasks({
              status: "open",
              rootOnly: true,
              attachment: attachmentFilter !== "all" ? attachmentFilter : undefined,
              q: searchQuery || undefined,
            });
            // Filter by status client-side
            data = data.filter((t) => t.status === (activeView === "waiting" ? "waiting" : "blocked"));
            break;
          default:
            data = await fetchTasks({
              status: "open",
              rootOnly: true,
              attachment: attachmentFilter !== "all" ? attachmentFilter : undefined,
              q: searchQuery || undefined,
            });
        }

        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeView, attachmentFilter, searchQuery, user?.id]);

  // Fetch grouped data
  const loadGroupedData = useCallback(async () => {
    if (activeTab !== "grouped") return;

    setGroupedLoading(true);
    try {
      if (groupBy === "deal") {
        const data = await fetchTasksByDeal();
        setDealGroups(data);
      } else {
        const data = await fetchTasksByProject();
        setProjectGroups(data);
      }
    } catch (error) {
      console.error("Failed to fetch grouped data:", error);
    } finally {
      setGroupedLoading(false);
    }
  }, [activeTab, groupBy]);

  // Initial load
  useEffect(() => {
    loadStats();
    loadUsers();
  }, [loadStats, loadUsers]);

  // Load tasks when filters change
  useEffect(() => {
    if (activeTab !== "grouped") {
      loadTasks();
    } else {
      loadGroupedData();
    }
  }, [activeTab, activeView, attachmentFilter, searchQuery, loadTasks, loadGroupedData]);

  // Group tasks by urgency for Queue view
  const groupedTasks = useMemo(() => {
    if (activeTab !== "queue" || activeView !== "my" && activeView !== "team") {
      return null;
    }
    return groupTasksByUrgency(tasks);
  }, [tasks, activeTab, activeView]);

  // Handle task selection
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setInspectorOpen(true);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set("task", task.id.toString());
    router.replace(`/tasks?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Handle task update from inspector
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setSelectedTask(updatedTask);
    loadStats();
  }, [loadStats]);

  // Handle task deletion (from TaskRow which passes Task)
  const handleTaskDeleteFromRow = useCallback((task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    loadStats();
  }, [loadStats]);

  // Handle task deletion (from TaskInspector which passes taskId)
  const handleTaskDeleteFromInspector = useCallback((taskId: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
    setInspectorOpen(false);
    loadStats();
  }, [loadStats]);

  // Handle task completion
  const handleTaskComplete = useCallback((task: Task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      )
    );
    loadStats();
  }, [loadStats]);

  // Handle task uncomplete
  const handleTaskUncomplete = useCallback((task: Task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: false, completedAt: null } : t
      )
    );
    loadStats();
  }, [loadStats]);

  // Handle new task created
  const handleTaskCreated = useCallback((task: Task) => {
    setTasks((prev) => [task, ...prev]);
    loadStats();
  }, [loadStats]);

  // Close inspector
  const handleCloseInspector = useCallback(() => {
    setInspectorOpen(false);
    setSelectedTask(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("task");
    router.replace(`/tasks?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Render queue content
  const renderQueueContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <TaskRowSkeleton />
              <TaskRowSkeleton />
              <TaskRowSkeleton />
            </div>
          ))}
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Loader2 className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No tasks found</h3>
          <p className="text-sm text-slate-500 mb-4">
            {activeView === "my"
              ? "You're all caught up! No tasks assigned to you."
              : "No tasks match the current filters."}
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            Create a task
          </Button>
        </div>
      );
    }

    // For My Queue and Team Queue, show grouped by urgency
    if (groupedTasks && (activeView === "my" || activeView === "team")) {
      return (
        <div className="space-y-6">
          <TaskGroupSection
            title="Overdue"
            tasks={groupedTasks.overdue}
            variant="overdue"
            defaultOpen={true}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            onTaskUncomplete={handleTaskUncomplete}
            onTaskDelete={handleTaskDeleteFromRow}
          />
          <TaskGroupSection
            title="Due Today"
            tasks={groupedTasks.dueToday}
            variant="dueToday"
            defaultOpen={true}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            onTaskUncomplete={handleTaskUncomplete}
            onTaskDelete={handleTaskDeleteFromRow}
          />
          <TaskGroupSection
            title="Due This Week"
            tasks={groupedTasks.dueThisWeek}
            variant="dueThisWeek"
            defaultOpen={true}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            onTaskUncomplete={handleTaskUncomplete}
            onTaskDelete={handleTaskDeleteFromRow}
          />
          <TaskGroupSection
            title="Upcoming"
            tasks={groupedTasks.upcoming}
            variant="upcoming"
            defaultOpen={false}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            onTaskUncomplete={handleTaskUncomplete}
            onTaskDelete={handleTaskDeleteFromRow}
          />
          <TaskGroupSection
            title="No Due Date"
            tasks={groupedTasks.noDueDate}
            variant="noDueDate"
            defaultOpen={false}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            onTaskUncomplete={handleTaskUncomplete}
            onTaskDelete={handleTaskDeleteFromRow}
          />
        </div>
      );
    }

    // For other views, show flat list
    return (
      <div className="space-y-0.5">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onClick={handleTaskClick}
            onComplete={handleTaskComplete}
            onUncomplete={handleTaskUncomplete}
            onDelete={handleTaskDeleteFromRow}
            onEdit={handleTaskClick}
          />
        ))}
      </div>
    );
  };

  // Render grouped content
  const renderGroupedContent = () => {
    if (groupedLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    const groups = groupBy === "deal" ? dealGroups : projectGroups;

    if (groups.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            {groupBy === "deal" ? (
              <Building2 className="h-6 w-6 text-slate-400" />
            ) : (
              <FolderKanban className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            No {groupBy === "deal" ? "deals" : "projects"} with tasks
          </h3>
          <p className="text-sm text-slate-500">
            Tasks attached to {groupBy === "deal" ? "deals" : "projects"} will appear here.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {groups.map((group, index) => (
          <EntityGroupSection
            key={`${groupBy}-${group.id ?? index}`}
            id={group.id}
            name={group.name}
            subtitle={group.company}
            status={group.status}
            tasks={group.tasks}
            variant={groupBy}
            overdueCount={group.overdueCount}
            subGroupByAssociation={groupBy === "deal" && subGroupByAssociation}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            onTaskUncomplete={handleTaskUncomplete}
            onTaskDelete={handleTaskDeleteFromRow}
            onTaskCreated={handleTaskCreated}
          />
        ))}
      </div>
    );
  };

  // Render completed content
  const renderCompletedContent = () => {
    if (loading) {
      return (
        <div className="space-y-0.5">
          <TaskRowSkeleton />
          <TaskRowSkeleton />
          <TaskRowSkeleton />
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Loader2 className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No completed tasks</h3>
          <p className="text-sm text-slate-500">
            Completed tasks will appear here.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onClick={handleTaskClick}
            onComplete={handleTaskComplete}
            onUncomplete={handleTaskUncomplete}
            onDelete={handleTaskDeleteFromRow}
            onEdit={handleTaskClick}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#fafbfd]">
      {/* Header */}
      <TasksHeader
        stats={stats}
        statsLoading={statsLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreateTask={() => setShowCreateDialog(true)}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        subGroupByAssociation={subGroupByAssociation}
        onSubGroupChange={setSubGroupByAssociation}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filter rail - only show for Queue tab */}
        {activeTab === "queue" && (
          <TasksFilterRail
            activeView={activeView}
            onViewChange={setActiveView}
            attachmentFilter={attachmentFilter}
            onAttachmentFilterChange={setAttachmentFilter}
            stats={stats}
            collapsed={filterRailCollapsed}
            onCollapsedChange={setFilterRailCollapsed}
            users={users}
            currentUserId={user?.id}
          />
        )}

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Content based on tab */}
              {activeTab === "queue" && renderQueueContent()}
              {activeTab === "grouped" && renderGroupedContent()}
              {activeTab === "completed" && renderCompletedContent()}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Task Inspector */}
      <TaskInspector
        task={selectedTask}
        open={inspectorOpen}
        onClose={handleCloseInspector}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDeleteFromInspector}
        users={users}
      />

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onTaskCreated={handleTaskCreated}
        users={users}
      />
    </div>
  );
}
