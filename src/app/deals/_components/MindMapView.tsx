"use client";

import { Search, X } from "lucide-react";
import { MindMapCanvas } from "./mind-map/MindMapCanvas";
import { useMindMapData } from "./mind-map/useMindMapData";

export function MindMapView() {
  const {
    nodes,
    edges,
    loading,
    searchQuery,
    setSearchQuery,
    toggleExpand,
    focusDealId,
    setFocus,
    highlightedNodeIds,
  } = useMindMapData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        Loading mind map...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Focus mode exit */}
        {focusDealId && (
          <button
            onClick={() => setFocus(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100"
          >
            <X className="h-3.5 w-3.5" />
            Exit focus
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 rounded-lg border border-slate-200 overflow-hidden bg-white">
        <MindMapCanvas
          nodes={nodes}
          edges={edges}
          highlightedNodeIds={highlightedNodeIds}
          onToggleExpand={toggleExpand}
        />
      </div>
    </div>
  );
}
