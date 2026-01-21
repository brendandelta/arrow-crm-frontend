"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  FileWarning,
  TrendingDown,
  UserX,
  CheckCircle2,
} from "lucide-react";

interface RiskFlag {
  active: boolean;
  message: string;
  severity: "danger" | "warning" | "info";
  count?: number;
  missing?: string[];
}

interface RiskFlags {
  pricing_stale?: RiskFlag;
  coverage_low?: RiskFlag;
  missing_docs?: RiskFlag;
  deadline_risk?: RiskFlag;
  stale_outreach?: RiskFlag;
  overdue_tasks?: RiskFlag;
}

interface RiskFlagIndicatorProps {
  riskFlags: RiskFlags;
  showLabels?: boolean;
  size?: "sm" | "md";
}

const flagConfig: Record<string, { icon: typeof AlertTriangle; label: string }> = {
  pricing_stale: { icon: TrendingDown, label: "Pricing Stale" },
  coverage_low: { icon: TrendingDown, label: "Low Coverage" },
  missing_docs: { icon: FileWarning, label: "Missing Docs" },
  deadline_risk: { icon: Clock, label: "Deadline Risk" },
  stale_outreach: { icon: UserX, label: "Stale Outreach" },
  overdue_tasks: { icon: AlertTriangle, label: "Overdue Tasks" },
};

const severityColors = {
  danger: {
    bg: "bg-red-100",
    text: "text-red-600",
    border: "border-red-200",
  },
  warning: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  info: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200",
  },
};

export function RiskFlagIndicator({
  riskFlags,
  showLabels = false,
  size = "md",
}: RiskFlagIndicatorProps) {
  const [hoveredFlag, setHoveredFlag] = useState<string | null>(null);

  const activeFlags = Object.entries(riskFlags).filter(
    ([_, flag]) => flag && flag.active
  );

  if (activeFlags.length === 0) {
    return showLabels ? (
      <div className="flex items-center gap-1.5 text-green-600">
        <CheckCircle2 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span className="text-xs">No issues</span>
      </div>
    ) : null;
  }

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const padding = size === "sm" ? "p-1" : "p-1.5";

  return (
    <div className="flex items-center gap-1 relative">
      {activeFlags.map(([key, flag]) => {
        if (!flag) return null;
        const config = flagConfig[key];
        if (!config) return null;

        const Icon = config.icon;
        const colors = severityColors[flag.severity];

        return (
          <div
            key={key}
            className="relative"
            onMouseEnter={() => setHoveredFlag(key)}
            onMouseLeave={() => setHoveredFlag(null)}
          >
            <div
              className={`${padding} rounded ${colors.bg} ${colors.text} cursor-help transition-colors`}
            >
              <Icon className={iconSize} />
            </div>

            {/* Tooltip */}
            {hoveredFlag === key && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20">
                <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-slate-300 mt-0.5">{flag.message}</div>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </div>
            )}
          </div>
        );
      })}

      {showLabels && activeFlags.length > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          {activeFlags.length} {activeFlags.length === 1 ? "issue" : "issues"}
        </span>
      )}
    </div>
  );
}

// Summary badge for compact display
export function RiskFlagSummary({
  summary,
}: {
  summary: {
    count: number;
    hasDanger: boolean;
    hasWarning: boolean;
  };
}) {
  if (summary.count === 0) return null;

  const bgColor = summary.hasDanger
    ? "bg-red-100"
    : summary.hasWarning
    ? "bg-amber-100"
    : "bg-blue-100";

  const textColor = summary.hasDanger
    ? "text-red-700"
    : summary.hasWarning
    ? "text-amber-700"
    : "text-blue-700";

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${bgColor} ${textColor}`}
    >
      <AlertTriangle className="h-3 w-3" />
      {summary.count}
    </span>
  );
}

// Expanded panel showing all risk flags with details
export function RiskFlagsPanel({
  riskFlags,
  onDismiss,
}: {
  riskFlags: RiskFlags;
  onDismiss?: (key: string) => void;
}) {
  const activeFlags = Object.entries(riskFlags).filter(
    ([_, flag]) => flag && flag.active
  );

  if (activeFlags.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
        No active risk flags
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activeFlags.map(([key, flag]) => {
        if (!flag) return null;
        const config = flagConfig[key];
        if (!config) return null;

        const Icon = config.icon;
        const colors = severityColors[flag.severity];

        return (
          <div
            key={key}
            className={`flex items-start gap-3 p-3 rounded-lg border ${colors.border} ${colors.bg}`}
          >
            <Icon className={`h-5 w-5 ${colors.text} mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm ${colors.text}`}>
                {config.label}
              </div>
              <div className="text-sm text-slate-600 mt-0.5">{flag.message}</div>
              {flag.missing && flag.missing.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {flag.missing.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="text-xs bg-white px-2 py-0.5 rounded border"
                    >
                      {item.replace(/_/g, " ")}
                    </span>
                  ))}
                  {flag.missing.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{flag.missing.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(key)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="sr-only">Dismiss</span>
                &times;
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
