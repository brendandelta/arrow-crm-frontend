"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Calendar,
  MapPin,
  Video,
  Phone,
  Users,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  Briefcase,
} from "lucide-react";

interface Deal {
  id: number;
  name: string;
  company: string | null;
}

interface NewEventModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EVENT_KINDS = [
  {
    value: "meeting",
    label: "Meeting",
    icon: Calendar,
    colors: {
      base: "border-slate-200 text-slate-600 bg-white",
      hover: "hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700",
      selected: "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500"
    }
  },
  {
    value: "call",
    label: "Call",
    icon: Phone,
    colors: {
      base: "border-slate-200 text-slate-600 bg-white",
      hover: "hover:border-green-300 hover:bg-green-50 hover:text-green-700",
      selected: "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500"
    }
  },
  {
    value: "video_call",
    label: "Video",
    icon: Video,
    colors: {
      base: "border-slate-200 text-slate-600 bg-white",
      hover: "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
      selected: "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
    }
  },
  {
    value: "in_person_meeting",
    label: "In Person",
    icon: Users,
    colors: {
      base: "border-slate-200 text-slate-600 bg-white",
      hover: "hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700",
      selected: "border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500"
    }
  },
  {
    value: "email",
    label: "Email",
    icon: Mail,
    colors: {
      base: "border-slate-200 text-slate-600 bg-white",
      hover: "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700",
      selected: "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500"
    }
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    colors: {
      base: "border-slate-200 text-slate-600 bg-white",
      hover: "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
      selected: "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
    }
  },
  {
    value: "linkedin_message",
    label: "LinkedIn",
    icon: MessageSquare,
    colors: {
      base: "border-slate-200 text-slate-600 bg-white",
      hover: "hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700",
      selected: "border-sky-500 bg-sky-50 text-sky-700 ring-1 ring-sky-500"
    }
  },
  {
    value: "note",
    label: "Note",
    icon: FileText,
    colors: {
      base: "border-slate-200 text-slate-600 bg-white",
      hover: "hover:border-slate-400 hover:bg-slate-100 hover:text-slate-700",
      selected: "border-slate-500 bg-slate-100 text-slate-700 ring-1 ring-slate-500"
    }
  },
];

const OUTCOMES = [
  { value: "", label: "No outcome yet" },
  { value: "connected", label: "Connected" },
  { value: "voicemail", label: "Voicemail" },
  { value: "no_answer", label: "No Answer" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export default function NewEventModal({ onClose, onSuccess }: NewEventModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);

  // Form state
  const [kind, setKind] = useState("meeting");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [startsAtTime, setStartsAtTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [dealId, setDealId] = useState<string>("");
  const [outcome, setOutcome] = useState("");

  // Fetch deals for the dropdown
  useEffect(() => {
    async function fetchDeals() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals`);
        if (res.ok) {
          const data = await res.json();
          setDeals(data);
        }
      } catch (err) {
        console.error("Failed to fetch deals:", err);
      } finally {
        setLoadingDeals(false);
      }
    }
    fetchDeals();
  }, []);

  // Set default date/time to now
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    const timeStr = `${hours}:${(minutes % 60).toString().padStart(2, "0")}`;
    setStartsAt(dateStr);
    setStartsAtTime(timeStr);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Combine date and time
      let startsAtISO: string | null = null;
      let endsAtISO: string | null = null;

      if (startsAt && startsAtTime) {
        const startDate = new Date(`${startsAt}T${startsAtTime}`);
        startsAtISO = startDate.toISOString();

        if (duration) {
          const endDate = new Date(startDate.getTime() + parseInt(duration) * 60 * 1000);
          endsAtISO = endDate.toISOString();
        }
      }

      const payload = {
        kind,
        subject: subject || null,
        body: body || null,
        starts_at: startsAtISO,
        ends_at: endsAtISO,
        duration_minutes: duration ? parseInt(duration) : null,
        location: location || null,
        meeting_url: meetingUrl || null,
        deal_id: dealId ? parseInt(dealId) : null,
        outcome: outcome || null,
        occurred_at: startsAtISO || new Date().toISOString(),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.errors?.join(", ") || "Failed to create event");
      }
    } catch (err) {
      console.error("Failed to create event:", err);
      setError("Failed to create event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedKind = EVENT_KINDS.find(k => k.value === kind);
  const KindIcon = selectedKind?.icon || Calendar;

  // Get header colors based on selected kind
  const getHeaderColors = () => {
    switch (kind) {
      case "meeting": return { bg: "bg-indigo-100", text: "text-indigo-600" };
      case "call": return { bg: "bg-green-100", text: "text-green-600" };
      case "video_call": return { bg: "bg-blue-100", text: "text-blue-600" };
      case "in_person_meeting": return { bg: "bg-purple-100", text: "text-purple-600" };
      case "email": return { bg: "bg-amber-100", text: "text-amber-600" };
      case "whatsapp": return { bg: "bg-emerald-100", text: "text-emerald-600" };
      case "linkedin_message": return { bg: "bg-sky-100", text: "text-sky-600" };
      case "note": return { bg: "bg-slate-100", text: "text-slate-600" };
      default: return { bg: "bg-blue-100", text: "text-blue-600" };
    }
  };
  const headerColors = getHeaderColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 ${headerColors.bg} rounded-xl flex items-center justify-center transition-colors`}>
              <KindIcon className={`h-5 w-5 ${headerColors.text} transition-colors`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">New Event</h2>
              <p className="text-xs text-slate-500">{selectedKind?.label || 'Meeting'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Event Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_KINDS.map((k) => {
                  const Icon = k.icon;
                  const isSelected = kind === k.value;
                  return (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setKind(k.value)}
                      className={`
                        flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2
                        text-xs font-medium transition-all duration-150 ease-out
                        ${isSelected ? k.colors.selected : `${k.colors.base} ${k.colors.hover}`}
                        ${isSelected ? 'shadow-sm scale-[1.02]' : 'hover:shadow-sm hover:scale-[1.02]'}
                      `}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? '' : 'opacity-70'}`} />
                      <span className={isSelected ? 'font-semibold' : ''}>{k.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Meeting with..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Time
                </label>
                <input
                  type="time"
                  value={startsAtTime}
                  onChange={(e) => setStartsAtTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            {/* Location / Meeting URL */}
            {(kind === "meeting" || kind === "in_person_meeting" || kind === "video_call") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Office, Coffee shop..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Video className="inline h-4 w-4 mr-1" />
                    Meeting URL
                  </label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://zoom.us/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Deal */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Related Deal (optional)
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingDeals}
              >
                <option value="">No deal</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.name} {deal.company && `(${deal.company})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Outcome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Notes
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add notes about this event..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
