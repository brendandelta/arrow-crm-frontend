"use client";

import Link from "next/link";
import {
  Briefcase,
  CircleDollarSign,
  Wallet,
  AlertCircle,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type TruthBarMetrics,
  formatCompactCurrency,
  formatRelativeDate,
} from "@/lib/dashboard-api";

interface TruthBarProps {
  metrics: TruthBarMetrics | null;
  loading?: boolean;
}

interface StatTileProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  href: string;
  variant?: "default" | "success" | "warning" | "danger";
  sublabel?: string;
  loading?: boolean;
}

function StatTile({
  label,
  value,
  icon,
  href,
  variant = "default",
  sublabel,
  loading,
}: StatTileProps) {
  const variantStyles = {
    default: "bg-white border-slate-200/60",
    success: "bg-emerald-50/50 border-emerald-200/60",
    warning: "bg-amber-50/50 border-amber-200/60",
    danger: "bg-red-50/50 border-red-200/60",
  };

  const iconVariantStyles = {
    default: "text-slate-500 bg-slate-100",
    success: "text-emerald-600 bg-emerald-100",
    warning: "text-amber-600 bg-amber-100",
    danger: "text-red-600 bg-red-100",
  };

  const valueVariantStyles = {
    default: "text-slate-900",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-700",
  };

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border",
          "bg-white border-slate-200/60"
        )}
      >
        <div className="h-9 w-9 rounded-lg bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
          <div className="h-5 w-12 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl border",
        "transition-all duration-200",
        "hover:shadow-md hover:border-slate-300/60",
        variantStyles[variant]
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center",
          "transition-transform group-hover:scale-105",
          iconVariantStyles[variant]
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
          {label}
        </p>
        <p
          className={cn(
            "text-lg font-semibold tabular-nums truncate",
            valueVariantStyles[variant]
          )}
        >
          {value}
        </p>
        {sublabel && (
          <p className="text-[10px] text-slate-400 truncate">{sublabel}</p>
        )}
      </div>
    </Link>
  );
}

export function TruthBar({ metrics, loading }: TruthBarProps) {
  // Use default values if metrics is null
  const m = metrics || {
    activeDeals: 0,
    totalCommittedCents: 0,
    totalWiredCents: 0,
    totalDeployedCents: 0,
    overdueTasks: 0,
    tasksDueToday: 0,
    nextCloseDate: null,
    nextDeadlineDate: null,
    nextCloseDealName: null,
  };

  const tiles = [
    {
      label: "Active Deals",
      value: m.activeDeals,
      icon: <Briefcase className="h-4 w-4" />,
      href: "/deals?stage=sourcing,live,closing",
      variant: "default" as const,
    },
    {
      label: "Committed",
      value: formatCompactCurrency(m.totalCommittedCents),
      icon: <CircleDollarSign className="h-4 w-4" />,
      href: "/deals?stage=live,closing",
      variant: "default" as const,
    },
    {
      label: "Wired",
      value: formatCompactCurrency(m.totalWiredCents),
      icon: <Wallet className="h-4 w-4" />,
      href: "/deals?stage=live,closing",
      variant:
        m.totalWiredCents < m.totalCommittedCents * 0.8
          ? ("warning" as const)
          : ("success" as const),
      sublabel:
        m.totalCommittedCents > 0
          ? `${Math.round((m.totalWiredCents / m.totalCommittedCents) * 100)}% of committed`
          : undefined,
    },
    {
      label: "Overdue Tasks",
      value: m.overdueTasks,
      icon: <AlertCircle className="h-4 w-4" />,
      href: "/tasks?filter=overdue",
      variant:
        m.overdueTasks > 0
          ? m.overdueTasks > 5
            ? ("danger" as const)
            : ("warning" as const)
          : ("success" as const),
      sublabel:
        m.tasksDueToday > 0
          ? `${m.tasksDueToday} due today`
          : undefined,
    },
    {
      label: "Next Close",
      value: m.nextCloseDate
        ? formatRelativeDate(m.nextCloseDate)
        : "—",
      icon: <Calendar className="h-4 w-4" />,
      href: m.nextCloseDealName
        ? `/deals?search=${encodeURIComponent(m.nextCloseDealName)}`
        : "/deals?stage=closing",
      variant: "default" as const,
      sublabel: m.nextCloseDealName || undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {tiles.map((tile, index) => (
        <StatTile key={index} {...tile} loading={loading} />
      ))}
    </div>
  );
}
