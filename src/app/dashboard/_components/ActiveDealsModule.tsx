"use client";

import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  AlertTriangle,
  Eye,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
} from "@/lib/dashboard-api";

interface ActiveDealsModuleProps {
  deals: ActiveDealSnapshot[];
  loading?: boolean;
}

const stageColors: Record<string, string> = {
  sourcing: "bg-slate-100 text-slate-600",
  live: "bg-emerald-100 text-emerald-700",
  closing: "bg-purple-100 text-purple-700",
};

const healthConfig: Record<DealHealth, { color: string; icon: React.ReactNode; label: string }> = {
  on_track: { color: "text-emerald-500", icon: <CheckCircle className="h-3.5 w-3.5" />, label: "On Track" },
  watch: { color: "text-amber-500", icon: <Eye className="h-3.5 w-3.5" />, label: "Watch" },
  at_risk: { color: "text-red-500", icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "At Risk" },
};

function DealRow({ deal }: { deal: ActiveDealSnapshot }) {
  const stageColor = stageColors[deal.stage] || stageColors.sourcing;
  const health = healthConfig[deal.health];
  const progress = deal.committedCents > 0
    ? Math.round((deal.wiredCents / deal.committedCents) * 100)
    : 0;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
    >
      {/* Fixed width stage badge */}
      <span className={cn("w-16 text-center text-[9px] font-medium py-0.5 rounded flex-shrink-0", stageColor)}>
        {deal.stageLabel}
      </span>

      {/* Deal info - flexible */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-900 truncate">{deal.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-500 tabular-nums">
            {formatCompactCurrency(deal.wiredCents)} / {formatCompactCurrency(deal.committedCents)}
          </span>
          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                progress >= 80 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : "bg-amber-500"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Health indicator - fixed width */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("w-5 flex justify-center flex-shrink-0", health.color)}>
              {health.icon}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {health.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Link>
  );
}

function DealSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="w-16 h-5 bg-slate-100 rounded animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        <div className="h-2 w-16 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="w-5 h-4 bg-slate-100 rounded animate-pulse" />
    </div>
  );
}

export function ActiveDealsModule({ deals, loading }: ActiveDealsModuleProps) {
  const sortedDeals = [...deals].sort((a, b) => {
    const stagePriority: Record<string, number> = { closing: 0, live: 1, sourcing: 2 };
    const healthPriority: Record<DealHealth, number> = { at_risk: 0, watch: 1, on_track: 2 };
    const stageDiff = (stagePriority[a.stage] || 3) - (stagePriority[b.stage] || 3);
    if (stageDiff !== 0) return stageDiff;
    return (healthPriority[a.health] || 3) - (healthPriority[b.health] || 3);
  });

  const closingCount = deals.filter((d) => d.stage === "closing").length;
  const atRiskCount = deals.filter((d) => d.health === "at_risk").length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Active Deals</span>
          {!loading && (
            <span className="text-[10px] text-slate-500">
              <span className="text-purple-600">{closingCount} closing</span>
              {atRiskCount > 0 && <span className="text-red-600"> · {atRiskCount} at risk</span>}
            </span>
          )}
        </div>
        <Link href="/deals?stage=sourcing,live,closing" className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50">
        {loading ? (
          <>
            <DealSkeleton />
            <DealSkeleton />
            <DealSkeleton />
          </>
        ) : sortedDeals.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Briefcase className="h-6 w-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-500">No active deals</p>
          </div>
        ) : (
          sortedDeals.slice(0, 5).map((deal) => <DealRow key={deal.id} deal={deal} />)
        )}
      </div>

      {/* Footer */}
      {sortedDeals.length > 5 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <Link href="/deals?stage=sourcing,live,closing" className="text-[10px] text-slate-500 hover:text-slate-700">
            +{sortedDeals.length - 5} more
          </Link>
        </div>
      )}
    </div>
  );
}
