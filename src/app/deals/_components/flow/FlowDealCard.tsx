"use client";

import { Calendar, Blocks, Users, ListTodo, AlertTriangle } from "lucide-react";
import { getPriorityConfig } from "../priority";
import { formatCurrency } from "../utils";
import type { FlowDeal } from "./types";

interface FlowDealCardProps {
  deal: FlowDeal;
  onClick: () => void;
  compact?: boolean;
}

export function FlowDealCard({ deal, onClick, compact }: FlowDealCardProps) {
  const hasRisk = deal.riskFlagsSummary.count > 0;
  const hasDanger = hasRisk && deal.riskFlagsSummary.hasDanger;
  const hasWarning = hasRisk && !hasDanger && deal.riskFlagsSummary.hasWarning;
  const isPastDue = deal.daysUntilClose !== null && deal.daysUntilClose < 0;
  const isUrgent = deal.daysUntilClose !== null && deal.daysUntilClose <= 7 && deal.daysUntilClose >= 0;
  const priorityConfig = getPriorityConfig(deal.priority);

  const coveragePct = deal.coverageRatio ?? 0;
  const coverageColor =
    coveragePct >= 100
      ? "bg-emerald-500"
      : coveragePct >= 60
      ? "bg-blue-500"
      : coveragePct >= 30
      ? "bg-amber-500"
      : "bg-slate-300";

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-lg border bg-white p-3 cursor-pointer
        transition-all duration-150
        hover:shadow-md hover:border-slate-300 hover:-translate-y-px
        ${hasDanger ? "border-l-[3px] border-l-red-400" : ""}
        ${hasWarning ? "border-l-[3px] border-l-amber-400" : ""}
        ${!hasDanger && !hasWarning ? "border-slate-200" : ""}
      `}
    >
      {/* Row 1: Name + Priority + Owner */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate leading-tight">
              {deal.name}
            </span>
            <span
              className={`shrink-0 inline-flex items-center rounded px-1 py-px text-[10px] font-semibold leading-none ${priorityConfig.color}`}
            >
              {priorityConfig.shortLabel}
            </span>
          </div>
          {deal.company && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5 leading-tight">
              {deal.company}
            </p>
          )}
        </div>
        {deal.owner && (
          <div className="shrink-0 h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-600">
            {deal.owner.firstName.charAt(0)}
          </div>
        )}
      </div>

      {/* Row 2: Coverage bar + value */}
      {!compact && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">
              {formatCurrency(deal.blocksValue)}
            </span>
            {deal.coverageRatio !== null && (
              <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                {deal.coverageRatio}%
              </span>
            )}
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${coverageColor}`}
              style={{ width: `${Math.min(coveragePct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Row 3: Signal icons */}
      <div className="flex items-center gap-2.5 mt-2">
        {deal.expectedClose && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] tabular-nums ${
              isPastDue
                ? "text-red-600"
                : isUrgent
                ? "text-amber-600"
                : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {isPastDue
              ? `${Math.abs(deal.daysUntilClose!)}d over`
              : deal.daysUntilClose === 0
              ? "Today"
              : `${deal.daysUntilClose}d`}
          </span>
        )}
        {deal.blocks > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
            <Blocks className="h-3 w-3" />
            {deal.blocks}
          </span>
        )}
        {deal.targetsNeedingFollowup > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600 tabular-nums">
            <Users className="h-3 w-3" />
            {deal.targetsNeedingFollowup}
          </span>
        )}
        {deal.overdueTasksCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-red-600 tabular-nums">
            <ListTodo className="h-3 w-3" />
            {deal.overdueTasksCount}
          </span>
        )}
        {hasRisk && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] ${
              hasDanger ? "text-red-500" : "text-amber-500"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
          </span>
        )}
        {/* Spacer pushes best price right if present */}
        {deal.bestPrice ? (
          <span className="ml-auto text-[11px] font-medium text-muted-foreground tabular-nums">
            {formatCurrency(deal.bestPrice)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
