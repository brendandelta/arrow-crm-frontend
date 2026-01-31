"use client";

import { ChevronRight, ChevronDown, Flame, Calendar, Users } from "lucide-react";

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
  const colors = ["text-slate-400", "text-yellow-500", "text-orange-500", "text-red-500"];
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
        className="p-1 hover:bg-slate-100 rounded"
      >
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="col-span-full bg-slate-50 border-t border-b">
      <div className="flex items-start">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-2 hover:bg-slate-100 rounded mt-2 ml-2"
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
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
                      className="flex items-center justify-between p-2 bg-white rounded border text-sm"
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
                      className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                    >
                      <div className="font-medium truncate max-w-[120px]">
                        {interest.investor?.name || "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(interest.committedCents)}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            interest.status === "committed"
                              ? "bg-green-100 text-green-700"
                              : interest.status === "soft_circled"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {interest.status.replace("_", " ")}
                        </span>
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
                      className="flex items-center gap-2 p-2 bg-white rounded border text-sm"
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
                      className={`flex items-center gap-2 p-2 bg-white rounded border text-sm ${
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
        <td colSpan={12} className="bg-slate-50/50 border-t border-slate-100">
          <div className="px-4 py-3 text-xs text-slate-400">Loading...</div>
        </td>
      </tr>
    );
  }

  if (!data) {
    return (
      <tr>
        <td colSpan={12} className="bg-slate-50/50 border-t border-slate-100">
          <div className="px-4 py-3 text-xs text-slate-400">No details available</div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={12} className="bg-slate-50/50 border-t border-slate-100 p-0">
        <div className="flex gap-3 p-3">
          {/* Top Blocks */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Blocks
            </h4>
            {data.topBlocks.length === 0 ? (
              <p className="text-xs text-slate-400">None</p>
            ) : (
              <div className="space-y-1">
                {data.topBlocks.slice(0, 3).map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-white rounded border border-slate-200 text-xs"
                  >
                    <span className="font-medium truncate">{block.seller?.name || "—"}</span>
                    <span className="font-medium tabular-nums text-slate-600 ml-2">
                      {formatCurrency(block.totalCents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Interests */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Interests
            </h4>
            {data.topInterests.length === 0 ? (
              <p className="text-xs text-slate-400">None</p>
            ) : (
              <div className="space-y-1">
                {data.topInterests.slice(0, 3).map((interest) => (
                  <div
                    key={interest.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-white rounded border border-slate-200 text-xs"
                  >
                    <span className="font-medium truncate">{interest.investor?.name || "—"}</span>
                    <span className="font-medium tabular-nums text-slate-600 ml-2">
                      {formatCurrency(interest.committedCents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Follow-ups */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Follow-ups
            </h4>
            {data.nextFollowups.length === 0 ? (
              <p className="text-xs text-slate-400">None</p>
            ) : (
              <div className="space-y-1">
                {data.nextFollowups.slice(0, 3).map((target) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-white rounded border border-slate-200 text-xs"
                  >
                    <span className="font-medium truncate">{target.targetName}</span>
                    {target.nextStepAt && (
                      <span className="text-slate-400 ml-2 shrink-0">{formatDate(target.nextStepAt)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Tasks */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Tasks
            </h4>
            {data.nextTasks.length === 0 ? (
              <p className="text-xs text-slate-400">None</p>
            ) : (
              <div className="space-y-1">
                {data.nextTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between px-2 py-1.5 bg-white rounded border text-xs ${
                      task.overdue ? "border-red-200" : "border-slate-200"
                    }`}
                  >
                    <span className={`font-medium truncate ${task.overdue ? "text-red-600" : ""}`}>
                      {task.subject}
                    </span>
                    {task.dueAt && (
                      <span className={`ml-2 shrink-0 ${task.overdue ? "text-red-500" : "text-slate-400"}`}>
                        {formatDate(task.dueAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

