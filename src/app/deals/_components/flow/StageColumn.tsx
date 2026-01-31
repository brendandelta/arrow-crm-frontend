"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FlowDealCard } from "./FlowDealCard";
import { STATUS_CONFIG } from "./types";
import { formatCurrency } from "../utils";
import type { FlowDeal } from "./types";

/* ── Sortable card wrapper ─────────────────────────────────────── */

function SortableCard({
  deal,
  onSelect,
  dragOccurredRef,
}: {
  deal: FlowDeal;
  onSelect: (deal: FlowDeal) => void;
  dragOccurredRef: React.RefObject<boolean>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `deal-${deal.id}`,
    data: { deal },
    transition: {
      duration: 250,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {isDragging ? (
        /* Placeholder — keeps layout height via invisible card, shows a
           clean dashed outline so the user sees the "slot" */
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/80">
          <div className="invisible">
            <FlowDealCard deal={deal} onClick={() => {}} />
          </div>
        </div>
      ) : (
        <FlowDealCard
          deal={deal}
          onClick={() => {
            if (!dragOccurredRef.current) onSelect(deal);
          }}
        />
      )}
    </div>
  );
}

/* ── Stage column ───────────────────────────────────────────────── */

interface StageColumnProps {
  status: string;
  deals: FlowDeal[];
  onSelectDeal: (deal: FlowDeal) => void;
  dragOccurredRef: React.RefObject<boolean>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isActiveOver?: boolean;
}

export function StageColumn({
  status,
  deals,
  onSelectDeal,
  dragOccurredRef,
  collapsed,
  onToggleCollapse,
  isActiveOver,
}: StageColumnProps) {
  // Droppable fallback for empty columns
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${status}`,
  });

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.sourcing;
  const totalValue = deals.reduce((sum, d) => sum + (d.blocksValue || 0), 0);
  const coverages = deals
    .map((d) => d.coverageRatio)
    .filter((c): c is number => c !== null);
  const avgCoverage =
    coverages.length > 0
      ? Math.round(coverages.reduce((a, b) => a + b, 0) / coverages.length)
      : null;

  const highlighted = isOver || isActiveOver;

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className={`flex flex-col items-center gap-2 rounded-lg border ${cfg.borderColor} px-2 py-4 bg-white hover:bg-slate-50 transition-colors min-w-[44px]`}
      >
        <div className={`h-2 w-2 rounded-full ${cfg.dotColor}`} />
        <span
          className="text-xs font-medium text-muted-foreground"
          style={{ writingMode: "vertical-rl" }}
        >
          {cfg.label}
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {deals.length}
        </span>
      </button>
    );
  }

  const itemIds = deals.map((d) => `deal-${d.id}`);

  return (
    <div className="h-full flex flex-col flex-1 min-w-0">
      {/* Column header */}
      <button
        onClick={onToggleCollapse}
        className={`flex items-center justify-between px-3 py-2.5 rounded-t-lg border ${cfg.borderColor} ${cfg.bgColor} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${cfg.dotColor}`} />
          <span className={`text-sm font-semibold ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground bg-white/70 rounded px-1.5 py-0.5 font-medium">
            {deals.length}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-muted-foreground tabular-nums">
            {formatCurrency(totalValue)}
          </div>
          {avgCoverage !== null && (
            <div className="text-[10px] text-muted-foreground tabular-nums">
              {avgCoverage}% avg
            </div>
          )}
        </div>
      </button>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-0 rounded-b-lg border border-t-0 transition-all duration-200 overflow-auto ${
          highlighted
            ? "bg-slate-100 ring-2 ring-inset ring-slate-300 shadow-inner"
            : "bg-slate-50/50"
        } ${cfg.borderColor}`}
      >
        <div className="h-full">
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="p-1.5 space-y-1.5">
              {deals.length === 0 ? (
                <div
                  className={`text-center py-12 text-muted-foreground text-xs transition-all duration-200 ${
                    highlighted ? "py-16" : ""
                  }`}
                >
                  {highlighted ? "Drop here" : "No deals"}
                </div>
              ) : (
                deals.map((deal) => (
                  <SortableCard
                    key={deal.id}
                    deal={deal}
                    onSelect={onSelectDeal}
                    dragOccurredRef={dragOccurredRef}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
