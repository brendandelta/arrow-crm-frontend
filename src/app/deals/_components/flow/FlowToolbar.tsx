"use client";

import { Search, SlidersHorizontal, X, Keyboard, BarChart3, Focus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { FlowFilter, FlowSort, Owner } from "./types";

interface FlowToolbarProps {
  filter: FlowFilter;
  sort: FlowSort;
  onFilterChange: (filter: Partial<FlowFilter>) => void;
  onSortChange: (sort: FlowSort) => void;
  focusMode: boolean;
  onToggleFocus: () => void;
  onOpenCommand: () => void;
  onOpenFunnel: () => void;
  owners: Owner[];
  currentUserId?: number | null;
}

const PRIORITY_OPTIONS = [
  { value: 0, label: "Now" },
  { value: 1, label: "High" },
  { value: 2, label: "Med" },
  { value: 3, label: "Low" },
];

export function FlowToolbar({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  focusMode,
  onToggleFocus,
  onOpenCommand,
  onOpenFunnel,
  owners,
  currentUserId,
}: FlowToolbarProps) {
  const hasFilters =
    filter.search !== "" ||
    filter.owner !== "all" ||
    filter.priority.size > 0 ||
    filter.risk ||
    filter.coverage !== "all" ||
    filter.closeDate !== "all";

  function clearFilters() {
    onFilterChange({
      search: "",
      owner: "all",
      priority: new Set(),
      risk: false,
      coverage: "all",
      closeDate: "all",
    });
  }

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="relative w-56">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search deals..."
          className="w-full pl-8 pr-3 h-8 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
        />
      </div>

      <Separator orientation="vertical" className="h-5" />

      {/* Owner filter */}
      <Select
        value={filter.owner}
        onValueChange={(v) => onFilterChange({ owner: v })}
      >
        <SelectTrigger size="sm" className="h-8 text-xs gap-1.5 min-w-[90px] bg-card">
          <SelectValue placeholder="Owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All owners</SelectItem>
          {currentUserId && <SelectItem value="me">My deals</SelectItem>}
          {owners.map((o) => (
            <SelectItem key={o.id} value={String(o.id)}>
              {o.firstName} {o.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority chips */}
      <div className="flex items-center gap-1">
        {PRIORITY_OPTIONS.map((p) => {
          const isActive = filter.priority.has(p.value);
          return (
            <button
              key={p.value}
              onClick={() => {
                const next = new Set(filter.priority);
                if (isActive) next.delete(p.value);
                else next.add(p.value);
                onFilterChange({ priority: next });
              }}
              className={`h-7 px-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Risk toggle */}
      <button
        onClick={() => onFilterChange({ risk: !filter.risk })}
        className={`h-7 px-2 rounded-md text-xs font-medium transition-colors ${
          filter.risk
            ? "bg-red-600 text-white"
            : "bg-card border border-border text-muted-foreground hover:bg-muted"
        }`}
      >
        At Risk
      </button>

      {/* Coverage filter */}
      <Select
        value={filter.coverage}
        onValueChange={(v) =>
          onFilterChange({ coverage: v as FlowFilter["coverage"] })
        }
      >
        <SelectTrigger size="sm" className="h-8 text-xs gap-1.5 min-w-[100px] bg-card">
          <SelectValue placeholder="Coverage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Coverage: All</SelectItem>
          <SelectItem value="under">Under (&lt;60%)</SelectItem>
          <SelectItem value="covered">Covered (60-100%)</SelectItem>
          <SelectItem value="over">Over (&gt;100%)</SelectItem>
        </SelectContent>
      </Select>

      {/* Close date filter */}
      <Select
        value={filter.closeDate}
        onValueChange={(v) =>
          onFilterChange({ closeDate: v as FlowFilter["closeDate"] })
        }
      >
        <SelectTrigger size="sm" className="h-8 text-xs gap-1.5 min-w-[90px] bg-card">
          <SelectValue placeholder="Close" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Close: All</SelectItem>
          <SelectItem value="7">Next 7 days</SelectItem>
          <SelectItem value="14">Next 14 days</SelectItem>
          <SelectItem value="30">Next 30 days</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}

      <div className="flex-1" />

      {/* Sort */}
      <Select
        value={sort}
        onValueChange={(v) => onSortChange(v as FlowSort)}
      >
        <SelectTrigger size="sm" className="h-8 text-xs gap-1.5 min-w-[100px] bg-card">
          <SlidersHorizontal className="h-3 w-3" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="closeDate">Close Date</SelectItem>
          <SelectItem value="coverage">Coverage</SelectItem>
          <SelectItem value="value">Value</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-5" />

      {/* Focus mode */}
      <button
        onClick={onToggleFocus}
        className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
          focusMode
            ? "bg-foreground text-background"
            : "bg-card border border-border text-muted-foreground hover:bg-muted"
        }`}
        title="Focus mode"
      >
        <Focus className="h-3.5 w-3.5" />
      </button>

      {/* Funnel analytics */}
      <button
        onClick={onOpenFunnel}
        className="h-8 w-8 rounded-md flex items-center justify-center bg-card border border-border text-muted-foreground hover:bg-muted transition-colors"
        title="Funnel analytics"
      >
        <BarChart3 className="h-3.5 w-3.5" />
      </button>

      {/* Command palette */}
      <button
        onClick={onOpenCommand}
        className="h-8 rounded-md flex items-center gap-1.5 px-2.5 bg-card border border-border text-muted-foreground hover:bg-muted transition-colors text-xs"
        title="Command palette (⌘K)"
      >
        <Keyboard className="h-3.5 w-3.5" />
        <kbd className="hidden sm:inline text-[10px] font-mono bg-muted rounded px-1 py-px">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
