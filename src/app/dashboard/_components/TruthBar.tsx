"use client";

import Link from "next/link";
import {
  Briefcase,
  CircleDollarSign,
  Wallet,
  AlertCircle,
  Calendar,
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
  accent?: "default" | "success" | "warning" | "danger";
  sublabel?: string;
  loading?: boolean;
}

function StatTile({
  label,
  value,
  icon,
  href,
  accent = "default",
  sublabel,
  loading,
}: StatTileProps) {
  const accentColors = {
    default: "text-slate-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse" />
            <div className="h-5 w-12 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="bg-white rounded-lg border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors block"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            {label}
          </p>
          <p className={cn("text-lg font-semibold tabular-nums leading-tight", accentColors[accent])}>
            {value}
          </p>
          {sublabel && (
            <p className="text-[10px] text-slate-400 truncate">{sublabel}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TruthBar({ metrics, loading }: TruthBarProps) {
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
      accent: "default" as const,
    },
    {
      label: "Committed",
      value: formatCompactCurrency(m.totalCommittedCents),
      icon: <CircleDollarSign className="h-4 w-4" />,
      href: "/deals?stage=live,closing",
      accent: "default" as const,
    },
    {
      label: "Wired",
      value: formatCompactCurrency(m.totalWiredCents),
      icon: <Wallet className="h-4 w-4" />,
      href: "/deals?stage=live,closing",
      accent: m.totalWiredCents < m.totalCommittedCents * 0.8 ? ("warning" as const) : ("success" as const),
      sublabel: m.totalCommittedCents > 0
        ? `${Math.round((m.totalWiredCents / m.totalCommittedCents) * 100)}% of committed`
        : undefined,
    },
    {
      label: "Overdue",
      value: m.overdueTasks,
      icon: <AlertCircle className="h-4 w-4" />,
      href: "/tasks?filter=overdue",
      accent: m.overdueTasks > 0
        ? m.overdueTasks > 5 ? ("danger" as const) : ("warning" as const)
        : ("success" as const),
      sublabel: m.tasksDueToday > 0 ? `${m.tasksDueToday} due today` : undefined,
    },
    {
      label: "Next Close",
      value: m.nextCloseDate ? formatRelativeDate(m.nextCloseDate) : "—",
      icon: <Calendar className="h-4 w-4" />,
      href: m.nextCloseDealName
        ? `/deals?search=${encodeURIComponent(m.nextCloseDealName)}`
        : "/deals?stage=closing",
      accent: "default" as const,
      sublabel: m.nextCloseDealName || undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {tiles.map((tile, index) => (
        <StatTile key={index} {...tile} loading={loading} />
      ))}
    </div>
  );
}
