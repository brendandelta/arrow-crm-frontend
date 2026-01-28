"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FlowMetrics } from "./FlowMetrics";
import { FlowToolbar } from "./FlowToolbar";
import { StageBoard } from "./StageBoard";
import { DealInspector } from "./DealInspector";
import { FlowCommandPalette } from "./FlowCommandPalette";
import { FunnelDrawer } from "./FunnelDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_ORDER } from "./types";
import type { FlowDeal, FlowStats, FlowFilter, FlowSort, Owner } from "./types";

interface FlowViewProps {
  deals: FlowDeal[];
  stats: FlowStats | null;
  loading: boolean;
  onStatusChange: (dealId: number, newStatus: string) => void;
  onPriorityChange: (dealId: number, priority: number) => void;
  onCreateDeal: () => void;
  owners: Owner[];
  currentUserId?: number | null;
}

const DEFAULT_FILTER: FlowFilter = {
  search: "",
  owner: "all",
  priority: new Set<number>(),
  risk: false,
  coverage: "all",
  closeDate: "all",
};

function sortDeals(deals: FlowDeal[], sort: FlowSort): FlowDeal[] {
  return [...deals].sort((a, b) => {
    switch (sort) {
      case "priority":
        return a.priority - b.priority;
      case "closeDate":
        return (a.daysUntilClose ?? 9999) - (b.daysUntilClose ?? 9999);
      case "coverage":
        return (b.coverageRatio ?? -1) - (a.coverageRatio ?? -1);
      case "value":
        return (b.blocksValue || 0) - (a.blocksValue || 0);
      default:
        return 0;
    }
  });
}

export function FlowView({
  deals,
  stats,
  loading,
  onStatusChange,
  onPriorityChange,
  onCreateDeal,
  owners,
  currentUserId,
}: FlowViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FlowFilter>(DEFAULT_FILTER);
  const [sort, setSort] = useState<FlowSort>("priority");
  const [focusMode, setFocusMode] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<FlowDeal | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [metricsFilter, setMetricsFilter] = useState<string | null>(null);

  const handleFilterChange = useCallback(
    (partial: Partial<FlowFilter>) => {
      setFilter((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const handleMetricsClick = useCallback(
    (key: string) => {
      if (metricsFilter === key) {
        setMetricsFilter(null);
        // Clear the filter derived from metrics
        handleFilterChange({ risk: false, owner: "all" });
      } else {
        setMetricsFilter(key);
        // Apply filters based on metric clicked
        if (key === "atRisk") {
          handleFilterChange({ risk: true });
        } else if (key === "live") {
          // Handled by the filtered deals logic below
        } else {
          // Soft circled, committed, wired — no direct filter, just highlight
        }
      }
    },
    [metricsFilter, handleFilterChange]
  );

  // Apply filters
  const filteredDeals = useMemo(() => {
    let result = deals;

    // Search
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.company && d.company.toLowerCase().includes(q)) ||
          (d.sector && d.sector.toLowerCase().includes(q))
      );
    }

    // Owner
    if (filter.owner === "me" && currentUserId) {
      result = result.filter((d) => d.owner?.id === currentUserId);
    } else if (filter.owner !== "all" && filter.owner !== "me") {
      const ownerId = Number(filter.owner);
      result = result.filter((d) => d.owner?.id === ownerId);
    }

    // Priority
    if (filter.priority.size > 0) {
      result = result.filter((d) => filter.priority.has(d.priority));
    }

    // Risk
    if (filter.risk) {
      result = result.filter((d) => d.riskFlagsSummary.count > 0);
    }

    // Coverage
    if (filter.coverage === "under") {
      result = result.filter(
        (d) => d.coverageRatio !== null && d.coverageRatio < 60
      );
    } else if (filter.coverage === "covered") {
      result = result.filter(
        (d) =>
          d.coverageRatio !== null &&
          d.coverageRatio >= 60 &&
          d.coverageRatio <= 100
      );
    } else if (filter.coverage === "over") {
      result = result.filter(
        (d) => d.coverageRatio !== null && d.coverageRatio > 100
      );
    }

    // Close date
    if (filter.closeDate !== "all") {
      const days = Number(filter.closeDate);
      result = result.filter(
        (d) =>
          d.daysUntilClose !== null &&
          d.daysUntilClose >= 0 &&
          d.daysUntilClose <= days
      );
    }

    // Metrics filter: "live" highlights
    if (metricsFilter === "live") {
      result = result.filter((d) => d.status === "live");
    }

    return sortDeals(result, sort);
  }, [deals, filter, sort, metricsFilter, currentUserId]);

  // Keep selected deal synced with deals state (for optimistic updates)
  const syncedSelectedDeal = useMemo(() => {
    if (!selectedDeal) return null;
    return deals.find((d) => d.id === selectedDeal.id) || null;
  }, [deals, selectedDeal]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton metrics */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        {/* Skeleton toolbar */}
        <Skeleton className="h-8 w-full rounded-md" />
        {/* Skeleton board */}
        <div className="flex gap-2">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="w-[300px] shrink-0 space-y-2">
              <Skeleton className="h-12 rounded-t-lg" />
              <div className="space-y-1.5 p-1.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${focusMode ? "max-w-none" : ""}`}>
      {/* Metrics strip — hidden in focus mode */}
      {!focusMode && (
        <FlowMetrics
          stats={stats}
          activeFilter={metricsFilter}
          onFilterClick={handleMetricsClick}
          deals={deals}
        />
      )}

      {/* Toolbar */}
      <FlowToolbar
        filter={filter}
        sort={sort}
        onFilterChange={handleFilterChange}
        onSortChange={setSort}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((p) => !p)}
        onOpenCommand={() => setCommandOpen(true)}
        onOpenFunnel={() => setFunnelOpen(true)}
        owners={owners}
        currentUserId={currentUserId}
      />

      {/* Stage board */}
      <StageBoard
        deals={filteredDeals}
        onSelectDeal={(deal) => setSelectedDeal(deal)}
        onStatusChange={onStatusChange}
      />

      {/* Inspector sheet */}
      <DealInspector
        deal={syncedSelectedDeal}
        open={!!syncedSelectedDeal}
        onClose={() => setSelectedDeal(null)}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onNavigate={(id) => router.push(`/deals/${id}`)}
        owners={owners}
      />

      {/* Command palette */}
      <FlowCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        deals={deals}
        onSelectDeal={(deal) => {
          setSelectedDeal(deal);
          setCommandOpen(false);
        }}
        onStatusChange={onStatusChange}
        onCreateDeal={onCreateDeal}
        onNavigate={(id) => router.push(`/deals/${id}`)}
      />

      {/* Funnel analytics drawer */}
      <FunnelDrawer
        open={funnelOpen}
        onClose={() => setFunnelOpen(false)}
        deals={deals}
        stats={stats}
      />
    </div>
  );
}
