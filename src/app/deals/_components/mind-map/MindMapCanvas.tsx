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
import { ChildNode } from "./ChildNode";

const nodeTypes: NodeTypes = {
  root: RootNode,
  deal: DealNode,
  child: ChildNode,
};

interface MindMapCanvasProps {
  nodes: Node[];
  edges: Edge[];
  highlightedNodeIds: Set<string> | null;
  onToggleExpand: (dealId: number) => void;
}

export function MindMapCanvas({
  nodes,
  edges,
  highlightedNodeIds,
  onToggleExpand,
}: MindMapCanvasProps) {
  const router = useRouter();

  const handleNavigate = useCallback(
    (dealId: number) => {
      router.push(`/deals/${dealId}`);
    },
    [router]
  );

  // Inject callbacks into node data
  const nodesWithCallbacks = nodes.map((node) => {
    if (node.type === "deal") {
      return {
        ...node,
        data: {
          ...node.data,
          onToggleExpand,
          onNavigate: handleNavigate,
        },
        style: highlightedNodeIds
          ? highlightedNodeIds.has(node.id)
            ? { opacity: 1, boxShadow: "0 0 0 2px #3b82f6", borderRadius: "8px" }
            : { opacity: 0.3 }
          : undefined,
      };
    }
    if (node.type === "child") {
      return {
        ...node,
        data: {
          ...node.data,
          onNavigate: handleNavigate,
        },
        style: highlightedNodeIds
          ? highlightedNodeIds.has(node.id)
            ? { opacity: 1, boxShadow: "0 0 0 2px #3b82f6", borderRadius: "8px" }
            : { opacity: 0.3 }
          : undefined,
      };
    }
    return {
      ...node,
      style: highlightedNodeIds
        ? highlightedNodeIds.has(node.id)
          ? { opacity: 1 }
          : { opacity: 0.3 }
        : undefined,
    };
  });

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeStrokeWidth={3}
          pannable
          zoomable
          className="!bg-slate-50 !border-slate-200"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
      </ReactFlow>
    </div>
  );
}
