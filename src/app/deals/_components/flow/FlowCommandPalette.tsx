"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Search,
  Plus,
  ArrowRight,
  AlertTriangle,
  UserPlus,
  ListTodo,
} from "lucide-react";
import { STATUS_CONFIG, STATUS_ORDER } from "./types";
import { getPriorityConfig } from "../priority";
import type { FlowDeal } from "./types";

interface FlowCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: FlowDeal[];
  onSelectDeal: (deal: FlowDeal) => void;
  onStatusChange: (dealId: number, newStatus: string) => void;
  onCreateDeal: () => void;
  onNavigate: (dealId: number) => void;
}

export function FlowCommandPalette({
  open,
  onOpenChange,
  deals,
  onSelectDeal,
  onStatusChange,
  onCreateDeal,
  onNavigate,
}: FlowCommandPaletteProps) {
  const [query, setQuery] = useState("");

  // Reset query when palette opens
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  // Global keyboard shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  const matchedDeals = useMemo(() => {
    if (!query) return deals.slice(0, 8);
    const q = query.toLowerCase();
    return deals
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.company && d.company.toLowerCase().includes(q)) ||
          (d.sector && d.sector.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [deals, query]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search deals, run actions..."
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Deals */}
        <CommandGroup heading="Deals">
          {matchedDeals.map((deal) => {
            const cfg = STATUS_CONFIG[deal.status] || STATUS_CONFIG.sourcing;
            const priority = getPriorityConfig(deal.priority);
            return (
              <CommandItem
                key={deal.id}
                value={`${deal.name} ${deal.company || ""}`}
                onSelect={() => {
                  onSelectDeal(deal);
                  onOpenChange(false);
                }}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dotColor}`}
                />
                <div className="flex-1 min-w-0">
                  <span className="truncate">{deal.name}</span>
                  {deal.company && (
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      {deal.company}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] rounded px-1 py-px ${priority.color}`}
                >
                  {priority.shortLabel}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onCreateDeal();
              onOpenChange(false);
            }}
          >
            <Plus className="text-muted-foreground" />
            Create new deal
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {/* Stage shortcuts - only show when a deal is typed */}
        {matchedDeals.length === 1 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Move "${matchedDeals[0].name}" to...`}>
              {STATUS_ORDER.filter((s) => s !== matchedDeals[0].status).map(
                (status) => {
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <CommandItem
                      key={status}
                      onSelect={() => {
                        onStatusChange(matchedDeals[0].id, status);
                        onOpenChange(false);
                      }}
                    >
                      <ArrowRight className="text-muted-foreground" />
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`}
                      />
                      {cfg.label}
                    </CommandItem>
                  );
                }
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
