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
  onMissingDocClick?: () => void;
  onConstraintClick?: () => void;
  onDeadlineClick?: () => void;
  onBlockingClick?: () => void;
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
  onMissingDocClick,
  onConstraintClick,
  onDeadlineClick,
  onBlockingClick,
}: TruthPanelProps) {
  const panels = [
    {
      key: "bestPrice",
      icon: DollarSign,
      label: "Best Price",
      hasData: !!bestPrice,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      hoverColor: "hover:ring-green-200",
      onClick: bestPrice && onBlockClick ? () => onBlockClick(bestPrice.blockId) : undefined,
      content: bestPrice ? (
        <div>
          <div className="text-2xl font-semibold">{formatCurrency(bestPrice.priceCents)}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {bestPrice.source || "Unknown source"}
          </div>
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
      hoverColor: "hover:ring-amber-200",
      onClick: biggestConstraint && onConstraintClick ? onConstraintClick : undefined,
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
      hoverColor: "hover:ring-orange-200",
      onClick: missingDoc && onMissingDocClick ? onMissingDocClick : undefined,
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
    {
      key: "blocking",
      icon: Ban,
      label: "Blocking",
      hasData: !!blocking?.active,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      hoverColor: "hover:ring-red-200",
      onClick: blocking?.active && onBlockingClick ? onBlockingClick : undefined,
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
        const isInteractive = !!panel.onClick;
        return (
          <div
            key={panel.key}
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onClick={panel.onClick}
            onKeyDown={isInteractive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); panel.onClick?.(); } } : undefined}
            className={`rounded-lg border p-4 transition-all ${panel.hasData ? panel.bgColor : "bg-muted"} ${
              isInteractive ? `cursor-pointer hover:ring-2 ${panel.hoverColor}` : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`h-4 w-4 ${panel.hasData ? panel.iconColor : "text-muted-foreground"}`} />
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
