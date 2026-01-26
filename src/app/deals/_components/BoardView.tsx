"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Users } from "lucide-react";
import { PriorityBadge } from "./PriorityBadge";
import { formatCurrency } from "./utils";
import { DemandProgressBar } from "@/components/deals/DemandProgressBar";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

interface RiskFlags {
  pricing_stale?: { active: boolean };
  coverage_low?: { active: boolean };
  missing_docs?: { active: boolean };
  deadline_risk?: { active: boolean };
  stale_outreach?: { active: boolean };
  overdue_tasks?: { active: boolean };
}

interface Deal {
  id: number;
  name: string;
  company: string | null;
  sector: string | null;
  status: string;
  priority: number;
  owner: Owner | null;
  blocks: number;
  blocksValue: number;
  softCircled: number;
  wired: number;
  totalCommitted: number;
  inventory: number;
  coverageRatio: number | null;
  expectedClose: string | null;
  daysUntilClose: number | null;
  overdueTasksCount: number;
  targetsNeedingFollowup: number;
  riskFlagsSummary: {
    count: number;
    hasDanger: boolean;
    hasWarning: boolean;
  };
}

interface BoardViewProps {
  deals: Deal[];
  onDealClick: (dealId: number) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  sourcing: { label: "Sourcing", color: "text-slate-700", bgColor: "bg-slate-100" },
  live: { label: "Live", color: "text-green-700", bgColor: "bg-green-100" },
  closing: { label: "Closing", color: "text-blue-700", bgColor: "bg-blue-100" },
  closed: { label: "Closed", color: "text-purple-700", bgColor: "bg-purple-100" },
  dead: { label: "Dead", color: "text-red-700", bgColor: "bg-red-100" },
};

const STATUS_ORDER = ["sourcing", "live", "closing", "closed", "dead"];

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const hasRisk = deal.riskFlagsSummary.count > 0;
  const isUrgent = deal.daysUntilClose !== null && deal.daysUntilClose <= 7 && deal.daysUntilClose >= 0;
  const isPastDue = deal.daysUntilClose !== null && deal.daysUntilClose < 0;

  return (
    <div
      onClick={onClick}
      className={`
        p-3 bg-white rounded-lg border shadow-sm cursor-pointer
        hover:shadow-md hover:border-slate-300 transition-all
        ${hasRisk && deal.riskFlagsSummary.hasDanger ? "border-l-4 border-l-red-400" : ""}
        ${hasRisk && !deal.riskFlagsSummary.hasDanger && deal.riskFlagsSummary.hasWarning ? "border-l-4 border-l-amber-400" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="font-medium text-sm truncate">{deal.name}</h4>
            <PriorityBadge priority={deal.priority} compact />
          </div>
          {deal.company && (
            <p className="text-xs text-muted-foreground truncate">{deal.company}</p>
          )}
        </div>
        {deal.owner && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
            {deal.owner.firstName.charAt(0)}
          </div>
        )}
      </div>

      {/* Demand Progress */}
      <div className="mb-2">
        <DemandProgressBar
          softCircled={deal.softCircled}
          committed={deal.totalCommitted - deal.softCircled - deal.wired}
          wired={deal.wired}
          inventory={deal.inventory}
          size="sm"
        />
        {deal.coverageRatio !== null && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {deal.coverageRatio}% coverage
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-muted-foreground">
          {deal.blocks} blocks · {formatCurrency(deal.blocksValue)}
        </span>
      </div>

      {/* Footer - Indicators */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Close Date */}
        {deal.expectedClose && (
          <div className={`flex items-center gap-1 text-xs ${isPastDue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-muted-foreground"}`}>
            <Calendar className="h-3 w-3" />
            {isPastDue ? (
              <span>{Math.abs(deal.daysUntilClose!)}d over</span>
            ) : deal.daysUntilClose === 0 ? (
              <span>Today</span>
            ) : (
              <span>{deal.daysUntilClose}d</span>
            )}
          </div>
        )}

        {/* Overdue Tasks */}
        {deal.overdueTasksCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="h-3 w-3" />
            {deal.overdueTasksCount}
          </div>
        )}

        {/* Targets needing followup */}
        {deal.targetsNeedingFollowup > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <Users className="h-3 w-3" />
            {deal.targetsNeedingFollowup}
          </div>
        )}
      </div>
    </div>
  );
}

function BoardColumn({
  status,
  deals,
  onDealClick,
}: {
  status: string;
  deals: Deal[];
  onDealClick: (dealId: number) => void;
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.sourcing;
  const totalValue = deals.reduce((sum, d) => sum + (d.blocksValue || 0), 0);

  return (
    <div className="flex-1 min-w-[280px] max-w-[320px] flex flex-col">
      {/* Column Header */}
      <div className={`px-3 py-2 rounded-t-lg ${config.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${config.color}`}>{config.label}</span>
            <Badge variant="secondary" className="text-xs">
              {deals.length}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 bg-slate-50 rounded-b-lg p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {deals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No deals
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function BoardView({ deals, onDealClick }: BoardViewProps) {
  // Group deals by status
  const dealsByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = deals.filter((d) => d.status === status);
    return acc;
  }, {} as Record<string, Deal[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_ORDER.map((status) => (
        <BoardColumn
          key={status}
          status={status}
          deals={dealsByStatus[status] || []}
          onDealClick={onDealClick}
        />
      ))}
    </div>
  );
}
