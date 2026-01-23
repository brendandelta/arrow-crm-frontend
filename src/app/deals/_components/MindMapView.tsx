"use client";

import { Search } from "lucide-react";
import { MindMapCanvas } from "./mind-map/MindMapCanvas";
import { useMindMapData } from "./mind-map/useMindMapData";

export function MindMapView() {
  const {
    nodes,
    edges,
    loading,
    searchQuery,
    setSearchQuery,
    highlightedNodeIds,
  } = useMindMapData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-slate-400">
        Loading mind map...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      {/* Search */}
      <div className="mb-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals or targets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-shadow shadow-sm"
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <MindMapCanvas
          nodes={nodes}
          edges={edges}
          highlightedNodeIds={highlightedNodeIds}
        />
      </div>
    </div>
  );
}
