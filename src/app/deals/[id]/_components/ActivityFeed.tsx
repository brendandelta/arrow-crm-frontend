"use client";

import { useState } from "react";
import {
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  performedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

interface ActivityFeedProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
}

const kindConfig: Record<
  string,
  { icon: typeof Phone; label: string; color: string; bgColor: string }
> = {
  call: { icon: Phone, label: "Call", color: "text-blue-600", bgColor: "bg-blue-100" },
  email: { icon: Mail, label: "Email", color: "text-purple-600", bgColor: "bg-purple-100" },
  meeting: { icon: Calendar, label: "Meeting", color: "text-green-600", bgColor: "bg-green-100" },
  in_person_meeting: { icon: Users, label: "In-Person", color: "text-green-600", bgColor: "bg-green-100" },
  video_call: { icon: Video, label: "Video Call", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  whatsapp: { icon: MessageSquare, label: "WhatsApp", color: "text-green-600", bgColor: "bg-green-100" },
  sms: { icon: MessageSquare, label: "SMS", color: "text-slate-600", bgColor: "bg-slate-100" },
  linkedin_message: { icon: Linkedin, label: "LinkedIn", color: "text-blue-700", bgColor: "bg-blue-100" },
  linkedin_connection: { icon: Linkedin, label: "LinkedIn", color: "text-blue-700", bgColor: "bg-blue-100" },
  note: { icon: StickyNote, label: "Note", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  task: { icon: CheckSquare, label: "Task", color: "text-orange-600", bgColor: "bg-orange-100" },
  stage_change: { icon: RefreshCw, label: "Stage Change", color: "text-slate-600", bgColor: "bg-slate-100" },
  doc_upload: { icon: Upload, label: "Document", color: "text-slate-600", bgColor: "bg-slate-100" },
};

type FilterType = "all" | "outreach" | "stage_changes" | "tasks" | "documents";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityFeed({ activities, onActivityClick }: ActivityFeedProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filterMap: Record<FilterType, string[]> = {
    all: Object.keys(kindConfig),
    outreach: ["call", "email", "meeting", "in_person_meeting", "video_call", "whatsapp", "sms", "linkedin_message"],
    stage_changes: ["stage_change"],
    tasks: ["task"],
    documents: ["doc_upload"],
  };

  const filteredActivities = activities.filter((a) =>
    filterMap[filter].includes(a.kind) || (filter === "tasks" && a.isTask)
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 border-b pb-3">
        {(
          [
            { key: "all", label: "All" },
            { key: "outreach", label: "Outreach" },
            { key: "stage_changes", label: "Stage Changes" },
            { key: "tasks", label: "Tasks" },
            { key: "documents", label: "Documents" },
          ] as { key: FilterType; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === f.key
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No activities to show
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

          <div className="space-y-1">
            {filteredActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onClick={() => onActivityClick?.(activity)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityItem({
  activity,
  onClick,
}: {
  activity: Activity;
  onClick: () => void;
}) {
  const config = kindConfig[activity.kind] || kindConfig.note;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors text-left relative"
    >
      {/* Icon */}
      <div className={`relative z-10 p-2 rounded-lg ${config.bgColor}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {activity.subject || config.label}
          </span>
          {activity.isTask && (
            <Badge
              className={
                activity.taskCompleted
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }
            >
              {activity.taskCompleted ? "Done" : "Todo"}
            </Badge>
          )}
          {activity.outcome && (
            <Badge variant="outline" className="text-xs">
              {activity.outcome}
            </Badge>
          )}
        </div>

        {activity.body && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {activity.body}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{formatDate(activity.occurredAt)}</span>
          {activity.performedBy && (
            <>
              <span>·</span>
              <span>
                {activity.performedBy.firstName} {activity.performedBy.lastName}
              </span>
            </>
          )}
          {activity.direction && (
            <>
              <span>·</span>
              <span className="capitalize">{activity.direction}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

// Compact version for sidebar
export function ActivityFeedCompact({
  activities,
  limit = 5,
}: {
  activities: Activity[];
  limit?: number;
}) {
  return (
    <div className="space-y-2">
      {activities.slice(0, limit).map((activity) => {
        const config = kindConfig[activity.kind] || kindConfig.note;
        const Icon = config.icon;

        return (
          <div key={activity.id} className="flex items-center gap-2 text-sm">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="flex-1 truncate">
              {activity.subject || config.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(activity.occurredAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
