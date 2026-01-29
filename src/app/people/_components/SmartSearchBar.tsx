"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Sparkles, Info, Loader2 } from "lucide-react";
import {
  parseSmartSearch,
  executeSmartSearch,
  SMART_SEARCH_EXAMPLES,
  type SmartSearchQuery,
  type SmartSearchResult,
  type ParsedPerson,
} from "@/lib/smart-search";
import { callLLMSearch, applyLLMFilters } from "@/lib/llm-search";
import type { LLMSearchResponse } from "@/lib/llm-search";

interface SmartSearchBarProps {
  people: ParsedPerson[];
  knownOrgs: string[];
  knownSources: string[];
  onResults: (
    results: SmartSearchResult[] | null,
    query: SmartSearchQuery | null,
    source: "deterministic" | "llm"
  ) => void;
  className?: string;
}

export function SmartSearchBar({
  people,
  knownOrgs,
  knownSources,
  onResults,
  className = "",
}: SmartSearchBarProps) {
  const [query, setQuery] = useState("");
  const [parsed, setParsed] = useState<SmartSearchQuery | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmActive, setLlmActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const llmRequestIdRef = useRef(0);

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % SMART_SEARCH_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentPlaceholder = SMART_SEARCH_EXAMPLES[placeholderIdx];

  // Deterministic search — runs instantly
  const executeDeterministicSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setParsed(null);
        setLlmActive(false);
        setLlmError(null);
        onResults(null, null, "deterministic");
        return;
      }

      const parsedQuery = parseSmartSearch(searchQuery, knownOrgs);
      setParsed(parsedQuery);

      const results = executeSmartSearch(parsedQuery, people);
      onResults(results, parsedQuery, "deterministic");
    },
    [people, knownOrgs, onResults]
  );

  // LLM search — async, replaces deterministic on success
  const executeLLMSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      const requestId = ++llmRequestIdRef.current;
      setIsLoading(true);
      setLlmError(null);

      try {
        const llmResponse: LLMSearchResponse = await callLLMSearch(
          searchQuery,
          knownOrgs,
          knownSources
        );

        // Stale request guard
        if (requestId !== llmRequestIdRef.current) return;

        const llmResults = applyLLMFilters(llmResponse, people);

        // Build a SmartSearchQuery-compatible object for intent display
        const llmParsedQuery: SmartSearchQuery = {
          raw: searchQuery,
          freeText: "",
          intents: llmResponse.intents.map((i) => ({
            type: i.type as "company" | "source" | "owner" | "role" | "warmth" | "time" | "tag" | "name" | "orgKind" | "orgSector" | "dealName" | "dealSector" | "dealStatus",
            value: "",
            label: i.label,
          })),
        };

        setParsed(llmParsedQuery);
        setLlmActive(true);
        onResults(llmResults, llmParsedQuery, "llm");
      } catch (err) {
        // Stale request guard
        if (requestId !== llmRequestIdRef.current) return;

        console.error("LLM search failed:", err);
        setLlmError(err instanceof Error ? err.message : "LLM search failed");
        // Deterministic results remain — no action needed
      } finally {
        if (requestId === llmRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [people, knownOrgs, knownSources, onResults]
  );

  // Debounced search — deterministic first, then LLM
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // 1. Run deterministic search immediately
      executeDeterministicSearch(query);

      // 2. Fire async LLM search (replaces on success)
      if (query.trim()) {
        executeLLMSearch(query);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, executeDeterministicSearch, executeLLMSearch]);

  const handleClear = () => {
    llmRequestIdRef.current++; // Cancel in-flight LLM requests
    setQuery("");
    setParsed(null);
    setLlmActive(false);
    setLlmError(null);
    setIsLoading(false);
    onResults(null, null, "deterministic");
    inputRef.current?.focus();
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div
        className={`relative flex items-center gap-2 bg-white border rounded-lg transition-all ${
          isFocused
            ? "border-indigo-300 ring-2 ring-indigo-100 shadow-sm"
            : "border-slate-200"
        }`}
      >
        <div className="flex items-center gap-1.5 pl-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-indigo-400" />
          )}
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={currentPlaceholder}
          className="flex-1 py-2 pr-3 text-sm bg-transparent focus:outline-none placeholder:text-slate-400"
        />
        {query && (
          <button
            onClick={handleClear}
            className="pr-3 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Intent chips */}
      {parsed && parsed.intents.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
            Understood:
          </span>
          {llmActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              AI
            </span>
          )}
          {parsed.intents.map((intent, i) => (
            <span
              key={`${intent.type}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
            >
              {intent.label}
            </span>
          ))}
          {llmError && (
            <span className="text-[10px] text-amber-500 ml-1" title={llmError}>
              (AI unavailable)
            </span>
          )}
        </div>
      )}

      {/* Quick filter chips when empty and focused */}
      {!query && isFocused && (
        <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-2">
            Try searching for
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SMART_SEARCH_EXAMPLES.slice(0, 6).map((example) => (
              <button
                key={example}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleExampleClick(example);
                }}
                className="px-2.5 py-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-full hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Explainability Tooltip ────────────────────────────

interface ExplainTooltipProps {
  explanations: string[];
}

export function ExplainTooltip({ explanations }: ExplainTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (explanations.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-0.5 rounded hover:bg-indigo-50 transition-colors"
        title="Why this result?"
      >
        <Info className="h-3.5 w-3.5 text-indigo-400" />
      </button>
      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 w-56 bg-slate-900 text-white text-xs rounded-lg shadow-xl p-2.5">
          <div className="font-medium text-slate-300 mb-1">Why this result</div>
          <ul className="space-y-0.5">
            {explanations.map((exp, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}
