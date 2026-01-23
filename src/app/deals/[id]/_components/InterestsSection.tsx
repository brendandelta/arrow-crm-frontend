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
import { Plus, AlertCircle, ListTodo, CalendarClock } from "lucide-react";
import { FunnelVisualization } from "./FunnelVisualization";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
}

interface TaskInfo {
  id: number;
  subject: string;
  dueAt: string | null;
  overdue: boolean;
}

interface Interest {
  id: number;
  investor: { id: number; name: string; kind: string } | null;
  contact: Person | null;
  decisionMaker: Person | null;
  targetCents: number | null;
  minCents: number | null;
  maxCents: number | null;
  committedCents: number | null;
  allocatedCents: number | null;
  allocatedBlockId: number | null;
  allocatedBlock?: {
    id: number;
    seller: string | null;
    priceCents: number | null;
    status: string;
  } | null;
  status: string;
  source: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  nextTask?: TaskInfo | null;
  tasks?: TaskInfo[];
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  isStale: boolean;
}

interface InterestsSectionProps {
  interests: Interest[];
  dealId: number;
  funnel: {
    prospecting: number;
    contacted: number;
    softCircled: number;
    committed: number;
    allocated: number;
    funded: number;
  };
  onInterestClick?: (interest: Interest) => void;
  onAddInterest?: () => void;
  onInterestsUpdated?: () => void;
}

function formatCurrency(cents: number | null) {
  if (!cents || cents === 0) return "—";
  const dollars = cents / 100;
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

function InterestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    prospecting: "bg-slate-100 text-slate-600",
    contacted: "bg-slate-200 text-slate-700",
    soft_circled: "bg-blue-100 text-blue-700",
    committed: "bg-purple-100 text-purple-700",
    allocated: "bg-indigo-100 text-indigo-700",
    funded: "bg-emerald-100 text-emerald-700",
    declined: "bg-red-100 text-red-600",
    withdrawn: "bg-slate-100 text-slate-500",
  };

  const displayStatus = status.replace(/_/g, " ");

  return (
    <Badge className={styles[status] || styles.prospecting}>
      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
    </Badge>
  );
}

export function InterestsSection({
  interests,
  dealId,
  funnel,
  onInterestClick,
  onAddInterest,
  onInterestsUpdated,
}: InterestsSectionProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [addingFollowUpFor, setAddingFollowUpFor] = useState<number | null>(null);

  const filteredInterests = statusFilter
    ? interests.filter((i) => {
        // Map funnel keys to interest statuses
        const statusMap: Record<string, string[]> = {
          prospecting: ["prospecting"],
          contacted: ["contacted"],
          softCircled: ["soft_circled"],
          committed: ["committed"],
          allocated: ["allocated"],
          funded: ["funded"],
        };
        return statusMap[statusFilter]?.includes(i.status);
      })
    : interests;

  const staleCount = interests.filter((i) => i.isStale).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Investor Interests</h3>
          <Badge variant="secondary">{interests.length}</Badge>
          {staleCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {staleCount} stale
            </span>
          )}
        </div>
        <button
          onClick={onAddInterest}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Interest
        </button>
      </div>

      {/* Funnel */}
      <FunnelVisualization
        funnel={funnel}
        onStageClick={(stage) => setStatusFilter(statusFilter === stage ? null : stage)}
        activeStage={statusFilter}
      />

      {/* Filter indicator */}
      {statusFilter && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtered by:</span>
          <Badge variant="secondary" className="capitalize">
            {statusFilter.replace(/([A-Z])/g, " $1").trim()}
          </Badge>
          <button
            onClick={() => setStatusFilter(null)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {filteredInterests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          {statusFilter ? "No interests in this stage" : "No investor interests yet"}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Investor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterests.map((interest) => (
                <Fragment key={interest.id}>
                <TableRow
                  className={`cursor-pointer hover:bg-slate-50 ${
                    interest.isStale ? "bg-amber-50/50" : ""
                  }`}
                  onClick={() => onInterestClick?.(interest)}
                >
                  <TableCell>
                    {interest.investor ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{interest.investor.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {interest.investor.kind}
                          </div>
                        </div>
                        {interest.isStale && (
                          <span title="Stale - no activity in 7+ days">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {interest.contact ? (
                      <div>
                        <div className="font-medium">
                          {interest.contact.firstName} {interest.contact.lastName}
                        </div>
                        {interest.contact.email && (
                          <div className="text-xs text-muted-foreground">
                            {interest.contact.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(interest.targetCents)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(interest.committedCents)}
                  </TableCell>
                  <TableCell>
                    {interest.allocatedBlock ? (
                      <div className="text-sm">
                        <div className="font-medium">{interest.allocatedBlock.seller || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(interest.allocatedBlock.priceCents)}/sh
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not mapped</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      {interest.nextTask ? (
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm truncate ${interest.nextTask.overdue ? "text-red-600 font-medium" : ""}`}>
                            {interest.nextTask.subject}
                          </div>
                          {interest.nextTask.dueAt && (
                            <div className="text-xs text-muted-foreground">
                              {formatDate(interest.nextTask.dueAt)}
                            </div>
                          )}
                        </div>
                      ) : interest.nextStep ? (
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{interest.nextStep}</div>
                          {interest.nextStepAt && (
                            <div className="text-xs text-muted-foreground">
                              {formatDate(interest.nextStepAt)}
                            </div>
                          )}
                        </div>
                      ) : null}
                      <button
                        onClick={() => setAddingFollowUpFor(addingFollowUpFor === interest.id ? null : interest.id)}
                        className="shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        title="Add follow-up task"
                      >
                        <ListTodo className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <InterestStatusBadge status={interest.status} />
                  </TableCell>
                </TableRow>
                {addingFollowUpFor === interest.id && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <InlineFollowUpForm
                        dealId={dealId}
                        taskableType="Interest"
                        taskableId={interest.id}
                        currentTaskId={interest.nextTask?.id}
                        onCancel={() => setAddingFollowUpFor(null)}
                        onSuccess={() => { setAddingFollowUpFor(null); onInterestsUpdated?.(); }}
                      />
                    </TableCell>
                  </TableRow>
                )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ============ Inline Follow-up Form ============

function InlineFollowUpForm({ dealId, taskableType, taskableId, currentTaskId, onCancel, onSuccess }: {
  dealId: number;
  taskableType: string;
  taskableId: number;
  currentTaskId?: number | null;
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
      // Mark the current follow-up task as complete
      if (currentTaskId) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${currentTaskId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create the new follow-up task
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
