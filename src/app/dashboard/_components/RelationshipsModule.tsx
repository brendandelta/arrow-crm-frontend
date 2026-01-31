"use client";

import Link from "next/link";
import {
  User,
  ChevronRight,
  Flame,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type RelationshipSignal } from "@/lib/dashboard-api";

interface RelationshipsModuleProps {
  signals: RelationshipSignal[];
  loading?: boolean;
}

const warmthConfig: Record<number, { color: string; icon: React.ReactNode | null }> = {
  0: { color: "bg-slate-300", icon: null },
  1: { color: "bg-blue-400", icon: null },
  2: { color: "bg-orange-500", icon: <Flame className="h-2 w-2 text-white" /> },
  3: { color: "bg-purple-500", icon: <Sparkles className="h-2 w-2 text-white" /> },
};

function PersonRow({ signal }: { signal: RelationshipSignal }) {
  const warmth = warmthConfig[signal.warmth] || warmthConfig[0];

  return (
    <Link
      href={`/people/${signal.personId}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
    >
      {/* Avatar with warmth badge - fixed width */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <User className="h-4 w-4 text-slate-500" />
        </div>
        <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center", warmth.color)}>
          {warmth.icon}
        </div>
      </div>

      {/* Content - flexible */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-900 truncate">
          {signal.firstName} {signal.lastName}
        </p>
        <p className="text-[10px] text-slate-500 truncate">
          {signal.organizationName}
          {signal.organizationName && signal.title && " · "}
          {signal.title}
        </p>
      </div>

      {/* Reason - fixed width */}
      <span className="w-20 text-[9px] text-slate-400 truncate text-right flex-shrink-0">
        {signal.reason}
      </span>
    </Link>
  );
}

function PersonSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        <div className="h-2.5 w-32 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="w-16 h-2.5 bg-slate-100 rounded animate-pulse" />
    </div>
  );
}

export function RelationshipsModule({ signals, loading }: RelationshipsModuleProps) {
  const hotCount = signals.filter((s) => s.warmth >= 2).length;
  const closingCount = signals.filter((s) => s.closingDealsCount > 0).length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-violet-100 flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Follow-ups</span>
          {!loading && signals.length > 0 && (
            <span className="text-[10px] text-slate-500">
              {hotCount > 0 && <span className="text-orange-600">{hotCount} hot</span>}
            </span>
          )}
        </div>
        <Link href="/people?sort=lastContactedAt" className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50">
        {loading ? (
          <>
            <PersonSkeleton />
            <PersonSkeleton />
            <PersonSkeleton />
          </>
        ) : signals.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <User className="h-6 w-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-500">All caught up</p>
          </div>
        ) : (
          signals.slice(0, 4).map((signal) => <PersonRow key={signal.personId} signal={signal} />)
        )}
      </div>

      {/* Footer */}
      {signals.length > 4 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <Link href="/people?sort=lastContactedAt" className="text-[10px] text-slate-500 hover:text-slate-700">
            +{signals.length - 4} more
          </Link>
        </div>
      )}
    </div>
  );
}
