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
  PlayCircle,
  ListTodo,
  MessageSquare
} from "lucide-react";

interface Attendee {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  avatarUrl: string | null;
}

interface MeetingDetail {
  id: number;
  title: string;
  description: string | null;
  kind: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string | null;
  allDay: boolean;
  isRecurring: boolean;
  recurrenceRule: string | null;
  location: string | null;
  locationType: string | null;
  meetingUrl: string | null;
  dialIn: string | null;
  address: string | null;
  dealId: number | null;
  dealName: string | null;
  organizationId: number | null;
  organizationName: string | null;
  attendees: Attendee[];
  externalAttendees: Array<{ name?: string; email?: string }>;
  gcalUrl: string | null;
  agenda: string | null;
  summary: string | null;
  actionItems: string | null;
  transcriptUrl: string | null;
  recordingUrl: string | null;
  outcome: string | null;
  followUpNeeded: boolean;
  followUpAt: string | null;
  followUpNotes: string | null;
  tags: string[];
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MeetingModalProps {
  meetingId: number;
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

function formatDuration(start: string, end: string | null) {
  if (!end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins} min`;
  }
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function MeetingKindBadge({ kind }: { kind: string | null }) {
  if (!kind) return null;

  const config: Record<string, { icon: React.ElementType; label: string; className: string }> = {
    call: { icon: Phone, label: "Call", className: "bg-green-100 text-green-700" },
    video: { icon: Video, label: "Video", className: "bg-blue-100 text-blue-700" },
    in_person: { icon: Users, label: "In Person", className: "bg-purple-100 text-purple-700" },
    email: { icon: MessageSquare, label: "Email", className: "bg-amber-100 text-amber-700" }
  };

  const { icon: Icon, label, className } = config[kind] || {
    icon: Calendar,
    label: kind,
    className: "bg-slate-100 text-slate-700"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function MeetingModal({ meetingId, onClose }: MeetingModalProps) {
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeeting() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/meetings/${meetingId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch meeting");
        }
        const data = await res.json();
        setMeeting(data);
      } catch (err) {
        console.error("Failed to fetch meeting:", err);
        setError("Failed to load meeting details");
      } finally {
        setLoading(false);
      }
    }

    fetchMeeting();
  }, [meetingId]);

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

  const isPast = meeting ? new Date(meeting.startsAt) < new Date() : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border border-slate-200 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            ) : meeting ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-slate-900 truncate">{meeting.title}</h2>
                  {meeting.isCompleted && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <MeetingKindBadge kind={meeting.kind} />
                  {isPast && !meeting.isCompleted && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                      Past
                    </span>
                  )}
                </div>
              </>
            ) : (
              <h2 className="text-lg font-semibold text-slate-900">Meeting Details</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-slate-500">{error}</p>
            </div>
          ) : meeting ? (
            <div className="space-y-6">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {formatDateTime(meeting.startsAt, meeting.allDay)}
                  </div>
                  {!meeting.allDay && meeting.endsAt && (
                    <div className="text-sm text-slate-500">
                      {formatTime(meeting.startsAt)} – {formatTime(meeting.endsAt)}
                      <span className="text-slate-400 ml-2">
                        ({formatDuration(meeting.startsAt, meeting.endsAt)})
                      </span>
                    </div>
                  )}
                  {meeting.timezone && (
                    <div className="text-xs text-slate-400 mt-0.5">{meeting.timezone}</div>
                  )}
                </div>
              </div>

              {/* Location / Meeting URL */}
              {(meeting.location || meeting.meetingUrl || meeting.address || meeting.dialIn) && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    {meeting.location && (
                      <div className="text-sm font-medium text-slate-900">{meeting.location}</div>
                    )}
                    {meeting.address && (
                      <div className="text-sm text-slate-500">{meeting.address}</div>
                    )}
                    {meeting.meetingUrl && (
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Video className="h-4 w-4" />
                        Join Meeting
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {meeting.dialIn && (
                      <div className="text-sm text-slate-500">
                        <span className="text-slate-400">Dial-in:</span> {meeting.dialIn}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Related Deal / Organization */}
              {(meeting.dealId || meeting.organizationId) && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {meeting.dealId ? (
                      <Briefcase className="h-5 w-5 text-slate-600" />
                    ) : (
                      <Building2 className="h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    {meeting.dealId && (
                      <Link
                        href={`/deals/${meeting.dealId}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {meeting.dealName || `Deal #${meeting.dealId}`}
                      </Link>
                    )}
                    {meeting.organizationId && (
                      <Link
                        href={`/organizations/${meeting.organizationId}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {meeting.organizationName || `Organization #${meeting.organizationId}`}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Attendees */}
              {(meeting.attendees.length > 0 || meeting.externalAttendees.length > 0) && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Users className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700 mb-2">
                      Attendees ({meeting.attendees.length + meeting.externalAttendees.length})
                    </div>
                    <div className="space-y-2">
                      {meeting.attendees.map((attendee) => (
                        <Link
                          key={attendee.id}
                          href={`/people/${attendee.id}`}
                          className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          {attendee.avatarUrl ? (
                            <img
                              src={attendee.avatarUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-medium text-slate-600">
                              {attendee.firstName?.charAt(0)}{attendee.lastName?.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {attendee.firstName} {attendee.lastName}
                            </div>
                            {attendee.email && (
                              <div className="text-xs text-slate-500 truncate">{attendee.email}</div>
                            )}
                          </div>
                        </Link>
                      ))}
                      {meeting.externalAttendees.map((ext, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                        >
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-500">
                            {ext.name?.charAt(0) || ext.email?.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-slate-900 truncate">
                              {ext.name || ext.email || "External attendee"}
                            </div>
                            {ext.name && ext.email && (
                              <div className="text-xs text-slate-500 truncate">{ext.email}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {meeting.description && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">Description</div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{meeting.description}</p>
                  </div>
                </div>
              )}

              {/* Agenda */}
              {meeting.agenda && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <ListTodo className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">Agenda</div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{meeting.agenda}</p>
                  </div>
                </div>
              )}

              {/* Summary (after meeting) */}
              {meeting.summary && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-1">Meeting Summary</div>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{meeting.summary}</p>
                </div>
              )}

              {/* Action Items */}
              {meeting.actionItems && (
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm font-medium text-amber-900 mb-1">Action Items</div>
                  <p className="text-sm text-amber-800 whitespace-pre-wrap">{meeting.actionItems}</p>
                </div>
              )}

              {/* Outcome */}
              {meeting.outcome && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-900 mb-1">Outcome</div>
                  <p className="text-sm text-green-800">{meeting.outcome}</p>
                </div>
              )}

              {/* Recording / Transcript */}
              {(meeting.recordingUrl || meeting.transcriptUrl) && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  {meeting.recordingUrl && (
                    <a
                      href={meeting.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <PlayCircle className="h-4 w-4" />
                      View Recording
                    </a>
                  )}
                  {meeting.transcriptUrl && (
                    <a
                      href={meeting.transcriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      View Transcript
                    </a>
                  )}
                </div>
              )}

              {/* Follow-up */}
              {meeting.followUpNeeded && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-900 mb-1">
                    Follow-up Required
                    {meeting.followUpAt && (
                      <span className="font-normal text-purple-700 ml-2">
                        by {new Date(meeting.followUpAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {meeting.followUpNotes && (
                    <p className="text-sm text-purple-800">{meeting.followUpNotes}</p>
                  )}
                </div>
              )}

              {/* Tags */}
              {meeting.tags && meeting.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {meeting.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Google Calendar link */}
              {meeting.gcalUrl && (
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={meeting.gcalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View in Google Calendar
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
