"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Building2,
  Landmark,
  Users,
  Blocks,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  fetchCapitalMapEntityDetail,
  fetchCapitalMapDealDetail,
  fetchCapitalMapBlockDetail,
  formatCapital,
  formatCapitalFull,
} from "@/lib/capital-map-api";
import type { SelectedNodeInfo, RELATIONSHIP_TYPE_COLORS } from "./types";

interface CapitalMapInspectorProps {
  selectedNode: SelectedNodeInfo;
  open: boolean;
  onClose: () => void;
}

const ENTITY_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-slate-100 text-slate-500",
  pending: "bg-amber-50 text-amber-700",
  dissolved: "bg-red-50 text-red-600",
};

const DEAL_STATUS_COLORS: Record<string, string> = {
  sourcing: "bg-slate-100 text-slate-600",
  live: "bg-blue-50 text-blue-700",
  closing: "bg-amber-50 text-amber-700",
  closed: "bg-green-50 text-green-700",
  dead: "bg-red-50 text-red-600",
};

const INTEREST_STATUS_COLORS: Record<string, string> = {
  prospecting: "bg-slate-100 text-slate-600",
  contacted: "bg-blue-50 text-blue-700",
  soft_circled: "bg-amber-50 text-amber-700",
  committed: "bg-green-50 text-green-700",
  allocated: "bg-emerald-50 text-emerald-700",
  funded: "bg-violet-50 text-violet-700",
  declined: "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-500",
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  owner: "bg-purple-50 text-purple-700",
  holder: "bg-blue-50 text-blue-700",
  issuer: "bg-indigo-50 text-indigo-700",
  allocator: "bg-green-50 text-green-700",
  advisor: "bg-amber-50 text-amber-700",
  manager: "bg-slate-100 text-slate-700",
  gp: "bg-emerald-50 text-emerald-700",
  lp: "bg-teal-50 text-teal-700",
};

export function CapitalMapInspector({
  selectedNode,
  open,
  onClose,
}: CapitalMapInspectorProps) {
  if (!selectedNode) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        {selectedNode.type === "entity" && (
          <EntityInspectorContent
            entityId={selectedNode.id}
            entityType={selectedNode.entityType}
          />
        )}
        {selectedNode.type === "deal" && (
          <DealInspectorContent dealId={selectedNode.id} />
        )}
        {selectedNode.type === "block" && (
          <BlockInspectorContent
            blockId={selectedNode.id}
            dealId={selectedNode.dealId}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ====================== Entity Inspector ======================

interface EntityDetail {
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
}

function EntityInspectorContent({
  entityId,
  entityType,
}: {
  entityId: number;
  entityType: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<EntityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCapitalMapEntityDetail(entityId)
      .then((d) => setData(d))
      .catch((err) => {
        console.error("Failed to fetch entity detail:", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [entityId]);

  const statusColor =
    ENTITY_STATUS_COLORS[data?.status || "active"] ||
    ENTITY_STATUS_COLORS.active;

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-8 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
        <div className="h-20 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-5 text-sm text-muted-foreground">
        Failed to load entity details
      </div>
    );
  }

  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3 border-b space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base leading-tight truncate">
              {data.displayName}
            </SheetTitle>
            <SheetDescription className="text-xs mt-0.5">
              {data.entityTypeLabel}
            </SheetDescription>
          </div>
          <Badge className={`${statusColor} border-0 text-[11px]`}>
            {data.statusLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              router.push(`/internal-entities?id=${entityId}`)
            }
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="h-3 w-3" />
            View Full Details
          </button>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-5">
          {/* Capital Metrics */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Capital
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  Committed
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatCapital(data.capitalMetrics.committedCents)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  Wired
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatCapital(data.capitalMetrics.wiredCents)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  Deployed
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatCapital(data.capitalMetrics.deployedCents)}
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Details */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Type
                </label>
                <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-white">
                  {data.entityTypeLabel}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Jurisdiction
                </label>
                <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-white">
                  {data.fullJurisdiction || "--"}
                </div>
              </div>
              {data.parentEntity && (
                <div className="col-span-2">
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Parent Entity
                  </label>
                  <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-white">
                    {data.parentEntity.displayName}
                  </div>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Signers */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              Signers
            </h3>
            {data.signers.length > 0 ? (
              <div className="space-y-1.5">
                {data.signers.map((signer) => (
                  <div
                    key={signer.id}
                    className="flex items-center justify-between p-2 rounded-md border bg-white text-xs"
                  >
                    <span className="truncate">{signer.fullName}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {signer.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No signers</p>
            )}
          </section>

          <Separator />

          {/* Bank Accounts */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="h-3 w-3" />
              Bank Accounts
            </h3>
            {data.bankAccounts.length > 0 ? (
              <div className="space-y-1.5">
                {data.bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-2 rounded-md border bg-white text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{account.bankName}</span>
                      {account.isPrimary && (
                        <Badge className="bg-indigo-50 text-indigo-600 border-0 text-[9px]">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      ****{account.accountLast4 || "----"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No bank accounts</p>
            )}
          </section>

          <Separator />

          {/* Linked Deals */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              Linked Deals
            </h3>
            {data.linkedDeals.length > 0 ? (
              <div className="space-y-1.5">
                {data.linkedDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-2 rounded-md border bg-white text-xs cursor-pointer hover:bg-slate-50"
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    <div className="min-w-0">
                      <span className="truncate font-medium">{deal.name}</span>
                      {deal.company && (
                        <span className="text-muted-foreground ml-1.5">
                          · {deal.company}
                        </span>
                      )}
                    </div>
                    <Badge
                      className={`${DEAL_STATUS_COLORS[deal.status] || DEAL_STATUS_COLORS.sourcing} border-0 text-[9px] shrink-0`}
                    >
                      {deal.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No linked deals</p>
            )}
          </section>
        </div>
      </ScrollArea>
    </>
  );
}

// ====================== Deal Inspector ======================

interface DealDetail {
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
}

function DealInspectorContent({ dealId }: { dealId: number }) {
  const router = useRouter();
  const [data, setData] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCapitalMapDealDetail(dealId)
      .then((d) => setData(d))
      .catch((err) => {
        console.error("Failed to fetch deal detail:", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [dealId]);

  const statusColor =
    DEAL_STATUS_COLORS[data?.status || "sourcing"] ||
    DEAL_STATUS_COLORS.sourcing;

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-8 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
        <div className="h-20 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-5 text-sm text-muted-foreground">
        Failed to load deal details
      </div>
    );
  }

  const wiredPct =
    data.committedCents > 0
      ? Math.round((data.wiredCents / data.committedCents) * 100)
      : 0;

  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3 border-b space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base leading-tight truncate">
              {data.name}
            </SheetTitle>
            <SheetDescription className="text-xs mt-0.5">
              {data.company || "No company"}
            </SheetDescription>
          </div>
          <Badge className={`${statusColor} border-0 text-[11px]`}>
            {data.statusLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => router.push(`/deals/${dealId}`)}
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="h-3 w-3" />
            View Full Details
          </button>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-5">
          {/* Capital Funnel */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              Capital Funnel
            </h3>
            <div className="p-3 rounded-lg bg-slate-50 border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Committed</span>
                <span className="font-medium">
                  {formatCapitalFull(data.committedCents)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Wired</span>
                <span className="font-medium">
                  {formatCapitalFull(data.wiredCents)}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    wiredPct >= 100
                      ? "bg-emerald-500"
                      : wiredPct >= 50
                        ? "bg-blue-500"
                        : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, wiredPct)}%` }}
                />
              </div>
              <div className="text-[10px] text-right text-muted-foreground">
                {wiredPct}% wired
              </div>
            </div>
          </section>

          <Separator />

          {/* Blocks */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Blocks className="h-3 w-3" />
              Blocks ({data.blocks.length})
            </h3>
            {data.blocks.length > 0 ? (
              <div className="space-y-1.5">
                {data.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-2 rounded-md border bg-white text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">
                        {block.sellerName || `Block ${block.id}`}
                      </span>
                      <span className="text-muted-foreground shrink-0 ml-2">
                        {formatCapital(block.totalCents)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            block.filledPct >= 100
                              ? "bg-emerald-500"
                              : block.filledPct >= 75
                                ? "bg-blue-500"
                                : "bg-amber-400"
                          }`}
                          style={{
                            width: `${Math.min(100, block.filledPct)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {block.filledPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No blocks</p>
            )}
          </section>

          <Separator />

          {/* Interests */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" />
              Interests ({data.interests.length})
            </h3>
            {data.interests.length > 0 ? (
              <div className="space-y-1.5">
                {data.interests.slice(0, 8).map((interest) => (
                  <div
                    key={interest.id}
                    className="flex items-center justify-between p-2 rounded-md border bg-white text-xs"
                  >
                    <div className="min-w-0">
                      <span className="truncate font-medium">
                        {interest.investorName}
                      </span>
                      {interest.entityName && (
                        <span className="text-muted-foreground ml-1">
                          via {interest.entityName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-muted-foreground">
                        {formatCapital(interest.committedCents)}
                      </span>
                      <Badge
                        className={`${INTEREST_STATUS_COLORS[interest.status] || INTEREST_STATUS_COLORS.prospecting} border-0 text-[9px]`}
                      >
                        {interest.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {data.interests.length > 8 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{data.interests.length - 8} more interests
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No interests</p>
            )}
          </section>

          <Separator />

          {/* Linked Entities */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              Linked Entities
            </h3>
            {data.linkedEntities.length > 0 ? (
              <div className="space-y-1.5">
                {data.linkedEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between p-2 rounded-md border bg-white text-xs cursor-pointer hover:bg-slate-50"
                    onClick={() =>
                      router.push(`/internal-entities?id=${entity.id}`)
                    }
                  >
                    <div className="min-w-0">
                      <span className="truncate font-medium">
                        {entity.displayName}
                      </span>
                      <span className="text-muted-foreground ml-1.5">
                        · {entity.entityType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <Badge
                      className={`${RELATIONSHIP_COLORS[entity.relationshipType] || "bg-slate-100 text-slate-600"} border-0 text-[9px] shrink-0`}
                    >
                      {entity.relationshipType}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No linked entities
              </p>
            )}
          </section>
        </div>
      </ScrollArea>
    </>
  );
}

// ====================== Block Inspector ======================

interface BlockDetail {
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
}

function BlockInspectorContent({
  blockId,
  dealId,
}: {
  blockId: number;
  dealId: number;
}) {
  const router = useRouter();
  const [data, setData] = useState<BlockDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCapitalMapBlockDetail(blockId)
      .then((d) => setData(d))
      .catch((err) => {
        console.error("Failed to fetch block detail:", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [blockId]);

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-8 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
        <div className="h-20 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-5 text-sm text-muted-foreground">
        Failed to load block details
      </div>
    );
  }

  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3 border-b space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base leading-tight truncate">
              {data.sellerName || `Block ${blockId}`}
            </SheetTitle>
            <SheetDescription className="text-xs mt-0.5">
              {data.dealName}
            </SheetDescription>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => router.push(`/deals/${dealId}`)}
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="h-3 w-3" />
            View Deal
          </button>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-5">
          {/* Block Summary */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Summary
            </h3>
            <div className="p-3 rounded-lg bg-slate-50 border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Block Size</span>
                <span className="font-medium">
                  {formatCapitalFull(data.totalCents)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Filled</span>
                <span className="font-medium">
                  {formatCapitalFull(data.filledCents)}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    data.filledPct >= 100
                      ? "bg-emerald-500"
                      : data.filledPct >= 75
                        ? "bg-blue-500"
                        : data.filledPct >= 50
                          ? "bg-amber-400"
                          : "bg-slate-300"
                  }`}
                  style={{ width: `${Math.min(100, data.filledPct)}%` }}
                />
              </div>
              <div className="text-[10px] text-right text-muted-foreground">
                {data.filledPct}% filled
              </div>
            </div>
          </section>

          <Separator />

          {/* Interests */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" />
              Mapped Interests ({data.interests.length})
            </h3>
            {data.interests.length > 0 ? (
              <div className="space-y-1.5">
                {data.interests.map((interest) => (
                  <div
                    key={interest.id}
                    className="p-2 rounded-md border bg-white text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">
                        {interest.investorName}
                      </span>
                      <Badge
                        className={`${INTEREST_STATUS_COLORS[interest.status] || INTEREST_STATUS_COLORS.prospecting} border-0 text-[9px]`}
                      >
                        {interest.statusLabel}
                      </Badge>
                    </div>
                    {interest.entityName && (
                      <div className="text-[10px] text-muted-foreground mb-1">
                        via {interest.entityName}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[10px]">
                      <span>
                        Committed:{" "}
                        <span className="font-medium">
                          {formatCapital(interest.committedCents)}
                        </span>
                      </span>
                      <span>
                        Wired:{" "}
                        <span className="font-medium">
                          {formatCapital(interest.wiredCents)}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No interests mapped to this block
              </p>
            )}
          </section>
        </div>
      </ScrollArea>
    </>
  );
}
