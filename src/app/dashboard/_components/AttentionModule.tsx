"use client";

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
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type AttentionItem,
  type AttentionSeverity,
  type AttentionItemType,
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
  overdue_task: <AlertTriangle className="h-3.5 w-3.5" />,
  due_today_task: <Clock className="h-3.5 w-3.5" />,
  high_priority_task: <CheckCircle2 className="h-3.5 w-3.5" />,
  deal_closing_soon: <Briefcase className="h-3.5 w-3.5" />,
  interest_stale: <User className="h-3.5 w-3.5" />,
  capital_gap: <DollarSign className="h-3.5 w-3.5" />,
  document_expiring: <FileWarning className="h-3.5 w-3.5" />,
  document_missing: <FileWarning className="h-3.5 w-3.5" />,
  credential_rotation: <AlertTriangle className="h-3.5 w-3.5" />,
  follow_up_needed: <User className="h-3.5 w-3.5" />,
};

const severityConfig: Record<AttentionSeverity, { dot: string; bg: string; text: string }> = {
  critical: { dot: "bg-red-500", bg: "bg-red-100", text: "text-red-600" },
  high: { dot: "bg-amber-500", bg: "bg-amber-100", text: "text-amber-600" },
  medium: { dot: "bg-blue-500", bg: "bg-blue-100", text: "text-blue-600" },
  low: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-500" },
};

function AttentionItemRow({ item }: { item: AttentionItem }) {
  const config = severityConfig[item.severity];

  return (
    <Link
      href={item.primaryAction.href}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
    >
      {/* Severity dot - fixed width */}
      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", config.dot)} />

      {/* Icon - fixed width */}
      <div className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0", config.bg, config.text)}>
        {typeIcons[item.type]}
      </div>

      {/* Content - flexible */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-900 truncate">{item.title}</p>
        <p className="text-[10px] text-slate-500 truncate">{item.subtitleReason}</p>
      </div>

      {/* Arrow - fixed width */}
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </Link>
  );
}

function AttentionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="w-2 h-2 rounded-full bg-slate-100 animate-pulse" />
      <div className="w-6 h-6 rounded bg-slate-100 animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
        <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
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
  const timeframeLabels = { today: "Today", this_week: "This Week", all: "All" };
  const scopeLabels = { mine: "Mine", team: "Team" };

  const criticalCount = items.filter((i) => i.severity === "critical").length;
  const highCount = items.filter((i) => i.severity === "high").length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-amber-100 flex items-center justify-center">
            <Bell className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Needs Attention</span>
          {!loading && items.length > 0 && (
            <span className="text-[10px] text-slate-500">
              {criticalCount > 0 && <span className="text-red-600">{criticalCount} critical</span>}
              {criticalCount > 0 && highCount > 0 && " · "}
              {highCount > 0 && <span className="text-amber-600">{highCount} high</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-slate-500">
                {timeframeLabels[timeframe]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(timeframeLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onTimeframeChange(key as "today" | "this_week" | "all")}
                  className={cn("text-xs", timeframe === key && "bg-slate-100")}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-slate-500">
                {scopeLabels[scope]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(scopeLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onScopeChange(key as "mine" | "team")}
                  className={cn("text-xs", scope === key && "bg-slate-100")}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* List - fixed height with scroll */}
      <div className="max-h-[320px] overflow-auto divide-y divide-slate-50">
        {loading ? (
          <>
            <AttentionSkeleton />
            <AttentionSkeleton />
            <AttentionSkeleton />
            <AttentionSkeleton />
          </>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs text-slate-500">All caught up</p>
          </div>
        ) : (
          items.slice(0, 8).map((item) => <AttentionItemRow key={item.id} item={item} />)
        )}
      </div>

      {/* Footer */}
      {items.length > 8 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <Link href="/tasks" className="text-[10px] text-slate-500 hover:text-slate-700">
            View all {items.length} items
          </Link>
        </div>
      )}
    </div>
  );
}
