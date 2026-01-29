"use client";

import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  Phone,
  Video,
  Users,
  MapPin,
  ExternalLink,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type UpcomingEvent } from "@/lib/dashboard-api";

interface EventsModuleProps {
  events: UpcomingEvent[];
  loading?: boolean;
}

const kindIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-3.5 w-3.5" />,
  video_call: <Video className="h-3.5 w-3.5" />,
  in_person_meeting: <Users className="h-3.5 w-3.5" />,
  meeting: <Calendar className="h-3.5 w-3.5" />,
};

const kindStyles: Record<string, string> = {
  call: "bg-green-100 text-green-700",
  video_call: "bg-blue-100 text-blue-700",
  in_person_meeting: "bg-purple-100 text-purple-700",
  meeting: "bg-indigo-100 text-indigo-700",
};

function formatEventTime(startsAt: string): { time: string; date: string; isToday: boolean; isTomorrow: boolean } {
  const date = new Date(startsAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const isToday = eventDate.getTime() === today.getTime();
  const isTomorrow = eventDate.getTime() === tomorrow.getTime();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  let dateStr = "";
  if (isToday) {
    dateStr = "Today";
  } else if (isTomorrow) {
    dateStr = "Tomorrow";
  } else {
    dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return { time, date: dateStr, isToday, isTomorrow };
}

function EventRow({ event }: { event: UpcomingEvent }) {
  const { time, date, isToday, isTomorrow } = formatEventTime(event.startsAt);
  const kindIcon = kindIcons[event.kind] || <Calendar className="h-3.5 w-3.5" />;
  const kindStyle = kindStyles[event.kind] || "bg-slate-100 text-slate-600";

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-4 py-3",
        "hover:bg-slate-50/80 transition-colors",
        "border-b border-slate-100 last:border-b-0"
      )}
    >
      {/* Time column */}
      <div className="flex-shrink-0 w-14 pt-0.5">
        <p
          className={cn(
            "text-[10px] font-medium",
            isToday ? "text-rose-600" : isTomorrow ? "text-amber-600" : "text-slate-500"
          )}
        >
          {date}
        </p>
        <p className="text-sm font-semibold text-slate-900 tabular-nums">{time}</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-[10px] flex items-center gap-1 border-transparent", kindStyle)}
          >
            {kindIcon}
            {event.kindLabel}
          </Badge>
          {event.attendeeCount > 0 && (
            <span className="text-[10px] text-slate-400">
              {event.attendeeCount} attendee{event.attendeeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-slate-900 mt-1 truncate">
          {event.subject || "No subject"}
        </p>

        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
          {event.dealName && (
            <Link
              href={`/deals?search=${encodeURIComponent(event.dealName)}`}
              className="flex items-center gap-1 hover:text-slate-700"
            >
              <span className="truncate">{event.dealName}</span>
            </Link>
          )}
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
          {event.meetingUrl && (
            <a
              href={event.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              onClick={(e) => e.stopPropagation()}
            >
              <Video className="h-3 w-3" />
              Join
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-slate-100">
      <div className="flex items-start gap-3">
        <div className="w-14 space-y-1">
          <div className="h-3 w-10 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
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
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming Events</h2>
            {!loading && todayCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] bg-rose-50 text-rose-700 border-rose-200"
              >
                {todayCount} today
              </Badge>
            )}
          </div>
          <Link
            href="/events?time_filter=upcoming"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Events list */}
      <ScrollArea className="max-h-[280px]">
        {loading ? (
          <>
            <EventSkeleton />
            <EventSkeleton />
            <EventSkeleton />
          </>
        ) : events.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No upcoming events</p>
          </div>
        ) : (
          events.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </ScrollArea>
    </div>
  );
}
