"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Phone,
  Video,
  Users,
  Search,
  Columns3,
  ChevronDown,
  Filter,
  MapPin,
  Briefcase,
  Clock,
  MessageSquare,
  Mail,
  Plus,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import NewEventModal from "@/components/NewEventModal";
import { getPageIdentity } from "@/lib/page-registry";
import { cn } from "@/lib/utils";

// Get page identity for theming
const pageIdentity = getPageIdentity("events");
const theme = pageIdentity?.theme;
const PageIcon = pageIdentity?.icon || Calendar;

// Activity/Event interface matching the backend API
interface Activity {
  id: number;
  kind: string;
  subject: string | null;
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
  // Meeting/calendar fields
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
  createdAt: string;
  updatedAt: string;
}

// Column definitions
const ALL_COLUMNS = [
  { id: "subject", label: "Subject", required: true },
  { id: "kind", label: "Type", required: false },
  { id: "dateTime", label: "Date & Time", required: false },
  { id: "duration", label: "Duration", required: false },
  { id: "deal", label: "Deal", required: false },
  { id: "location", label: "Location", required: false },
  { id: "attendees", label: "Attendees", required: false },
  { id: "outcome", label: "Outcome", required: false },
  { id: "performedBy", label: "Performed By", required: false },
] as const;

type ColumnId = typeof ALL_COLUMNS[number]["id"];

const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = [
  "subject", "kind", "dateTime", "duration", "deal", "location", "attendees"
];

const KIND_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "call", label: "Call" },
  { value: "video_call", label: "Video Call" },
  { value: "in_person_meeting", label: "In Person" },
  { value: "meeting", label: "Meeting" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin_message", label: "LinkedIn" },
  { value: "note", label: "Note" },
];

const TIME_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
];

const OUTCOME_OPTIONS = [
  { value: "all", label: "All Outcomes" },
  { value: "connected", label: "Connected" },
  { value: "voicemail", label: "Voicemail" },
  { value: "no_answer", label: "No Answer" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

// Storage keys
const STORAGE_KEYS = {
  visibleColumns: "arrow-crm-events-columns",
  kindFilter: "arrow-crm-events-kind-filter",
  timeFilter: "arrow-crm-events-time-filter",
  outcomeFilter: "arrow-crm-events-outcome-filter",
};

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(`Failed to parse stored value for ${key}:`, e);
  }
  return fallback;
}

function formatDuration(minutes: number | null, start: string | null, end: string | null): string | null {
  if (minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return null;
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
    video_call: { label: "Video", className: "bg-blue-100 text-blue-700" },
    in_person_meeting: { label: "In Person", className: "bg-purple-100 text-purple-700" },
    meeting: { label: "Meeting", className: "bg-indigo-100 text-indigo-700" },
    email: { label: "Email", className: "bg-amber-100 text-amber-700" },
    whatsapp: { label: "WhatsApp", className: "bg-emerald-100 text-emerald-700" },
    sms: { label: "SMS", className: "bg-cyan-100 text-cyan-700" },
    linkedin_message: { label: "LinkedIn", className: "bg-sky-100 text-sky-700" },
    linkedin_connection: { label: "LinkedIn", className: "bg-sky-100 text-sky-700" },
    note: { label: "Note", className: "bg-slate-100 text-slate-700" },
    task: { label: "Task", className: "bg-orange-100 text-orange-700" },
  };

  const { label, className } = config[kind] || {
    label: kind.replace(/_/g, " "),
    className: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <EventKindIcon kind={kind} />
      {label}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-slate-400">-</span>;

  const config: Record<string, { label: string; className: string }> = {
    connected: { label: "Connected", className: "bg-green-100 text-green-700" },
    voicemail: { label: "Voicemail", className: "bg-yellow-100 text-yellow-700" },
    no_answer: { label: "No Answer", className: "bg-slate-100 text-slate-600" },
    left_message: { label: "Left Message", className: "bg-blue-100 text-blue-700" },
    replied: { label: "Replied", className: "bg-green-100 text-green-700" },
    bounced: { label: "Bounced", className: "bg-red-100 text-red-700" },
    opened: { label: "Opened", className: "bg-blue-100 text-blue-700" },
    scheduled: { label: "Scheduled", className: "bg-indigo-100 text-indigo-700" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    no_show: { label: "No Show", className: "bg-orange-100 text-orange-700" },
  };

  const { label, className } = config[outcome] || {
    label: outcome.replace(/_/g, " "),
    className: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function EventsPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(
    new Set(DEFAULT_VISIBLE_COLUMNS)
  );

  // Dropdown state
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showKindDropdown, setShowKindDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showOutcomeDropdown, setShowOutcomeDropdown] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  // Load persisted preferences
  useEffect(() => {
    const storedColumns = getStoredValue<ColumnId[]>(STORAGE_KEYS.visibleColumns, []);
    if (storedColumns.length > 0) {
      setVisibleColumns(new Set(storedColumns));
    }
    setKindFilter(getStoredValue(STORAGE_KEYS.kindFilter, "all"));
    setTimeFilter(getStoredValue(STORAGE_KEYS.timeFilter, "all"));
    setOutcomeFilter(getStoredValue(STORAGE_KEYS.outcomeFilter, "all"));
    setIsInitialized(true);
  }, []);

  // Persist preferences
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.visibleColumns, JSON.stringify(Array.from(visibleColumns)));
    }
  }, [visibleColumns, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.kindFilter, JSON.stringify(kindFilter));
    }
  }, [kindFilter, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.timeFilter, JSON.stringify(timeFilter));
    }
  }, [timeFilter, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.outcomeFilter, JSON.stringify(outcomeFilter));
    }
  }, [outcomeFilter, isInitialized]);

  // Fetch activities
  useEffect(() => {
    async function fetchActivities() {
      try {
        const params = new URLSearchParams();

        if (kindFilter !== "all") {
          params.append("kind", kindFilter);
        }
        if (timeFilter !== "all") {
          params.append("time_filter", timeFilter);
        }

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
        }
      } catch (err) {
        console.error("Failed to fetch activities:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [kindFilter, timeFilter, refreshKey]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        activity.subject,
        activity.dealName,
        activity.location,
        activity.performedBy?.firstName,
        activity.performedBy?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    // Outcome filter
    if (outcomeFilter !== "all" && activity.outcome !== outcomeFilter) {
      return false;
    }

    return true;
  });

  // Selection handlers
  const allSelected = filteredActivities.length > 0 && filteredActivities.every(a => selectedIds.has(a.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredActivities.map(a => a.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleColumn = (columnId: ColumnId) => {
    const column = ALL_COLUMNS.find(c => c.id === columnId);
    if (column?.required) return;

    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    setVisibleColumns(newVisible);
  };

  const closeAllDropdowns = () => {
    setShowKindDropdown(false);
    setShowTimeDropdown(false);
    setShowOutcomeDropdown(false);
  };

  const activeFiltersCount =
    (kindFilter !== "all" ? 1 : 0) +
    (timeFilter !== "all" ? 1 : 0) +
    (outcomeFilter !== "all" ? 1 : 0);

  const upcomingCount = activities.filter(a => a.isUpcoming).length;
  const todayCount = activities.filter(a => {
    if (!a.startsAt) return false;
    return new Date(a.startsAt).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#FAFBFC]">
      {/* Premium Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="relative px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )} />
                <div className={cn(
                  "relative h-11 w-11 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-[1.02]",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )}>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
                  <PageIcon className="relative h-5 w-5 text-white drop-shadow-sm" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Events
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {loading ? (
                    <span className="inline-block w-32 h-4 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{filteredActivities.length} events</span>
                      {upcomingCount > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-rose-600">{upcomingCount} upcoming</span>
                        </>
                      )}
                      {todayCount > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-rose-600">{todayCount} today</span>
                        </>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity",
                  theme && `bg-gradient-to-r ${theme.gradient}`
                )} style={{ opacity: 0.15 }} />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className={cn(
                      "w-72 h-11 pl-11 pr-4 text-sm rounded-xl transition-all duration-200",
                      "bg-slate-50 border border-slate-200/80",
                      "placeholder:text-slate-400",
                      "focus:outline-none focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10"
                    )}
                  />
                </div>
              </div>

              {/* New Event Button */}
              <button
                onClick={() => setShowNewEventModal(true)}
                className={cn(
                  "group relative flex items-center gap-2.5 h-11 px-5",
                  "text-white text-sm font-medium rounded-xl",
                  "shadow-lg active:scale-[0.98] transition-all duration-200",
                  theme && `bg-gradient-to-b ${theme.gradient} ${theme.shadow}`,
                  theme && "hover:shadow-xl"
                )}
              >
                <Plus className="h-4 w-4" />
                <span>New Event</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {/* Filters Bar */}
        <div className="flex items-center gap-3 mb-4">

        {/* Kind Filter */}
        <div className="relative">
          <button
            onClick={() => {
              closeAllDropdowns();
              setShowKindDropdown(!showKindDropdown);
            }}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-slate-50 ${
              kindFilter !== "all" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"
            }`}
          >
            <Filter className="h-4 w-4" />
            {KIND_OPTIONS.find(o => o.value === kindFilter)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>
          {showKindDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
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
              closeAllDropdowns();
              setShowTimeDropdown(!showTimeDropdown);
            }}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-slate-50 ${
              timeFilter !== "all" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"
            }`}
          >
            <Clock className="h-4 w-4" />
            {TIME_OPTIONS.find(o => o.value === timeFilter)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>
          {showTimeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
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

        {/* Outcome Filter */}
        <div className="relative">
          <button
            onClick={() => {
              closeAllDropdowns();
              setShowOutcomeDropdown(!showOutcomeDropdown);
            }}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-slate-50 ${
              outcomeFilter !== "all" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"
            }`}
          >
            {OUTCOME_OPTIONS.find(o => o.value === outcomeFilter)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>
          {showOutcomeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
              {OUTCOME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setOutcomeFilter(option.value);
                    setShowOutcomeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                    outcomeFilter === option.value ? "bg-blue-50 text-blue-700" : "text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Column Toggle */}
        <div className="relative ml-auto" ref={columnDropdownRef}>
          <button
            onClick={() => setShowColumnDropdown(!showColumnDropdown)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
          >
            <Columns3 className="h-4 w-4" />
            Columns
          </button>
          {showColumnDropdown && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
              {ALL_COLUMNS.map((column) => (
                <label
                  key={column.id}
                  className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer ${
                    column.required ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Checkbox
                    checked={visibleColumns.has(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                    disabled={column.required}
                  />
                  {column.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-slate-500">{activeFiltersCount} filter(s) active</span>
          <button
            onClick={() => {
              setKindFilter("all");
              setTimeFilter("all");
              setOutcomeFilter("all");
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear all
          </button>
        </div>
      )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
              Loading events...
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No events found</p>
            {(searchQuery || activeFiltersCount > 0) && (
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
            )}
            <button
              onClick={() => setShowNewEventModal(true)}
              className="mt-3 text-sm text-rose-600 hover:text-rose-700 font-medium"
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    className={someSelected ? "opacity-50" : ""}
                  />
                </TableHead>
                {ALL_COLUMNS.filter(col => visibleColumns.has(col.id)).map((column) => (
                  <TableHead key={column.id} className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {column.label}
                  </TableHead>
                ))}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow
                  key={activity.id}
                  className={`hover:bg-slate-50 cursor-pointer ${
                    selectedIds.has(activity.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(activity.id)}
                      onCheckedChange={() => toggleSelect(activity.id)}
                    />
                  </TableCell>

                  {visibleColumns.has("subject") && (
                    <TableCell className="font-medium text-slate-900">
                      {activity.subject || <span className="text-slate-400 italic">No subject</span>}
                    </TableCell>
                  )}

                  {visibleColumns.has("kind") && (
                    <TableCell>
                      <EventKindBadge kind={activity.kind} />
                    </TableCell>
                  )}

                  {visibleColumns.has("dateTime") && (
                    <TableCell className="text-sm text-slate-600">
                      {formatDateTime(activity.startsAt || activity.occurredAt)}
                    </TableCell>
                  )}

                  {visibleColumns.has("duration") && (
                    <TableCell className="text-sm text-slate-500">
                      {formatDuration(activity.durationMinutes, activity.startsAt, activity.endsAt) || "-"}
                    </TableCell>
                  )}

                  {visibleColumns.has("deal") && (
                    <TableCell>
                      {activity.dealName ? (
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <Briefcase className="h-3 w-3" />
                          {activity.dealName}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                  )}

                  {visibleColumns.has("location") && (
                    <TableCell>
                      {activity.location ? (
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </span>
                      ) : activity.meetingUrl ? (
                        <a
                          href={activity.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Video className="h-3 w-3" />
                          Join
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                  )}

                  {visibleColumns.has("attendees") && (
                    <TableCell>
                      {activity.attendeeCount > 0 ? (
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <Users className="h-3 w-3" />
                          {activity.attendeeCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                  )}

                  {visibleColumns.has("outcome") && (
                    <TableCell>
                      <OutcomeBadge outcome={activity.outcome} />
                    </TableCell>
                  )}

                  {visibleColumns.has("performedBy") && (
                    <TableCell className="text-sm text-slate-600">
                      {activity.performedBy
                        ? `${activity.performedBy.firstName} ${activity.performedBy.lastName}`
                        : <span className="text-slate-400">-</span>
                      }
                    </TableCell>
                  )}

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button className="p-1 hover:bg-slate-100 rounded">
                      <MoreHorizontal className="h-4 w-4 text-slate-400" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4">
          <span className="text-sm">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-slate-700" />
          <button className="text-sm hover:text-slate-300">Delete</button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* New Event Modal */}
      {showNewEventModal && (
        <NewEventModal
          onClose={() => setShowNewEventModal(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
