"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Phone,
  Video,
  Users,
  Search,
  Filter,
  ChevronDown,
  MapPin,
  Building2,
  Briefcase,
  Clock,
  MessageSquare
} from "lucide-react";
import { MeetingModal } from "@/components/MeetingModal";

interface Meeting {
  id: number;
  title: string;
  kind: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  dealId: number | null;
  dealName: string | null;
  organizationId: number | null;
  organizationName: string | null;
  attendeeCount: number;
}

const KIND_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "call", label: "Call" },
  { value: "video", label: "Video" },
  { value: "in_person", label: "In Person" },
  { value: "email", label: "Email" },
];

const TIME_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
];

function formatDuration(start: string, end: string | null) {
  if (!end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}m`;
  }
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function MeetingKindIcon({ kind }: { kind: string | null }) {
  switch (kind) {
    case "call":
      return <Phone className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "in_person":
      return <Users className="h-4 w-4" />;
    case "email":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
}

function MeetingKindBadge({ kind }: { kind: string | null }) {
  const config: Record<string, { label: string; className: string }> = {
    call: { label: "Call", className: "bg-green-100 text-green-700" },
    video: { label: "Video", className: "bg-blue-100 text-blue-700" },
    in_person: { label: "In Person", className: "bg-purple-100 text-purple-700" },
    email: { label: "Email", className: "bg-amber-100 text-amber-700" }
  };

  if (!kind) return null;

  const { label, className } = config[kind] || {
    label: kind,
    className: "bg-slate-100 text-slate-700"
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <MeetingKindIcon kind={kind} />
      {label}
    </span>
  );
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [showKindDropdown, setShowKindDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  useEffect(() => {
    async function fetchMeetings() {
      try {
        let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/meetings`;
        const params = new URLSearchParams();

        if (kindFilter !== "all") {
          params.append("kind", kindFilter);
        }
        if (timeFilter === "upcoming") {
          params.append("upcoming", "true");
        } else if (timeFilter === "past") {
          params.append("past", "true");
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setMeetings(data);
        }
      } catch (err) {
        console.error("Failed to fetch meetings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMeetings();
  }, [kindFilter, timeFilter]);

  // Filter meetings by search query
  const filteredMeetings = meetings.filter((meeting) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      meeting.title.toLowerCase().includes(query) ||
      meeting.dealName?.toLowerCase().includes(query) ||
      meeting.organizationName?.toLowerCase().includes(query)
    );
  });

  // Group meetings by date
  const groupedMeetings = filteredMeetings.reduce((acc, meeting) => {
    const date = new Date(meeting.startsAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(meeting);
    return acc;
  }, {} as Record<string, Meeting[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedMeetings).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const isPast = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Meetings</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage all your meetings</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Kind Filter */}
        <div className="relative">
          <button
            onClick={() => {
              setShowKindDropdown(!showKindDropdown);
              setShowTimeDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
          >
            <Filter className="h-4 w-4" />
            {KIND_OPTIONS.find(o => o.value === kindFilter)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>
          {showKindDropdown && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              {KIND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setKindFilter(option.value);
                    setShowKindDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                    kindFilter === option.value ? "bg-blue-50 text-blue-700" : "text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time Filter */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTimeDropdown(!showTimeDropdown);
              setShowKindDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
          >
            <Clock className="h-4 w-4" />
            {TIME_OPTIONS.find(o => o.value === timeFilter)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>
          {showTimeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTimeFilter(option.value);
                    setShowTimeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                    timeFilter === option.value ? "bg-blue-50 text-blue-700" : "text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No meetings found</p>
          {searchQuery && (
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const date = new Date(dateStr);
            const isToday = date.toDateString() === new Date().toDateString();
            const dateLabel = isToday
              ? "Today"
              : date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric"
                });

            return (
              <div key={dateStr}>
                <h2 className={`text-sm font-medium mb-3 ${isToday ? "text-blue-600" : "text-slate-500"}`}>
                  {dateLabel}
                </h2>
                <div className="space-y-2">
                  {groupedMeetings[dateStr].map((meeting) => {
                    const past = isPast(meeting.startsAt);
                    return (
                      <button
                        key={meeting.id}
                        onClick={() => setSelectedMeetingId(meeting.id)}
                        className={`w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all text-left ${
                          past ? "opacity-60" : ""
                        }`}
                      >
                        {/* Time */}
                        <div className="w-20 flex-shrink-0">
                          <div className="text-sm font-medium text-slate-900">
                            {new Date(meeting.startsAt).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit"
                            })}
                          </div>
                          {meeting.endsAt && (
                            <div className="text-xs text-slate-400">
                              {formatDuration(meeting.startsAt, meeting.endsAt)}
                            </div>
                          )}
                        </div>

                        {/* Kind Icon */}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            meeting.kind === "call"
                              ? "bg-green-100 text-green-600"
                              : meeting.kind === "video"
                              ? "bg-blue-100 text-blue-600"
                              : meeting.kind === "in_person"
                              ? "bg-purple-100 text-purple-600"
                              : meeting.kind === "email"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <MeetingKindIcon kind={meeting.kind} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 truncate">
                              {meeting.title}
                            </span>
                            <MeetingKindBadge kind={meeting.kind} />
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {meeting.organizationName && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Building2 className="h-3 w-3" />
                                {meeting.organizationName}
                              </span>
                            )}
                            {meeting.dealName && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Briefcase className="h-3 w-3" />
                                {meeting.dealName}
                              </span>
                            )}
                            {meeting.location && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="h-3 w-3" />
                                {meeting.location}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attendees */}
                        {meeting.attendeeCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Users className="h-4 w-4" />
                            {meeting.attendeeCount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Meeting Modal */}
      {selectedMeetingId && (
        <MeetingModal
          meetingId={selectedMeetingId}
          onClose={() => setSelectedMeetingId(null)}
        />
      )}
    </div>
  );
}
