"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EnumOption {
  value: string;
  label: string;
  color?: string;
}

interface EnumFilterProps {
  options: EnumOption[];
  selected: Set<string>;
  counts: Map<string, number>;
  onChange: (selected: Set<string>) => void;
}

export function EnumFilter({ options, selected, counts, onChange }: EnumFilterProps) {
  const [search, setSearch] = useState("");
  const showSearch = options.length >= 5;

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const allSelected = options.every((o) => selected.has(o.value));
  const noneSelected = selected.size === 0;

  const toggleAll = () => {
    if (allSelected || noneSelected) {
      onChange(new Set(options.map((o) => o.value)));
    } else {
      onChange(new Set());
    }
  };

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full text-[12px] pl-8 pr-3 py-1.5 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-muted-foreground/60"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <button
        onClick={toggleAll}
        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {allSelected ? "Clear all" : "Select all"}
      </button>

      <div className="max-h-[200px] overflow-y-auto space-y-0.5">
        {filtered.map((option) => {
          const isChecked = selected.has(option.value);
          const count = counts.get(option.value) ?? 0;
          return (
            <label
              key={option.value}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-muted ${
                isChecked ? "bg-blue-50/50" : ""
              }`}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(option.value)}
                className="h-3.5 w-3.5 rounded border-border text-blue-600 focus:ring-blue-500/20"
              />
              <Badge
                className={`text-[11px] ${option.color || "bg-muted text-muted-foreground"}`}
              >
                {option.label}
              </Badge>
              <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                {count}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
