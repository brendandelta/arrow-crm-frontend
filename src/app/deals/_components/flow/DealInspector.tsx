"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ExternalLink,
  Users,
  Blocks,
  Copy,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getPriorityConfig, DEAL_PRIORITIES } from "../priority";
import { formatCurrency, formatDate } from "../utils";
import { DemandProgressBar } from "@/components/deals/DemandProgressBar";
import { RiskFlagIndicator } from "@/components/deals/RiskFlagIndicator";
import { STATUS_ORDER, STATUS_CONFIG } from "./types";
import type { FlowDeal, Owner } from "./types";

interface Block {
  id: number;
  seller: { name: string } | null;
  priceCents: number | null;
  totalCents: number | null;
  heat: number;
  heatLabel: string;
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

interface ExpandedData {
  topBlocks: Block[];
  nextFollowups: DealTarget[];
  nextTasks: Task[];
}

interface DealInspectorProps {
  deal: FlowDeal | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (dealId: number, newStatus: string) => void;
  onPriorityChange: (dealId: number, priority: number) => void;
  onOwnerChange?: (dealId: number, ownerId: number | null) => void;
  onCloseDateChange?: (dealId: number, date: string | null) => void;
  onNavigate: (dealId: number) => void;
  owners?: Owner[];
}

export function DealInspector({
  deal,
  open,
  onClose,
  onStatusChange,
  onPriorityChange,
  onOwnerChange,
  onCloseDateChange,
  onNavigate,
  owners = [],
}: DealInspectorProps) {
  const [expanded, setExpanded] = useState<ExpandedData | null>(null);
  const [loadingExpanded, setLoadingExpanded] = useState(false);

  useEffect(() => {
    if (!deal) {
      setExpanded(null);
      return;
    }
    setLoadingExpanded(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${deal.id}`)
      .then((res) => res.json())
      .then((data) => {
        setExpanded({
          topBlocks: (data.blocks || []).slice(0, 3).map((b: Block) => ({
            id: b.id,
            seller: b.seller,
            priceCents: b.priceCents,
            totalCents: b.totalCents,
            heat: b.heat,
            heatLabel: b.heatLabel,
            status: b.status,
          })),
          nextFollowups: (data.targets || [])
            .filter((t: DealTarget) => t.nextStepAt)
            .slice(0, 4)
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
      .finally(() => setLoadingExpanded(false));
  }, [deal?.id]);

  if (!deal) return null;

  const priorityConfig = getPriorityConfig(deal.priority);
  const statusCfg = STATUS_CONFIG[deal.status] || STATUS_CONFIG.sourcing;
  const isPastDue = deal.daysUntilClose !== null && deal.daysUntilClose < 0;
  const isUrgent =
    deal.daysUntilClose !== null &&
    deal.daysUntilClose <= 7 &&
    deal.daysUntilClose >= 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col h-full"
      >
        {/* Compact header */}
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetHeader className="p-0 space-y-0">
                <SheetTitle className="text-sm font-semibold leading-tight truncate">
                  {deal.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 mt-0.5">
                  {deal.company || "No company"}
                  {deal.sector && ` · ${deal.sector}`}
                </SheetDescription>
              </SheetHeader>
            </div>
            <button
              onClick={() => onNavigate(deal.id)}
              className="shrink-0 h-7 px-2.5 rounded text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </button>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${statusCfg.bgColor} ${statusCfg.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${priorityConfig.color}`}>
              {priorityConfig.shortLabel}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/deals/${deal.id}`)}
              className="ml-auto text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy link
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Editable fields */}
            <section className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-3">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Details
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Stage */}
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Stage
                  </label>
                  <Select
                    value={deal.status}
                    onValueChange={(v) => onStatusChange(deal.id, v)}
                  >
                    <SelectTrigger size="sm" className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_CONFIG[s]?.label || s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Priority
                  </label>
                  <Select
                    value={String(deal.priority)}
                    onValueChange={(v) =>
                      onPriorityChange(deal.id, Number(v))
                    }
                  >
                    <SelectTrigger size="sm" className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={String(p.value)}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Owner */}
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Owner
                  </label>
                  {onOwnerChange && owners.length > 0 ? (
                    <Select
                      value={deal.owner ? String(deal.owner.id) : "unassigned"}
                      onValueChange={(v) =>
                        onOwnerChange(deal.id, v === "unassigned" ? null : Number(v))
                      }
                    >
                      <SelectTrigger size="sm" className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {owners.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.firstName} {o.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-white">
                      {deal.owner
                        ? `${deal.owner.firstName} ${deal.owner.lastName}`
                        : "Unassigned"}
                    </div>
                  )}
                </div>

                {/* Close date */}
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Close Date
                  </label>
                  {onCloseDateChange ? (
                    <input
                      type="date"
                      value={deal.expectedClose ? deal.expectedClose.split('T')[0] : ''}
                      onChange={(e) => onCloseDateChange(deal.id, e.target.value || null)}
                      className={`h-8 w-full text-xs border rounded-md px-2.5 bg-white ${
                        isPastDue
                          ? "text-red-600"
                          : isUrgent
                          ? "text-amber-600"
                          : "text-foreground"
                      }`}
                    />
                  ) : (
                    <div
                      className={`h-8 flex items-center gap-1.5 text-xs border rounded-md px-2.5 bg-white ${
                        isPastDue
                          ? "text-red-600"
                          : isUrgent
                          ? "text-amber-600"
                          : "text-foreground"
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      {deal.expectedClose
                        ? formatDate(deal.expectedClose)
                        : "No date"}
                    </div>
                  )}
                </div>
              </div>

              {/* Best price + value row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Best Price
                  </label>
                  <div className="h-8 flex items-center text-xs font-medium tabular-nums border rounded-md px-2.5 bg-white">
                    {deal.bestPrice
                      ? formatCurrency(deal.bestPrice)
                      : "—"}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Deal Value
                  </label>
                  <div className="h-8 flex items-center text-xs font-medium tabular-nums border rounded-md px-2.5 bg-white">
                    {formatCurrency(deal.blocksValue)}
                  </div>
                </div>
              </div>
            </section>

            {/* Demand / Coverage */}
            <section className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Demand
              </h3>
              <DemandProgressBar
                softCircled={deal.softCircled}
                committed={deal.totalCommitted - deal.softCircled - deal.wired}
                wired={deal.wired}
                inventory={deal.inventory}
                showLabels
                size="md"
              />
              {deal.coverageRatio !== null && (
                <div className="text-xs text-muted-foreground">
                  Coverage: <strong>{deal.coverageRatio}%</strong>
                </div>
              )}
            </section>

            {/* Risk */}
            {deal.riskFlagsSummary.count > 0 && (
              <section className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2.5">
                <h3 className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">
                  Risk Flags
                </h3>
                <RiskFlagIndicator
                  riskFlags={deal.riskFlags}
                  showLabels
                  size="md"
                />
              </section>
            )}

            {/* Blocks */}
            <section className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Blocks
                </h3>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {deal.blocks} total
                </span>
              </div>
              {loadingExpanded ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 bg-slate-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : expanded?.topBlocks && expanded.topBlocks.length > 0 ? (
                <div className="space-y-1.5">
                  {expanded.topBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-white text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Blocks className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {block.seller?.name || "Unknown"}
                        </span>
                      </div>
                      <span className="font-medium tabular-nums shrink-0 ml-2">
                        {block.totalCents
                          ? formatCurrency(block.totalCents)
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No blocks</p>
              )}
            </section>

            {/* Tasks */}
            <section className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Tasks
                </h3>
                {deal.overdueTasksCount > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                    {deal.overdueTasksCount} overdue
                  </span>
                )}
              </div>
              {loadingExpanded ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-8 bg-slate-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : expanded?.nextTasks && expanded.nextTasks.length > 0 ? (
                <div className="space-y-1">
                  {expanded.nextTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-2 p-2 rounded-md border text-xs ${
                        task.overdue
                          ? "bg-red-50 border-red-200"
                          : "bg-white"
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
                          <div
                            className={`text-[10px] mt-0.5 ${
                              task.overdue
                                ? "text-red-600"
                                : "text-muted-foreground"
                            }`}
                          >
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

            {/* Outreach / Follow-ups */}
            <section className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Follow-ups
                </h3>
                {deal.targetsNeedingFollowup > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    {deal.targetsNeedingFollowup} need follow-up
                  </span>
                )}
              </div>
              {loadingExpanded ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-8 bg-slate-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : expanded?.nextFollowups &&
                expanded.nextFollowups.length > 0 ? (
                <div className="space-y-1">
                  {expanded.nextFollowups.map((fu) => (
                    <div
                      key={fu.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-white text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{fu.targetName}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {fu.nextStep || "—"} · {formatDate(fu.nextStepAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No scheduled follow-ups
                </p>
              )}
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
