"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize, Minimize, Locate, ChevronRight } from "lucide-react";
import {
  HoldingsNode,
  MasterSeriesNode,
  SeriesLlcNode,
  DealNode,
  BlockNode,
} from "./nodes";
import { CapitalFlowEdge } from "./edges";

const nodeTypes: NodeTypes = {
  holdings: HoldingsNode,
  master: MasterSeriesNode,
  series: SeriesLlcNode,
  deal: DealNode,
  block: BlockNode,
};

const edgeTypes: EdgeTypes = {
  capitalFlow: CapitalFlowEdge,
};

interface CapitalMapCanvasProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

function CapitalMapCanvasInner({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: CapitalMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.3, duration: 300 });
  }, [reactFlowInstance]);

  // Build breadcrumbs from selected node
  const breadcrumbs = (() => {
    if (!selectedNodeId) return [];
    const crumbs: { id: string; label: string }[] = [];

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    if (!selectedNode) return [];

    // Find parent chain via edges
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const parentEdge = (nodeId: string) =>
      edges.find((e) => e.target === nodeId);

    let current: string | undefined = selectedNodeId;
    const chain: Node[] = [];
    while (current) {
      const n = nodeMap.get(current);
      if (n) chain.unshift(n);
      const pe = parentEdge(current);
      current = pe?.source;
    }

    chain.forEach((n) => {
      const d = n.data as Record<string, unknown>;
      const label = (d.label as string) || n.id;
      crumbs.push({ id: n.id, label });
    });

    return crumbs;
  })();

  const handleBreadcrumbClick = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        // For TB layout, center with appropriate offset
        reactFlowInstance.setCenter(
          node.position.x + 100,
          node.position.y + 35,
          { zoom: 1, duration: 300 }
        );
        onSelectNode(nodeId);
      }
    },
    [nodes, reactFlowInstance, onSelectNode]
  );

  // Handle pane click to deselect
  const handlePaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#fafbfd" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        zoomOnScroll={false}
        panOnScroll={true}
        proOptions={{ hideAttribution: true }}
        onPaneClick={handlePaneClick}
        defaultEdgeOptions={{
          type: "capitalFlow",
          style: { strokeLinecap: "round", strokeLinejoin: "round" },
        }}
      >
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Panel position="top-left">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                  )}
                  <button
                    onClick={() => handleBreadcrumbClick(crumb.id)}
                    className={`text-xs font-medium transition-colors ${
                      i === breadcrumbs.length - 1
                        ? "text-indigo-600"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {crumb.label}
                  </button>
                </span>
              ))}
            </div>
          </Panel>
        )}

        <Controls
          position="bottom-left"
          showInteractive={false}
          showFitView={false}
          className="!border-slate-200 !shadow-sm"
        />
        <Panel position="bottom-left" className="!ml-[52px] !mb-[9px]">
          <div className="flex gap-1">
            <button
              onClick={handleFitView}
              className="flex items-center justify-center w-[26px] h-[26px] bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 transition-colors"
              title="Fit to view"
            >
              <Locate className="h-3.5 w-3.5 text-slate-600" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-[26px] h-[26px] bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-3.5 w-3.5 text-slate-600" />
              ) : (
                <Maximize className="h-3.5 w-3.5 text-slate-600" />
              )}
            </button>
          </div>
        </Panel>
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          maskColor="rgba(248,250,252,0.7)"
          className="!bg-white !border-slate-200 !shadow-sm !rounded-lg"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#e2e8f0"
        />
      </ReactFlow>
    </div>
  );
}

// Wrap in provider for useReactFlow hook
export function CapitalMapCanvas(props: CapitalMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <CapitalMapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
