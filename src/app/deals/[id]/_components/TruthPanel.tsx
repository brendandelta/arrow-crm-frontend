"use client";

import { DollarSign, AlertTriangle, FileX, Clock, Ban, CheckCircle2 } from "lucide-react";

interface TruthPanelProps {
  bestPrice: {
    priceCents: number;
    source: string | null;
    blockId: number;
  } | null;
  biggestConstraint: {
    type: string;
    message: string;
  } | null;
  missingDoc: {
    kind: string;
    label: string;
  } | null;
  nextDeadline: {
    date: string;
    type: string;
    label: string;
  } | null;
  blocking: {
    active: boolean;
    message: string;
    severity: string;
  } | null;
  onBlockClick?: (blockId: number) => void;
}

function formatCurrency(cents: number) {
  if (!cents || cents === 0) return "—";
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(2)}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(2)}K`;
  }
  return `$${dollars.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function TruthPanel({
  bestPrice,
  biggestConstraint,
  missingDoc,
  nextDeadline,
  blocking,
  onBlockClick,
}: TruthPanelProps) {
  const panels = [
    {
      key: "bestPrice",
      icon: DollarSign,
      label: "Best Price",
      hasData: !!bestPrice,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      content: bestPrice ? (
        <div>
          <div className="text-2xl font-semibold">{formatCurrency(bestPrice.priceCents)}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {bestPrice.source || "Unknown source"}
          </div>
          {onBlockClick && (
            <button
              onClick={() => onBlockClick(bestPrice.blockId)}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              View block
            </button>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground">No blocks available</div>
      ),
    },
    {
      key: "constraint",
      icon: AlertTriangle,
      label: "Biggest Constraint",
      hasData: !!biggestConstraint,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      content: biggestConstraint ? (
        <div>
          <div className="text-sm font-medium">{biggestConstraint.message}</div>
          <div className="text-xs text-muted-foreground mt-1 capitalize">
            {biggestConstraint.type.replace(/_/g, " ")}
          </div>
        </div>
      ) : (
        <div className="text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          No blockers
        </div>
      ),
    },
    {
      key: "missingDoc",
      icon: FileX,
      label: "Missing Doc",
      hasData: !!missingDoc,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      content: missingDoc ? (
        <div>
          <div className="text-sm font-medium">{missingDoc.label}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Required for diligence
          </div>
        </div>
      ) : (
        <div className="text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          All docs present
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
    {
      key: "blocking",
      icon: Ban,
      label: "Blocking",
      hasData: !!blocking?.active,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      content: blocking?.active ? (
        <div>
          <div className="text-sm font-medium text-red-700">{blocking.message}</div>
        </div>
      ) : (
        <div className="text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          Nothing blocking
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {panels.map((panel) => {
        const Icon = panel.icon;
        return (
          <div
            key={panel.key}
            className={`rounded-lg border p-4 ${panel.hasData ? panel.bgColor : "bg-slate-50"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`h-4 w-4 ${panel.hasData ? panel.iconColor : "text-slate-400"}`} />
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

// Compact horizontal version for smaller spaces
export function TruthPanelCompact({
  bestPrice,
  biggestConstraint,
  nextDeadline,
}: {
  bestPrice: TruthPanelProps["bestPrice"];
  biggestConstraint: TruthPanelProps["biggestConstraint"];
  nextDeadline: TruthPanelProps["nextDeadline"];
}) {
  return (
    <div className="flex items-center gap-4 text-sm">
      {bestPrice && (
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium">{formatCurrency(bestPrice.priceCents)}</span>
          <span className="text-muted-foreground">best price</span>
        </div>
      )}
      {biggestConstraint && (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-amber-700">{biggestConstraint.message}</span>
        </div>
      )}
      {nextDeadline && (
        <div className="flex items-center gap-1.5">
          <Clock
            className={`h-4 w-4 ${
              daysUntil(nextDeadline.date) <= 7 ? "text-red-600" : "text-blue-600"
            }`}
          />
          <span
            className={
              daysUntil(nextDeadline.date) <= 7 ? "text-red-600 font-medium" : ""
            }
          >
            {formatDate(nextDeadline.date)}
          </span>
        </div>
      )}
    </div>
  );
}
