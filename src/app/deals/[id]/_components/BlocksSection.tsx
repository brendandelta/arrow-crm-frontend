"use client";

import { useState, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, LayoutGrid, LayoutList, Flame, ChevronDown, ChevronRight, ListTodo, CalendarClock } from "lucide-react";

interface TaskInfo {
  id: number;
  subject: string;
  dueAt: string | null;
  overdue: boolean;
}

interface MappedInterest {
  id: number;
  investor: string | null;
  committedCents: number | null;
  status: string;
}

interface Block {
  id: number;
  seller: { id: number; name: string; kind: string } | null;
  sellerType?: string | null;
  contact?: { id: number; firstName: string; lastName: string; email?: string; title?: string; phone?: string } | null;
  broker?: { id: number; name: string } | null;
  brokerContact?: { id: number; firstName: string; lastName: string; email?: string; title?: string; phone?: string } | null;
  shareClass?: string | null;
  shares?: number | null;
  priceCents?: number | null;
  totalCents?: number | null;
  minSizeCents?: number | null;
  impliedValuationCents?: number | null;
  discountPct?: number | null;
  status: string;
  heat: number;
  heatLabel: string;
  terms?: string | null;
  expiresAt?: string | null;
  source?: string | null;
  sourceDetail?: string | null;
  verified?: boolean;
  internalNotes?: string | null;
  createdAt?: string;
  nextTask?: TaskInfo | null;
  tasks?: TaskInfo[];
  mappedInterests?: MappedInterest[];
  mappedInterestsCount?: number;
  mappedCommittedCents?: number;
}

interface BlocksSectionProps {
  blocks: Block[];
  dealId: number;
  onBlockClick: (block: Block) => void;
  onAddBlock: () => void;
  onBlocksUpdated?: () => void;
}

function formatCurrency(cents: number | null | undefined) {
  if (cents === null || cents === undefined || cents === 0) return "—";
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

function HeatBadge({ heat, label }: { heat: number; label: string }) {
  const styles: Record<number, string> = {
    0: "bg-slate-100 text-slate-600",
    1: "bg-yellow-100 text-yellow-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-red-100 text-red-700",
  };
  return (
    <Badge className={`${styles[heat]} flex items-center gap-1`}>
      {heat >= 2 && <Flame className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

function BlockStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: "bg-green-100 text-green-700",
    reserved: "bg-yellow-100 text-yellow-700",
    sold: "bg-purple-100 text-purple-700",
    withdrawn: "bg-slate-100 text-slate-600",
  };
  return (
    <Badge className={styles[status] || styles.available}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function BlocksSection({ blocks, dealId, onBlockClick, onAddBlock, onBlocksUpdated }: BlocksSectionProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [expandedBlockId, setExpandedBlockId] = useState<number | null>(null);
  const [addingFollowUpFor, setAddingFollowUpFor] = useState<number | null>(null);

  const toggleExpand = (blockId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBlockId(expandedBlockId === blockId ? null : blockId);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Blocks</h3>
          <Badge variant="secondary">{blocks.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 ${viewMode === "table" ? "bg-slate-100" : "hover:bg-slate-50"}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 ${viewMode === "card" ? "bg-slate-100" : "hover:bg-slate-50"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onAddBlock}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add Block
          </button>
        </div>
      </div>

      {/* Content */}
      {blocks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          No blocks yet. Add your first block to get started.
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Heat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead className="text-right">Mapped</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.map((block) => (
                <Fragment key={block.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => onBlockClick(block)}
                  >
                    <TableCell>
                      {block.mappedInterests && block.mappedInterests.length > 0 && (
                        <button
                          onClick={(e) => toggleExpand(block.id, e)}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          {expandedBlockId === block.id ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      {block.seller ? (
                        <div>
                          <div className="font-medium">{block.seller.name}</div>
                          <div className="text-xs text-muted-foreground">{block.seller.kind}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {block.contact ? (
                        <div>
                          <div className="font-medium">
                            {block.contact.firstName} {block.contact.lastName}
                          </div>
                          {block.contact.email && (
                            <div className="text-xs text-muted-foreground">{block.contact.email}</div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {block.shares?.toLocaleString() || "—"}
                      {block.shareClass && (
                        <div className="text-xs text-muted-foreground">{block.shareClass}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(block.priceCents)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(block.totalCents)}
                    </TableCell>
                    <TableCell>
                      <HeatBadge heat={block.heat} label={block.heatLabel} />
                    </TableCell>
                    <TableCell>
                      <BlockStatusBadge status={block.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {block.nextTask ? (
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm truncate ${block.nextTask.overdue ? "text-red-600 font-medium" : ""}`}>
                              {block.nextTask.subject}
                            </div>
                            {block.nextTask.dueAt && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(block.nextTask.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                            )}
                          </div>
                        ) : null}
                        <button
                          onClick={() => setAddingFollowUpFor(addingFollowUpFor === block.id ? null : block.id)}
                          className="shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          title="Add follow-up task"
                        >
                          <ListTodo className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {block.mappedInterestsCount ? (
                        <div>
                          <div className="font-medium">{block.mappedInterestsCount}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(block.mappedCommittedCents || 0)}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row - Mapped Interests */}
                  {expandedBlockId === block.id && block.mappedInterests && (
                    <TableRow>
                      <TableCell colSpan={10} className="bg-slate-50 p-0">
                        <div className="p-3 pl-10">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Mapped Interests
                          </div>
                          <div className="space-y-1">
                            {block.mappedInterests.map((interest) => (
                              <div
                                key={interest.id}
                                className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                              >
                                <span className="font-medium">{interest.investor || "—"}</span>
                                <div className="flex items-center gap-2">
                                  <span>{formatCurrency(interest.committedCents)}</span>
                                  <Badge className="text-xs bg-slate-100">
                                    {interest.status.replace("_", " ")}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {addingFollowUpFor === block.id && (
                    <TableRow>
                      <TableCell colSpan={10} className="p-0">
                        <InlineFollowUpForm
                          dealId={dealId}
                          taskableType="Block"
                          taskableId={block.id}
                          onCancel={() => setAddingFollowUpFor(null)}
                          onSuccess={() => { setAddingFollowUpFor(null); onBlocksUpdated?.(); }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-2 gap-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              onClick={() => onBlockClick(block)}
              className="p-4 border rounded-lg cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">{block.seller?.name || "No seller"}</div>
                  {block.contact && (
                    <div className="text-sm text-muted-foreground">
                      {block.contact.firstName} {block.contact.lastName}
                    </div>
                  )}
                </div>
                <HeatBadge heat={block.heat} label={block.heatLabel} />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="text-lg font-semibold">{formatCurrency(block.totalCents)}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Price</div>
                  <div className="font-medium">{formatCurrency(block.priceCents)}/sh</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <BlockStatusBadge status={block.status} />
                {block.mappedInterestsCount ? (
                  <span className="text-xs text-muted-foreground">
                    {block.mappedInterestsCount} interests mapped
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Inline Follow-up Form ============

function InlineFollowUpForm({ dealId, taskableType, taskableId, onCancel, onSuccess }: {
  dealId: number;
  taskableType: string;
  taskableId: number;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          due_at: dueAt || null,
          priority: priority === "high" ? 2 : priority === "low" ? 0 : 1,
          deal_id: dealId,
          taskable_type: taskableType,
          taskable_id: taskableId,
        }),
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to create follow-up:", err);
    }
    setSubmitting(false);
  };

  return (
    <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
      <input
        type="text"
        placeholder="Follow-up task description..."
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full text-sm px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
        autoFocus
      />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="text-xs border rounded px-2 py-1"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
        <div className="flex-1" />
        <button
          onClick={handleSubmit}
          disabled={!subject.trim() || submitting}
          className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Add Follow-up"}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800">
          Cancel
        </button>
      </div>
    </div>
  );
}
