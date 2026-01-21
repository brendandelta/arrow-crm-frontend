"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, AlertCircle } from "lucide-react";
import { FunnelVisualization } from "./FunnelVisualization";

interface Interest {
  id: number;
  investor: { id: number; name: string; kind: string } | null;
  contact: { id: number; firstName: string; lastName: string; email?: string } | null;
  targetCents: number | null;
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
  nextStep: string | null;
  nextStepAt: string | null;
  isStale: boolean;
  updatedAt: string;
}

interface InterestsSectionProps {
  interests: Interest[];
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
  funnel,
  onInterestClick,
  onAddInterest,
}: InterestsSectionProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
                <TableHead>Next Step</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterests.map((interest) => (
                <TableRow
                  key={interest.id}
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
                          <AlertCircle className="h-4 w-4 text-amber-500" title="Stale - no activity in 7+ days" />
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
                  <TableCell>
                    {interest.nextStep ? (
                      <div>
                        <div className="text-sm">{interest.nextStep}</div>
                        {interest.nextStepAt && (
                          <div className="text-xs text-muted-foreground">
                            {formatDate(interest.nextStepAt)}
                          </div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <InterestStatusBadge status={interest.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
