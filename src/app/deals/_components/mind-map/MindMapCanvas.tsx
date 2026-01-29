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
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { Maximize, Minimize, Locate, ChevronRight } from "lucide-react";
import { RootNode } from "./RootNode";
import { DealNode } from "./DealNode";
import { CategoryNode } from "./CategoryNode";
import { ChildNode } from "./ChildNode";

const nodeTypes: NodeTypes = {
  root: RootNode,
  deal: DealNode,
  category: CategoryNode,
  child: ChildNode,
};

interface MindMapCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onAddItem: (dealId: number, type: string) => void;
  onToggleBranch: (dealId: number, categoryType: string) => void;
  onSelectNode: (nodeId: string, nodeType: string, data: Record<string, unknown>) => void;
  selectedNodeId: string | null;
}

function MindMapCanvasInner({
  nodes,
  edges,
  onAddItem,
  onToggleBranch,
  onSelectNode,
  selectedNodeId,
}: MindMapCanvasProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const handleNavigate = useCallback(
    (dealId: number) => {
      router.push(`/deals/${dealId}`);
    },
    [router]
  );

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
    const parentEdge = (nodeId: string) => edges.find((e) => e.target === nodeId);

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
      const label =
        (d.name as string) || (d.label as string) || n.id;
      crumbs.push({ id: n.id, label });
    });

    return crumbs;
  })();

  const handleBreadcrumbClick = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        reactFlowInstance.setCenter(
          node.position.x + 80,
          node.position.y + 20,
          { zoom: 1, duration: 300 }
        );
      }
    },
    [nodes, reactFlowInstance]
  );

  // Inject callbacks into nodes + highlight selected
  const nodesWithCallbacks = nodes.map((node) => {
    let updated = node;

    if (node.type === "deal" || node.type === "child") {
      updated = {
        ...updated,
        data: { ...updated.data, onNavigate: handleNavigate, onSelect: onSelectNode },
      };
    }

    if (node.type === "category") {
      updated = {
        ...updated,
        data: { ...updated.data, onAdd: onAddItem, onToggle: onToggleBranch },
      };
    }

    // Highlight selected node
    if (selectedNodeId && node.id === selectedNodeId) {
      updated = {
        ...updated,
        style: {
          ...updated.style,
          outline: "2px solid #6366f1",
          outlineOffset: "2px",
          borderRadius: "12px",
        },
      };
    }

    return updated;
  });

  return (
    <div ref={containerRef} className="w-full h-full" style={{ background: "#fafbfd" }}>
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        zoomOnScroll={false}
        panOnScroll={true}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "default",
          style: { strokeLinecap: "round", strokeLinejoin: "round" },
        }}
      >
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Panel position="top-left">
            <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 shadow-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
                  <button
                    onClick={() => handleBreadcrumbClick(crumb.id)}
                    className={`text-xs font-medium transition-colors ${
                      i === breadcrumbs.length - 1
                        ? "text-indigo-600"
                        : "text-muted-foreground hover:text-foreground"
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
          className="!border-border !shadow-sm"
        />
        <Panel position="bottom-left" className="!ml-[52px] !mb-[9px]">
          <div className="flex gap-1">
            <button
              onClick={handleFitView}
              className="flex items-center justify-center w-[26px] h-[26px] bg-card border border-border rounded shadow-sm hover:bg-muted transition-colors"
              title="Fit to view"
            >
              <Locate className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-[26px] h-[26px] bg-card border border-border rounded shadow-sm hover:bg-muted transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Maximize className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
        </Panel>
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          maskColor="rgba(248,250,252,0.7)"
          className="!bg-card !border-border !shadow-sm !rounded-lg"
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
export function MindMapCanvas(props: MindMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <MindMapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
