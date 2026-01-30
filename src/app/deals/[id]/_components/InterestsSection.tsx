"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, AlertCircle, LayoutGrid, LayoutList } from "lucide-react";
import { FunnelVisualization } from "./FunnelVisualization";
import { FollowUpCell } from "./FollowUpCell";
import { useTableFiltering } from "./table-filtering/useTableFiltering";
import { FilterableHeader } from "./table-filtering/FilterableHeader";
import { ActiveFiltersBar } from "./table-filtering/ActiveFiltersBar";
import type { ColumnDef } from "./table-filtering/types";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
}

interface TaskInfo {
  id: number;
  subject: string;
  dueAt: string | null;
  overdue: boolean;
}

interface Interest {
  id: number;
  investor: { id: number; name: string; kind: string } | null;
  contact: Person | null;
  decisionMaker: Person | null;
  targetCents: number | null;
  minCents: number | null;
  maxCents: number | null;
  committedCents: number | null;
  allocatedCents: number | null;
  allocatedBlockId: number | null;
  allocatedBlock?: {
    id: number;
    seller: string | null;
    priceCents: number | null;
    status: string;
  } | null;
  status: string;
  source: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  nextTask?: TaskInfo | null;
  tasks?: TaskInfo[];
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  isStale: boolean;
}

interface InterestsSectionProps {
  interests: Interest[];
  dealId: number;
  funnel: {
    prospecting: number;
    contacted: number;
    softCircled: number;
    committed: number;
    allocated: number;
    funded: number;
  };
  onInterestClick?: (interest: Interest) => void;
  onAddInterest?: () => void;
  onInterestsUpdated?: () => void;
  /** When true, hides block-related columns (for Primary deals) */
  isPrimaryDeal?: boolean;
}

function formatCurrency(cents: number | null) {
  if (!cents || cents === 0) return "—";
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function InterestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    prospecting: "bg-slate-100 text-slate-600",
    contacted: "bg-slate-200 text-slate-700",
    soft_circled: "bg-blue-100 text-blue-700",
    committed: "bg-purple-100 text-purple-700",
    allocated: "bg-indigo-100 text-indigo-700",
    funded: "bg-emerald-100 text-emerald-700",
    declined: "bg-red-100 text-red-600",
    withdrawn: "bg-slate-100 text-slate-500",
  };

  const displayStatus = status.replace(/_/g, " ");

  return (
    <Badge className={styles[status] || styles.prospecting}>
      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
    </Badge>
  );
}

const INTEREST_STATUS_OPTIONS = [
  { value: "prospecting", label: "Prospecting", color: "bg-slate-100 text-slate-600" },
  { value: "contacted", label: "Contacted", color: "bg-slate-200 text-slate-700" },
  { value: "soft_circled", label: "Soft Circled", color: "bg-blue-100 text-blue-700" },
  { value: "committed", label: "Committed", color: "bg-purple-100 text-purple-700" },
  { value: "allocated", label: "Allocated", color: "bg-indigo-100 text-indigo-700" },
  { value: "funded", label: "Funded", color: "bg-emerald-100 text-emerald-700" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-600" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-slate-100 text-slate-500" },
];

const INTEREST_COLUMNS: ColumnDef<Interest>[] = [
  {
    id: "investor",
    label: "Investor",
    filterType: "text",
    accessor: (row) => row.investor?.name ?? null,
    sortLabels: ["A → Z", "Z → A"],
  },
  {
    id: "contact",
    label: "Contact",
    filterType: "text",
    accessor: (row) =>
      row.contact ? `${row.contact.firstName} ${row.contact.lastName}` : null,
    sortLabels: ["A → Z", "Z → A"],
  },
  {
    id: "target",
    label: "Target",
    filterType: "currency",
    accessor: (row) => row.targetCents,
    align: "right",
    sortLabels: ["Low → High", "High → Low"],
  },
  {
    id: "committed",
    label: "Committed",
    filterType: "currency",
    accessor: (row) => row.committedCents,
    align: "right",
    sortLabels: ["Low → High", "High → Low"],
  },
  {
    id: "block",
    label: "Block",
    filterType: "boolean",
    accessor: (row) => (row.allocatedBlock ? true : false),
    booleanLabels: ["Mapped", "Not mapped"],
    sortable: false,
  },
  {
    id: "followUp",
    label: "Follow-up",
    filterType: "boolean",
    accessor: (row) => (row.nextTask ? true : false),
    booleanLabels: ["Has task", "No task"],
    sortable: false,
  },
  {
    id: "status",
    label: "Status",
    filterType: "enum",
    accessor: (row) => row.status,
    enumOptions: INTEREST_STATUS_OPTIONS,
    sortLabels: ["A → Z", "Z → A"],
  },
];

// Maps funnel stage names to their DB status values
const FUNNEL_TO_STATUS: Record<string, string> = {
  prospecting: "prospecting",
  contacted: "contacted",
  softCircled: "soft_circled",
  committed: "committed",
  allocated: "allocated",
  funded: "funded",
};

export function InterestsSection({
  interests,
  dealId,
  funnel,
  onInterestClick,
  onAddInterest,
  onInterestsUpdated,
  isPrimaryDeal = false,
}: InterestsSectionProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("card");

  // Filter out block column for Primary deals
  const columns = useMemo(() => {
    if (isPrimaryDeal) {
      return INTEREST_COLUMNS.filter(col => col.id !== "block");
    }
    return INTEREST_COLUMNS;
  }, [isPrimaryDeal]);

  const {
    filteredData,
    activeFilters,
    hasActiveFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    toggleSort,
    setSort,
    getSortDirection,
    getEnumCounts,
    filters,
  } = useTableFiltering(interests, columns);

  // Derive funnel active stage from current status enum filter
  const statusFilter = filters.get("status");
  const activeFunnelStage = useMemo(() => {
    if (!statusFilter || statusFilter.type !== "enum") return null;
    // If exactly one status is selected and it matches a funnel stage, show that stage active
    if (statusFilter.selected.size === 1) {
      const selectedStatus = Array.from(statusFilter.selected)[0];
      const entry = Object.entries(FUNNEL_TO_STATUS).find(([, v]) => v === selectedStatus);
      return entry ? entry[0] : null;
    }
    return null;
  }, [statusFilter]);

  const handleFunnelClick = (stage: string) => {
    const dbStatus = FUNNEL_TO_STATUS[stage];
    if (!dbStatus) return;

    // If already filtering by this stage, clear the filter
    if (activeFunnelStage === stage) {
      clearFilter("status");
    } else {
      setFilter("status", { type: "enum", selected: new Set([dbStatus]) });
    }
  };

  const staleCount = interests.filter((i) => i.isStale).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Investor Interests</h3>
          <Badge variant="secondary">{interests.length}</Badge>
          {staleCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {staleCount} stale
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 ${viewMode === "card" ? "bg-slate-100" : "hover:bg-slate-50"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 ${viewMode === "table" ? "bg-slate-100" : "hover:bg-slate-50"}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onAddInterest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Interest
          </button>
        </div>
      </div>

      {/* Funnel */}
      <FunnelVisualization
        funnel={funnel}
        onStageClick={handleFunnelClick}
        activeStage={activeFunnelStage}
      />

      {/* Content */}
      {interests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          No investor interests yet
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <FilterableHeader
                    key={col.id}
                    column={col}
                    filterValue={activeFilters.find((f) => f.columnId === col.id)?.filterValue}
                    sortDirection={getSortDirection(col.id)}
                    enumCounts={getEnumCounts(col.id)}
                    onFilterChange={setFilter}
                    onSortToggle={toggleSort}
                    onSortSet={setSort}
                  />
                ))}
              </TableRow>
              <ActiveFiltersBar
                filters={activeFilters}
                colSpan={columns.length}
                onClearFilter={clearFilter}
                onClearAll={clearAllFilters}
              />
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 && hasActiveFilters ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    <div className="text-sm text-slate-400">No results match your filters</div>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Clear filters
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
              filteredData.map((interest) => (
                <TableRow
                  key={interest.id}
                  className={`cursor-pointer hover:bg-slate-50 ${
                    interest.isStale ? "bg-amber-50/50" : ""
                  }`}
                  onClick={() => onInterestClick?.(interest)}
                >
                  <TableCell>
                    {interest.investor ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{interest.investor.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {interest.investor.kind}
                          </div>
                        </div>
                        {interest.isStale && (
                          <span title="Stale - no activity in 7+ days">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {interest.contact ? (
                      <div>
                        <div className="font-medium">
                          {interest.contact.firstName} {interest.contact.lastName}
                        </div>
                        {interest.contact.email && (
                          <div className="text-xs text-muted-foreground">
                            {interest.contact.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(interest.targetCents)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(interest.committedCents)}
                  </TableCell>
                  {!isPrimaryDeal && (
                    <TableCell>
                      {interest.allocatedBlock ? (
                        <div className="text-sm">
                          <div className="font-medium">{interest.allocatedBlock.seller || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(interest.allocatedBlock.priceCents)}/sh
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not mapped</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <FollowUpCell
                      task={interest.nextTask}
                      dealId={dealId}
                      taskableType="Interest"
                      taskableId={interest.id}
                      onUpdated={() => onInterestsUpdated?.()}
                    />
                  </TableCell>
                  <TableCell>
                    <InterestStatusBadge status={interest.status} />
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-2 gap-3">
          {filteredData.map((interest) => (
            <div
              key={interest.id}
              onClick={() => onInterestClick?.(interest)}
              className={`p-4 border rounded-lg cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors ${
                interest.isStale ? "border-l-[3px] border-l-amber-400" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">{interest.investor?.name || "No investor"}</div>
                  {interest.contact && (
                    <div className="text-sm text-muted-foreground">
                      {interest.contact.firstName} {interest.contact.lastName}
                    </div>
                  )}
                </div>
                <InterestStatusBadge status={interest.status} />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-muted-foreground">Target</div>
                  <div className="text-lg font-semibold">{formatCurrency(interest.targetCents)}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Committed</div>
                  <div className="font-medium">{formatCurrency(interest.committedCents)}</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  {!isPrimaryDeal && (
                    interest.allocatedBlock ? (
                      <span className="text-xs text-muted-foreground">
                        Block: {interest.allocatedBlock.seller || "—"} ({formatCurrency(interest.allocatedBlock.priceCents)}/sh)
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not mapped to block</span>
                    )
                  )}
                  {isPrimaryDeal && <span />}
                  {interest.isStale && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      Stale
                    </span>
                  )}
                </div>
                <FollowUpCell
                  task={interest.nextTask}
                  dealId={dealId}
                  taskableType="Interest"
                  taskableId={interest.id}
                  onUpdated={() => onInterestsUpdated?.()}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

