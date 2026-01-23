import dagre from "@dagrejs/dagre";
import { type Node, type Edge } from "@xyflow/react";

const NODE_WIDTHS: Record<string, number> = {
  root: 120,
  deal: 170,
  category: 130,
  child: 210,
};

const NODE_HEIGHTS: Record<string, number> = {
  root: 44,
  deal: 38,
  category: 30,
  child: 44,
};

export function computeLayout(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    ranksep: 100,
    nodesep: 16,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    const nodeType = node.type || "child";
    g.setNode(node.id, {
      width: NODE_WIDTHS[nodeType] || 210,
      height: NODE_HEIGHTS[nodeType] || 44,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const nodeType = node.type || "child";
    const width = NODE_WIDTHS[nodeType] || 210;
    const height = NODE_HEIGHTS[nodeType] || 44;

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
