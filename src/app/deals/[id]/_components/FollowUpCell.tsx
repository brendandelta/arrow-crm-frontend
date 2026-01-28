"use client";

import { useState, useEffect } from "react";
import { Check, Plus, CalendarClock, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TaskInfo {
  id: number;
  subject: string;
  dueAt: string | null;
  overdue: boolean;
}

interface FollowUpCellProps {
  task?: TaskInfo | null;
  dealId: number;
  taskableType: string;
  taskableId: number;
  onUpdated: () => void;
  /** Compact mode for card views */
  compact?: boolean;
}

function relativeDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (dateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return `In ${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FollowUpCell({
  task,
  dealId,
  taskableType,
  taskableId,
  onUpdated,
  compact,
}: FollowUpCellProps) {
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [open, setOpen] = useState(false);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task || completing) return;
    setCompleting(true);
    setCompleted(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${task.id}/complete`,
        { method: "POST" }
      );
      onUpdated();
    } catch {
      setCompleted(false);
    }
    setCompleting(false);
  };

  // Completed state
  if (task && completed) {
    return (
      <div
        className="flex items-center gap-2 animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
        <span className="text-[12px] text-slate-400 line-through truncate">
          {task.subject}
        </span>
      </div>
    );
  }

  // Has a task
  if (task) {
    const dueLabel = relativeDate(task.dueAt);

    return (
      <div
        className="group/followup flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          disabled={completing}
          className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all disabled:opacity-50 ${
            task.overdue
              ? "border-rose-300 hover:border-rose-400 hover:bg-rose-50"
              : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50"
          }`}
        >
          <Check
            className={`h-2.5 w-2.5 opacity-0 group-hover/followup:opacity-60 transition-opacity ${
              task.overdue ? "text-rose-500" : "text-emerald-500"
            }`}
          />
        </button>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div
            className={`text-[12px] leading-tight truncate ${
              task.overdue ? "text-rose-600 font-medium" : "text-slate-700"
            }`}
          >
            {task.subject}
          </div>
          {dueLabel && (
            <div
              className={`text-[10px] leading-tight mt-0.5 ${
                task.overdue ? "text-rose-500 font-medium" : "text-slate-400"
              }`}
            >
              {dueLabel}
            </div>
          )}
        </div>

        {/* Add another task button */}
        {!compact && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className="p-0.5 rounded text-slate-300 opacity-0 group-hover/followup:opacity-100 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                title="Add task"
              >
                <Plus className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="w-80 p-0 rounded-xl shadow-xl"
            >
              <QuickTaskForm
                dealId={dealId}
                taskableType={taskableType}
                taskableId={taskableId}
                onSuccess={() => {
                  setOpen(false);
                  onUpdated();
                }}
                onCancel={() => setOpen(false)}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  // No task — show add button
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {compact ? (
            <button
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-500 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Follow-up
            </button>
          ) : (
            <button
              className="group/add flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-indigo-600 transition-colors py-0.5"
            >
              <div className="w-4 h-4 rounded-full border-[1.5px] border-dashed border-slate-300 group-hover/add:border-indigo-400 flex items-center justify-center transition-colors">
                <Plus className="h-2.5 w-2.5" />
              </div>
              <span>Add task</span>
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          className="w-80 p-0 rounded-xl shadow-xl"
        >
          <QuickTaskForm
            dealId={dealId}
            taskableType={taskableType}
            taskableId={taskableId}
            onSuccess={() => {
              setOpen(false);
              onUpdated();
            }}
            onCancel={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ============ Quick Task Form ============

interface QuickTaskFormProps {
  dealId: number;
  taskableType: string;
  taskableId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function QuickTaskForm({
  dealId,
  taskableType,
  taskableId,
  onSuccess,
  onCancel,
}: QuickTaskFormProps) {
  const [subject, setSubject] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [priority, setPriority] = useState("normal");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [users, setUsers] = useState<
    { id: number; firstName: string; lastName: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showMore && users.length === 0) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`)
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(() => {});
    }
  }, [showMore, users.length]);

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            subject: subject.trim(),
            due_at: dueAt || null,
            priority: priority === "high" ? 2 : priority === "low" ? 0 : 1,
            assigned_to_id: assignedToId ? Number(assignedToId) : null,
            deal_id: dealId,
            taskable_type: taskableType,
            taskable_id: taskableId,
          },
        }),
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && subject.trim()) handleSubmit();
    if (e.key === "Escape") onCancel();
  };

  // Quick-set due date buttons
  const setQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDueAt(d.toISOString().split("T")[0]);
  };

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="text-[12px] font-semibold text-slate-700">
        New follow-up
      </div>

      {/* Subject */}
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs to happen?"
        className="w-full text-[13px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white placeholder:text-slate-300 transition-all"
        autoFocus
      />

      {/* Due date quick picks */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3 w-3 text-slate-400" />
          <span className="text-[11px] text-slate-400">Due</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { label: "Today", days: 0 },
            { label: "Tomorrow", days: 1 },
            { label: "In 3d", days: 3 },
            { label: "In 1w", days: 7 },
          ].map((opt) => {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + opt.days);
            const target = targetDate.toISOString().split("T")[0];
            const isActive = dueAt === target;
            return (
              <button
                key={opt.days}
                onClick={() => setDueAt(isActive ? "" : target)}
                className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="text-[11px] bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-slate-600 ml-auto w-[110px]"
          />
        </div>
      </div>

      {/* Expandable extras */}
      {!showMore ? (
        <button
          onClick={() => setShowMore(true)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronDown className="h-3 w-3" />
          Priority & assign
        </button>
      ) : (
        <div className="flex items-center gap-2 animate-in slide-in-from-top-1 fade-in duration-150">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-[11px] bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-600"
          >
            <option value="low">Low priority</option>
            <option value="normal">Normal</option>
            <option value="high">High priority</option>
          </select>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="text-[11px] bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 flex-1"
          >
            <option value="">Assign to...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={!subject.trim() || submitting}
          className="flex-1 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-sm"
        >
          {submitting ? "Saving..." : "Add task"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
