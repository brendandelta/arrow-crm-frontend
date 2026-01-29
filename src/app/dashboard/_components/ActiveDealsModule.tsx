"use client";

import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  AlertTriangle,
  Eye,
  CheckCircle,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type ActiveDealSnapshot,
  type DealHealth,
  formatCompactCurrency,
  formatRelativeDate,
} from "@/lib/dashboard-api";

interface ActiveDealsModuleProps {
  deals: ActiveDealSnapshot[];
  loading?: boolean;
}

const stageStyles: Record<string, string> = {
  sourcing: "bg-slate-100 text-slate-600",
  live: "bg-blue-100 text-blue-700",
  closing: "bg-purple-100 text-purple-700",
};

const healthStyles: Record<DealHealth, { bg: string; icon: React.ReactNode; label: string }> = {
  on_track: {
    bg: "text-emerald-500",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    label: "On Track",
  },
  watch: {
    bg: "text-amber-500",
    icon: <Eye className="h-3.5 w-3.5" />,
    label: "Watch",
  },
  at_risk: {
    bg: "text-red-500",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    label: "At Risk",
  },
};

function DealCard({ deal }: { deal: ActiveDealSnapshot }) {
  const healthConfig = healthStyles[deal.health];
  const capitalProgress =
    deal.committedCents > 0
      ? Math.round((deal.wiredCents / deal.committedCents) * 100)
      : 0;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className={cn(
        "group block px-4 py-3",
        "hover:bg-slate-50/80 transition-colors",
        "border-b border-slate-100 last:border-b-0"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side: Deal info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-slate-700">
              {deal.name}
            </p>
            <Badge variant="outline" className={cn("text-[10px]", stageStyles[deal.stage])}>
              {deal.stageLabel}
            </Badge>
          </div>

          {deal.company && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{deal.company}</p>
          )}

          {/* Capital bar */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Capital Progress</span>
              <span className="text-slate-600 tabular-nums">
                {formatCompactCurrency(deal.wiredCents)} /{" "}
                {formatCompactCurrency(deal.committedCents)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  capitalProgress >= 80
                    ? "bg-emerald-500"
                    : capitalProgress >= 50
                    ? "bg-blue-500"
                    : capitalProgress > 0
                    ? "bg-amber-500"
                    : "bg-slate-200"
                )}
                style={{ width: `${Math.min(capitalProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
            {deal.ownerName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {deal.ownerName}
              </span>
            )}
            {deal.nextDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatRelativeDate(deal.nextDate)}
              </span>
            )}
            {deal.confidence !== null && (
              <span className="tabular-nums">{deal.confidence}% conf</span>
            )}
          </div>
        </div>

        {/* Right side: Health indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex-shrink-0 flex items-center gap-1",
                  healthConfig.bg
                )}
              >
                {healthConfig.icon}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              <p className="font-medium">{healthConfig.label}</p>
              {deal.healthReason && (
                <p className="text-slate-400">{deal.healthReason}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Link>
  );
}

function DealSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-1.5 w-full bg-slate-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-4 w-4 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function ActiveDealsModule({ deals, loading }: ActiveDealsModuleProps) {
  // Sort deals by stage priority and health
  const sortedDeals = [...deals].sort((a, b) => {
    const stagePriority: Record<string, number> = { closing: 0, live: 1, sourcing: 2 };
    const healthPriority: Record<DealHealth, number> = { at_risk: 0, watch: 1, on_track: 2 };

    const stageDiff = (stagePriority[a.stage] || 3) - (stagePriority[b.stage] || 3);
    if (stageDiff !== 0) return stageDiff;

    return (healthPriority[a.health] || 3) - (healthPriority[b.health] || 3);
  });

  // Summary counts
  const closingCount = deals.filter((d) => d.stage === "closing").length;
  const atRiskCount = deals.filter((d) => d.health === "at_risk").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Active Deals</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                {closingCount} closing
              </Badge>
              {atRiskCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                  {atRiskCount} at risk
                </Badge>
              )}
            </div>
          </div>
          <Link
            href="/deals?stage=sourcing,live,closing"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Deals list */}
      <ScrollArea className="max-h-[350px]">
        {loading ? (
          <>
            <DealSkeleton />
            <DealSkeleton />
            <DealSkeleton />
          </>
        ) : sortedDeals.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">No active deals</p>
            <p className="text-xs text-slate-500 mt-1">
              Create a deal to get started
            </p>
          </div>
        ) : (
          sortedDeals.slice(0, 6).map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))
        )}
      </ScrollArea>

      {/* Footer */}
      {sortedDeals.length > 6 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30">
          <Link
            href="/deals?stage=sourcing,live,closing"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            +{sortedDeals.length - 6} more deals →
          </Link>
        </div>
      )}
    </div>
  );
}
