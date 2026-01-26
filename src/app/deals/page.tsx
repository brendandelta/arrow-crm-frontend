"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { CreateDealModal } from "./_components/CreateDealModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { KPIStrip } from "./_components/KPIStrip";
import { ExpandedRowContent } from "./_components/ExpandableTableRow";
import { ViewToggle } from "./_components/ViewToggle";
import { StatusBadge } from "./_components/StatusBadge";
import { PriorityBadge } from "./_components/PriorityBadge";
import { DEAL_PRIORITIES, getPriorityConfig } from "./_components/priority";
import { CloseCountdown } from "./_components/CloseCountdown";
import { TaskSummary } from "./_components/TaskSummary";
import { OutreachSummary } from "./_components/OutreachSummary";
import { formatCurrency } from "./_components/utils";
import { BoardView } from "./_components/BoardView";
import { PipelineView } from "./_components/PipelineView";
import { MindMapView } from "./_components/MindMapView";
import { DemandProgressBar } from "@/components/deals/DemandProgressBar";
import { RiskFlagIndicator } from "@/components/deals/RiskFlagIndicator";
import { useTableFiltering } from "./[id]/_components/table-filtering/useTableFiltering";
import { FilterableHeader } from "./[id]/_components/table-filtering/FilterableHeader";
import { ActiveFiltersBar } from "./[id]/_components/table-filtering/ActiveFiltersBar";
import type { ColumnDef } from "./[id]/_components/table-filtering/types";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

interface RiskFlag {
  active: boolean;
  message: string;
  severity: "danger" | "warning" | "info";
  count?: number;
  missing?: string[];
}

interface RiskFlags {
  pricing_stale?: RiskFlag;
  coverage_low?: RiskFlag;
  missing_docs?: RiskFlag;
  deadline_risk?: RiskFlag;
  stale_outreach?: RiskFlag;
  overdue_tasks?: RiskFlag;
}

interface DemandFunnel {
  prospecting: number;
  contacted: number;
  softCircled: number;
  committed: number;
  allocated: number;
  funded: number;
}

interface Block {
  id: number;
  seller: { name: string } | null;
  priceCents: number | null;
  totalCents: number | null;
  heat: number;
  heatLabel: string;
  status: string;
}

interface Interest {
  id: number;
  investor: { name: string } | null;
  committedCents: number | null;
  status: string;
}

interface Task {
  id: number;
  subject: string;
  dueAt: string | null;
  overdue: boolean;
}

interface DealTarget {
  id: number;
  targetName: string;
  status: string;
  nextStep: string | null;
  nextStepAt: string | null;
}

interface ExpandableRowData {
  topBlocks: Block[];
  topInterests: Interest[];
  nextFollowups: DealTarget[];
  nextTasks: Task[];
}

interface Deal {
  id: number;
  name: string;
  company: string | null;
  companyId: number | null;
  sector: string | null;
  status: string;
  stage: string;
  kind: string;
  priority: number;
  owner: Owner | null;
  blocks: number;
  blocksValue: number;
  interests: number;
  targets: number;
  activeTargets: number;
  committed: number;
  closed: number;
  softCircled: number;
  wired: number;
  totalCommitted: number;
  inventory: number;
  coverageRatio: number | null;
  valuation: number | null;
  expectedClose: string | null;
  deadline: string | null;
  daysUntilClose: number | null;
  sourcedAt: string | null;
  bestPrice: number | null;
  overdueTasksCount: number;
  dueThisWeekCount: number;
  riskFlags: RiskFlags;
  riskFlagsSummary: {
    count: number;
    hasDanger: boolean;
    hasWarning: boolean;
  };
  demandFunnel: DemandFunnel;
  targetsNeedingFollowup: number;
  // For expandable row
  topBlocks?: Block[];
  topInterests?: Interest[];
  nextFollowups?: DealTarget[];
  nextTasks?: Task[];
}

interface Stats {
  liveCount: number;
  totalDeals: number;
  activeDeals: number;
  totalSoftCircled: number;
  totalCommitted: number;
  totalWired: number;
  totalInventory: number;
  atRiskCount: number;
  overdueTasksCount: number;
  byStatus: Record<string, number>;
}

type ViewMode = "table" | "board" | "pipeline" | "mindmap";

// --- Close Date buckets ---
function closeBucket(d: Deal): string {
  if (d.daysUntilClose === null) return "no_date";
  if (d.daysUntilClose < 0) return "overdue";
  if (d.daysUntilClose <= 7) return "this_week";
  if (d.daysUntilClose <= 30) return "this_month";
  return "later";
}

// --- Task buckets ---
function taskBucket(d: Deal): string {
  if (d.overdueTasksCount > 0) return "overdue";
  if (d.dueThisWeekCount > 0) return "due_soon";
  return "clear";
}

// --- Risk bucket ---
function riskBucket(d: Deal): string {
  if (d.riskFlagsSummary.count === 0) return "clean";
  if (d.riskFlagsSummary.hasDanger) return "danger";
  return "warning";
}

// --- Column definitions ---
function buildDealColumns(allOwners: Owner[]): ColumnDef<Deal>[] {
  return [
    {
      id: "deal",
      label: "Deal",
      filterType: "text",
      accessor: (row) => `${row.name} ${row.company ?? ""} ${row.sector ?? ""}`,
      sortAccessor: (row) => row.name,
      sortLabels: ["A → Z", "Z → A"],
    },
    {
      id: "status",
      label: "Status",
      filterType: "enum",
      accessor: (row) => row.status,
      enumOptions: [
        { value: "live", label: "Live", color: "bg-green-100 text-green-800" },
        { value: "sourcing", label: "Sourcing", color: "bg-slate-100 text-slate-600" },
        { value: "closing", label: "Closing", color: "bg-blue-100 text-blue-800" },
        { value: "closed", label: "Closed", color: "bg-purple-100 text-purple-800" },
        { value: "dead", label: "Dead", color: "bg-red-100 text-red-800" },
      ],
      sortLabels: ["A → Z", "Z → A"],
    },
    {
      id: "priority",
      label: "Priority",
      filterType: "enum",
      accessor: (row) => row.priority.toString(),
      sortAccessor: (row) => row.priority,
      enumOptions: DEAL_PRIORITIES.map((p) => ({
        value: p.value.toString(),
        label: p.label,
        color: p.color,
      })),
      sortLabels: ["Urgent first", "Low first"],
    },
    {
      id: "closeDate",
      label: "Close Date",
      filterType: "enum",
      accessor: (row) => closeBucket(row),
      sortAccessor: (row) => row.daysUntilClose ?? 9999,
      enumOptions: [
        { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-700" },
        { value: "this_week", label: "This week", color: "bg-amber-100 text-amber-700" },
        { value: "this_month", label: "This month", color: "bg-blue-100 text-blue-700" },
        { value: "later", label: "30d+", color: "bg-slate-100 text-slate-600" },
        { value: "no_date", label: "No date", color: "bg-slate-50 text-slate-400" },
      ],
      sortLabels: ["Soonest first", "Furthest first"],
    },
    {
      id: "blocks",
      label: "Blocks",
      filterType: "number",
      accessor: (row) => row.blocks || null,
      align: "right",
      sortLabels: ["Fewest", "Most"],
    },
    {
      id: "bestPrice",
      label: "Best Price",
      filterType: "currency",
      accessor: (row) => row.bestPrice,
      align: "right",
      sortLabels: ["Low → High", "High → Low"],
    },
    {
      id: "demand",
      label: "Demand",
      filterType: "number",
      accessor: (row) => row.coverageRatio,
      sortLabels: ["Low → High", "High → Low"],
    },
    {
      id: "outreach",
      label: "Outreach",
      filterType: "boolean",
      accessor: (row) => row.targetsNeedingFollowup > 0,
      booleanLabels: ["Needs follow-up", "All clear"],
    },
    {
      id: "tasks",
      label: "Tasks",
      filterType: "enum",
      accessor: (row) => taskBucket(row),
      enumOptions: [
        { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-700" },
        { value: "due_soon", label: "Due soon", color: "bg-amber-100 text-amber-700" },
        { value: "clear", label: "Clear", color: "bg-green-100 text-green-700" },
      ],
      sortable: false,
    },
    {
      id: "risk",
      label: "Risk",
      filterType: "enum",
      accessor: (row) => riskBucket(row),
      enumOptions: [
        { value: "danger", label: "Danger", color: "bg-red-100 text-red-700" },
        { value: "warning", label: "Warning", color: "bg-amber-100 text-amber-700" },
        { value: "clean", label: "Clean", color: "bg-green-100 text-green-700" },
      ],
      sortable: false,
    },
    {
      id: "owner",
      label: "Owner",
      filterType: "enum",
      accessor: (row) =>
        row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : "__none__",
      enumOptions: [
        ...allOwners.map((o) => ({
          value: `${o.firstName} ${o.lastName}`,
          label: `${o.firstName} ${o.lastName}`,
          color: "bg-slate-100 text-slate-700",
        })),
        { value: "__none__", label: "Unassigned", color: "bg-slate-50 text-slate-400" },
      ],
      sortLabels: ["A → Z", "Z → A"],
    },
  ];
}

const TOTAL_COLS = 12; // expand + 11 data columns

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [expandedDealId, setExpandedDealId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Record<number, ExpandableRowData>>({});
  const [loadingExpanded, setLoadingExpanded] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Extract unique owners for filter options
  const allOwners = useMemo(() => {
    return deals
      .filter((d) => d.owner)
      .reduce((acc, d) => {
        if (d.owner && !acc.find((o) => o.id === d.owner!.id)) {
          acc.push(d.owner);
        }
        return acc;
      }, [] as Owner[]);
  }, [deals]);

  const dealColumns = useMemo(() => buildDealColumns(allOwners), [allOwners]);

  const {
    filteredData: hookFiltered,
    activeFilters,
    hasActiveFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    toggleSort,
    setSort,
    getSortDirection,
    getEnumCounts,
  } = useTableFiltering(deals, dealColumns, "arrow_filters_deals");

  // Apply global search on top of hook filtering
  const filteredDeals = useMemo(() => {
    if (!searchQuery) return hookFiltered;
    const q = searchQuery.toLowerCase();
    return hookFiltered.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.company && d.company.toLowerCase().includes(q)) ||
        (d.sector && d.sector.toLowerCase().includes(q))
    );
  }, [hookFiltered, searchQuery]);

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals`).then((res) => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/stats`).then((res) => res.json()),
    ])
      .then(([dealsData, statsData]) => {
        setDeals(Array.isArray(dealsData) ? dealsData : []);
        setStats(statsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch deals:", err);
        setLoading(false);
      });
  }, []);

  // Load expanded row data
  const loadExpandedData = async (dealId: number) => {
    if (expandedData[dealId]) return;

    setLoadingExpanded(dealId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${dealId}`);
      const data = await res.json();

      setExpandedData((prev) => ({
        ...prev,
        [dealId]: {
          topBlocks: (data.blocks || []).slice(0, 3).map((b: Block) => ({
            id: b.id,
            seller: b.seller,
            priceCents: b.priceCents,
            totalCents: b.totalCents,
            heat: b.heat,
            heatLabel: b.heatLabel,
            status: b.status,
          })),
          topInterests: (data.interests || [])
            .filter((i: Interest) => i.committedCents && i.committedCents > 0)
            .slice(0, 5)
            .map((i: Interest) => ({
              id: i.id,
              investor: i.investor,
              committedCents: i.committedCents,
              status: i.status,
            })),
          nextFollowups: (data.targets || [])
            .filter((t: DealTarget) => t.nextStepAt)
            .slice(0, 3)
            .map((t: DealTarget) => ({
              id: t.id,
              targetName: t.targetName,
              status: t.status,
              nextStep: t.nextStep,
              nextStepAt: t.nextStepAt,
            })),
          nextTasks: [
            ...(data.tasks?.overdue || []),
            ...(data.tasks?.dueThisWeek || []),
          ].slice(0, 3).map((t: Task) => ({
            id: t.id,
            subject: t.subject,
            dueAt: t.dueAt,
            overdue: t.overdue,
          })),
        },
      }));
    } catch (err) {
      console.error("Failed to load expanded data:", err);
    }
    setLoadingExpanded(null);
  };

  const toggleExpanded = (dealId: number) => {
    if (expandedDealId === dealId) {
      setExpandedDealId(null);
    } else {
      setExpandedDealId(dealId);
      loadExpandedData(dealId);
    }
  };

  // KPI strip click drives column filters
  const handleKPIFilterClick = (filter: string) => {
    if (filter === "live") {
      const currentFilter = activeFilters.find((f) => f.columnId === "status");
      const currentSelected =
        currentFilter?.filterValue.type === "enum"
          ? currentFilter.filterValue.selected
          : new Set<string>();
      if (currentSelected.has("live")) {
        const next = new Set(currentSelected);
        next.delete("live");
        if (next.size === 0) {
          clearFilter("status");
        } else {
          setFilter("status", { type: "enum", selected: next });
        }
      } else {
        setFilter("status", { type: "enum", selected: new Set(["live"]) });
      }
    } else if (filter === "atRisk") {
      const currentFilter = activeFilters.find((f) => f.columnId === "risk");
      const isFiltered = !!currentFilter;
      if (isFiltered) {
        clearFilter("risk");
      } else {
        setFilter("risk", {
          type: "enum",
          selected: new Set(["danger", "warning"]),
        });
      }
    }
  };

  // Determine if "live" KPI is active
  const liveKPIActive = useMemo(() => {
    const statusFilter = activeFilters.find((f) => f.columnId === "status");
    if (!statusFilter || statusFilter.filterValue.type !== "enum") return false;
    return statusFilter.filterValue.selected.has("live") && statusFilter.filterValue.selected.size === 1;
  }, [activeFilters]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Deals</h1>
        <div className="flex items-center gap-3">
          <ViewToggle activeView={viewMode} onViewChange={setViewMode} />
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Deal
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      {stats && (
        <KPIStrip
          stats={{
            liveCount: stats.liveCount,
            totalSoftCircled: stats.totalSoftCircled,
            totalCommitted: stats.totalCommitted,
            totalWired: stats.totalWired,
            atRiskCount: stats.atRiskCount,
            overdueTasksCount: stats.overdueTasksCount,
          }}
          onFilterClick={handleKPIFilterClick}
          activeFilter={liveKPIActive ? "live" : undefined}
        />
      )}

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deals, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Content View */}
      {loading && viewMode !== "mindmap" ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      ) : viewMode === "mindmap" ? (
        <MindMapView />
      ) : viewMode === "board" ? (
        <BoardView
          deals={filteredDeals}
          onDealClick={(dealId) => router.push(`/deals/${dealId}`)}
        />
      ) : viewMode === "pipeline" ? (
        <PipelineView
          deals={filteredDeals}
          onDealClick={(dealId) => router.push(`/deals/${dealId}`)}
        />
      ) : (
        /* Table View */
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                {dealColumns.map((col) => (
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
                colSpan={TOTAL_COLS}
                onClearFilter={clearFilter}
                onClearAll={clearAllFilters}
              />
            </TableHeader>
            <TableBody>
              {filteredDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TOTAL_COLS} className="text-center py-8">
                    <div className="text-sm text-slate-400">
                      {hasActiveFilters || searchQuery
                        ? "No deals match your filters"
                        : "No deals found"}
                    </div>
                    {(hasActiveFilters || searchQuery) && (
                      <button
                        onClick={() => {
                          clearAllFilters();
                          setSearchQuery("");
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Clear all filters
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeals.map((deal) => (
                  <Fragment key={deal.id}>
                    <TableRow
                      className={`cursor-pointer hover:bg-slate-50 ${getPriorityConfig(deal.priority).row}`}
                      onClick={() => router.push(`/deals/${deal.id}`)}
                    >
                      <TableCell className="p-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(deal.id);
                          }}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          {expandedDealId === deal.id ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{deal.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span>{deal.company || "—"}</span>
                          {deal.sector && (
                            <>
                              <span>·</span>
                              <span>{deal.sector}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={deal.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={deal.priority} compact />
                      </TableCell>
                      <TableCell>
                        <CloseCountdown
                          daysUntilClose={deal.daysUntilClose}
                          expectedClose={deal.expectedClose}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm font-medium">{deal.blocks || "—"}</div>
                        {deal.blocksValue > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(deal.blocksValue)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {deal.bestPrice ? (
                          <span className="font-medium tabular-nums">
                            {formatCurrency(deal.bestPrice)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="w-[120px]">
                          <DemandProgressBar
                            softCircled={deal.softCircled}
                            committed={deal.totalCommitted - deal.softCircled - deal.wired}
                            wired={deal.wired}
                            inventory={deal.inventory}
                            size="sm"
                          />
                          {deal.coverageRatio !== null && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {deal.coverageRatio}% coverage
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <OutreachSummary
                          targetsNeedingFollowup={deal.targetsNeedingFollowup}
                          activeTargets={deal.activeTargets}
                        />
                      </TableCell>
                      <TableCell>
                        <TaskSummary
                          overdue={deal.overdueTasksCount}
                          dueThisWeek={deal.dueThisWeekCount}
                        />
                      </TableCell>
                      <TableCell>
                        {deal.riskFlagsSummary.count > 0 ? (
                          <RiskFlagIndicator riskFlags={deal.riskFlags} size="sm" />
                        ) : (
                          <span className="text-xs text-green-600">OK</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {deal.owner ? (
                          <div className="text-sm">
                            {deal.owner.firstName} {deal.owner.lastName.charAt(0)}.
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedDealId === deal.id && (
                      <ExpandedRowContent
                        data={expandedData[deal.id] || null}
                        loading={loadingExpanded === deal.id}
                      />
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {showCreateModal && (
        <CreateDealModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
