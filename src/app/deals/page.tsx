"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronRight, ChevronDown } from "lucide-react";
import { KPIStrip } from "./_components/KPIStrip";
import { DealsFilters } from "./_components/DealsFilters";
import { ExpandedRowContent } from "./_components/ExpandableTableRow";
import { ViewToggle } from "./_components/ViewToggle";
import { StatusBadge } from "./_components/StatusBadge";
import { PriorityIndicator } from "./_components/PriorityIndicator";
import { CloseCountdown } from "./_components/CloseCountdown";
import { TaskSummary } from "./_components/TaskSummary";
import { OutreachSummary } from "./_components/OutreachSummary";
import { formatCurrency } from "./_components/utils";
import { BoardView } from "./_components/BoardView";
import { PipelineView } from "./_components/PipelineView";
import { MindMapView } from "./_components/MindMapView";
import { DemandProgressBar } from "@/components/deals/DemandProgressBar";
import { RiskFlagIndicator } from "@/components/deals/RiskFlagIndicator";

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

interface Filters {
  stages: string[];
  statuses: string[];
  owners: number[];
  closeWindow: number | null;
  needsOutreach: boolean;
  needsDocs: boolean;
  pricingStale: boolean;
}

type ViewMode = "table" | "board" | "pipeline" | "mindmap";

const defaultFilters: Filters = {
  stages: [],
  statuses: [],
  owners: [],
  closeWindow: null,
  needsOutreach: false,
  needsDocs: false,
  pricingStale: false,
};

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [expandedDealId, setExpandedDealId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Record<number, ExpandableRowData>>({});
  const [loadingExpanded, setLoadingExpanded] = useState<number | null>(null);

  // Extract unique values for filters
  const allStages = Array.from(new Set(deals.map((d) => d.stage).filter(Boolean)));
  const allStatuses = Array.from(new Set(deals.map((d) => d.status)));
  const allOwners = deals
    .filter((d) => d.owner)
    .reduce((acc, d) => {
      if (d.owner && !acc.find((o) => o.id === d.owner!.id)) {
        acc.push(d.owner);
      }
      return acc;
    }, [] as Owner[]);

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

  // Filter deals based on search and filters
  const filteredDeals = deals.filter((deal) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deal.company && deal.company.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus =
      filters.statuses.length === 0 || filters.statuses.includes(deal.status);

    // Stage filter
    const matchesStage =
      filters.stages.length === 0 || filters.stages.includes(deal.stage);

    // Owner filter
    const matchesOwner =
      filters.owners.length === 0 ||
      (deal.owner && filters.owners.includes(deal.owner.id));

    // Close window filter
    const matchesCloseWindow =
      !filters.closeWindow ||
      (deal.daysUntilClose !== null && deal.daysUntilClose <= filters.closeWindow && deal.daysUntilClose >= 0);

    // Needs outreach filter
    const matchesNeedsOutreach =
      !filters.needsOutreach || deal.targetsNeedingFollowup > 0;

    // Needs docs filter
    const matchesNeedsDocs =
      !filters.needsDocs || deal.riskFlags?.missing_docs?.active;

    // Pricing stale filter
    const matchesPricingStale =
      !filters.pricingStale || deal.riskFlags?.pricing_stale?.active;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesStage &&
      matchesOwner &&
      matchesCloseWindow &&
      matchesNeedsOutreach &&
      matchesNeedsDocs &&
      matchesPricingStale
    );
  });

  const handleKPIFilterClick = (filter: string) => {
    if (filter === "live") {
      setFilters((prev) => ({
        ...prev,
        statuses: prev.statuses.includes("live")
          ? prev.statuses.filter((s) => s !== "live")
          : [...prev.statuses, "live"],
      }));
    } else if (filter === "atRisk") {
      // Toggle risk-related filters
      setFilters((prev) => ({
        ...prev,
        needsOutreach: !prev.needsOutreach || !prev.needsDocs || !prev.pricingStale,
        needsDocs: !prev.needsOutreach || !prev.needsDocs || !prev.pricingStale,
        pricingStale: !prev.needsOutreach || !prev.needsDocs || !prev.pricingStale,
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Deals</h1>
        <ViewToggle activeView={viewMode} onViewChange={setViewMode} />
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
          activeFilter={filters.statuses.includes("live") ? "live" : undefined}
        />
      )}

      {/* Search & Filters Row */}
      <div className="space-y-3">
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

        {/* Advanced Filters */}
        <DealsFilters
          stages={allStages}
          statuses={allStatuses}
          owners={allOwners}
          activeFilters={filters}
          onFiltersChange={setFilters}
        />
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
                <TableHead className="w-[200px]">Deal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead className="text-right">Blocks</TableHead>
                <TableHead className="text-right">Best Price</TableHead>
                <TableHead className="w-[140px]">Demand</TableHead>
                <TableHead>Outreach</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    No deals found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeals.map((deal) => (
                  <Fragment key={deal.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-slate-50"
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
                        <div className="flex items-center gap-2">
                          <StatusBadge status={deal.status} />
                          <PriorityIndicator priority={deal.priority} />
                        </div>
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
    </div>
  );
}
