"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Loader2,
  Calendar,
  MapPin,
  Video,
  Phone,
  Users,
  Building2,
  Briefcase,
  FileText,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Mail,
  Clock,
} from "lucide-react";

interface Attendee {
  id: number;
  type: string;
  attendeeId: number | null;
  email: string | null;
  name: string | null;
  role: string | null;
  responseStatus: string | null;
  isOrganizer: boolean;
}

interface ActivityDetail {
  id: number;
  kind: string;
  subject: string | null;
  body: string | null;
  direction: string | null;
  outcome: string | null;
  occurredAt: string;
  durationMinutes: number | null;
  regardingType: string;
  regardingId: number;
  dealTargetId: number | null;
  dealId: number | null;
  dealName: string | null;
  performedBy: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  isTask: boolean;
  taskCompleted: boolean;
  taskDueAt: string | null;
  isOverdue: boolean;
  assignedTo: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  // Meeting fields
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  locationType: string | null;
  meetingUrl: string | null;
  timezone: string | null;
  allDay: boolean;
  isScheduled: boolean;
  isUpcoming: boolean | null;
  attendeeCount: number;
  attendees: Attendee[];
  metadata: Record<string, unknown>;
  calendarId: string | null;
  calendarProvider: string | null;
  calendarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EventModalProps {
  activityId: number;
  onClose: () => void;
}

function formatDateTime(dateStr: string | null, allDay?: boolean) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (allDay) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDuration(minutes: number | null, start: string | null, end: string | null) {
  if (minutes) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return null;
}

function EventKindIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "call":
      return <Phone className="h-4 w-4" />;
    case "video_call":
      return <Video className="h-4 w-4" />;
    case "in_person_meeting":
      return <Users className="h-4 w-4" />;
    case "meeting":
      return <Calendar className="h-4 w-4" />;
    case "email":
      return <Mail className="h-4 w-4" />;
    case "whatsapp":
    case "sms":
      return <MessageSquare className="h-4 w-4" />;
    case "linkedin_message":
    case "linkedin_connection":
      return <ExternalLink className="h-4 w-4" />;
    case "note":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
}

function EventKindBadge({ kind }: { kind: string }) {
  const config: Record<string, { label: string; className: string }> = {
    call: { label: "Call", className: "bg-green-100 text-green-700" },
    video_call: { label: "Video Call", className: "bg-blue-100 text-blue-700" },
    in_person_meeting: { label: "In Person", className: "bg-purple-100 text-purple-700" },
    meeting: { label: "Meeting", className: "bg-indigo-100 text-indigo-700" },
    email: { label: "Email", className: "bg-amber-100 text-amber-700" },
    whatsapp: { label: "WhatsApp", className: "bg-emerald-100 text-emerald-700" },
    sms: { label: "SMS", className: "bg-cyan-100 text-cyan-700" },
    linkedin_message: { label: "LinkedIn", className: "bg-sky-100 text-sky-700" },
    note: { label: "Note", className: "bg-muted text-foreground" },
    task: { label: "Task", className: "bg-orange-100 text-orange-700" },
  };

  const { label, className } = config[kind] || {
    label: kind.replace(/_/g, " "),
    className: "bg-muted text-foreground",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <EventKindIcon kind={kind} />
      {label}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return null;

  const config: Record<string, { label: string; className: string }> = {
    connected: { label: "Connected", className: "bg-green-100 text-green-700" },
    voicemail: { label: "Voicemail", className: "bg-yellow-100 text-yellow-700" },
    no_answer: { label: "No Answer", className: "bg-muted text-muted-foreground" },
    left_message: { label: "Left Message", className: "bg-blue-100 text-blue-700" },
    replied: { label: "Replied", className: "bg-green-100 text-green-700" },
    bounced: { label: "Bounced", className: "bg-red-100 text-red-700" },
    scheduled: { label: "Scheduled", className: "bg-indigo-100 text-indigo-700" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    no_show: { label: "No Show", className: "bg-orange-100 text-orange-700" },
  };

  const { label, className } = config[outcome] || {
    label: outcome.replace(/_/g, " "),
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function EventModal({ activityId, onClose }: EventModalProps) {
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities/${activityId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch activity");
        }
        const data = await res.json();
        setActivity(data);
      } catch (err) {
        console.error("Failed to fetch activity:", err);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [activityId]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const isPast = activity?.startsAt ? new Date(activity.startsAt) < new Date() :
                 activity ? new Date(activity.occurredAt) < new Date() : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            ) : activity ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {activity.subject || `${activity.kind.replace(/_/g, " ")} Activity`}
                  </h2>
                  {activity.taskCompleted && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <EventKindBadge kind={activity.kind} />
                  {activity.outcome && <OutcomeBadge outcome={activity.outcome} />}
                  {isPast && !activity.taskCompleted && (
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                      Past
                    </span>
                  )}
                  {activity.isOverdue && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      Overdue
                    </span>
                  )}
                </div>
              </>
            ) : (
              <h2 className="text-lg font-semibold text-foreground">Event Details</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-muted-foreground rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : activity ? (
            <div className="space-y-6">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {formatDateTime(activity.startsAt || activity.occurredAt, activity.allDay)}
                  </div>
                  {!activity.allDay && activity.startsAt && activity.endsAt && (
                    <div className="text-sm text-muted-foreground">
                      {formatTime(activity.startsAt)} – {formatTime(activity.endsAt)}
                      <span className="text-muted-foreground ml-2">
                        ({formatDuration(activity.durationMinutes, activity.startsAt, activity.endsAt)})
                      </span>
                    </div>
                  )}
                  {activity.durationMinutes && !activity.endsAt && (
                    <div className="text-sm text-muted-foreground">
                      Duration: {formatDuration(activity.durationMinutes, null, null)}
                    </div>
                  )}
                  {activity.timezone && (
                    <div className="text-xs text-muted-foreground mt-0.5">{activity.timezone}</div>
                  )}
                </div>
              </div>

              {/* Location / Meeting URL */}
              {(activity.location || activity.meetingUrl) && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    {activity.location && (
                      <div className="text-sm font-medium text-foreground">{activity.location}</div>
                    )}
                    {activity.meetingUrl && (
                      <a
                        href={activity.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Video className="h-4 w-4" />
                        Join Meeting
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Related Deal */}
              {activity.dealId && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <Link
                      href={`/deals/${activity.dealId}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {activity.dealName || `Deal #${activity.dealId}`}
                    </Link>
                  </div>
                </div>
              )}

              {/* Attendees */}
              {activity.attendees && activity.attendees.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground mb-2">
                      Attendees ({activity.attendees.length})
                    </div>
                    <div className="space-y-2">
                      {activity.attendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {attendee.name?.charAt(0) || attendee.email?.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">
                              {attendee.name || attendee.email || "Unknown"}
                              {attendee.isOrganizer && (
                                <span className="ml-2 text-xs text-muted-foreground">(Organizer)</span>
                              )}
                            </div>
                            {attendee.email && attendee.name && (
                              <div className="text-xs text-muted-foreground truncate">{attendee.email}</div>
                            )}
                          </div>
                          {attendee.responseStatus && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              attendee.responseStatus === "accepted" ? "bg-green-100 text-green-700" :
                              attendee.responseStatus === "declined" ? "bg-red-100 text-red-700" :
                              attendee.responseStatus === "tentative" ? "bg-yellow-100 text-yellow-700" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {attendee.responseStatus}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Performed By */}
              {activity.performedBy && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Performed by</div>
                    <div className="text-sm font-medium text-foreground">
                      {activity.performedBy.firstName} {activity.performedBy.lastName}
                    </div>
                  </div>
                </div>
              )}

              {/* Body/Description */}
              {activity.body && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground mb-1">Notes</div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.body}</p>
                  </div>
                </div>
              )}

              {/* Task Due Date */}
              {activity.isTask && activity.taskDueAt && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Due Date</div>
                    <div className={`text-sm font-medium ${activity.isOverdue ? "text-red-600" : "text-foreground"}`}>
                      {new Date(activity.taskDueAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar link */}
              {activity.calendarUrl && (
                <div className="pt-2 border-t border-border">
                  <a
                    href={activity.calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View in {activity.calendarProvider === "gcal" ? "Google Calendar" :
                             activity.calendarProvider === "outlook" ? "Outlook" : "Calendar"}
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
