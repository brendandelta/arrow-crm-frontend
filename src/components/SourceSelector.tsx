"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Plus, X, ChevronDown } from "lucide-react";
import {
  getAllSources,
  addCustomSource,
  SOURCE_CATEGORIES,
  getCategoryConfig,
  resolveSource,
  type Source,
  type SourceCategory,
} from "@/lib/sources";

interface SourceSelectorProps {
  value: string | null;
  onChange: (source: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function SourceSelector({
  value,
  onChange,
  placeholder = "Select source...",
  className = "",
}: SourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceCategory, setNewSourceCategory] = useState<SourceCategory>("other");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allSources = useMemo(() => getAllSources(), []);
  const resolved = value ? resolveSource(value) : null;
  const categoryConfig = resolved ? getCategoryConfig(resolved.category) : null;

  // Group sources by category
  const grouped = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? allSources.filter((s) => s.name.toLowerCase().includes(q))
      : allSources;

    const groups: Record<string, Source[]> = {};
    for (const src of filtered) {
      if (!groups[src.category]) groups[src.category] = [];
      groups[src.category].push(src);
    }
    return groups;
  }, [allSources, searchQuery]);

  const hasResults = Object.keys(grouped).length > 0;
  const exactMatch = allSources.some(
    (s) => s.name.toLowerCase() === searchQuery.toLowerCase().trim()
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreate(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (source: Source) => {
    onChange(source.name);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
  };

  const handleCreate = () => {
    if (!newSourceName.trim()) return;
    const newSource: Source = {
      name: newSourceName.trim(),
      category: newSourceCategory,
    };
    addCustomSource(newSource);
    onChange(newSource.name);
    setNewSourceName("");
    setNewSourceCategory("other");
    setShowCreate(false);
    setIsOpen(false);
  };

  const handleQuickCreate = () => {
    if (!searchQuery.trim()) return;
    setNewSourceName(searchQuery.trim());
    setShowCreate(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 transition-colors text-left"
      >
        {value && categoryConfig ? (
          <span className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${categoryConfig.color}`} />
            <span className="truncate">{resolved?.name ?? value}</span>
          </span>
        ) : (
          <span className="text-slate-400 flex-1">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 hover:bg-slate-200 rounded"
            >
              <X className="h-3 w-3 text-slate-400" />
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[260px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sources..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
              />
            </div>
          </div>

          {/* Create form */}
          {showCreate ? (
            <div className="p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                New Source
              </div>
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="Source name"
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoFocus
              />
              <select
                value={newSourceCategory}
                onChange={(e) => setNewSourceCategory(e.target.value as SourceCategory)}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {SOURCE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newSourceName.trim()}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Grouped list */}
              <div className="max-h-[240px] overflow-y-auto py-1">
                {hasResults ? (
                  SOURCE_CATEGORIES.map((cat) => {
                    const items = grouped[cat.value];
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={cat.value}>
                        <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {cat.label}
                        </div>
                        {items.map((src) => (
                          <button
                            key={src.name}
                            onClick={() => handleSelect(src)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors text-left ${
                              value === src.name ? "bg-blue-50 text-blue-700" : "text-slate-700"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full shrink-0 ${cat.color}`} />
                            <span className="flex-1 truncate">{src.name}</span>
                            {value === src.name && (
                              <span className="text-blue-500 text-xs">Selected</span>
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-400">No sources found</div>
                )}
              </div>

              {/* Create new option */}
              {searchQuery.trim() && !exactMatch && (
                <div className="border-t border-slate-100">
                  <button
                    onClick={handleQuickCreate}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      Create &quot;{searchQuery.trim()}&quot;
                    </span>
                  </button>
                </div>
              )}

              {/* Always show create option at the bottom */}
              {(!searchQuery.trim() || exactMatch) && (
                <div className="border-t border-slate-100">
                  <button
                    onClick={() => {
                      setNewSourceName("");
                      setShowCreate(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create new source</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
