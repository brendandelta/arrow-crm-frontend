import { useState, useEffect, useMemo, useCallback } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { computeLayout } from "./layout";
import type { MindMapResponse, MindMapDeal, MindMapFilters } from "./types";

interface UseMindMapDataOptions {
  expandedBranches: Set<string>;
  filters: MindMapFilters;
}

function dealMatchesFilters(deal: MindMapDeal, groupOwner: string, filters: MindMapFilters): boolean {
  // Bucket filter
  if (filters.bucket !== "all") {
    const ownerLower = groupOwner.toLowerCase();
    if (filters.bucket === "arrow" && ownerLower !== "arrow") return false;
    if (filters.bucket === "liberator" && ownerLower !== "liberator") return false;
  }

  // Stage filter
  if (filters.stages.size > 0 && !filters.stages.has(deal.status)) return false;

  // Owner filter
  if (filters.owner !== "all") {
    const ownerId = deal.owner?.id?.toString();
    if (ownerId !== filters.owner) return false;
  }

  // Risk filter
  if (filters.risk && deal.riskLevel === "ok") return false;

  // Search filter
  if (filters.search.trim()) {
    const query = filters.search.toLowerCase();
    const nameMatch = deal.name.toLowerCase().includes(query);
    const companyMatch = deal.company?.toLowerCase().includes(query);
    const targetMatch = deal.targets.some((t) => t.name.toLowerCase().includes(query));
    const interestMatch = deal.interests.some((i) => i.name.toLowerCase().includes(query));
    if (!nameMatch && !companyMatch && !targetMatch && !interestMatch) return false;
  }

  return true;
}

export function useMindMapData({ expandedBranches, filters }: UseMindMapDataOptions) {
  const [data, setData] = useState<MindMapResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
    const hasActiveFilters =
      filters.bucket !== "all" ||
      filters.stages.size > 0 ||
      filters.owner !== "all" ||
      filters.risk ||
      filters.search.trim() !== "";

    groups.forEach((group) => {
      const rootId = `root-${group.owner}`;

      rawNodes.push({
        id: rootId,
        type: "root",
        position: { x: 0, y: 0 },
        data: { label: group.label.replace(" Deals", "") },
      });

      group.deals.forEach((deal: MindMapDeal) => {
        const dealNodeId = `deal-${deal.id}`;
        const matches = dealMatchesFilters(deal, group.owner, filters);

        // In hide mode, skip non-matching deals entirely
        if (hasActiveFilters && !matches && filters.filterMode === "hide") return;

        const dimStyle = hasActiveFilters && !matches
          ? { opacity: 0.15, filter: "grayscale(0.8)" }
          : undefined;

        rawNodes.push({
          id: dealNodeId,
          type: "deal",
          position: { x: 0, y: 0 },
          data: {
            dealId: deal.id,
            name: deal.name,
            company: deal.company,
            status: deal.status,
            priority: deal.priority,
            riskLevel: deal.riskLevel,
            owner: deal.owner,
            targetCount: deal.targets.length,
            interestCount: deal.interests.length,
            coverageRatio: deal.coverageRatio,
            hasTargets: deal.targets.length > 0 || deal.interests.length > 0,
            onNavigate: () => {},
            onSelect: () => {},
          },
          style: dimStyle,
        });

        rawEdges.push({
          id: `e-${rootId}-${dealNodeId}`,
          source: rootId,
          target: dealNodeId,
          type: "default",
          style: { stroke: "#a5b4fc", strokeWidth: 2, opacity: dimStyle ? 0.15 : 0.6 },
          animated: false,
        });

        const targetsBranchKey = `targets-${deal.id}`;
        const interestsBranchKey = `interests-${deal.id}`;
        const targetsExpanded = expandedBranches.has(targetsBranchKey);
        const interestsExpanded = expandedBranches.has(interestsBranchKey);

        // Targets category node
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
              expanded: targetsExpanded,
              onAdd: () => {},
              onToggle: () => {},
            },
            style: dimStyle,
          });
          rawEdges.push({
            id: `e-${dealNodeId}-${targetsCatId}`,
            source: dealNodeId,
            target: targetsCatId,
            type: "default",
            style: { stroke: "#a5b4fc", strokeWidth: 1.5, opacity: dimStyle ? 0.15 : 0.5 },
          });

          // Only build children if expanded
          if (targetsExpanded) {
            deal.targets.forEach((target) => {
              const targetNodeId = `target-${deal.id}-${target.id}`;
              const nextLabel =
                target.nextAction.kind !== "none"
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
                  status: target.status,
                  isStale: target.isStale,
                  nextStep: target.nextAction.label,
                  nextStepAt: target.nextAction.dueAt,
                  onNavigate: () => {},
                  onSelect: () => {},
                },
                style: dimStyle,
              });
              rawEdges.push({
                id: `e-${targetsCatId}-${targetNodeId}`,
                source: targetsCatId,
                target: targetNodeId,
                type: "default",
                style: { stroke: "#cbd5e1", strokeWidth: 1.5, opacity: dimStyle ? 0.15 : 0.4 },
              });
            });
          }
        }

        // Interests category node
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
              expanded: interestsExpanded,
              onAdd: () => {},
              onToggle: () => {},
            },
            style: dimStyle,
          });
          rawEdges.push({
            id: `e-${dealNodeId}-${interestsCatId}`,
            source: dealNodeId,
            target: interestsCatId,
            type: "default",
            style: { stroke: "#a5b4fc", strokeWidth: 1.5, opacity: dimStyle ? 0.15 : 0.5 },
          });

          // Only build children if expanded
          if (interestsExpanded) {
            deal.interests.forEach((interest) => {
              const interestNodeId = `interest-${deal.id}-${interest.id}`;
              const nextLabel =
                interest.nextAction.kind !== "none"
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
                  status: interest.status,
                  committedCents: interest.committedCents,
                  blockName: interest.blockName,
                  nextStep: interest.nextAction.label,
                  nextStepAt: interest.nextAction.dueAt,
                  onNavigate: () => {},
                  onSelect: () => {},
                },
                style: dimStyle,
              });
              rawEdges.push({
                id: `e-${interestsCatId}-${interestNodeId}`,
                source: interestsCatId,
                target: interestNodeId,
                type: "default",
                style: { stroke: "#cbd5e1", strokeWidth: 1.5, opacity: dimStyle ? 0.15 : 0.4 },
              });
            });
          }
        }
      });
    });

    return computeLayout(rawNodes, rawEdges);
  }, [data, expandedBranches, filters]);

  // Collect all unique owners for filter dropdown
  const allOwners = useMemo(() => {
    if (!data) return [];
    const ownerMap = new Map<string, { id: number; firstName: string; lastName: string }>();
    data.groups.forEach((g) =>
      g.deals.forEach((d) => {
        if (d.owner) ownerMap.set(d.owner.id.toString(), d.owner);
      })
    );
    return Array.from(ownerMap.values());
  }, [data]);

  // Collect all deals for command palette search
  const allDeals = useMemo(() => {
    if (!data) return [];
    const deals: { id: number; name: string; company: string | null; groupOwner: string }[] = [];
    data.groups.forEach((g) =>
      g.deals.forEach((d) => deals.push({ id: d.id, name: d.name, company: d.company, groupOwner: g.owner }))
    );
    return deals;
  }, [data]);

  // Flat list of all targets and interests for command palette
  const allChildren = useMemo(() => {
    if (!data) return [];
    const children: { id: number; name: string; type: "target" | "interest"; dealId: number; dealName: string }[] = [];
    data.groups.forEach((g) =>
      g.deals.forEach((d) => {
        d.targets.forEach((t) => children.push({ id: t.id, name: t.name, type: "target", dealId: d.id, dealName: d.name }));
        d.interests.forEach((i) => children.push({ id: i.id, name: i.name, type: "interest", dealId: d.id, dealName: d.name }));
      })
    );
    return children;
  }, [data]);

  return {
    nodes,
    edges,
    loading,
    allOwners,
    allDeals,
    allChildren,
    refetch: fetchData,
  };
}
