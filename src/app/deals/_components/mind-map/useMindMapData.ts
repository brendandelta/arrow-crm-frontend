import { useState, useEffect, useMemo, useCallback } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { computeLayout } from "./layout";
import type { MindMapResponse, MindMapDeal } from "./types";

export function useMindMapData() {
  const [data, setData] = useState<MindMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/mind_map`)
      .then((res) => res.json())
      .then((d) => {
        setData(d && d.groups ? d : { groups: [] });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch mind map data:", err);
        setData({ groups: [] });
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];
    const groups = data.groups || [];

    groups.forEach((group) => {
      const rootId = `root-${group.owner}`;

      // Root node ("Arrow" or "Liberator")
      rawNodes.push({
        id: rootId,
        type: "root",
        position: { x: 0, y: 0 },
        data: { label: group.label.replace(" Deals", "") },
      });

      group.deals.forEach((deal: MindMapDeal) => {
        const dealNodeId = `deal-${deal.id}`;

        // Deal node (just the name)
        rawNodes.push({
          id: dealNodeId,
          type: "deal",
          position: { x: 0, y: 0 },
          data: {
            dealId: deal.id,
            name: deal.name,
            hasTargets: deal.targets.length > 0 || deal.interests.length > 0,
            onNavigate: () => {},
          },
        });

        // Edge: root -> deal
        rawEdges.push({
          id: `e-${rootId}-${dealNodeId}`,
          source: rootId,
          target: dealNodeId,
          type: "default",
          style: { stroke: "#a5b4fc", strokeWidth: 2, opacity: 0.6 },
          animated: false,
        });

        // "Targets" category node (always shown so users can add)
        {
          const targetsCatId = `cat-targets-${deal.id}`;
          rawNodes.push({
            id: targetsCatId,
            type: "category",
            position: { x: 0, y: 0 },
            data: {
              label: "Targets",
              count: deal.targets.length,
              dealId: deal.id,
              categoryType: "targets",
              onAdd: () => {},
            },
          });
          rawEdges.push({
            id: `e-${dealNodeId}-${targetsCatId}`,
            source: dealNodeId,
            target: targetsCatId,
            type: "default",
            style: { stroke: "#a5b4fc", strokeWidth: 1.5, opacity: 0.5 },
          });

          deal.targets.forEach((target) => {
            const targetNodeId = `target-${deal.id}-${target.id}`;
            const nextLabel = target.nextAction.kind !== "none"
              ? target.nextAction.label
              : "No follow-up set";

            rawNodes.push({
              id: targetNodeId,
              type: "child",
              position: { x: 0, y: 0 },
              data: {
                name: target.name,
                nextAction: nextLabel,
                isOverdue: target.nextAction.isOverdue,
                dealId: deal.id,
                itemId: target.id,
                itemType: "target" as const,
                nextStep: target.nextAction.label,
                nextStepAt: target.nextAction.dueAt,
                onNavigate: () => {},
                onEditFollowUp: () => {},
              },
            });
            rawEdges.push({
              id: `e-${targetsCatId}-${targetNodeId}`,
              source: targetsCatId,
              target: targetNodeId,
              type: "default",
              style: { stroke: "#cbd5e1", strokeWidth: 1.5, opacity: 0.4 },
            });
          });
        }

        // "Interests" category node (always shown so users can add)
        {
          const interestsCatId = `cat-interests-${deal.id}`;
          rawNodes.push({
            id: interestsCatId,
            type: "category",
            position: { x: 0, y: 0 },
            data: {
              label: "Interests",
              count: deal.interests.length,
              dealId: deal.id,
              categoryType: "interests",
              onAdd: () => {},
            },
          });
          rawEdges.push({
            id: `e-${dealNodeId}-${interestsCatId}`,
            source: dealNodeId,
            target: interestsCatId,
            type: "default",
            style: { stroke: "#a5b4fc", strokeWidth: 1.5, opacity: 0.5 },
          });

          deal.interests.forEach((interest) => {
            const interestNodeId = `interest-${deal.id}-${interest.id}`;
            const nextLabel = interest.nextAction.kind !== "none"
              ? interest.nextAction.label
              : "No follow-up set";

            rawNodes.push({
              id: interestNodeId,
              type: "child",
              position: { x: 0, y: 0 },
              data: {
                name: interest.name,
                nextAction: nextLabel,
                isOverdue: interest.nextAction.isOverdue,
                dealId: deal.id,
                itemId: interest.id,
                itemType: "interest" as const,
                nextStep: interest.nextAction.label,
                nextStepAt: interest.nextAction.dueAt,
                onNavigate: () => {},
                onEditFollowUp: () => {},
              },
            });
            rawEdges.push({
              id: `e-${interestsCatId}-${interestNodeId}`,
              source: interestsCatId,
              target: interestNodeId,
              type: "default",
              style: { stroke: "#cbd5e1", strokeWidth: 1.5, opacity: 0.4 },
            });
          });
        }
      });
    });

    return computeLayout(rawNodes, rawEdges);
  }, [data]);

  // Search highlighting
  const highlightedNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return new Set(
      nodes
        .filter((n) => {
          const d = n.data as Record<string, unknown>;
          const name = (d.name as string) || (d.label as string) || "";
          return name.toLowerCase().includes(query);
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
    highlightedNodeIds,
    refetch: fetchData,
  };
}
