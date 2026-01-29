"use client";

import Link from "next/link";
import { Landmark, ChevronRight, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const wiredPercentage =
    entity.committedCents > 0
      ? Math.round((entity.wiredCents / entity.committedCents) * 100)
      : 0;
  const hasGap = entity.gapCents > 0;

  return (
    <Link
      href={`/internal-entities?id=${entity.entityId}`}
      className={cn(
        "group flex items-center gap-3 px-4 py-3",
        "hover:bg-slate-50/80 transition-colors",
        "border-b border-slate-100 last:border-b-0"
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
        <Landmark className="h-4 w-4 text-indigo-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 truncate group-hover:text-slate-700">
            {entity.entityName}
          </p>
          {hasGap && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {formatCompactCurrency(entity.gapCents)} committed but not wired
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-500">
          <span className="tabular-nums">
            {formatCompactCurrency(entity.wiredCents)} wired
          </span>
          <span className="tabular-nums">
            {formatCompactCurrency(entity.committedCents)} committed
          </span>
          <span>{entity.dealCount} deal{entity.dealCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex-shrink-0 w-16">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              wiredPercentage >= 80
                ? "bg-emerald-500"
                : wiredPercentage >= 50
                ? "bg-blue-500"
                : "bg-amber-500"
            )}
            style={{ width: `${Math.min(wiredPercentage, 100)}%` }}
          />
        </div>
        <p className="text-[9px] text-slate-400 text-center mt-0.5 tabular-nums">
          {wiredPercentage}%
        </p>
      </div>
    </Link>
  );
}

function EntitySkeleton() {
  return (
    <div className="px-4 py-3 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="w-16 h-4 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function CapitalModule({ entities, loading }: CapitalModuleProps) {
  // Calculate totals
  const totalCommitted = entities.reduce((sum, e) => sum + e.committedCents, 0);
  const totalWired = entities.reduce((sum, e) => sum + e.wiredCents, 0);
  const totalGap = entities.reduce((sum, e) => sum + e.gapCents, 0);

  // Sort by committed descending
  const sortedEntities = [...entities].sort(
    (a, b) => b.committedCents - a.committedCents
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Capital by Entity
            </h2>
            {totalGap > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
              >
                {formatCompactCurrency(totalGap)} gap
              </Badge>
            )}
          </div>
          <Link
            href="/internal-entities"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Summary row */}
        {!loading && entities.length > 0 && (
          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span className="tabular-nums">
                {formatCompactCurrency(totalWired)} / {formatCompactCurrency(totalCommitted)}
              </span>
            </span>
            <span>
              {Math.round((totalWired / (totalCommitted || 1)) * 100)}% wired
            </span>
          </div>
        )}
      </div>

      {/* Entities list */}
      <ScrollArea className="max-h-[250px]">
        {loading ? (
          <>
            <EntitySkeleton />
            <EntitySkeleton />
            <EntitySkeleton />
          </>
        ) : sortedEntities.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Landmark className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No capital data available</p>
          </div>
        ) : (
          sortedEntities.slice(0, 5).map((entity) => (
            <EntityRow key={entity.entityId} entity={entity} />
          ))
        )}
      </ScrollArea>

      {/* Footer */}
      {sortedEntities.length > 5 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30">
          <Link
            href="/internal-entities"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            +{sortedEntities.length - 5} more entities →
          </Link>
        </div>
      )}
    </div>
  );
}
