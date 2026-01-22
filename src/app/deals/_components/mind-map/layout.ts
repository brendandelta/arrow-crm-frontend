import dagre from "@dagrejs/dagre";
import { type Node, type Edge } from "@xyflow/react";

const NODE_WIDTHS: Record<string, number> = {
  root: 160,
  deal: 240,
  child: 200,
};

const NODE_HEIGHTS: Record<string, number> = {
  root: 60,
  deal: 110,
  child: 80,
};

export function computeLayout(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    ranksep: 180,
    nodesep: 40,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    const nodeType = node.type || "child";
    g.setNode(node.id, {
      width: NODE_WIDTHS[nodeType] || 200,
      height: NODE_HEIGHTS[nodeType] || 80,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const nodeType = node.type || "child";
    const width = NODE_WIDTHS[nodeType] || 200;
    const height = NODE_HEIGHTS[nodeType] || 80;

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
