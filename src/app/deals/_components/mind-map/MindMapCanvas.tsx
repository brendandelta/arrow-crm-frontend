"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type NodeTypes,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
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
  highlightedNodeIds: Set<string> | null;
}

export function MindMapCanvas({
  nodes,
  edges,
  highlightedNodeIds,
}: MindMapCanvasProps) {
  const router = useRouter();

  const handleNavigate = useCallback(
    (dealId: number) => {
      router.push(`/deals/${dealId}`);
    },
    [router]
  );

  // Inject navigate callback and apply search highlighting
  const nodesWithCallbacks = nodes.map((node) => {
    const withNav =
      node.type === "deal" || node.type === "child"
        ? { ...node, data: { ...node.data, onNavigate: handleNavigate } }
        : node;

    if (highlightedNodeIds) {
      return {
        ...withNav,
        style: highlightedNodeIds.has(node.id)
          ? { opacity: 1, filter: "none" }
          : { opacity: 0.2, filter: "grayscale(1)" },
      };
    }

    return withNav;
  });

  return (
    <div className="w-full h-full" style={{ background: "#fafbfd" }}>
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        zoomOnScroll={false}
        panOnScroll={false}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "default",
          style: { strokeLinecap: "round", strokeLinejoin: "round" },
        }}
      >
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!border-slate-200 !shadow-sm"
        />
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
