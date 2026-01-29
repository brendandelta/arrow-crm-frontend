"use client";

import { useEffect, useState } from "react";
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
  Plus,
  Calendar,
  Users,
  Blocks,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils";
import { getPriorityConfig } from "../priority";

// ---- Expanded deal data (fetched on demand) ----

interface Block {
  id: number;
  seller: { name: string } | null;
  totalCents: number | null;
  status: string;
}

interface Task {
  id: number;
  subject: string;
  dueAt: string | null;
  overdue: boolean;
}

interface FollowUp {
  id: number;
  targetName: string;
  status: string;
  nextStep: string | null;
  nextStepAt: string | null;
}

interface ExpandedData {
  topBlocks: Block[];
  nextFollowups: FollowUp[];
  nextTasks: Task[];
}

// ---- Props ----

export interface SelectedNode {
  id: string;
  type: string; // "deal" | "target" | "interest"
  data: Record<string, unknown>;
}

interface MindMapInspectorProps {
  selectedNode: SelectedNode | null;
  open: boolean;
  onClose: () => void;
  onNavigate: (dealId: number) => void;
  onAddTarget: (dealId: number) => void;
  onAddInterest: (dealId: number) => void;
  onEditTarget: (targetId: number, dealId: number) => void;
  onEditInterest: (interestId: number, dealId: number) => void;
}

// ---- STATUS config for targets ----
const TARGET_STATUS_COLORS: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  contacted: "bg-blue-50 text-blue-700",
  engaged: "bg-indigo-50 text-indigo-700",
  negotiating: "bg-purple-50 text-purple-700",
  committed: "bg-green-50 text-green-700",
  passed: "bg-red-50 text-red-600",
  on_hold: "bg-yellow-50 text-yellow-700",
};

const INTEREST_STATUS_COLORS: Record<string, string> = {
  prospecting: "bg-muted text-muted-foreground",
  contacted: "bg-blue-50 text-blue-700",
  soft_circled: "bg-amber-50 text-amber-700",
  committed: "bg-green-50 text-green-700",
  allocated: "bg-emerald-50 text-emerald-700",
  funded: "bg-violet-50 text-violet-700",
  declined: "bg-red-50 text-red-600",
  withdrawn: "bg-muted text-muted-foreground",
};

const STAGE_COLORS: Record<string, { label: string; color: string }> = {
  sourcing: { label: "Sourcing", color: "bg-muted text-foreground" },
  live: { label: "Live", color: "bg-emerald-50 text-emerald-700" },
  closing: { label: "Closing", color: "bg-blue-50 text-blue-700" },
  closed: { label: "Closed", color: "bg-violet-50 text-violet-700" },
  dead: { label: "Dead", color: "bg-muted text-muted-foreground" },
};

export function MindMapInspector({
  selectedNode,
  open,
  onClose,
  onNavigate,
  onAddTarget,
  onAddInterest,
  onEditTarget,
  onEditInterest,
}: MindMapInspectorProps) {
  if (!selectedNode) return null;

  const { type } = selectedNode;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {type === "deal" && (
          <DealInspectorContent
            data={selectedNode.data}
            onNavigate={onNavigate}
            onAddTarget={onAddTarget}
            onAddInterest={onAddInterest}
          />
        )}
        {type === "target" && (
          <TargetInspectorContent
            data={selectedNode.data}
            onNavigate={onNavigate}
            onEditTarget={onEditTarget}
          />
        )}
        {type === "interest" && (
          <InterestInspectorContent
            data={selectedNode.data}
            onNavigate={onNavigate}
            onEditInterest={onEditInterest}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ====================== Deal Inspector ======================

function DealInspectorContent({
  data,
  onNavigate,
  onAddTarget,
  onAddInterest,
}: {
  data: Record<string, unknown>;
  onNavigate: (dealId: number) => void;
  onAddTarget: (dealId: number) => void;
  onAddInterest: (dealId: number) => void;
}) {
  const dealId = data.dealId as number;
  const name = data.name as string;
  const company = (data.company as string) || null;
  const status = data.status as string;
  const priority = data.priority as number;
  const riskLevel = data.riskLevel as string;
  const owner = data.owner as { id: number; firstName: string; lastName: string } | null;
  const targetCount = data.targetCount as number;
  const interestCount = data.interestCount as number;
  const coverageRatio = data.coverageRatio as number | null;

  const pCfg = getPriorityConfig(priority);
  const stageCfg = STAGE_COLORS[status] || STAGE_COLORS.sourcing;

  const [expanded, setExpanded] = useState<ExpandedData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setExpanded(null);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${dealId}`)
      .then((res) => res.json())
      .then((d) => {
        setExpanded({
          topBlocks: (d.blocks || []).slice(0, 3).map((b: Block) => ({
            id: b.id,
            seller: b.seller,
            totalCents: b.totalCents,
            status: b.status,
          })),
          nextFollowups: (d.targets || [])
            .filter((t: FollowUp) => t.nextStepAt)
            .slice(0, 4)
            .map((t: FollowUp) => ({
              id: t.id,
              targetName: t.targetName,
              status: t.status,
              nextStep: t.nextStep,
              nextStepAt: t.nextStepAt,
            })),
          nextTasks: [
            ...(d.tasks?.overdue || []),
            ...(d.tasks?.dueThisWeek || []),
          ]
            .slice(0, 5)
            .map((t: Task) => ({
              id: t.id,
              subject: t.subject,
              dueAt: t.dueAt,
              overdue: t.overdue,
            })),
        });
      })
      .catch(() => setExpanded(null))
      .finally(() => setLoading(false));
  }, [dealId]);

  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3 border-b space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base leading-tight truncate">
              {name}
            </SheetTitle>
            <SheetDescription className="text-xs mt-0.5">
              {company || "No company"}
            </SheetDescription>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${stageCfg.color}`}>
              {stageCfg.label}
            </span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${pCfg.color}`}>
              {pCfg.shortLabel}
            </span>
            {riskLevel !== "ok" && (
              <AlertTriangle className={`h-4 w-4 ${riskLevel === "danger" ? "text-red-500" : "text-amber-400"}`} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onNavigate(dealId)}
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="h-3 w-3" />
            Open Deal
          </button>
          <button
            onClick={() => onAddTarget(dealId)}
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-card border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Target
          </button>
          <button
            onClick={() => onAddInterest(dealId)}
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-card border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Interest
          </button>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-5">
          {/* Details */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Owner</label>
                <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-card">
                  {owner ? `${owner.firstName} ${owner.lastName}` : "Unassigned"}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Coverage</label>
                <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-card">
                  {coverageRatio != null ? `${coverageRatio}%` : "--"}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Targets</label>
                <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-card">
                  {targetCount}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Interests</label>
                <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-card">
                  {interestCount}
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Blocks */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Blocks
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : expanded?.topBlocks && expanded.topBlocks.length > 0 ? (
              <div className="space-y-1.5">
                {expanded.topBlocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-2 rounded-md border bg-card text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Blocks className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{block.seller?.name || "Unknown"}</span>
                    </div>
                    <span className="font-medium tabular-nums shrink-0 ml-2">
                      {block.totalCents ? formatCurrency(block.totalCents) : "--"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No blocks</p>
            )}
          </section>

          <Separator />

          {/* Follow-ups */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Follow-ups
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : expanded?.nextFollowups && expanded.nextFollowups.length > 0 ? (
              <div className="space-y-1">
                {expanded.nextFollowups.map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between p-2 rounded-md border bg-card text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{fu.targetName}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {fu.nextStep || "--"} · {formatDate(fu.nextStepAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No scheduled follow-ups</p>
            )}
          </section>

          <Separator />

          {/* Tasks */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tasks
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : expanded?.nextTasks && expanded.nextTasks.length > 0 ? (
              <div className="space-y-1">
                {expanded.nextTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-2 p-2 rounded-md border text-xs ${
                      task.overdue ? "bg-red-50 border-red-200" : "bg-card"
                    }`}
                  >
                    {task.overdue ? (
                      <Clock className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{task.subject}</div>
                      {task.dueAt && (
                        <div className={`text-[10px] mt-0.5 ${task.overdue ? "text-red-600" : "text-muted-foreground"}`}>
                          {formatDate(task.dueAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No pending tasks</p>
            )}
          </section>
        </div>
      </ScrollArea>
    </>
  );
}

// ====================== Target Inspector ======================

function TargetInspectorContent({
  data,
  onNavigate,
  onEditTarget,
}: {
  data: Record<string, unknown>;
  onNavigate: (dealId: number) => void;
  onEditTarget: (targetId: number, dealId: number) => void;
}) {
  const itemId = data.itemId as number;
  const dealId = data.dealId as number;
  const name = data.name as string;
  const status = (data.status as string) || "not_started";
  const isStale = data.isStale as boolean;
  const isOverdue = data.isOverdue as boolean;
  const nextStep = data.nextStep as string;
  const nextStepAt = data.nextStepAt as string | null;

  const statusColor = TARGET_STATUS_COLORS[status] || TARGET_STATUS_COLORS.not_started;
  const statusLabel = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3 border-b space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base leading-tight truncate">
              {name}
            </SheetTitle>
            <SheetDescription className="text-xs mt-0.5">Target</SheetDescription>
          </div>
          <Badge className={`${statusColor} border-0 text-[11px]`}>{statusLabel}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEditTarget(itemId, dealId)}
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Edit Target
          </button>
          <button
            onClick={() => onNavigate(dealId)}
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-card border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="h-3 w-3" />
            Open Deal
          </button>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-4">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Status</label>
                <div className={`h-8 flex items-center text-xs font-medium border rounded-md px-2.5 ${statusColor}`}>
                  {statusLabel}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Next Step</label>
                <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-card truncate">
                  {nextStep || "--"}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Due Date</label>
                <div className={`h-8 flex items-center text-xs border rounded-md px-2.5 bg-card gap-1.5 ${isOverdue ? "text-red-600" : "text-foreground"}`}>
                  <Calendar className="h-3 w-3" />
                  {nextStepAt ? formatDate(nextStepAt) : "--"}
                </div>
              </div>
            </div>
          </section>

          {(isStale || isOverdue) && (
            <>
              <Separator />
              <section className="space-y-2">
                {isStale && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Target is stale — no recent activity
                  </div>
                )}
                {isOverdue && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    Follow-up is overdue
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

// ====================== Interest Inspector ======================

function InterestInspectorContent({
  data,
  onNavigate,
  onEditInterest,
}: {
  data: Record<string, unknown>;
  onNavigate: (dealId: number) => void;
  onEditInterest: (interestId: number, dealId: number) => void;
}) {
  const itemId = data.itemId as number;
  const dealId = data.dealId as number;
  const name = data.name as string;
  const status = (data.status as string) || "prospecting";
  const committedCents = data.committedCents as number | null;
  const blockName = data.blockName as string | null;
  const nextStep = data.nextStep as string;
  const nextStepAt = data.nextStepAt as string | null;
  const isOverdue = data.isOverdue as boolean;

  const statusColor = INTEREST_STATUS_COLORS[status] || INTEREST_STATUS_COLORS.prospecting;
  const statusLabel = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3 border-b space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base leading-tight truncate">
              {name}
            </SheetTitle>
            <SheetDescription className="text-xs mt-0.5">Interest</SheetDescription>
          </div>
          <Badge className={`${statusColor} border-0 text-[11px]`}>{statusLabel}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEditInterest(itemId, dealId)}
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Edit Interest
          </button>
          <button
            onClick={() => onNavigate(dealId)}
            className="h-7 px-2.5 rounded-md text-xs font-medium bg-card border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="h-3 w-3" />
            Open Deal
          </button>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-4">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Status</label>
                <div className={`h-8 flex items-center text-xs font-medium border rounded-md px-2.5 ${statusColor}`}>
                  {statusLabel}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Committed</label>
                <div className="h-8 flex items-center text-xs font-medium tabular-nums border rounded-md px-2.5 bg-card">
                  {committedCents ? formatCurrency(committedCents) : "--"}
                </div>
              </div>
              {blockName && (
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Block</label>
                  <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-card truncate">
                    {blockName}
                  </div>
                </div>
              )}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Next Step</label>
                <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-card truncate">
                  {nextStep || "--"}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Due Date</label>
                <div className={`h-8 flex items-center text-xs border rounded-md px-2.5 bg-card gap-1.5 ${isOverdue ? "text-red-600" : "text-foreground"}`}>
                  <Calendar className="h-3 w-3" />
                  {nextStepAt ? formatDate(nextStepAt) : "--"}
                </div>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </>
  );
}
