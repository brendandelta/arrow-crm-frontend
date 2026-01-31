"use client";

import Link from "next/link";
import {
  AlertTriangle,
  FileWarning,
  KeyRound,
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

const alertTypeConfig: Record<AlertType, { icon: React.ReactNode; bg: string; iconBg: string }> = {
  document_expiring: {
    icon: <FileWarning className="h-3.5 w-3.5" />,
    bg: "bg-amber-50/50",
    iconBg: "bg-amber-100 text-amber-600",
  },
  document_missing: {
    icon: <FileWarning className="h-3.5 w-3.5" />,
    bg: "bg-red-50/50",
    iconBg: "bg-red-100 text-red-600",
  },
  credential_overdue: {
    icon: <KeyRound className="h-3.5 w-3.5" />,
    bg: "bg-red-50/50",
    iconBg: "bg-red-100 text-red-600",
  },
  credential_due_soon: {
    icon: <KeyRound className="h-3.5 w-3.5" />,
    bg: "bg-amber-50/50",
    iconBg: "bg-amber-100 text-amber-600",
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
        "flex items-center gap-3 px-4 py-2.5",
        config.bg
      )}
    >
      {/* Icon */}
      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0", config.iconBg)}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-900 truncate">{alert.title}</p>
        <p className="text-[10px] text-slate-500 truncate">{alert.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={alert.action.href}
          className={cn(
            "text-[10px] font-medium px-2 py-1 rounded transition-colors",
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
            className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600"
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
    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/50">
      <div className="h-7 w-7 rounded-md bg-slate-100 animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
        <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="h-5 w-12 bg-slate-100 rounded animate-pulse" />
    </div>
  );
}

export function AlertsModule({ alerts, loading, onDismiss }: AlertsModuleProps) {
  if (!loading && alerts.length === 0) {
    return null;
  }

  const errorCount = alerts.filter((a) => a.severity === "error").length;
  const hasErrors = errorCount > 0;

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden",
      hasErrors ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"
    )}>
      {/* Header */}
      <div className={cn(
        "px-4 py-2.5 border-b flex items-center gap-2",
        hasErrors ? "border-red-100" : "border-amber-100"
      )}>
        <AlertTriangle className={cn("h-3.5 w-3.5", hasErrors ? "text-red-500" : "text-amber-500")} />
        <span className="text-xs font-semibold text-slate-900">
          {hasErrors ? "Issues" : "Warnings"}
        </span>
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded",
          hasErrors ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
        )}>
          {alerts.length}
        </span>
      </div>

      {/* Alerts list */}
      <div className="divide-y divide-slate-100 max-h-[160px] overflow-auto">
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
