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
import { Plus, LayoutGrid, LayoutList, Flame, ChevronDown, ChevronRight } from "lucide-react";
import { FollowUpCell } from "./FollowUpCell";
import { useTableFiltering } from "./table-filtering/useTableFiltering";
import { FilterableHeader } from "./table-filtering/FilterableHeader";
import { ActiveFiltersBar } from "./table-filtering/ActiveFiltersBar";
import type { ColumnDef } from "./table-filtering/types";

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
    0: "bg-muted text-muted-foreground",
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
  const s = status || "available";
  const styles: Record<string, string> = {
    available: "bg-green-100 text-green-700",
    reserved: "bg-yellow-100 text-yellow-700",
    sold: "bg-purple-100 text-purple-700",
    withdrawn: "bg-muted text-muted-foreground",
  };
  return (
    <Badge className={styles[s] || styles.available}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </Badge>
  );
}

const BLOCK_STATUS_OPTIONS = [
  { value: "available", label: "Available", color: "bg-green-100 text-green-700" },
  { value: "reserved", label: "Reserved", color: "bg-yellow-100 text-yellow-700" },
  { value: "sold", label: "Sold", color: "bg-purple-100 text-purple-700" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-muted text-muted-foreground" },
];

const HEAT_OPTIONS = [
  { value: "0", label: "Cold", color: "bg-muted text-muted-foreground" },
  { value: "1", label: "Warm", color: "bg-yellow-100 text-yellow-700" },
  { value: "2", label: "Hot", color: "bg-orange-100 text-orange-700" },
  { value: "3", label: "Very Hot", color: "bg-red-100 text-red-700" },
];

const BLOCK_COLUMNS: ColumnDef<Block>[] = [
  {
    id: "seller",
    label: "Seller",
    filterType: "text",
    accessor: (row) => row.seller?.name ?? null,
    sortLabels: ["A → Z", "Z → A"],
  },
  {
    id: "contact",
    label: "Contact",
    filterType: "text",
    accessor: (row) =>
      row.contact ? `${row.contact.firstName} ${row.contact.lastName}` : null,
    sortLabels: ["A → Z", "Z → A"],
  },
  {
    id: "shares",
    label: "Shares",
    filterType: "number",
    accessor: (row) => row.shares ?? null,
    align: "right",
    sortLabels: ["Low → High", "High → Low"],
  },
  {
    id: "price",
    label: "Price",
    filterType: "currency",
    accessor: (row) => row.priceCents ?? null,
    align: "right",
    sortLabels: ["Low → High", "High → Low"],
  },
  {
    id: "total",
    label: "Total",
    filterType: "currency",
    accessor: (row) => row.totalCents ?? null,
    align: "right",
    sortLabels: ["Low → High", "High → Low"],
  },
  {
    id: "heat",
    label: "Heat",
    filterType: "enum",
    accessor: (row) => String(row.heat),
    sortAccessor: (row) => row.heat,
    enumOptions: HEAT_OPTIONS,
    sortLabels: ["Cold → Hot", "Hot → Cold"],
  },
  {
    id: "status",
    label: "Status",
    filterType: "enum",
    accessor: (row) => row.status,
    enumOptions: BLOCK_STATUS_OPTIONS,
    sortLabels: ["A → Z", "Z → A"],
  },
  {
    id: "followUp",
    label: "Follow-up",
    filterType: "boolean",
    accessor: (row) => (row.nextTask ? true : false),
    booleanLabels: ["Has task", "No task"],
    sortable: false,
  },
  {
    id: "mapped",
    label: "Mapped",
    filterType: "boolean",
    accessor: (row) => ((row.mappedInterestsCount ?? 0) > 0 ? true : false),
    sortAccessor: (row) => row.mappedInterestsCount ?? 0,
    booleanLabels: ["Has interests", "No interests"],
    align: "right",
    sortLabels: ["Fewest", "Most"],
  },
];

export function BlocksSection({ blocks, dealId, onBlockClick, onAddBlock, onBlocksUpdated }: BlocksSectionProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [expandedBlockId, setExpandedBlockId] = useState<number | null>(null);

  const {
    filteredData,
    activeFilters,
    hasActiveFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    toggleSort,
    setSort,
    getSortDirection,
    getEnumCounts,
  } = useTableFiltering(blocks, BLOCK_COLUMNS);

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
              onClick={() => setViewMode("card")}
              className={`p-1.5 ${viewMode === "card" ? "bg-muted" : "hover:bg-muted"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 ${viewMode === "table" ? "bg-muted" : "hover:bg-muted"}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onAddBlock}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-background bg-foreground hover:bg-foreground/90 rounded-md transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
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
                {BLOCK_COLUMNS.map((col) => (
                  <FilterableHeader
                    key={col.id}
                    column={col}
                    filterValue={activeFilters.find((f) => f.columnId === col.id)?.filterValue}
                    sortDirection={getSortDirection(col.id)}
                    enumCounts={getEnumCounts(col.id)}
                    onFilterChange={setFilter}
                    onSortToggle={toggleSort}
                    onSortSet={setSort}
                  />
                ))}
              </TableRow>
              <ActiveFiltersBar
                filters={activeFilters}
                colSpan={BLOCK_COLUMNS.length + 1}
                onClearFilter={clearFilter}
                onClearAll={clearAllFilters}
              />
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 && hasActiveFilters ? (
                <TableRow>
                  <TableCell colSpan={BLOCK_COLUMNS.length + 1} className="text-center py-8">
                    <div className="text-sm text-muted-foreground">No results match your filters</div>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Clear filters
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
              filteredData.map((block) => (
                <Fragment key={block.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => onBlockClick(block)}
                  >
                    <TableCell>
                      {block.mappedInterests && block.mappedInterests.length > 0 && (
                        <button
                          onClick={(e) => toggleExpand(block.id, e)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {expandedBlockId === block.id ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
                    <TableCell>
                      <FollowUpCell
                        task={block.nextTask}
                        dealId={dealId}
                        taskableType="Block"
                        taskableId={block.id}
                        onUpdated={() => onBlocksUpdated?.()}
                      />
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
                      <TableCell colSpan={10} className="bg-muted p-0">
                        <div className="p-3 pl-10">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Mapped Interests
                          </div>
                          <div className="space-y-1">
                            {block.mappedInterests.map((interest) => (
                              <div
                                key={interest.id}
                                className="flex items-center justify-between p-2 bg-card rounded border text-sm"
                              >
                                <span className="font-medium">{interest.investor || "—"}</span>
                                <div className="flex items-center gap-2">
                                  <span>{formatCurrency(interest.committedCents)}</span>
                                  <Badge className="text-xs bg-muted">
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
                </Fragment>
              ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-2 gap-3">
          {filteredData.map((block) => (
            <div
              key={block.id}
              onClick={() => onBlockClick(block)}
              className="p-4 border rounded-lg cursor-pointer hover:border-border hover:bg-muted transition-colors"
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

              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <BlockStatusBadge status={block.status} />
                  {block.mappedInterestsCount ? (
                    <span className="text-xs text-muted-foreground">
                      {block.mappedInterestsCount} interests mapped
                    </span>
                  ) : null}
                </div>
                <FollowUpCell
                  task={block.nextTask}
                  dealId={dealId}
                  taskableType="Block"
                  taskableId={block.id}
                  onUpdated={() => onBlocksUpdated?.()}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

