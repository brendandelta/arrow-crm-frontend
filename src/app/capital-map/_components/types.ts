import { Node, Edge } from "@xyflow/react";

// ============================================
// API Response Types
// ============================================

export interface CapitalMapEntity {
  id: number;
  displayName: string;
  entityType: string;
  isSeriesLlc: boolean;
  status: "active" | "inactive";
  capitalMetrics: {
    committedCents: number;
    wiredCents: number;
    deployedCents: number;
  };
  childEntities: CapitalMapEntity[];
  linkedDeals: CapitalMapDeal[];
}

export interface CapitalMapDeal {
  id: number;
  name: string;
  company: string | null;
  status: string;
  committedCents: number;
  wiredCents: number;
  blocks: CapitalMapBlock[];
  relationshipType: string;
  economicRole: string | null;
}

export interface CapitalMapBlock {
  id: number;
  sellerName: string | null;
  totalCents: number | null;
  filledPct: number;
  interests: CapitalMapInterest[];
}

export interface CapitalMapInterest {
  id: number;
  investorName: string;
  entityName: string | null;
  committedCents: number | null;
  status: string;
}

export interface CapitalMapResponse {
  root: CapitalMapEntity;
}

// ============================================
// Filter Types
// ============================================

export interface CapitalMapFilters {
  search: string;
  entityTypes: Set<string>;
  dealStatuses: Set<string>;
  showInactive: boolean;
  minCapitalCents: number | null;
  filterMode: "dim" | "hide";
}

export const DEFAULT_FILTERS: CapitalMapFilters = {
  search: "",
  entityTypes: new Set<string>(),
  dealStatuses: new Set<string>(),
  showInactive: false,
  minCapitalCents: null,
  filterMode: "dim",
};

// ============================================
// Node Types
// ============================================

export type CapitalMapNodeType =
  | "holdings"
  | "master"
  | "series"
  | "deal"
  | "block";

export interface BaseNodeData {
  label: string;
  isExpanded: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onToggle: () => void;
  onSelect: () => void;
  [key: string]: unknown;
}

export interface HoldingsNodeData extends BaseNodeData {
  entityId: number;
  capitalMetrics: {
    committedCents: number;
    wiredCents: number;
    deployedCents: number;
  };
  childCount: number;
}

export interface MasterSeriesNodeData extends BaseNodeData {
  entityId: number;
  entityType: string;
  capitalMetrics: {
    committedCents: number;
    wiredCents: number;
    deployedCents: number;
  };
  childCount: number;
  status: "active" | "inactive";
}

export interface SeriesLlcNodeData extends BaseNodeData {
  entityId: number;
  entityType: string;
  capitalMetrics: {
    committedCents: number;
    wiredCents: number;
    deployedCents: number;
  };
  dealCount: number;
  status: "active" | "inactive";
}

export interface DealNodeData extends BaseNodeData {
  dealId: number;
  company: string | null;
  dealStatus: string;
  committedCents: number;
  wiredCents: number;
  blockCount: number;
  relationshipType: string;
  economicRole: string | null;
}

export interface BlockNodeData extends BaseNodeData {
  blockId: number;
  sellerName: string | null;
  totalCents: number | null;
  filledPct: number;
  interests: CapitalMapInterest[];
}

// ============================================
// React Flow Node Types
// ============================================

export type HoldingsNode = Node<HoldingsNodeData, "holdings">;
export type MasterSeriesNode = Node<MasterSeriesNodeData, "master">;
export type SeriesLlcNode = Node<SeriesLlcNodeData, "series">;
export type DealNode = Node<DealNodeData, "deal">;
export type BlockNode = Node<BlockNodeData, "block">;

export type CapitalMapNode =
  | HoldingsNode
  | MasterSeriesNode
  | SeriesLlcNode
  | DealNode
  | BlockNode;

// ============================================
// Edge Types
// ============================================

export interface CapitalFlowEdgeData {
  capitalCents: number;
  maxCapitalCents: number;
  relationshipType?: string;
  [key: string]: unknown;
}

export type CapitalFlowEdge = Edge<CapitalFlowEdgeData>;

// ============================================
// Selection Types
// ============================================

export type SelectedNodeInfo =
  | { type: "entity"; id: number; entityType: string }
  | { type: "deal"; id: number }
  | { type: "block"; id: number; dealId: number }
  | null;

// ============================================
// Command Palette Types
// ============================================

export interface CommandPaletteItem {
  id: string;
  type: "entity" | "deal" | "investor";
  label: string;
  sublabel?: string;
  entityId?: number;
  dealId?: number;
}

// ============================================
// Constants
// ============================================

export const DEAL_STATUS_COLORS: Record<string, string> = {
  sourcing: "bg-slate-100 text-slate-600",
  live: "bg-blue-50 text-blue-700",
  closing: "bg-amber-50 text-amber-700",
  closed: "bg-green-50 text-green-700",
  dead: "bg-red-50 text-red-600",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  master_series: "Master Series",
  series_llc: "Series LLC",
  holding_company: "Holding Company",
  fund: "Fund",
  gp: "General Partner",
  lp: "Limited Partner",
};

export const RELATIONSHIP_TYPE_COLORS: Record<string, string> = {
  owner: "bg-purple-50 text-purple-700",
  holder: "bg-blue-50 text-blue-700",
  issuer: "bg-indigo-50 text-indigo-700",
  allocator: "bg-green-50 text-green-700",
  advisor: "bg-amber-50 text-amber-700",
  manager: "bg-slate-100 text-slate-700",
  gp: "bg-emerald-50 text-emerald-700",
  lp: "bg-teal-50 text-teal-700",
};

export const ECONOMIC_ROLE_COLORS: Record<string, string> = {
  receives_capital: "bg-green-50 text-green-700",
  deploys_capital: "bg-blue-50 text-blue-700",
  holds_asset: "bg-purple-50 text-purple-700",
  earns_fees: "bg-amber-50 text-amber-700",
};
