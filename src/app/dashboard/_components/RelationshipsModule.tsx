"use client";

import Link from "next/link";
import {
  User,
  ChevronRight,
  Phone,
  Plus,
  Clock,
  Flame,
  Sparkles,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type RelationshipSignal } from "@/lib/dashboard-api";

interface RelationshipsModuleProps {
  signals: RelationshipSignal[];
  loading?: boolean;
}

const warmthStyles: Record<number, { bg: string; text: string; icon: React.ReactNode }> = {
  0: { bg: "bg-slate-100", text: "text-slate-600", icon: null },
  1: { bg: "bg-blue-100", text: "text-blue-700", icon: null },
  2: { bg: "bg-orange-100", text: "text-orange-700", icon: <Flame className="h-3 w-3" /> },
  3: { bg: "bg-purple-100", text: "text-purple-700", icon: <Sparkles className="h-3 w-3" /> },
};

function PersonRow({ signal }: { signal: RelationshipSignal }) {
  const warmthConfig = warmthStyles[signal.warmth] || warmthStyles[0];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3",
        "hover:bg-slate-50/80 transition-colors",
        "border-b border-slate-100 last:border-b-0"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
        <User className="h-4 w-4 text-slate-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/people?id=${signal.personId}`}
            className="text-sm font-medium text-slate-900 truncate hover:text-slate-700"
          >
            {signal.firstName} {signal.lastName}
          </Link>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] flex items-center gap-1",
              warmthConfig.bg,
              warmthConfig.text,
              "border-transparent"
            )}
          >
            {warmthConfig.icon}
            {signal.warmthLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
          {signal.organizationName && (
            <span className="flex items-center gap-1 truncate">
              <Building className="h-3 w-3" />
              {signal.organizationName}
            </span>
          )}
          {signal.title && (
            <span className="truncate">· {signal.title}</span>
          )}
        </div>

        <p className="text-[10px] text-slate-400 mt-1">{signal.reason}</p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
          asChild
        >
          <Link href={`/people?id=${signal.personId}&action=activity`}>
            <Phone className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
          asChild
        >
          <Link href={`/tasks?action=create&personId=${signal.personId}`}>
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function PersonSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-14 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-3 w-40 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function RelationshipsModule({ signals, loading }: RelationshipsModuleProps) {
  // Count by warmth
  const hotCount = signals.filter((s) => s.warmth >= 2).length;
  const closingCount = signals.filter((s) => s.closingDealsCount > 0).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Follow-ups Needed
            </h2>
            {!loading && (
              <div className="flex items-center gap-2">
                {closingCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-purple-50 text-purple-700 border-purple-200"
                  >
                    {closingCount} closing deals
                  </Badge>
                )}
                {hotCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-orange-50 text-orange-700 border-orange-200"
                  >
                    {hotCount} hot/champion
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Link
            href="/people?sort=lastContactedAt"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* People list */}
      <ScrollArea className="max-h-[280px]">
        {loading ? (
          <>
            <PersonSkeleton />
            <PersonSkeleton />
            <PersonSkeleton />
          </>
        ) : signals.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">All contacts are up to date</p>
          </div>
        ) : (
          signals.slice(0, 5).map((signal) => (
            <PersonRow key={signal.personId} signal={signal} />
          ))
        )}
      </ScrollArea>

      {/* Footer */}
      {signals.length > 5 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30">
          <Link
            href="/people?sort=lastContactedAt"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            +{signals.length - 5} more people →
          </Link>
        </div>
      )}
    </div>
  );
}
