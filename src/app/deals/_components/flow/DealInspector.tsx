"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ListTodo,
  Users,
  Blocks,
  Copy,
  AlertTriangle,
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
  onNavigate: (dealId: number) => void;
  owners: Owner[];
}

export function DealInspector({
  deal,
  open,
  onClose,
  onStatusChange,
  onPriorityChange,
  onNavigate,
  owners,
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
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base leading-tight truncate">
                {deal.name}
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                {deal.company || "No company"}{" "}
                {deal.sector && `· ${deal.sector}`}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${statusCfg.bgColor} ${statusCfg.color}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`}
                />
                {statusCfg.label}
              </span>
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${priorityConfig.color}`}
              >
                {priorityConfig.shortLabel}
              </span>
            </div>
          </div>

          {/* Quick action row */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(deal.id)}
              className="h-7 px-2.5 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="h-3 w-3" />
              Open Deal
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/deals/${deal.id}`
                );
              }}
              className="h-7 px-2 rounded-md text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Link
            </button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-5">
            {/* Editable fields */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                  <div className="h-8 flex items-center text-xs text-foreground border rounded-md px-2.5 bg-white">
                    {deal.owner
                      ? `${deal.owner.firstName} ${deal.owner.lastName}`
                      : "Unassigned"}
                  </div>
                </div>

                {/* Close date */}
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Close Date
                  </label>
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
                    {deal.daysUntilClose !== null && (
                      <span className="text-muted-foreground">
                        ({isPastDue
                          ? `${Math.abs(deal.daysUntilClose)}d over`
                          : deal.daysUntilClose === 0
                          ? "today"
                          : `${deal.daysUntilClose}d`})
                      </span>
                    )}
                  </div>
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

            <Separator />

            {/* Demand / Coverage */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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

            <Separator />

            {/* Risk */}
            {deal.riskFlagsSummary.count > 0 && (
              <>
                <section className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Risk Flags
                  </h3>
                  <RiskFlagIndicator
                    riskFlags={deal.riskFlags}
                    showLabels
                    size="md"
                  />
                </section>
                <Separator />
              </>
            )}

            {/* Blocks */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Blocks
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">
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

            <Separator />

            {/* Tasks */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tasks
                </h3>
                {deal.overdueTasksCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {deal.overdueTasksCount} overdue
                  </Badge>
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

            <Separator />

            {/* Outreach / Follow-ups */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Follow-ups
                </h3>
                {deal.targetsNeedingFollowup > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700"
                  >
                    {deal.targetsNeedingFollowup} need follow-up
                  </Badge>
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
