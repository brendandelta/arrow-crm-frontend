"use client";

import Link from "next/link";
import {
  AlertTriangle,
  FileWarning,
  KeyRound,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type AlertItem, type AlertType } from "@/lib/dashboard-api";

interface AlertsModuleProps {
  alerts: AlertItem[];
  loading?: boolean;
  onDismiss?: (alertId: string) => void;
}

const alertTypeConfig: Record<AlertType, { icon: React.ReactNode; bgColor: string }> = {
  document_expiring: {
    icon: <FileWarning className="h-4 w-4" />,
    bgColor: "bg-amber-100 text-amber-600",
  },
  document_missing: {
    icon: <FileWarning className="h-4 w-4" />,
    bgColor: "bg-red-100 text-red-600",
  },
  credential_overdue: {
    icon: <KeyRound className="h-4 w-4" />,
    bgColor: "bg-red-100 text-red-600",
  },
  credential_due_soon: {
    icon: <KeyRound className="h-4 w-4" />,
    bgColor: "bg-amber-100 text-amber-600",
  },
};

function AlertRow({
  alert,
  onDismiss,
}: {
  alert: AlertItem;
  onDismiss?: (alertId: string) => void;
}) {
  const config = alertTypeConfig[alert.type];
  const isError = alert.severity === "error";

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-4 py-3",
        "border-b border-slate-100 last:border-b-0",
        isError ? "bg-red-50/30" : "bg-amber-50/30"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
          config.bgColor
        )}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {alert.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <Link
          href={alert.action.href}
          className={cn(
            "text-xs font-medium px-2 py-1 rounded-md transition-colors",
            isError
              ? "text-red-700 hover:bg-red-100"
              : "text-amber-700 hover:bg-amber-100"
          )}
        >
          {alert.action.label}
        </Link>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
            onClick={() => onDismiss(alert.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function AlertSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function AlertsModule({ alerts, loading, onDismiss }: AlertsModuleProps) {
  // Don't render if no alerts
  if (!loading && alerts.length === 0) {
    return null;
  }

  const errorCount = alerts.filter((a) => a.severity === "error").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3 border-b",
          errorCount > 0
            ? "bg-red-50/50 border-red-100"
            : "bg-amber-50/50 border-amber-100"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                errorCount > 0 ? "text-red-500" : "text-amber-500"
              )}
            />
            <h2 className="text-sm font-semibold text-slate-900">
              {errorCount > 0 ? "Issues Requiring Action" : "Warnings"}
            </h2>
            <span
              className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                errorCount > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {alerts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts list */}
      <div className="max-h-[200px] overflow-auto">
        {loading ? (
          <>
            <AlertSkeleton />
            <AlertSkeleton />
          </>
        ) : (
          alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onDismiss={onDismiss} />
          ))
        )}
      </div>
    </div>
  );
}
