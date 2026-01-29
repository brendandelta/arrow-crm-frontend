"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Briefcase, Target, DollarSign } from "lucide-react";

interface Deal {
  id: number;
  name: string;
  company: string | null;
  groupOwner: string;
}

interface Child {
  id: number;
  name: string;
  type: "target" | "interest";
  dealId: number;
  dealName: string;
}

interface MindMapCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: Deal[];
  children: Child[];
  onSelectDeal: (dealId: number) => void;
  onSelectChild: (childId: number, childType: "target" | "interest", dealId: number) => void;
}

export function MindMapCommandPalette({
  open,
  onOpenChange,
  deals,
  children: allChildren,
  onSelectDeal,
  onSelectChild,
}: MindMapCommandPaletteProps) {
  const [search, setSearch] = useState("");

  // Reset search on open
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const filteredDeals = useMemo(() => {
    if (!search.trim()) return deals.slice(0, 20);
    const q = search.toLowerCase();
    return deals.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.company?.toLowerCase().includes(q)
    );
  }, [deals, search]);

  const filteredTargets = useMemo(() => {
    if (!search.trim()) return allChildren.filter((c) => c.type === "target").slice(0, 10);
    const q = search.toLowerCase();
    return allChildren.filter(
      (c) => c.type === "target" && c.name.toLowerCase().includes(q)
    );
  }, [allChildren, search]);

  const filteredInterests = useMemo(() => {
    if (!search.trim()) return allChildren.filter((c) => c.type === "interest").slice(0, 10);
    const q = search.toLowerCase();
    return allChildren.filter(
      (c) => c.type === "interest" && c.name.toLowerCase().includes(q)
    );
  }, [allChildren, search]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search deals, targets, interests..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {filteredDeals.length > 0 && (
          <CommandGroup heading="Deals">
            {filteredDeals.map((deal) => (
              <CommandItem
                key={`deal-${deal.id}`}
                value={`deal-${deal.name}-${deal.id}`}
                onSelect={() => {
                  onSelectDeal(deal.id);
                  onOpenChange(false);
                }}
              >
                <Briefcase className="h-4 w-4 mr-2 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{deal.name}</span>
                  {deal.company && (
                    <span className="ml-2 text-xs text-muted-foreground">{deal.company}</span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase">
                  {deal.groupOwner}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredTargets.length > 0 && (
          <CommandGroup heading="Targets">
            {filteredTargets.map((child) => (
              <CommandItem
                key={`target-${child.id}`}
                value={`target-${child.name}-${child.id}`}
                onSelect={() => {
                  onSelectChild(child.id, "target", child.dealId);
                  onOpenChange(false);
                }}
              >
                <Target className="h-4 w-4 mr-2 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{child.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{child.dealName}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredInterests.length > 0 && (
          <CommandGroup heading="Interests">
            {filteredInterests.map((child) => (
              <CommandItem
                key={`interest-${child.id}`}
                value={`interest-${child.name}-${child.id}`}
                onSelect={() => {
                  onSelectChild(child.id, "interest", child.dealId);
                  onOpenChange(false);
                }}
              >
                <DollarSign className="h-4 w-4 mr-2 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{child.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{child.dealName}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
