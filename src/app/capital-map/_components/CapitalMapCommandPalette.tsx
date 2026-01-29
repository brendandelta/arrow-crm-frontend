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
import { Building2, Briefcase, Users } from "lucide-react";
import type { CommandPaletteItem } from "./types";

interface CapitalMapCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandPaletteItem[];
  onSelect: (itemId: string, itemType: "entity" | "deal" | "investor") => void;
}

export function CapitalMapCommandPalette({
  open,
  onOpenChange,
  items,
  onSelect,
}: CapitalMapCommandPaletteProps) {
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

  const entities = useMemo(() => {
    const entityItems = items.filter((i) => i.type === "entity");
    if (!search.trim()) return entityItems.slice(0, 15);
    const q = search.toLowerCase();
    return entityItems.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.sublabel?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const deals = useMemo(() => {
    const dealItems = items.filter((i) => i.type === "deal");
    if (!search.trim()) return dealItems.slice(0, 15);
    const q = search.toLowerCase();
    return dealItems.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.sublabel?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const investors = useMemo(() => {
    const investorItems = items.filter((i) => i.type === "investor");
    if (!search.trim()) return investorItems.slice(0, 10);
    const q = search.toLowerCase();
    return investorItems.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.sublabel?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const getIcon = (type: string) => {
    switch (type) {
      case "entity":
        return <Building2 className="h-4 w-4 mr-2 text-slate-400" />;
      case "deal":
        return <Briefcase className="h-4 w-4 mr-2 text-slate-400" />;
      case "investor":
        return <Users className="h-4 w-4 mr-2 text-slate-400" />;
      default:
        return null;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search entities, deals, investors..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {entities.length > 0 && (
          <CommandGroup heading="Entities">
            {entities.map((item) => (
              <CommandItem
                key={item.id}
                value={`entity-${item.label}-${item.id}`}
                onSelect={() => {
                  onSelect(item.id, "entity");
                  onOpenChange(false);
                }}
              >
                {getIcon("entity")}
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{item.label}</span>
                  {item.sublabel && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.sublabel}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {deals.length > 0 && (
          <CommandGroup heading="Deals">
            {deals.map((item) => (
              <CommandItem
                key={item.id}
                value={`deal-${item.label}-${item.id}`}
                onSelect={() => {
                  onSelect(item.id, "deal");
                  onOpenChange(false);
                }}
              >
                {getIcon("deal")}
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{item.label}</span>
                  {item.sublabel && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.sublabel}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {investors.length > 0 && (
          <CommandGroup heading="Investors">
            {investors.map((item) => (
              <CommandItem
                key={item.id}
                value={`investor-${item.label}-${item.id}`}
                onSelect={() => {
                  onSelect(item.id, "investor");
                  onOpenChange(false);
                }}
              >
                {getIcon("investor")}
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{item.label}</span>
                  {item.sublabel && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.sublabel}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
