"use client";

import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  Phone,
  Video,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type UpcomingEvent } from "@/lib/dashboard-api";

interface EventsModuleProps {
  events: UpcomingEvent[];
  loading?: boolean;
}

const kindIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-3 w-3" />,
  video_call: <Video className="h-3 w-3" />,
  in_person_meeting: <Users className="h-3 w-3" />,
  meeting: <Calendar className="h-3 w-3" />,
};

const kindColors: Record<string, string> = {
  call: "bg-green-100 text-green-600",
  video_call: "bg-blue-100 text-blue-600",
  in_person_meeting: "bg-purple-100 text-purple-600",
  meeting: "bg-slate-100 text-slate-600",
};

function formatEventTime(startsAt: string): { time: string; label: string; isUrgent: boolean } {
  const date = new Date(startsAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const isToday = eventDate.getTime() === today.getTime();
  const isTomorrow = eventDate.getTime() === tomorrow.getTime();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  let label: string;
  if (isToday) {
    label = "Today";
  } else if (isTomorrow) {
    label = "Tomorrow";
  } else {
    label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return { time, label, isUrgent: isToday || isTomorrow };
}

function EventRow({ event }: { event: UpcomingEvent }) {
  const { time, label, isUrgent } = formatEventTime(event.startsAt);
  const kindIcon = kindIcons[event.kind] || kindIcons.meeting;
  const kindColor = kindColors[event.kind] || kindColors.meeting;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
      {/* Date/time column - fixed width */}
      <div className="w-14 flex-shrink-0 text-right">
        <p className={cn("text-[9px] font-medium", isUrgent ? "text-rose-600" : "text-slate-400")}>
          {label}
        </p>
        <p className="text-xs font-semibold text-slate-900 tabular-nums">{time}</p>
      </div>

      {/* Type icon */}
      <div className={cn("h-6 w-6 rounded flex items-center justify-center flex-shrink-0", kindColor)}>
        {kindIcon}
      </div>

      {/* Content - flexible */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-900 truncate">
          {event.subject || "No subject"}
        </p>
        <p className="text-[10px] text-slate-500 truncate">
          {event.dealName || event.kindLabel}
        </p>
      </div>

      {/* Join button - fixed width */}
      {event.meetingUrl ? (
        <a
          href={event.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 text-[9px] font-medium text-blue-600 hover:text-blue-700 flex-shrink-0 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          Join
        </a>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="w-14 space-y-1">
        <div className="h-2 w-10 bg-slate-100 rounded animate-pulse ml-auto" />
        <div className="h-3 w-12 bg-slate-100 rounded animate-pulse ml-auto" />
      </div>
      <div className="h-6 w-6 bg-slate-100 rounded animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
        <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function EventsModule({ events, loading }: EventsModuleProps) {
  const todayCount = events.filter((e) => {
    const eventDate = new Date(e.startsAt);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-fuchsia-100 flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-fuchsia-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Events</span>
          {!loading && todayCount > 0 && (
            <span className="text-[10px] text-rose-600">{todayCount} today</span>
          )}
        </div>
        <Link href="/events?time_filter=upcoming" className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50">
        {loading ? (
          <>
            <EventSkeleton />
            <EventSkeleton />
            <EventSkeleton />
          </>
        ) : events.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Calendar className="h-6 w-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-500">No upcoming events</p>
          </div>
        ) : (
          events.slice(0, 4).map((event) => <EventRow key={event.id} event={event} />)
        )}
      </div>

      {/* Footer */}
      {events.length > 4 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <Link href="/events?time_filter=upcoming" className="text-[10px] text-slate-500 hover:text-slate-700">
            +{events.length - 4} more
          </Link>
        </div>
      )}
    </div>
  );
}
