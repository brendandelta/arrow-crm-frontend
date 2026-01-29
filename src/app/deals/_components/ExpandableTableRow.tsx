"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Flame, Calendar, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Block {
  id: number;
  seller: { name: string } | null;
  priceCents: number | null;
  totalCents: number | null;
  heat: number;
  heatLabel: string;
  status: string;
}

interface Interest {
  id: number;
  investor: { name: string } | null;
  committedCents: number | null;
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

interface ExpandableRowData {
  topBlocks: Block[];
  topInterests: Interest[];
  nextFollowups: DealTarget[];
  nextTasks: Task[];
}

interface ExpandableTableRowProps {
  isExpanded: boolean;
  onToggle: () => void;
  data: ExpandableRowData | null;
  loading?: boolean;
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

function HeatIndicator({ heat }: { heat: number }) {
  const colors = ["text-muted-foreground", "text-yellow-500", "text-orange-500", "text-red-500"];
  return (
    <div className="flex">
      {Array.from({ length: Math.min(heat + 1, 4) }).map((_, i) => (
        <Flame key={i} className={`h-3 w-3 ${colors[heat] || colors[0]}`} />
      ))}
    </div>
  );
}

export function ExpandableTableRow({
  isExpanded,
  onToggle,
  data,
  loading = false,
}: ExpandableTableRowProps) {
  if (!isExpanded) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-1 hover:bg-muted rounded"
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="col-span-full bg-muted border-t border-b">
      <div className="flex items-start">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-2 hover:bg-muted rounded mt-2 ml-2"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {loading ? (
          <div className="flex-1 p-4 text-center text-muted-foreground">Loading...</div>
        ) : !data ? (
          <div className="flex-1 p-4 text-center text-muted-foreground">No data</div>
        ) : (
          <div className="flex-1 grid grid-cols-4 gap-4 p-4">
            {/* Top Blocks */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Top Blocks
              </h4>
              {data.topBlocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No blocks</p>
              ) : (
                <div className="space-y-2">
                  {data.topBlocks.slice(0, 3).map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-2 bg-card rounded border text-sm"
                    >
                      <div>
                        <div className="font-medium">{block.seller?.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(block.priceCents)}/sh
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(block.totalCents)}</div>
                        <HeatIndicator heat={block.heat} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Interests */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Top Interests
              </h4>
              {data.topInterests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No interests</p>
              ) : (
                <div className="space-y-2">
                  {data.topInterests.slice(0, 5).map((interest) => (
                    <div
                      key={interest.id}
                      className="flex items-center justify-between p-2 bg-card rounded border text-sm"
                    >
                      <div className="font-medium truncate max-w-[120px]">
                        {interest.investor?.name || "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(interest.committedCents)}</span>
                        <Badge
                          className={`text-xs ${
                            interest.status === "committed"
                              ? "bg-green-100 text-green-700"
                              : interest.status === "soft_circled"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {interest.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Follow-ups */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Next Follow-ups
              </h4>
              {data.nextFollowups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No follow-ups scheduled</p>
              ) : (
                <div className="space-y-2">
                  {data.nextFollowups.slice(0, 3).map((target) => (
                    <div
                      key={target.id}
                      className="flex items-center gap-2 p-2 bg-card rounded border text-sm"
                    >
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{target.targetName}</div>
                        {target.nextStep && (
                          <div className="text-xs text-muted-foreground truncate">
                            {target.nextStep}
                          </div>
                        )}
                      </div>
                      {target.nextStepAt && (
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(target.nextStepAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Tasks */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Next Tasks
              </h4>
              {data.nextTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks</p>
              ) : (
                <div className="space-y-2">
                  {data.nextTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-2 p-2 bg-card rounded border text-sm ${
                        task.overdue ? "border-red-200" : ""
                      }`}
                    >
                      <Calendar
                        className={`h-4 w-4 shrink-0 ${
                          task.overdue ? "text-red-500" : "text-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${task.overdue ? "text-red-600" : ""}`}>
                          {task.subject}
                        </div>
                      </div>
                      {task.dueAt && (
                        <div
                          className={`text-xs whitespace-nowrap ${
                            task.overdue ? "text-red-600" : "text-muted-foreground"
                          }`}
                        >
                          {formatDate(task.dueAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Expandable row content for table integration
export function ExpandedRowContent({
  data,
  loading,
}: {
  data: ExpandableRowData | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <tr>
        <td colSpan={10} className="bg-muted p-4 text-center text-muted-foreground">
          Loading details...
        </td>
      </tr>
    );
  }

  if (!data) {
    return (
      <tr>
        <td colSpan={10} className="bg-muted p-4 text-center text-muted-foreground">
          No details available
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={10} className="bg-muted p-0">
        <div className="grid grid-cols-4 gap-4 p-4">
          {/* Reuse the same content structure */}
          <ExpandedSection title="Top Blocks">
            {data.topBlocks.slice(0, 3).map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-2 bg-card rounded border text-sm"
              >
                <div>
                  <div className="font-medium">{block.seller?.name || "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(block.priceCents)}/sh
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(block.totalCents)}</div>
                  <HeatIndicator heat={block.heat} />
                </div>
              </div>
            ))}
          </ExpandedSection>

          <ExpandedSection title="Top Interests">
            {data.topInterests.slice(0, 5).map((interest) => (
              <div
                key={interest.id}
                className="flex items-center justify-between p-2 bg-card rounded border text-sm"
              >
                <div className="font-medium truncate max-w-[120px]">
                  {interest.investor?.name || "—"}
                </div>
                <span className="font-medium">{formatCurrency(interest.committedCents)}</span>
              </div>
            ))}
          </ExpandedSection>

          <ExpandedSection title="Next Follow-ups">
            {data.nextFollowups.slice(0, 3).map((target) => (
              <div key={target.id} className="p-2 bg-card rounded border text-sm">
                <div className="font-medium truncate">{target.targetName}</div>
                {target.nextStepAt && (
                  <div className="text-xs text-muted-foreground">{formatDate(target.nextStepAt)}</div>
                )}
              </div>
            ))}
          </ExpandedSection>

          <ExpandedSection title="Next Tasks">
            {data.nextTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className={`p-2 bg-card rounded border text-sm ${
                  task.overdue ? "border-red-200" : ""
                }`}
              >
                <div className={`font-medium truncate ${task.overdue ? "text-red-600" : ""}`}>
                  {task.subject}
                </div>
                {task.dueAt && (
                  <div className={`text-xs ${task.overdue ? "text-red-600" : "text-muted-foreground"}`}>
                    {formatDate(task.dueAt)}
                  </div>
                )}
              </div>
            ))}
          </ExpandedSection>
        </div>
      </td>
    </tr>
  );
}

function ExpandedSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const childArray = React.Children.toArray(children);

  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h4>
      {childArray.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

