import dagre from "@dagrejs/dagre";
import { type Node, type Edge } from "@xyflow/react";

// Node dimensions for each type
const NODE_WIDTHS: Record<string, number> = {
  holdings: 220,
  master: 190,
  series: 170,
  deal: 180,
  block: 160,
};

const NODE_HEIGHTS: Record<string, number> = {
  holdings: 70,
  master: 55,
  series: 50,
  deal: 60,
  block: 50,
};

export function computeCapitalMapLayout(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB", // Top-to-bottom layout for capital flow
    ranksep: 90, // Vertical spacing between ranks
    nodesep: 30, // Horizontal spacing between nodes
    marginx: 60,
    marginy: 60,
  });

  nodes.forEach((node) => {
    const nodeType = node.type || "series";
    g.setNode(node.id, {
      width: NODE_WIDTHS[nodeType] || 170,
      height: NODE_HEIGHTS[nodeType] || 50,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const nodeType = node.type || "series";
    const width = NODE_WIDTHS[nodeType] || 170;
    const height = NODE_HEIGHTS[nodeType] || 50;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Get node dimensions for external use
export function getNodeDimensions(nodeType: string): {
  width: number;
  height: number;
} {
  return {
    width: NODE_WIDTHS[nodeType] || 170,
    height: NODE_HEIGHTS[nodeType] || 50,
  };
}
