"use client";

import { useState, useCallback } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { CapitalMapCanvas } from "./CapitalMapCanvas";
import { useCapitalMapData } from "./useCapitalMapData";
import { CapitalMapFilterRail } from "./CapitalMapFilterRail";
import { CapitalMapInspector } from "./CapitalMapInspector";
import { CapitalMapCommandPalette } from "./CapitalMapCommandPalette";
import { DEFAULT_FILTERS, type CapitalMapFilters, type SelectedNodeInfo } from "./types";

export function CapitalMapView() {
  // ---- Filter state ----
  const [filters, setFilters] = useState<CapitalMapFilters>({ ...DEFAULT_FILTERS });
  const [railOpen, setRailOpen] = useState(true);

  // ---- Expand/collapse state ----
  const [expandedEntities, setExpandedEntities] = useState<Set<number>>(new Set());
  const [expandedDeals, setExpandedDeals] = useState<Set<number>>(new Set());

  // ---- Selection state ----
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<SelectedNodeInfo>(null);

  // ---- Command palette ----
  const [commandOpen, setCommandOpen] = useState(false);

  // ---- Callbacks ----

  const handleToggleEntity = useCallback((entityId: number) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
  }, []);

  const handleToggleDeal = useCallback((dealId: number) => {
    setExpandedDeals((prev) => {
      const next = new Set(prev);
      // Collapse other deals and toggle this one
      if (next.has(dealId)) {
        next.delete(dealId);
      } else {
        next.clear(); // Only one deal expanded at a time
        next.add(dealId);
      }
      return next;
    });
  }, []);

  const handleSelectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);

    if (!nodeId) {
      setSelectedNodeInfo(null);
      return;
    }

    // Parse node ID to determine type
    if (nodeId.startsWith("holdings-")) {
      const id = parseInt(nodeId.replace("holdings-", ""), 10);
      setSelectedNodeInfo({ type: "entity", id, entityType: "holding_company" });
    } else if (nodeId.startsWith("entity-")) {
      const id = parseInt(nodeId.replace("entity-", ""), 10);
      setSelectedNodeInfo({ type: "entity", id, entityType: "entity" });
    } else if (nodeId.startsWith("deal-")) {
      const id = parseInt(nodeId.replace("deal-", ""), 10);
      setSelectedNodeInfo({ type: "deal", id });
    } else if (nodeId.startsWith("block-")) {
      const id = parseInt(nodeId.replace("block-", ""), 10);
      // We need the deal ID for blocks - extract from expanded deals
      const dealId = Array.from(expandedDeals)[0] || 0;
      setSelectedNodeInfo({ type: "block", id, dealId });
    }
  }, [expandedDeals]);

  // ---- Data ----
  const {
    nodes,
    edges,
    loading,
    error,
    searchableItems,
    allEntityTypes,
    allDealStatuses,
    refetch,
  } = useCapitalMapData({
    expandedEntities,
    expandedDeals,
    filters,
    selectedNodeId,
    onToggleEntity: handleToggleEntity,
    onToggleDeal: handleToggleDeal,
    onSelectNode: handleSelectNode,
  });

  // ---- Command palette handlers ----
  const handleCommandSelect = useCallback(
    (itemId: string, itemType: "entity" | "deal" | "investor") => {
      if (itemType === "entity") {
        const entityId = parseInt(itemId.replace("entity-", ""), 10);
        // Expand path to entity
        // For now, just select it
        handleSelectNode(itemId);
      } else if (itemType === "deal") {
        const dealId = parseInt(itemId.replace("deal-", ""), 10);
        handleSelectNode(itemId);
      }
      setCommandOpen(false);
    },
    [handleSelectNode]
  );

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading capital map...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
      {/* Rail toggle + command palette shortcut hint */}
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => setRailOpen(!railOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          {railOpen ? (
            <PanelLeftClose className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          )}
          {railOpen ? "Hide Filters" : "Show Filters"}
        </button>
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <kbd className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded">
            {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent)
              ? "\u2318"
              : "Ctrl+"}
            K
          </kbd>
          <span>Search</span>
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Left filter rail */}
        {railOpen && (
          <CapitalMapFilterRail
            filters={filters}
            onFiltersChange={setFilters}
            entityTypes={allEntityTypes}
            dealStatuses={allDealStatuses}
          />
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <CapitalMapCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
          />
        </div>
      </div>

      {/* Right inspector */}
      <CapitalMapInspector
        selectedNode={selectedNodeInfo}
        open={selectedNodeInfo !== null}
        onClose={() => {
          setSelectedNodeId(null);
          setSelectedNodeInfo(null);
        }}
      />

      {/* Command palette */}
      <CapitalMapCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        items={searchableItems}
        onSelect={handleCommandSelect}
      />
    </div>
  );
}
