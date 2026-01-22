export interface NextAction {
  label: string;
  dueAt: string | null;
  isOverdue: boolean;
  kind: "task" | "target" | "interest" | "none";
}

export interface MindMapBlock {
  id: number;
  name: string;
  type: "block";
  status: string;
  sizeCents: number | null;
  priceCents: number | null;
  constraints: string[];
  nextAction: NextAction;
}

export interface MindMapInterest {
  id: number;
  name: string;
  type: "interest";
  status: string;
  committedCents: number | null;
  blockName: string | null;
  nextAction: NextAction;
}

export interface MindMapTarget {
  id: number;
  name: string;
  type: "target";
  status: string;
  lastActivityAt: string | null;
  isStale: boolean;
  nextAction: NextAction;
}

export type MindMapChild = MindMapBlock | MindMapInterest | MindMapTarget;

export interface MindMapDeal {
  id: number;
  name: string;
  company: string | null;
  status: string;
  priority: number;
  owner: { id: number; firstName: string; lastName: string } | null;
  riskLevel: "danger" | "warning" | "ok";
  coverageRatio: number | null;
  nextAction: NextAction;
  blocks: MindMapBlock[];
  interests: MindMapInterest[];
  targets: MindMapTarget[];
}

export interface MindMapGroup {
  owner: string;
  label: string;
  deals: MindMapDeal[];
}

export interface MindMapResponse {
  groups: MindMapGroup[];
}
