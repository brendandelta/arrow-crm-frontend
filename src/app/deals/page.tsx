"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Circle, Search, Calendar, Users, CheckSquare, AlertTriangle } from "lucide-react";
import { KPIStrip, KPIStripCompact } from "@/components/deals/KPIStrip";
import { DemandProgressBar } from "@/components/deals/DemandProgressBar";
import { RiskFlagIndicator, RiskFlagSummary } from "@/components/deals/RiskFlagIndicator";

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

function formatCurrency(cents: number) {
  if (!cents || cents === 0) return "—";
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-green-100 text-green-800 hover:bg-green-100",
    sourcing: "bg-slate-100 text-slate-600 hover:bg-slate-100",
    closing: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    closed: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    dead: "bg-red-100 text-red-800 hover:bg-red-100",
  };
  return (
    <Badge className={styles[status] || styles.sourcing}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function PriorityIndicator({ priority }: { priority: number }) {
  const colors = ["text-slate-300", "text-yellow-500", "text-orange-500", "text-red-500"];
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <Circle
          key={i}
          className={`h-2 w-2 ${i <= priority ? colors[priority] : "text-slate-200"}`}
          fill={i <= priority ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function CloseCountdown({ daysUntilClose, expectedClose }: { daysUntilClose: number | null; expectedClose: string | null }) {
  if (daysUntilClose === null || expectedClose === null) return <span className="text-muted-foreground">—</span>;

  const isUrgent = daysUntilClose <= 7;
  const isPast = daysUntilClose < 0;

  return (
    <div className={`text-sm ${isPast ? "text-red-600" : isUrgent ? "text-amber-600" : ""}`}>
      <div className="font-medium">{formatDate(expectedClose)}</div>
      <div className="text-xs text-muted-foreground">
        {isPast
          ? `${Math.abs(daysUntilClose)}d overdue`
          : daysUntilClose === 0
          ? "Today"
          : `${daysUntilClose}d`}
      </div>
    </div>
  );
}

function TaskSummary({ overdue, dueThisWeek }: { overdue: number; dueThisWeek: number }) {
  if (overdue === 0 && dueThisWeek === 0) return <span className="text-muted-foreground text-sm">—</span>;

  return (
    <div className="flex items-center gap-2 text-sm">
      {overdue > 0 && (
        <span className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="h-3 w-3" />
          {overdue}
        </span>
      )}
      {dueThisWeek > 0 && (
        <span className="flex items-center gap-1 text-amber-600">
          <CheckSquare className="h-3 w-3" />
          {dueThisWeek}
        </span>
      )}
    </div>
  );
}

function OutreachSummary({ targetsNeedingFollowup, activeTargets }: { targetsNeedingFollowup: number; activeTargets: number }) {
  if (activeTargets === 0) return <span className="text-muted-foreground text-sm">—</span>;

  return (
    <div className="text-sm">
      {targetsNeedingFollowup > 0 ? (
        <span className="flex items-center gap-1 text-amber-600">
          <Users className="h-3 w-3" />
          {targetsNeedingFollowup}/{activeTargets}
        </span>
      ) : (
        <span className="text-muted-foreground">{activeTargets} active</span>
      )}
    </div>
  );
}

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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

  // Filter deals based on search and status
  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      !searchQuery ||
      deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deal.company && deal.company.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = !statusFilter || deal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleKPIFilterClick = (filter: string) => {
    if (filter === "live") {
      setStatusFilter(statusFilter === "live" ? null : "live");
    } else if (filter === "atRisk") {
      // Could implement at-risk filtering
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Deals</h1>
        {stats && (
          <KPIStripCompact
            stats={{
              liveCount: stats.liveCount,
              totalSoftCircled: stats.totalSoftCircled,
              totalCommitted: stats.totalCommitted,
              totalWired: stats.totalWired,
              atRiskCount: stats.atRiskCount,
            }}
          />
        )}
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
          activeFilter={statusFilter === "live" ? "live" : undefined}
        />
      )}

      {/* Search Bar */}
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
        <div className="flex items-center gap-2">
          {["live", "sourcing", "closing", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                statusFilter === status
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Deals Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Deal</TableHead>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No deals found
                </TableCell>
              </TableRow>
            ) : (
              filteredDeals.map((deal) => (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => router.push(`/deals/${deal.id}`)}
                >
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
