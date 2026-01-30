"use client";

import {
  Target,
  Users,
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  UserCheck,
} from "lucide-react";

interface PrimaryTruthPanelProps {
  // Fundraise progress
  target: number | null;
  committed: number;
  softCircled: number;
  // Lead investor info (from customFields.primary)
  leadInvestor?: string | null;
  // Interests/demand summary
  interestsCount: number;
  committedInterestsCount: number;
  // Document status
  missingDoc: {
    kind: string;
    label: string;
  } | null;
  documentCompletionPercent: number;
  // Deadlines
  nextDeadline: {
    date: string;
    type: string;
    label: string;
  } | null;
  // Tasks/blockers
  overdueTasksCount: number;
  // Callbacks
  onMissingDocClick?: () => void;
  onDeadlineClick?: () => void;
  onTasksClick?: () => void;
}

function formatCurrency(cents: number | null) {
  if (!cents || cents === 0) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(2)}B`;
  }
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(0)}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string) {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function PrimaryTruthPanel({
  target,
  committed,
  softCircled,
  leadInvestor,
  interestsCount,
  committedInterestsCount,
  missingDoc,
  documentCompletionPercent,
  nextDeadline,
  overdueTasksCount,
  onMissingDocClick,
  onDeadlineClick,
  onTasksClick,
}: PrimaryTruthPanelProps) {
  // Calculate fundraise progress
  const totalRaised = committed + softCircled;
  const progressPercent = target && target > 0 ? Math.min(100, Math.round((totalRaised / target) * 100)) : 0;
  const isFullyRaised = progressPercent >= 100;
  const isOverHalfway = progressPercent >= 50;

  const panels = [
    {
      key: "progress",
      icon: TrendingUp,
      label: "Fundraise Progress",
      iconColor: isFullyRaised ? "text-emerald-600" : isOverHalfway ? "text-blue-600" : "text-amber-600",
      bgColor: isFullyRaised ? "bg-emerald-50" : isOverHalfway ? "bg-blue-50" : "bg-amber-50",
      content: target ? (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{formatCurrency(totalRaised)}</span>
            <span className="text-sm text-muted-foreground">of {formatCurrency(target)}</span>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFullyRaised ? "bg-emerald-500" : isOverHalfway ? "bg-blue-500" : "bg-amber-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressPercent}% raised</span>
              {target > totalRaised && <span>{formatCurrency(target - totalRaised)} to go</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground">No target set</div>
      ),
    },
    {
      key: "lead",
      icon: UserCheck,
      label: "Lead Investor",
      iconColor: leadInvestor ? "text-indigo-600" : "text-slate-400",
      bgColor: leadInvestor ? "bg-indigo-50" : "bg-slate-50",
      content: leadInvestor ? (
        <div>
          <div className="text-lg font-medium text-slate-900">{leadInvestor}</div>
          <div className="text-xs text-indigo-600 mt-1">Lead confirmed</div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">No lead yet</div>
          <div className="text-xs text-slate-400">Add via Round Details</div>
        </div>
      ),
    },
    {
      key: "demand",
      icon: Users,
      label: "Investor Demand",
      iconColor: committedInterestsCount > 0 ? "text-purple-600" : interestsCount > 0 ? "text-blue-600" : "text-slate-400",
      bgColor: committedInterestsCount > 0 ? "bg-purple-50" : interestsCount > 0 ? "bg-blue-50" : "bg-slate-50",
      content: (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{interestsCount}</span>
            <span className="text-sm text-muted-foreground">investor{interestsCount !== 1 ? "s" : ""}</span>
          </div>
          {committedInterestsCount > 0 && (
            <div className="text-xs text-purple-600 mt-1 font-medium">
              {committedInterestsCount} committed
            </div>
          )}
          {interestsCount === 0 && (
            <div className="text-xs text-slate-400 mt-1">Add interests to track demand</div>
          )}
        </div>
      ),
    },
    {
      key: "diligence",
      icon: FileCheck,
      label: "Diligence",
      hasData: documentCompletionPercent < 100,
      iconColor: documentCompletionPercent >= 100 ? "text-emerald-600" : documentCompletionPercent >= 50 ? "text-amber-600" : "text-orange-600",
      bgColor: documentCompletionPercent >= 100 ? "bg-emerald-50" : documentCompletionPercent >= 50 ? "bg-amber-50" : "bg-orange-50",
      hoverColor: "hover:ring-orange-200",
      onClick: missingDoc && onMissingDocClick ? onMissingDocClick : undefined,
      content: documentCompletionPercent >= 100 ? (
        <div className="text-emerald-600 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          All docs complete
        </div>
      ) : (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{documentCompletionPercent}%</span>
            <span className="text-sm text-muted-foreground">complete</span>
          </div>
          {missingDoc && (
            <div className="text-xs text-orange-600 mt-1">
              Missing: {missingDoc.label}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "deadline",
      icon: Clock,
      label: "Next Deadline",
      hasData: !!nextDeadline,
      iconColor: nextDeadline && daysUntil(nextDeadline.date) <= 7 ? "text-red-600" : "text-blue-600",
      bgColor: nextDeadline && daysUntil(nextDeadline.date) <= 7 ? "bg-red-50" : "bg-blue-50",
      hoverColor: nextDeadline && daysUntil(nextDeadline.date) <= 7 ? "hover:ring-red-200" : "hover:ring-blue-200",
      onClick: nextDeadline && onDeadlineClick ? onDeadlineClick : undefined,
      content: nextDeadline ? (
        <div>
          <div className="text-lg font-semibold">{formatDate(nextDeadline.date)}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{nextDeadline.label}</div>
          <div
            className={`text-xs mt-1 ${
              daysUntil(nextDeadline.date) <= 7
                ? "text-red-600 font-medium"
                : "text-muted-foreground"
            }`}
          >
            {daysUntil(nextDeadline.date) < 0
              ? `${Math.abs(daysUntil(nextDeadline.date))} days overdue`
              : daysUntil(nextDeadline.date) === 0
              ? "Today"
              : `${daysUntil(nextDeadline.date)} days`}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground">No deadlines set</div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {panels.map((panel) => {
        const Icon = panel.icon;
        const isInteractive = !!panel.onClick;
        return (
          <div
            key={panel.key}
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onClick={panel.onClick}
            onKeyDown={
              isInteractive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      panel.onClick?.();
                    }
                  }
                : undefined
            }
            className={`rounded-lg border p-4 transition-all ${panel.bgColor} ${
              isInteractive ? `cursor-pointer hover:ring-2 ${panel.hoverColor}` : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`h-4 w-4 ${panel.iconColor}`} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {panel.label}
              </span>
            </div>
            {panel.content}
          </div>
        );
      })}
    </div>
  );
}
