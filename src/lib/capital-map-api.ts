// Capital Map API types and helpers

// ==================== Types ====================

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

// ==================== API Helpers ====================

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const session = localStorage.getItem("arrow_session");
  if (!session) {
    console.warn("[Capital Map API] No session found");
    return {};
  }

  try {
    const data = JSON.parse(session);
    if (data.backendUserId) {
      return { "X-User-Id": data.backendUserId.toString() };
    }
    console.warn(
      "[Capital Map API] Session missing backendUserId - try logging out and back in"
    );
  } catch {
    console.error("[Capital Map API] Invalid session data");
  }
  return {};
}

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}

// ==================== API Functions ====================

/**
 * Fetch the capital map data structure starting from the root entity.
 * Returns a hierarchical tree of entities with linked deals, blocks, and interests.
 */
export async function fetchCapitalMap(): Promise<CapitalMapResponse> {
  const res = await authFetch(`${API_BASE}/api/capital_map`);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch capital map: ${error}`);
  }

  return res.json();
}

/**
 * Fetch detailed entity information for the inspector panel.
 */
export async function fetchCapitalMapEntityDetail(
  entityId: number
): Promise<{
  id: number;
  displayName: string;
  entityType: string;
  entityTypeLabel: string;
  jurisdictionCountry: string | null;
  jurisdictionState: string | null;
  fullJurisdiction: string | null;
  status: string;
  statusLabel: string;
  parentEntity: { id: number; displayName: string } | null;
  signers: Array<{ id: number; fullName: string; role: string }>;
  bankAccounts: Array<{
    id: number;
    bankName: string;
    accountType: string;
    accountLast4: string | null;
    isPrimary: boolean;
  }>;
  linkedDeals: Array<{
    id: number;
    name: string;
    status: string;
    company: string | null;
  }>;
  capitalMetrics: {
    committedCents: number;
    wiredCents: number;
    deployedCents: number;
  };
}> {
  const res = await authFetch(
    `${API_BASE}/api/capital_map/entities/${entityId}`
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch entity detail: ${error}`);
  }

  return res.json();
}

/**
 * Fetch detailed deal information for the inspector panel.
 */
export async function fetchCapitalMapDealDetail(dealId: number): Promise<{
  id: number;
  name: string;
  company: string | null;
  status: string;
  statusLabel: string;
  committedCents: number;
  wiredCents: number;
  deployedCents: number;
  blocks: Array<{
    id: number;
    sellerName: string | null;
    totalCents: number | null;
    filledPct: number;
    interestCount: number;
  }>;
  interests: Array<{
    id: number;
    investorName: string;
    entityName: string | null;
    committedCents: number | null;
    status: string;
    blockId: number | null;
  }>;
  linkedEntities: Array<{
    id: number;
    displayName: string;
    entityType: string;
    relationshipType: string;
    economicRole: string | null;
  }>;
}> {
  const res = await authFetch(`${API_BASE}/api/capital_map/deals/${dealId}`);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch deal detail: ${error}`);
  }

  return res.json();
}

/**
 * Fetch block details including all mapped interests.
 */
export async function fetchCapitalMapBlockDetail(blockId: number): Promise<{
  id: number;
  sellerName: string | null;
  totalCents: number | null;
  filledCents: number;
  filledPct: number;
  dealId: number;
  dealName: string;
  interests: Array<{
    id: number;
    investorName: string;
    entityName: string | null;
    committedCents: number | null;
    wiredCents: number | null;
    status: string;
    statusLabel: string;
  }>;
}> {
  const res = await authFetch(`${API_BASE}/api/capital_map/blocks/${blockId}`);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch block detail: ${error}`);
  }

  return res.json();
}

// ==================== Utility Functions ====================

/**
 * Format cents as currency string.
 */
export function formatCapital(cents: number | null): string {
  if (cents === null || cents === undefined) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(0)}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

/**
 * Format cents as full currency string.
 */
export function formatCapitalFull(cents: number | null): string {
  if (cents === null || cents === undefined) return "$0.00";
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Calculate percentage with bounds.
 */
export function calculatePercentage(
  part: number,
  total: number,
  maxPct: number = 100
): number {
  if (total === 0) return 0;
  return Math.min(maxPct, (part / total) * 100);
}
