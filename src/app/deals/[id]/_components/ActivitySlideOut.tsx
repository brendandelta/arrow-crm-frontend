"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  Loader2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Video,
  MessageSquare,
  StickyNote,
  CheckSquare,
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
  { value: "video_call", label: "Video", icon: Video, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-green-600", bgColor: "bg-green-100" },
  { value: "sms", label: "SMS", icon: MessageSquare, color: "text-slate-600", bgColor: "bg-slate-100" },
  { value: "linkedin_message", label: "LinkedIn", icon: Linkedin, color: "text-blue-700", bgColor: "bg-blue-100" },
  { value: "note", label: "Note", icon: StickyNote, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  { value: "task", label: "Task", icon: CheckSquare, color: "text-orange-600", bgColor: "bg-orange-100" },
];

const OUTCOMES = ["completed", "no_answer", "left_voicemail", "scheduled_followup", "declined", "interested", "not_interested"];

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return dateStr.slice(0, 16);
}

function getKindConfig(kind: string) {
  return ACTIVITY_KINDS.find((k) => k.value === kind) || ACTIVITY_KINDS.find((k) => k.value === "note")!;
}

const inputClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text";
const selectClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-pointer appearance-none";
const textareaClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text resize-none min-h-[100px]";

export function ActivitySlideOut({
  activity,
  dealId,
  onClose,
  onSave,
  onDelete,
}: ActivitySlideOutProps) {
  const isNew = !activity;
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
            <h2 className="text-lg font-semibold">
              {isNew ? "Log Activity" : activity?.subject || kindConfig.label}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-1">
            {/* Activity Type */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-2 px-3">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Type</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 px-3">
                {ACTIVITY_KINDS.map((k) => {
                  const Icon = k.icon;
                  return (
                    <button
                      key={k.value}
                      onClick={() => setFormData({ ...formData, kind: k.value })}
                      className={`flex flex-col items-center gap-1 py-2 px-1 text-[10px] font-medium rounded-lg border transition-all ${
                        formData.kind === k.value
                          ? `${k.bgColor} ${k.color} border-current`
                          : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {k.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Subject</span>
              </div>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={`${inputClass} font-medium`}
                placeholder="Brief description..."
                autoFocus={isNew}
              />
            </div>

            {/* Direction */}
            {showDirectionField && (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-2 px-3">
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Direction</span>
                </div>
                <div className="flex gap-2 px-3">
                  {(["outbound", "inbound"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setFormData({ ...formData, direction: d })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        formData.direction === d
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {d === "outbound" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* When */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {showTimeFields ? "Start Time" : "When"}
                </span>
              </div>
              <input
                type="datetime-local"
                value={showTimeFields ? formData.startsAt : formData.occurredAt}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [showTimeFields ? "startsAt" : "occurredAt"]: e.target.value,
                  })
                }
                className={selectClass}
              />
              {showTimeFields && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1 px-3">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">End Time</span>
                  </div>
                  <input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className={selectClass}
                  />
                </div>
              )}
            </div>

            {/* Outcome */}
            {showOutcomeField && (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-1 px-3">
                  <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Outcome</span>
                </div>
                <select
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  className={selectClass}
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

            {/* Task toggle */}
            <div className="py-2">
              <div className="flex items-center gap-3 px-3">
                <button
                  onClick={() => setFormData({ ...formData, isTask: !formData.isTask })}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    formData.isTask
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  {formData.isTask ? "This is a task" : "Mark as task"}
                </button>
                {formData.isTask && (
                  <button
                    onClick={() => setFormData({ ...formData, taskCompleted: !formData.taskCompleted })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      formData.taskCompleted
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {formData.taskCompleted ? "Completed" : "Open"}
                  </button>
                )}
              </div>
              {formData.isTask && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1 px-3">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Task Due Date</span>
                  </div>
                  <input
                    type="date"
                    value={formData.taskDueAt}
                    onChange={(e) => setFormData({ ...formData, taskDueAt: e.target.value })}
                    className={selectClass}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Notes</span>
              </div>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className={textareaClass}
                placeholder="Add notes..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          {!isNew && onDelete && (
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                  >
                    No
                  </button>
                </div>
              )}
            </>
          )}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isNew ? "Log Activity" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
