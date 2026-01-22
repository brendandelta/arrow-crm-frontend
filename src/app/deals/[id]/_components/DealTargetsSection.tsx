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
  nextStep: string | null;
  nextStepAt: string | null;
  isStale: boolean;
  daysSinceContact: number | null;
  owner?: Owner | null;
  recentActivities?: Activity[];
}

interface DealTargetsSectionProps {
  targets: DealTarget[];
  dealId: number;
  onTargetUpdated: () => void;
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

export function DealTargetsSection({ targets, dealId, onTargetUpdated }: DealTargetsSectionProps) {
  const [expandedTimelines, setExpandedTimelines] = useState<Set<number>>(new Set());
  const [loggingEventFor, setLoggingEventFor] = useState<number | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<number | null>(null);

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

  const handleSetFollowUp = async (targetId: number, date: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next_step_at: date }),
      });
      setEditingFollowUp(null);
      onTargetUpdated();
    } catch (err) {
      console.error("Failed to set follow-up:", err);
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
              isLoggingEvent={loggingEventFor === target.id}
              isEditingFollowUp={editingFollowUp === target.id}
              onToggleTimeline={() => toggleTimeline(target.id)}
              onStartLogEvent={() => setLoggingEventFor(target.id)}
              onCancelLogEvent={() => setLoggingEventFor(null)}
              onStartEditFollowUp={() => setEditingFollowUp(target.id)}
              onCancelEditFollowUp={() => setEditingFollowUp(null)}
              onStatusChange={handleStatusChange}
              onSetFollowUp={handleSetFollowUp}
              onTargetUpdated={onTargetUpdated}
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
  isEditingFollowUp: boolean;
  onToggleTimeline: () => void;
  onStartLogEvent: () => void;
  onCancelLogEvent: () => void;
  onStartEditFollowUp: () => void;
  onCancelEditFollowUp: () => void;
  onStatusChange: (targetId: number, status: string) => void;
  onSetFollowUp: (targetId: number, date: string) => void;
  onTargetUpdated: () => void;
  formatDate: (date: string | null) => string;
}

function TargetRow({
  target,
  dealId,
  isTimelineExpanded,
  isLoggingEvent,
  isEditingFollowUp,
  onToggleTimeline,
  onStartLogEvent,
  onCancelLogEvent,
  onStartEditFollowUp,
  onCancelEditFollowUp,
  onStatusChange,
  onSetFollowUp,
  onTargetUpdated,
  formatDate,
}: TargetRowProps) {
  const isStale = target.isStale || (target.daysSinceContact !== null && target.daysSinceContact > 7);

  // Derive next action
  const nextAction = target.nextStep
    ? `${target.nextStep}${target.nextStepAt ? ` · ${formatDate(target.nextStepAt)}` : ""}`
    : null;

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
            <span className="text-sm font-semibold text-slate-900">{target.targetName}</span>
            {target.role && (
              <span className="text-xs text-slate-500 capitalize">
                · {target.role.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {/* Status + Last + Next */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {/* Status dropdown */}
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

            {/* Last contact */}
            <span className="text-xs text-slate-500">
              Last: {target.daysSinceContact !== null ? `${target.daysSinceContact}d ago` : "Never"}
            </span>

            {/* Next follow-up */}
            {isEditingFollowUp ? (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  className="text-xs border rounded px-1.5 py-0.5"
                  autoFocus
                  onChange={(e) => {
                    if (e.target.value) {
                      onSetFollowUp(target.id, e.target.value);
                    }
                  }}
                  onBlur={() => onCancelEditFollowUp()}
                />
              </div>
            ) : (
              <button
                onClick={onStartEditFollowUp}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Next: {target.nextStepAt ? formatDate(target.nextStepAt) : "Set"}
              </button>
            )}
          </div>

          {/* Next action line */}
          {nextAction && (
            <div className="mt-1 text-xs text-slate-600 flex items-center gap-1">
              <span className="text-slate-400">→</span>
              <span className={target.nextStepAt && new Date(target.nextStepAt) < new Date() ? "text-red-600 font-medium" : ""}>
                {nextAction}
              </span>
            </div>
          )}
        </div>

        {/* Owner */}
        {target.owner && (
          <span className="text-xs text-slate-500 shrink-0">
            {target.owner.firstName}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3">
        {ACTIVITY_KINDS.map((kind) => {
          const Icon = kind.icon;
          return (
            <button
              key={kind.value}
              onClick={() => onStartLogEvent()}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
            >
              <Icon className="h-3 w-3" />
              {kind.label}
            </button>
          );
        })}
        <button
          onClick={onStartEditFollowUp}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
        >
          <CalendarClock className="h-3 w-3" />
          Follow-up
        </button>
      </div>

      {/* Inline Log Event Form */}
      {isLoggingEvent && (
        <InlineLogEventForm
          dealId={dealId}
          targetId={target.id}
          onCancel={onCancelLogEvent}
          onSuccess={() => {
            onCancelLogEvent();
            onTargetUpdated();
          }}
        />
      )}

      {/* Timeline toggle */}
      {target.recentActivities && target.recentActivities.length > 0 && (
        <div className="mt-3 border-t pt-2">
          <button
            onClick={onToggleTimeline}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
          >
            {isTimelineExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Timeline ({target.recentActivities.length} events)
          </button>

          {isTimelineExpanded && (
            <div className="mt-2 space-y-1.5 pl-2">
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
        </div>
      )}
    </div>
  );
}

// ============ InlineLogEventForm Component ============

interface InlineLogEventFormProps {
  dealId: number;
  targetId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

function InlineLogEventForm({ dealId, targetId, onCancel, onSuccess }: InlineLogEventFormProps) {
  const [kind, setKind] = useState("call");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    setSubmitting(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          subject: subject.trim(),
          body: body.trim() || null,
          regarding_type: "DealTarget",
          regarding_id: targetId,
          deal_id: dealId,
          occurred_at: new Date().toISOString(),
        }),
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
