"use client";

import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
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
import { Search, ChevronRight, ChevronDown, Plus, CircleDollarSign, TrendingUp, DollarSign, Target, AlertTriangle, Banknote } from "lucide-react";
import { ExpandedRowContent } from "./_components/ExpandableTableRow";
import { ViewToggle } from "./_components/ViewToggle";
import { StatusBadge } from "./_components/StatusBadge";
import { PriorityBadge } from "./_components/PriorityBadge";
import { DEAL_PRIORITIES, getPriorityConfig } from "./_components/priority";
import { CloseCountdown } from "./_components/CloseCountdown";
import { TaskSummary } from "./_components/TaskSummary";
import { OutreachSummary } from "./_components/OutreachSummary";
import { formatCurrency } from "./_components/utils";
import { MindMapView } from "./_components/MindMapView";
import { FlowView } from "./_components/flow/FlowView";
import { useAuth } from "@/contexts/AuthContext";
import { DemandProgressBar } from "@/components/deals/DemandProgressBar";
import { toast } from "sonner";
import { RiskFlagIndicator } from "@/components/deals/RiskFlagIndicator";
import { useTableFiltering } from "./[id]/_components/table-filtering/useTableFiltering";
import { FilterableHeader } from "./[id]/_components/table-filtering/FilterableHeader";
import { ActiveFiltersBar } from "./[id]/_components/table-filtering/ActiveFiltersBar";
import type { ColumnDef } from "./[id]/_components/table-filtering/types";
import { getPageIdentity } from "@/lib/page-registry";
import { cn } from "@/lib/utils";

// Get page identity for theming
const pageIdentity = getPageIdentity("deals");
const theme = pageIdentity?.theme;
const Icon = pageIdentity?.icon || CircleDollarSign;

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

type ViewMode = "table" | "flow" | "mindmap";

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

// Format cents to readable currency (matches FlowMetrics)
function fmtCents(cents: number) {
  if (!cents || cents === 0) return "$0";
  const d = cents / 100;
  if (d >= 1_000_000_000) return `$${(d / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (d >= 1_000_000) return `$${(d / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (d >= 1_000) return `$${(d / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${d.toFixed(0)}`;
}

export default function DealsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "table";
    const stored = localStorage.getItem("arrow_view_deals");
    // Migrate old board/pipeline to flow
    if (stored === "board" || stored === "pipeline") return "flow";
    const valid: ViewMode[] = ["table", "flow", "mindmap"];
    return valid.includes(stored as ViewMode) ? (stored as ViewMode) : "table";
  });
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
        toast.error("Failed to load deals");
        setLoading(false);
      });
  }, []);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem("arrow_view_deals", viewMode);
  }, [viewMode]);

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

  const handleStatusChange = useCallback(async (dealId: number, newStatus: string) => {
    const oldDeals = deals;
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, status: newStatus } : d))
    );
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${dealId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("API error");
    } catch {
      // Revert on failure
      setDeals(oldDeals);
      toast.error("Failed to update deal status");
    }
  }, [deals]);

  const handlePriorityChange = useCallback(async (dealId: number, priority: number) => {
    const oldDeals = deals;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, priority } : d))
    );
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${dealId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority }),
        }
      );
      if (!res.ok) throw new Error("API error");
    } catch {
      setDeals(oldDeals);
      toast.error("Failed to update deal priority");
    }
  }, [deals]);

  const handleOwnerChange = useCallback(async (dealId: number, ownerId: number | null) => {
    const oldDeals = deals;
    const newOwner = ownerId ? allOwners.find((o) => o.id === ownerId) || null : null;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, owner: newOwner } : d))
    );
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${dealId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId }),
        }
      );
      if (!res.ok) throw new Error("API error");
    } catch {
      setDeals(oldDeals);
      toast.error("Failed to update deal owner");
    }
  }, [deals, allOwners]);

  const handleCloseDateChange = useCallback(async (dealId: number, date: string | null) => {
    const oldDeals = deals;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, expectedClose: date } : d))
    );
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${dealId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedClose: date }),
        }
      );
      if (!res.ok) throw new Error("API error");
    } catch {
      setDeals(oldDeals);
      toast.error("Failed to update close date");
    }
  }, [deals]);

  const toggleExpanded = (dealId: number) => {
    if (expandedDealId === dealId) {
      setExpandedDealId(null);
    } else {
      setExpandedDealId(dealId);
      loadExpandedData(dealId);
    }
  };

  return (
    <div className="h-[calc(100vh-1.5rem)] flex flex-col bg-[#FAFBFC]">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center",
              theme && `bg-gradient-to-br ${theme.gradient}`
            )}>
              <Icon className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Deals</h1>
              {!loading && stats && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span>{deals.length} total</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-600">{stats.liveCount} live</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-amber-600">{stats.atRiskCount} at risk</span>
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {viewMode === "table" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 h-9 pl-9 pr-3 text-sm rounded-lg bg-slate-50 border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-300"
                />
              </div>
            )}

            <ViewToggle activeView={viewMode} onViewChange={setViewMode} />

            <button
              onClick={() => setShowCreateModal(true)}
              className={cn(
                "flex items-center gap-2 h-9 px-4 text-white text-sm font-medium rounded-lg transition-colors",
                theme && `bg-gradient-to-br ${theme.gradient} hover:opacity-90`
              )}
            >
              <Plus className="h-4 w-4" />
              <span>New Deal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {viewMode === "mindmap" ? (
          <div className="h-full p-4">
            <MindMapView />
          </div>
        ) : viewMode === "flow" ? (
          <div className="h-full px-6 py-4">
            <FlowView
              deals={deals}
              stats={stats}
              loading={loading}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onOwnerChange={handleOwnerChange}
              onCloseDateChange={handleCloseDateChange}
              onCreateDeal={() => setShowCreateModal(true)}
              owners={allOwners}
              currentUserId={user?.backendUserId}
            />
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Loading deals...
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="h-full px-6 py-4 flex flex-col gap-3">
            {/* KPI Metrics Strip - matching Flow view */}
            {stats && (
              <div className="space-y-2 shrink-0">
                {/* Primary KPI cards */}
                <div className="grid grid-cols-5 gap-2">
                  {[
                    {
                      key: "live",
                      label: "Live",
                      value: String(stats.liveCount),
                      icon: TrendingUp,
                      accent: "text-emerald-600",
                      bg: "bg-emerald-50",
                      ring: "ring-emerald-200",
                    },
                    {
                      key: "softCircled",
                      label: "Soft Circled",
                      value: fmtCents(stats.totalSoftCircled),
                      icon: Target,
                      accent: "text-blue-600",
                      bg: "bg-blue-50",
                      ring: "ring-blue-200",
                    },
                    {
                      key: "committed",
                      label: "Committed",
                      value: fmtCents(stats.totalCommitted),
                      icon: DollarSign,
                      accent: "text-violet-600",
                      bg: "bg-violet-50",
                      ring: "ring-violet-200",
                    },
                    {
                      key: "wired",
                      label: "Wired",
                      value: fmtCents(stats.totalWired),
                      icon: Banknote,
                      accent: "text-emerald-600",
                      bg: "bg-emerald-50",
                      ring: "ring-emerald-200",
                    },
                    {
                      key: "atRisk",
                      label: "At Risk",
                      value: String(stats.atRiskCount),
                      icon: AlertTriangle,
                      accent: "text-red-600",
                      bg: "bg-red-50",
                      ring: "ring-red-200",
                    },
                  ].map((kpi) => {
                    const KpiIcon = kpi.icon;
                    return (
                      <div
                        key={kpi.key}
                        className="flex items-center gap-2.5 rounded-lg border bg-white border-slate-200 hover:border-slate-300 px-3 py-2 transition-all"
                      >
                        <div className={`p-1.5 rounded-md ${kpi.bg}`}>
                          <KpiIcon className={`h-3.5 w-3.5 ${kpi.accent}`} />
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground leading-none">
                            {kpi.label}
                          </div>
                          <div className="text-base font-semibold tabular-nums leading-tight">
                            {kpi.value}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Secondary inline stats */}
                <div className="flex items-center gap-4 px-1 text-[11px] text-muted-foreground">
                  <span>
                    <strong className="font-medium text-foreground">{stats.totalDeals}</strong>{" "}
                    total deals
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    <strong className="font-medium text-foreground">
                      {fmtCents(deals.reduce((s, d) => s + (d.blocksValue || 0), 0))}
                    </strong>{" "}
                    pipeline
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    <strong className="font-medium text-foreground">
                      {fmtCents(deals.filter((d) => d.status === "closed").reduce((s, d) => s + (d.blocksValue || 0), 0))}
                    </strong>{" "}
                    closed
                  </span>
                  {deals.filter((d) => d.status === "sourcing").length > 0 && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span>
                        <strong className="font-medium text-foreground">
                          {((deals.filter((d) => d.status === "closed").length / deals.filter((d) => d.status === "sourcing").length) * 100).toFixed(0)}%
                        </strong>{" "}
                        conversion
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 rounded-lg border border-slate-200 bg-white overflow-auto">
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
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDealModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
