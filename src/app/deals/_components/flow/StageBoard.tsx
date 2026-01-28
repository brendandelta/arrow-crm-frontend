"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { StageColumn } from "./StageColumn";
import { FlowDealCard } from "./FlowDealCard";
import { STATUS_ORDER } from "./types";
import type { FlowDeal } from "./types";

/* ── Types ──────────────────────────────────────────────────────── */

interface StageBoardProps {
  deals: FlowDeal[];
  onSelectDeal: (deal: FlowDeal) => void;
  onStatusChange: (dealId: number, newStatus: string) => void;
}

type ColumnsMap = Record<string, FlowDeal[]>;

/* ── Helpers ────────────────────────────────────────────────────── */

function buildColumns(deals: FlowDeal[]): ColumnsMap {
  const columns: ColumnsMap = {};
  for (const status of STATUS_ORDER) {
    columns[status] = deals.filter((d) => d.status === status);
  }
  return columns;
}

/** Find which column a deal-* id lives in */
function findContainer(
  id: UniqueIdentifier,
  columns: ColumnsMap
): string | null {
  const idStr = String(id);

  // Could be a column id (column-sourcing)
  for (const status of STATUS_ORDER) {
    if (idStr === `column-${status}`) return status;
  }

  // Otherwise it's a deal id — scan columns
  for (const [status, deals] of Object.entries(columns)) {
    if (deals.some((d) => `deal-${d.id}` === idStr)) {
      return status;
    }
  }
  return null;
}

/* ── Drop animation config ──────────────────────────────────────── */

const dropAnimation = {
  duration: 280,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

/* ── Component ──────────────────────────────────────────────────── */

export function StageBoard({
  deals,
  onSelectDeal,
  onStatusChange,
}: StageBoardProps) {
  // Local columns state — mutated during drag for real-time card movement
  const [columns, setColumns] = useState<ColumnsMap>(() =>
    buildColumns(deals)
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDeal, setActiveDeal] = useState<FlowDeal | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set()
  );

  const dragOccurredRef = useRef(false);
  const originalStatusRef = useRef<string | null>(null);
  // Mirror columns in a ref so drag-end can read current state without stale closures
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Sync local columns from props when NOT actively dragging
  useEffect(() => {
    if (!activeId) {
      setColumns(buildColumns(deals));
    }
  }, [deals, activeId]);

  /* ── Drag start ─────────────────────────────────────────────── */

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const deal = event.active.data.current?.deal as FlowDeal | undefined;
    if (deal) {
      setActiveId(event.active.id);
      setActiveDeal(deal);
      originalStatusRef.current = deal.status;
      dragOccurredRef.current = false;
    }
  }, []);

  /* ── Drag over (cross-container + within-column reorder) ────── */

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || !activeId) return;

      setColumns((prev) => {
        const activeContainer = findContainer(active.id, prev);
        const overContainer = findContainer(over.id, prev);

        if (!activeContainer || !overContainer) return prev;

        // Track which column the cursor is over for highlight
        setOverColumn(overContainer);

        if (activeContainer === overContainer) {
          // Within-column reorder
          const items = prev[activeContainer];
          const oldIndex = items.findIndex(
            (d) => `deal-${d.id}` === String(active.id)
          );
          const newIndex = items.findIndex(
            (d) => `deal-${d.id}` === String(over.id)
          );
          if (
            oldIndex !== -1 &&
            newIndex !== -1 &&
            oldIndex !== newIndex
          ) {
            return {
              ...prev,
              [activeContainer]: arrayMove(items, oldIndex, newIndex),
            };
          }
          return prev;
        }

        // Cross-container move
        const sourceItems = [...prev[activeContainer]];
        const targetItems = [...prev[overContainer]];
        const activeIndex = sourceItems.findIndex(
          (d) => `deal-${d.id}` === String(active.id)
        );

        if (activeIndex === -1) return prev;

        const [movedDeal] = sourceItems.splice(activeIndex, 1);

        // Insertion index: if hovering over a specific deal, insert at that position;
        // if hovering over the column droppable, append to end
        const overIndex = targetItems.findIndex(
          (d) => `deal-${d.id}` === String(over.id)
        );
        const insertAt = overIndex >= 0 ? overIndex : targetItems.length;
        targetItems.splice(insertAt, 0, movedDeal);

        return {
          ...prev,
          [activeContainer]: sourceItems,
          [overContainer]: targetItems,
        };
      });
    },
    [activeId]
  );

  /* ── Drag end ───────────────────────────────────────────────── */

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      dragOccurredRef.current = true;

      const originalStatus = originalStatusRef.current;
      const finalContainer = findContainer(
        event.active.id,
        columnsRef.current
      );

      // If the deal moved to a different column, fire the status-change callback
      if (
        finalContainer &&
        originalStatus &&
        finalContainer !== originalStatus
      ) {
        const dealId = Number(
          String(event.active.id).replace("deal-", "")
        );
        onStatusChange(dealId, finalContainer);
      }

      // Reset drag state
      setActiveId(null);
      setActiveDeal(null);
      setOverColumn(null);
      originalStatusRef.current = null;

      requestAnimationFrame(() => {
        dragOccurredRef.current = false;
      });
    },
    [onStatusChange]
  );

  /* ── Drag cancel ────────────────────────────────────────────── */

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveDeal(null);
    setOverColumn(null);
    originalStatusRef.current = null;
    // Reset columns to prop-derived state
    setColumns(buildColumns(deals));

    requestAnimationFrame(() => {
      dragOccurredRef.current = false;
    });
  }, [deals]);

  /* ── Column collapse ────────────────────────────────────────── */

  function toggleCollapse(status: string) {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-2 overflow-x-auto pb-2 items-start">
        {STATUS_ORDER.map((status) => (
          <StageColumn
            key={status}
            status={status}
            deals={columns[status] || []}
            onSelectDeal={onSelectDeal}
            dragOccurredRef={dragOccurredRef}
            collapsed={collapsedColumns.has(status)}
            onToggleCollapse={() => toggleCollapse(status)}
            isActiveOver={overColumn === status && !!activeId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeDeal ? (
          <div className="rotate-[1.5deg] scale-[1.03] opacity-95 shadow-2xl shadow-slate-400/25 rounded-lg ring-1 ring-slate-200/60">
            <FlowDealCard deal={activeDeal} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
