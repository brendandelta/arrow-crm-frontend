export interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

export interface RiskFlag {
  active: boolean;
  message: string;
  severity: "danger" | "warning" | "info";
  count?: number;
  missing?: string[];
}

export interface RiskFlags {
  pricing_stale?: RiskFlag;
  coverage_low?: RiskFlag;
  missing_docs?: RiskFlag;
  deadline_risk?: RiskFlag;
  stale_outreach?: RiskFlag;
  overdue_tasks?: RiskFlag;
}

export interface DemandFunnel {
  prospecting: number;
  contacted: number;
  softCircled: number;
  committed: number;
  allocated: number;
  funded: number;
}

export interface FlowDeal {
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

export interface FlowStats {
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

export const STATUS_ORDER = ["sourcing", "live", "closing", "closed", "dead"] as const;

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; dotColor: string; borderColor: string }
> = {
  sourcing: {
    label: "Sourcing",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    dotColor: "bg-slate-400",
    borderColor: "border-slate-200",
  },
  live: {
    label: "Live",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    dotColor: "bg-emerald-500",
    borderColor: "border-emerald-200",
  },
  closing: {
    label: "Closing",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    dotColor: "bg-blue-500",
    borderColor: "border-blue-200",
  },
  closed: {
    label: "Closed",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    dotColor: "bg-violet-500",
    borderColor: "border-violet-200",
  },
  dead: {
    label: "Dead",
    color: "text-slate-500",
    bgColor: "bg-slate-50",
    dotColor: "bg-slate-300",
    borderColor: "border-slate-200",
  },
};

export type FlowFilter = {
  search: string;
  owner: "all" | "me" | string;
  priority: Set<number>;
  risk: boolean;
  coverage: "all" | "under" | "covered" | "over";
  closeDate: "all" | "7" | "14" | "30";
};

export type FlowSort = "priority" | "closeDate" | "coverage" | "value";
