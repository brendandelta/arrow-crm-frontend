"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  StickyNote,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageSquare,
  Video,
  Plus,
  ListTodo,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

interface Activity {
  id: number;
  kind: string;
  subject: string | null;
  occurredAt: string;
  outcome?: string | null;
}

interface TaskInfo {
  id: number;
  subject: string;
  dueAt: string | null;
  overdue: boolean;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
}

interface DealTarget {
  id: number;
  targetType: string;
  targetId: number;
  targetName: string;
  status: string;
  role: string | null;
  priority: number;
  lastActivityAt: string | null;
  activityCount: number;
  firstContactedAt?: string | null;
  lastContactedAt?: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  notes?: string | null;
  isStale: boolean;
  daysSinceContact: number | null;
  owner?: Owner | null;
  recentActivities?: Activity[];
  tasks?: TaskInfo[];
  nextTask?: TaskInfo | null;
}

interface DealTargetsSectionProps {
  targets: DealTarget[];
  dealId: number;
  onTargetUpdated: () => void;
  onAddTarget: () => void;
  onTargetClick?: (target: DealTarget) => void;
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "contacted", label: "Contacted" },
  { value: "engaged", label: "Engaged" },
  { value: "negotiating", label: "Negotiating" },
  { value: "committed", label: "Committed" },
  { value: "passed", label: "Passed" },
  { value: "on_hold", label: "On Hold" },
];

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-700",
  engaged: "bg-indigo-100 text-indigo-700",
  negotiating: "bg-violet-100 text-violet-700",
  committed: "bg-green-100 text-green-700",
  passed: "bg-red-100 text-red-600",
  on_hold: "bg-amber-100 text-amber-700",
};

const ACTIVITY_KINDS = [
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Video },
  { value: "whatsapp", label: "Message", icon: MessageSquare },
  { value: "note", label: "Note", icon: StickyNote },
];

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Video,
  whatsapp: MessageSquare,
  sms: MessageSquare,
  linkedin_message: MessageSquare,
  note: StickyNote,
  video_call: Video,
};

export function DealTargetsSection({ targets, dealId, onTargetUpdated, onAddTarget, onTargetClick }: DealTargetsSectionProps) {
  const [expandedTimelines, setExpandedTimelines] = useState<Set<number>>(new Set());
  const [loggingEventFor, setLoggingEventFor] = useState<{ targetId: number; kind: string } | null>(null);
  const [addingTaskFor, setAddingTaskFor] = useState<number | null>(null);

  // Summary counts
  const statusCounts = targets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const staleCount = targets.filter((t) => t.isStale).length;

  const toggleTimeline = (targetId: number) => {
    setExpandedTimelines((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }
      return next;
    });
  };

  const handleStatusChange = async (targetId: number, newStatus: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onTargetUpdated();
    } catch (err) {
      console.error("Failed to update target status:", err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.filter((s) => statusCounts[s.value]).map((s) => (
            <span
              key={s.value}
              className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[s.value]}`}
            >
              {s.label}: {statusCounts[s.value]}
            </span>
          ))}
          {staleCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 text-xs ml-2">
              {staleCount} need follow-up
            </Badge>
          )}
        </div>
        <button
          onClick={onAddTarget}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Target
        </button>
      </div>

      {/* Target Rows */}
      {targets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No outreach targets for this deal</p>
      ) : (
        <div className="space-y-3">
          {targets.map((target) => (
            <TargetRow
              key={target.id}
              target={target}
              dealId={dealId}
              isTimelineExpanded={expandedTimelines.has(target.id)}
              isLoggingEvent={loggingEventFor?.targetId === target.id}
              loggingKind={loggingEventFor?.targetId === target.id ? loggingEventFor.kind : undefined}
              isAddingTask={addingTaskFor === target.id}
              onToggleTimeline={() => toggleTimeline(target.id)}
              onStartLogEvent={(kind: string) => setLoggingEventFor({ targetId: target.id, kind })}
              onCancelLogEvent={() => setLoggingEventFor(null)}
              onStartAddTask={() => setAddingTaskFor(target.id)}
              onCancelAddTask={() => setAddingTaskFor(null)}
              onStatusChange={handleStatusChange}
              onTargetUpdated={onTargetUpdated}
              onTargetClick={onTargetClick}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ TargetRow Component ============

interface TargetRowProps {
  target: DealTarget;
  dealId: number;
  isTimelineExpanded: boolean;
  isLoggingEvent: boolean;
  loggingKind?: string;
  isAddingTask: boolean;
  onToggleTimeline: () => void;
  onStartLogEvent: (kind: string) => void;
  onCancelLogEvent: () => void;
  onStartAddTask: () => void;
  onCancelAddTask: () => void;
  onStatusChange: (targetId: number, status: string) => void;
  onTargetUpdated: () => void;
  onTargetClick?: (target: DealTarget) => void;
  formatDate: (date: string | null) => string;
}

function TargetRow({
  target,
  dealId,
  isTimelineExpanded,
  isLoggingEvent,
  loggingKind,
  isAddingTask,
  onToggleTimeline,
  onStartLogEvent,
  onCancelLogEvent,
  onStartAddTask,
  onCancelAddTask,
  onStatusChange,
  onTargetUpdated,
  onTargetClick,
  formatDate,
}: TargetRowProps) {
  const isStale = target.isStale || (target.daysSinceContact !== null && target.daysSinceContact > 7);

  // Use nextTask from backend if available, fall back to legacy nextStep
  const nextTask = target.nextTask;
  const nextActionText = nextTask
    ? `${nextTask.subject}${nextTask.dueAt ? ` · ${formatDate(nextTask.dueAt)}` : ""}`
    : target.nextStep
      ? `${target.nextStep}${target.nextStepAt ? ` · ${formatDate(target.nextStepAt)}` : ""}`
      : null;
  const isOverdue = nextTask?.overdue || (target.nextStepAt && new Date(target.nextStepAt) < new Date());

  return (
    <div
      className={`rounded-lg border p-4 ${
        isStale ? "border-l-4 border-l-amber-400 bg-amber-50/30" : "border-slate-200"
      }`}
    >
      {/* Row Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isStale && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
            <button
              onClick={() => onTargetClick?.(target)}
              className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors text-left"
            >
              {target.targetName}
            </button>
            {target.role && (
              <span className="text-xs text-slate-500 capitalize">
                · {target.role.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {/* Status + Last contact */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Status:</span>
              <select
                value={target.status}
                onChange={(e) => onStatusChange(target.id, e.target.value)}
                className={`text-xs px-1.5 py-0.5 rounded border-0 font-medium cursor-pointer ${STATUS_COLORS[target.status] || "bg-slate-100 text-slate-600"}`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-500">
              Last: {target.daysSinceContact !== null ? `${target.daysSinceContact}d ago` : "Never"}
            </span>
          </div>
        </div>

        {/* Owner */}
        {target.owner && (
          <span className="text-xs text-slate-500 shrink-0">
            {target.owner.firstName}
          </span>
        )}
      </div>

      {/* Two-column layout: Events left, Follow-up right */}
      <div className="flex gap-4 mt-3">
        {/* Left: Events */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Events</div>
          <div className="flex items-center gap-2">
            {target.recentActivities && target.recentActivities.length > 0 && (
              <button
                onClick={onToggleTimeline}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 transition-colors"
              >
                {isTimelineExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                {target.recentActivities.length} event{target.recentActivities.length !== 1 ? "s" : ""}
              </button>
            )}
            {!isLoggingEvent && (
              <button
                onClick={() => onStartLogEvent("call")}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Event
              </button>
            )}
          </div>

          {/* Expanded event list */}
          {isTimelineExpanded && target.recentActivities && (
            <div className="mt-2 space-y-1.5 pl-1">
              {target.recentActivities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.kind] || Clock;
                return (
                  <div key={activity.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <Icon className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate flex-1">{activity.subject || activity.kind}</span>
                    <span className="text-slate-400 shrink-0">{formatDate(activity.occurredAt)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Inline Log Event Form */}
          {isLoggingEvent && (
            <InlineLogEventForm
              dealId={dealId}
              targetId={target.id}
              initialKind={loggingKind || "call"}
              onCancel={onCancelLogEvent}
              onSuccess={() => {
                onCancelLogEvent();
                onTargetUpdated();
              }}
            />
          )}
        </div>

        {/* Right: Follow-up */}
        <div className="w-64 shrink-0 border-l pl-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Follow-up</div>
          {nextTask ? (
            <div className="mb-2">
              <div className={`text-sm ${isOverdue ? "text-red-600 font-medium" : "text-slate-700"}`}>
                {nextTask.subject}
              </div>
              {nextTask.dueAt && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CalendarClock className="h-3 w-3" />
                  {formatDate(nextTask.dueAt)}
                  {isOverdue && <span className="text-red-500 font-medium ml-1">Overdue</span>}
                </div>
              )}
            </div>
          ) : target.nextStep ? (
            <div className="mb-2">
              <div className="text-sm text-slate-700">{target.nextStep}</div>
              {target.nextStepAt && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CalendarClock className="h-3 w-3" />
                  {formatDate(target.nextStepAt)}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 mb-2">No follow-up set</div>
          )}

          {/* Open tasks count */}
          {target.tasks && target.tasks.length > 0 && (
            <div className="text-xs text-slate-500 mb-2">
              {target.tasks.length} open task{target.tasks.length !== 1 ? "s" : ""}
            </div>
          )}

          {!isAddingTask ? (
            <button
              onClick={onStartAddTask}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add Follow-up
            </button>
          ) : (
            <InlineAddTaskForm
              dealId={dealId}
              targetId={target.id}
              currentTaskId={nextTask?.id}
              onCancel={onCancelAddTask}
              onSuccess={() => {
                onCancelAddTask();
                onTargetUpdated();
              }}
            />
          )}
        </div>
      </div>

    </div>
  );
}

// ============ InlineLogEventForm Component ============

interface InlineLogEventFormProps {
  dealId: number;
  targetId: number;
  initialKind?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const DIRECTIONS = [
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
];

const CALL_OUTCOMES = [
  { value: "connected", label: "Connected" },
  { value: "no_answer", label: "No Answer" },
  { value: "left_voicemail", label: "Left Voicemail" },
  { value: "scheduled_followup", label: "Scheduled Follow-up" },
];

const MEETING_OUTCOMES = [
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No Show" },
  { value: "cancelled", label: "Cancelled" },
  { value: "scheduled_followup", label: "Scheduled Follow-up" },
];

const KINDS_WITH_DIRECTION = ["call", "email", "whatsapp", "sms", "linkedin_message"];
const KINDS_WITH_OUTCOME = ["call", "meeting"];
const KINDS_WITH_TIME = ["meeting"];

function InlineLogEventForm({ dealId, targetId, initialKind = "call", onCancel, onSuccess }: InlineLogEventFormProps) {
  const [kind, setKind] = useState(initialKind);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [direction, setDirection] = useState("outbound");
  const [outcome, setOutcome] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showDirection = KINDS_WITH_DIRECTION.includes(kind);
  const showOutcome = KINDS_WITH_OUTCOME.includes(kind);
  const showTime = KINDS_WITH_TIME.includes(kind);
  const outcomeOptions = kind === "meeting" ? MEETING_OUTCOMES : CALL_OUTCOMES;

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      kind,
      subject: subject.trim(),
      body: body.trim() || null,
      regarding_type: "DealTarget",
      regarding_id: targetId,
      deal_target_id: targetId,
      deal_id: dealId,
      occurred_at: new Date().toISOString(),
    };

    if (showDirection) payload.direction = direction;
    if (showOutcome && outcome) payload.outcome = outcome;
    if (showTime && startsAt) payload.starts_at = startsAt;
    if (showTime && endsAt) payload.ends_at = endsAt;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to log event:", err);
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
      {/* Kind selector */}
      <div className="flex items-center gap-2">
        {ACTIVITY_KINDS.map((k) => (
          <button
            key={k.value}
            onClick={() => setKind(k.value)}
            className={`text-xs px-2 py-1 rounded ${
              kind === k.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Subject */}
      <input
        type="text"
        placeholder="Subject (required)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full text-sm px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
        autoFocus
      />

      {/* Type-specific fields */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Direction: call, email, message types */}
        {showDirection && (
          <div className="flex items-center gap-1.5">
            {DIRECTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDirection(d.value)}
                className={`text-xs px-2 py-1 rounded ${
                  direction === d.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Outcome: call, meeting */}
        {showOutcome && (
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="">Outcome...</option>
            {outcomeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Meeting time fields */}
      {showTime && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Start:</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="text-xs border rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">End:</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="text-xs border rounded px-2 py-1"
            />
          </div>
        </div>
      )}

      {/* Body (optional) */}
      <textarea
        placeholder="Notes (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full text-sm px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
      />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!subject.trim() || submitting}
          className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Log Event"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ============ InlineAddTaskForm Component ============

interface InlineAddTaskFormProps {
  dealId: number;
  targetId: number;
  currentTaskId?: number | null;
  onCancel: () => void;
  onSuccess: () => void;
}

function InlineAddTaskForm({ dealId, targetId, currentTaskId, onCancel, onSuccess }: InlineAddTaskFormProps) {
  const [subject, setSubject] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    setSubmitting(true);

    try {
      // Mark the current follow-up task as complete
      if (currentTaskId) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${currentTaskId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create the new follow-up task
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          due_at: dueAt || null,
          priority: priority === "high" ? 2 : priority === "low" ? 0 : 1,
          deal_id: dealId,
          taskable_type: "DealTarget",
          taskable_id: targetId,
        }),
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-2 space-y-1.5">
      <input
        type="text"
        placeholder="Task description..."
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full text-xs px-2 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="text-xs border rounded px-1.5 py-1 flex-1"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs border rounded px-1.5 py-1"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleSubmit}
          disabled={!subject.trim() || submitting}
          className="px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
