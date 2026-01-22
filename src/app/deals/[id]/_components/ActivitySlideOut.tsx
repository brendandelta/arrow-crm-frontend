"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Pencil,
  Save,
  Loader2,
  Trash2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Video,
  MessageSquare,
  StickyNote,
  CheckSquare,
  Upload,
  RefreshCw,
  Users,
  Linkedin,
  Clock,
  User,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Activity {
  id: number;
  kind: string;
  subject: string | null;
  body?: string | null;
  occurredAt: string;
  startsAt?: string | null;
  endsAt?: string | null;
  outcome?: string | null;
  direction?: string | null;
  isTask?: boolean;
  taskCompleted?: boolean;
  taskDueAt?: string | null;
  performedBy?: Owner | null;
  assignedTo?: Owner | null;
}

interface ActivitySlideOutProps {
  activity: Activity | null;
  dealId: number;
  onClose: () => void;
  onSave: (activity: Activity) => void;
  onDelete?: (activityId: number) => void;
}

const ACTIVITY_KINDS = [
  { value: "call", label: "Call", icon: Phone, color: "text-blue-600", bgColor: "bg-blue-100" },
  { value: "email", label: "Email", icon: Mail, color: "text-purple-600", bgColor: "bg-purple-100" },
  { value: "meeting", label: "Meeting", icon: Calendar, color: "text-green-600", bgColor: "bg-green-100" },
  { value: "in_person_meeting", label: "In-Person", icon: Users, color: "text-green-600", bgColor: "bg-green-100" },
  { value: "video_call", label: "Video Call", icon: Video, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-green-600", bgColor: "bg-green-100" },
  { value: "sms", label: "SMS", icon: MessageSquare, color: "text-slate-600", bgColor: "bg-slate-100" },
  { value: "linkedin_message", label: "LinkedIn", icon: Linkedin, color: "text-blue-700", bgColor: "bg-blue-100" },
  { value: "note", label: "Note", icon: StickyNote, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  { value: "task", label: "Task", icon: CheckSquare, color: "text-orange-600", bgColor: "bg-orange-100" },
];

const OUTCOMES = ["completed", "no_answer", "left_voicemail", "scheduled_followup", "declined", "interested", "not_interested"];
const DIRECTIONS = ["inbound", "outbound"];

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return dateStr.slice(0, 16); // Format for datetime-local input
}

function formatDateTimeDisplay(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateDisplay(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function FieldRow({
  label,
  children,
  missing = false,
  icon: Icon,
}: {
  label: string;
  children: React.ReactNode;
  missing?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <label className="text-sm font-medium text-slate-500">{label}</label>
        {missing && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Missing
          </span>
        )}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function getKindConfig(kind: string) {
  return ACTIVITY_KINDS.find((k) => k.value === kind) || ACTIVITY_KINDS.find((k) => k.value === "note")!;
}

export function ActivitySlideOut({
  activity,
  dealId,
  onClose,
  onSave,
  onDelete,
}: ActivitySlideOutProps) {
  const isNew = !activity;
  const [editing, setEditing] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    kind: activity?.kind || "note",
    subject: activity?.subject || "",
    body: activity?.body || "",
    occurredAt: formatDateTime(activity?.occurredAt) || formatDateTime(new Date().toISOString()),
    startsAt: formatDateTime(activity?.startsAt),
    endsAt: formatDateTime(activity?.endsAt),
    outcome: activity?.outcome || "",
    direction: activity?.direction || "",
    isTask: activity?.isTask || false,
    taskCompleted: activity?.taskCompleted || false,
    taskDueAt: activity?.taskDueAt?.split("T")[0] || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        activity: {
          deal_id: dealId,
          kind: formData.kind,
          subject: formData.subject || null,
          body: formData.body || null,
          occurred_at: formData.occurredAt || new Date().toISOString(),
          starts_at: formData.startsAt || null,
          ends_at: formData.endsAt || null,
          outcome: formData.outcome || null,
          direction: formData.direction || null,
          is_task: formData.isTask,
          task_completed: formData.taskCompleted,
          task_due_at: formData.taskDueAt || null,
        },
      };

      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities/${activity.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
        if (!isNew) setEditing(false);
      } else {
        console.error("Failed to save activity");
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!activity || !onDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities/${activity.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onDelete(activity.id);
        onClose();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeleting(false);
  };

  const kindConfig = getKindConfig(formData.kind);
  const KindIcon = kindConfig.icon;

  const showDirectionField = ["call", "email", "sms", "whatsapp", "linkedin_message"].includes(formData.kind);
  const showTimeFields = ["meeting", "in_person_meeting", "video_call", "call"].includes(formData.kind);
  const showOutcomeField = ["call", "meeting", "in_person_meeting", "video_call"].includes(formData.kind);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${kindConfig.bgColor}`}>
              <KindIcon className={`h-5 w-5 ${kindConfig.color}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {isNew ? "Log Activity" : activity?.subject || kindConfig.label}
              </h2>
              {!isNew && activity?.occurredAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDateTimeDisplay(activity.occurredAt)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editing ? (
            <div className="space-y-4">
              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Activity Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {ACTIVITY_KINDS.map((k) => {
                    const Icon = k.icon;
                    return (
                      <button
                        key={k.value}
                        onClick={() => setFormData({ ...formData, kind: k.value })}
                        className={`flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium rounded border transition-colors ${
                          formData.kind === k.value
                            ? `${k.bgColor} ${k.color} border-current`
                            : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {k.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-slate-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Brief description of the activity"
                />
              </div>

              {/* Direction (for calls, emails, messages) */}
              {showDirectionField && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">Direction</label>
                  <div className="flex gap-2">
                    {DIRECTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setFormData({ ...formData, direction: d })}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded border transition-colors ${
                          formData.direction === d
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {d === "outbound" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4" />
                        )}
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date/Time */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">When</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={showTimeFields ? "" : "col-span-2"}>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      {showTimeFields ? "Start Time" : "Occurred At"}
                    </label>
                    <input
                      type="datetime-local"
                      value={showTimeFields ? formData.startsAt : formData.occurredAt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [showTimeFields ? "startsAt" : "occurredAt"]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  {showTimeFields && (
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={formData.endsAt}
                        onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Outcome (for calls, meetings) */}
              {showOutcomeField && (
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-slate-500 mb-2">Outcome</label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="">Select outcome...</option>
                    {OUTCOMES.map((o) => (
                      <option key={o} value={o}>
                        {o.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Task Options */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="isTask"
                    checked={formData.isTask}
                    onChange={(e) => setFormData({ ...formData, isTask: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label htmlFor="isTask" className="text-sm font-medium text-slate-700">
                    This is a task (requires follow-up)
                  </label>
                </div>
                {formData.isTask && (
                  <div className="grid grid-cols-2 gap-4 ml-7">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={formData.taskDueAt}
                        onChange={(e) => setFormData({ ...formData, taskDueAt: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.taskCompleted}
                          onChange={(e) => setFormData({ ...formData, taskCompleted: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">Completed</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Body/Notes */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-slate-500 mb-1">Notes</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[120px]"
                  placeholder="Details about this activity..."
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-1">
              {/* Type Badge */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b">
                <Badge className={`${kindConfig.bgColor} ${kindConfig.color}`}>
                  {kindConfig.label}
                </Badge>
                {activity?.direction && (
                  <Badge variant="outline" className="capitalize">
                    {activity.direction === "outbound" ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownLeft className="h-3 w-3 mr-1" />
                    )}
                    {activity.direction}
                  </Badge>
                )}
                {activity?.isTask && (
                  <Badge
                    className={
                      activity.taskCompleted
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    {activity.taskCompleted ? "Completed" : "Todo"}
                  </Badge>
                )}
              </div>

              {/* Subject */}
              <FieldRow label="Subject" missing={!activity?.subject}>
                {activity?.subject ? (
                  <span className="font-medium">{activity.subject}</span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Occurred At */}
              <FieldRow label="Date & Time" icon={Clock}>
                {activity?.occurredAt ? (
                  <span>{formatDateTimeDisplay(activity.occurredAt)}</span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Start/End Time (for meetings) */}
              {(activity?.startsAt || activity?.endsAt) && (
                <FieldRow label="Duration" icon={Calendar}>
                  <div>
                    {activity.startsAt && <span>{formatDateTimeDisplay(activity.startsAt)}</span>}
                    {activity.startsAt && activity.endsAt && <span> — </span>}
                    {activity.endsAt && <span>{formatDateTimeDisplay(activity.endsAt)}</span>}
                  </div>
                </FieldRow>
              )}

              {/* Outcome */}
              <FieldRow label="Outcome" missing={showOutcomeField && !activity?.outcome}>
                {activity?.outcome ? (
                  <Badge variant="outline">
                    {activity.outcome.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Task Due Date */}
              {activity?.isTask && (
                <FieldRow label="Task Due Date" missing={!activity?.taskDueAt} icon={CheckSquare}>
                  {activity?.taskDueAt ? (
                    <span>{formatDateDisplay(activity.taskDueAt)}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </FieldRow>
              )}

              {/* Performed By */}
              <FieldRow label="Performed By" missing={!activity?.performedBy} icon={User}>
                {activity?.performedBy ? (
                  <span>
                    {activity.performedBy.firstName} {activity.performedBy.lastName}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Assigned To (for tasks) */}
              {activity?.isTask && (
                <FieldRow label="Assigned To" missing={!activity?.assignedTo} icon={User}>
                  {activity?.assignedTo ? (
                    <span>
                      {activity.assignedTo.firstName} {activity.assignedTo.lastName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Not assigned</span>
                  )}
                </FieldRow>
              )}

              {/* Body/Notes */}
              <FieldRow label="Notes" missing={!activity?.body} icon={FileText}>
                {activity?.body ? (
                  <p className="whitespace-pre-wrap">{activity.body}</p>
                ) : (
                  <span className="text-muted-foreground italic">No notes</span>
                )}
              </FieldRow>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          {!isNew && onDelete && !editing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Delete this activity?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
            </div>
          )}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3 ml-auto">
              {editing && !isNew && (
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
              )}
              {editing ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isNew ? "Log Activity" : "Save Changes"}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
