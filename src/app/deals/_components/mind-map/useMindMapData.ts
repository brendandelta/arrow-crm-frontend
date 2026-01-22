import { useState, useEffect, useMemo, useCallback } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { computeLayout } from "./layout";
import type { MindMapResponse, MindMapDeal } from "./types";

export function useMindMapData() {
  const [data, setData] = useState<MindMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDeals, setExpandedDeals] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [focusDealId, setFocusDealId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/mind_map`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch mind map data:", err);
        setLoading(false);
      });
  }, []);

  const toggleExpand = useCallback((dealId: number) => {
    setExpandedDeals((prev) => {
      const next = new Set(prev);
      if (next.has(dealId)) {
        next.delete(dealId);
      } else {
        next.add(dealId);
      }
      return next;
    });
  }, []);

  const setFocus = useCallback((dealId: number | null) => {
    setFocusDealId(dealId);
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];

    const groups = data.groups;

    // Filter for focus mode
    const filteredGroups = focusDealId
      ? groups.map((g) => ({
          ...g,
          deals: g.deals.filter((d) => d.id === focusDealId),
        })).filter((g) => g.deals.length > 0)
      : groups;

    filteredGroups.forEach((group) => {
      const rootId = `root-${group.owner}`;

      // Root node
      rawNodes.push({
        id: rootId,
        type: "root",
        position: { x: 0, y: 0 },
        data: {
          label: group.label,
          dealCount: group.deals.length,
        },
      });

      group.deals.forEach((deal: MindMapDeal) => {
        const dealNodeId = `deal-${deal.id}`;
        const isExpanded = expandedDeals.has(deal.id);

        // Deal node
        rawNodes.push({
          id: dealNodeId,
          type: "deal",
          position: { x: 0, y: 0 },
          data: {
            dealId: deal.id,
            name: deal.name,
            company: deal.company,
            status: deal.status,
            riskLevel: deal.riskLevel,
            nextAction: deal.nextAction,
            expanded: isExpanded,
            onToggleExpand: toggleExpand,
            onNavigate: () => {},
          },
        });

        // Edge: root -> deal
        rawEdges.push({
          id: `e-${rootId}-${dealNodeId}`,
          source: rootId,
          target: dealNodeId,
          type: "smoothstep",
          style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        });

        // Children (only if expanded)
        if (isExpanded) {
          const children = [
            ...deal.blocks.map((b) => ({ ...b, childType: "block" as const })),
            ...deal.interests.map((i) => ({ ...i, childType: "interest" as const })),
            ...deal.targets.map((t) => ({ ...t, childType: "target" as const })),
          ];

          children.forEach((child) => {
            const childNodeId = `${child.childType}-${child.id}`;

            rawNodes.push({
              id: childNodeId,
              type: "child",
              position: { x: 0, y: 0 },
              data: {
                childId: child.id,
                name: child.name,
                childType: child.childType,
                status: child.status,
                nextAction: child.nextAction,
                dealId: deal.id,
                onNavigate: () => {},
                // Block-specific
                ...("sizeCents" in child ? { sizeCents: child.sizeCents, priceCents: child.priceCents, constraints: child.constraints } : {}),
                // Interest-specific
                ...("committedCents" in child ? { committedCents: child.committedCents, blockName: child.blockName } : {}),
                // Target-specific
                ...("lastActivityAt" in child ? { lastActivityAt: child.lastActivityAt, isStale: child.isStale } : {}),
              },
            });

            rawEdges.push({
              id: `e-${dealNodeId}-${childNodeId}`,
              source: dealNodeId,
              target: childNodeId,
              type: "smoothstep",
              style: { stroke: "#cbd5e1", strokeWidth: 1 },
            });
          });
        }
      });
    });

    return computeLayout(rawNodes, rawEdges);
  }, [data, expandedDeals, focusDealId, toggleExpand]);

  // Compute search-highlighted node IDs
  const highlightedNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return new Set(
      nodes
        .filter((n) => {
          const d = n.data as Record<string, unknown>;
          const name = (d.name as string) || (d.label as string) || "";
          const company = (d.company as string) || "";
          return name.toLowerCase().includes(query) || company.toLowerCase().includes(query);
        })
        .map((n) => n.id)
    );
  }, [nodes, searchQuery]);

  return {
    nodes,
    edges,
    loading,
    searchQuery,
    setSearchQuery,
    toggleExpand,
    focusDealId,
    setFocus,
    highlightedNodeIds,
  };
}
