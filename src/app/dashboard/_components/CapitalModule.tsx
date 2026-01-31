"use client";

import Link from "next/link";
import { Landmark, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type CapitalByEntity, formatCompactCurrency } from "@/lib/dashboard-api";

interface CapitalModuleProps {
  entities: CapitalByEntity[];
  loading?: boolean;
}

function EntityRow({ entity }: { entity: CapitalByEntity }) {
  const percent = entity.committedCents > 0
    ? Math.round((entity.wiredCents / entity.committedCents) * 100)
    : 0;
  const hasGap = entity.gapCents > 0;

  return (
    <Link
      href={`/internal-entities?id=${entity.entityId}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
    >
      {/* Progress ring - fixed width */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100" />
          <circle
            cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${(percent / 100) * 75.4} 75.4`}
            className={cn(percent >= 80 ? "text-emerald-500" : percent >= 50 ? "text-blue-500" : "text-amber-500")}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-semibold text-slate-600">
          {percent}%
        </span>
      </div>

      {/* Content - flexible */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-xs font-medium text-slate-900 truncate">{entity.entityName}</p>
          {hasGap && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><AlertTriangle className="h-3 w-3 text-amber-500" /></TooltipTrigger>
                <TooltipContent><p className="text-xs">{formatCompactCurrency(entity.gapCents)} gap</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-[10px] text-slate-500 tabular-nums">
          {formatCompactCurrency(entity.wiredCents)} / {formatCompactCurrency(entity.committedCents)}
        </p>
      </div>

      {/* Deal count - fixed width */}
      <span className="w-12 text-[10px] text-slate-400 text-right flex-shrink-0">
        {entity.dealCount} deal{entity.dealCount !== 1 ? "s" : ""}
      </span>
    </Link>
  );
}

function EntitySkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
        <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="w-12 h-2.5 bg-slate-100 rounded animate-pulse" />
    </div>
  );
}

export function CapitalModule({ entities, loading }: CapitalModuleProps) {
  const totalCommitted = entities.reduce((sum, e) => sum + e.committedCents, 0);
  const totalWired = entities.reduce((sum, e) => sum + e.wiredCents, 0);
  const totalGap = entities.reduce((sum, e) => sum + e.gapCents, 0);
  const overallPercent = totalCommitted > 0 ? Math.round((totalWired / totalCommitted) * 100) : 0;

  const sortedEntities = [...entities].sort((a, b) => b.committedCents - a.committedCents);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-indigo-100 flex items-center justify-center">
            <Landmark className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Capital</span>
          {!loading && entities.length > 0 && (
            <span className="text-[10px] text-slate-500">
              <span className="text-indigo-600">{overallPercent}% wired</span>
              {totalGap > 0 && <span className="text-amber-600"> · {formatCompactCurrency(totalGap)} gap</span>}
            </span>
          )}
        </div>
        <Link href="/internal-entities" className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50">
        {loading ? (
          <>
            <EntitySkeleton />
            <EntitySkeleton />
            <EntitySkeleton />
          </>
        ) : sortedEntities.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Landmark className="h-6 w-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-500">No capital data</p>
          </div>
        ) : (
          sortedEntities.slice(0, 4).map((entity) => <EntityRow key={entity.entityId} entity={entity} />)
        )}
      </div>

      {/* Footer */}
      {sortedEntities.length > 4 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <Link href="/internal-entities" className="text-[10px] text-slate-500 hover:text-slate-700">
            +{sortedEntities.length - 4} more
          </Link>
        </div>
      )}
    </div>
  );
}
