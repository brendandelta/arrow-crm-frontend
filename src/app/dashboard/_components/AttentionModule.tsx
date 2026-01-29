"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Briefcase,
  DollarSign,
  User,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type AttentionItem,
  type AttentionSeverity,
  type AttentionItemType,
  formatRelativeDate,
} from "@/lib/dashboard-api";

interface AttentionModuleProps {
  items: AttentionItem[];
  loading?: boolean;
  timeframe: "today" | "this_week" | "all";
  scope: "mine" | "team";
  onTimeframeChange: (timeframe: "today" | "this_week" | "all") => void;
  onScopeChange: (scope: "mine" | "team") => void;
}

const typeIcons: Record<AttentionItemType, React.ReactNode> = {
  overdue_task: <AlertTriangle className="h-4 w-4" />,
  due_today_task: <Clock className="h-4 w-4" />,
  high_priority_task: <CheckCircle2 className="h-4 w-4" />,
  deal_closing_soon: <Briefcase className="h-4 w-4" />,
  interest_stale: <User className="h-4 w-4" />,
  capital_gap: <DollarSign className="h-4 w-4" />,
  document_expiring: <FileWarning className="h-4 w-4" />,
  document_missing: <FileWarning className="h-4 w-4" />,
  credential_rotation: <AlertTriangle className="h-4 w-4" />,
  follow_up_needed: <User className="h-4 w-4" />,
};

const severityStyles: Record<AttentionSeverity, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const severityIconBg: Record<AttentionSeverity, string> = {
  critical: "bg-red-100 text-red-600",
  high: "bg-amber-100 text-amber-600",
  medium: "bg-blue-100 text-blue-600",
  low: "bg-slate-100 text-slate-500",
};

function AttentionItemRow({ item }: { item: AttentionItem }) {
  return (
    <Link
      href={item.primaryAction.href}
      className={cn(
        "group flex items-start gap-3 px-4 py-3",
        "hover:bg-slate-50/80 transition-colors",
        "border-b border-slate-100 last:border-b-0"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5",
          severityIconBg[item.severity]
        )}
      >
        {typeIcons[item.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-slate-700">
              {item.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{item.subtitleReason}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "flex-shrink-0 text-[10px] font-medium",
              severityStyles[item.severity]
            )}
          >
            {item.severity}
          </Badge>
        </div>

        {/* Related entities */}
        {item.relatedEntities.length > 1 && (
          <div className="flex items-center gap-2 mt-1.5">
            {item.relatedEntities.slice(1).map((entity, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] text-slate-400"
              >
                <span className="capitalize">{entity.type}:</span>
                <span className="text-slate-600">{entity.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
          {item.primaryAction.label}
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  );
}

function AttentionSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-5 w-16 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function AttentionModule({
  items,
  loading,
  timeframe,
  scope,
  onTimeframeChange,
  onScopeChange,
}: AttentionModuleProps) {
  const timeframeLabels = {
    today: "Today",
    this_week: "This Week",
    all: "All",
  };

  const scopeLabels = {
    mine: "Mine",
    team: "Team",
  };

  // Group items by severity for summary
  const criticalCount = items.filter((i) => i.severity === "critical").length;
  const highCount = items.filter((i) => i.severity === "high").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Needs Attention
            </h2>
            {!loading && (
              <div className="flex items-center gap-2">
                {criticalCount > 0 && (
                  <Badge variant="outline" className={severityStyles.critical}>
                    {criticalCount} critical
                  </Badge>
                )}
                {highCount > 0 && (
                  <Badge variant="outline" className={severityStyles.high}>
                    {highCount} high
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-slate-600"
                >
                  {timeframeLabels[timeframe]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(timeframeLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() =>
                      onTimeframeChange(key as "today" | "this_week" | "all")
                    }
                    className={cn(timeframe === key && "bg-slate-100")}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-slate-600"
                >
                  {scopeLabels[scope]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(scopeLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onScopeChange(key as "mine" | "team")}
                    className={cn(scope === key && "bg-slate-100")}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Items */}
      <ScrollArea className="max-h-[400px]">
        {loading ? (
          <>
            <AttentionSkeleton />
            <AttentionSkeleton />
            <AttentionSkeleton />
            <AttentionSkeleton />
          </>
        ) : items.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">All caught up</p>
            <p className="text-xs text-slate-500 mt-1">
              No urgent items need your attention
            </p>
          </div>
        ) : (
          items.slice(0, 10).map((item) => (
            <AttentionItemRow key={item.id} item={item} />
          ))
        )}
      </ScrollArea>

      {/* Footer */}
      {items.length > 10 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30">
          <Link
            href="/tasks"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            View all {items.length} items →
          </Link>
        </div>
      )}
    </div>
  );
}
