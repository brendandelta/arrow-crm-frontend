import { useState, useEffect, useMemo, useCallback } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { computeCapitalMapLayout } from "./layout";
import { fetchCapitalMap } from "@/lib/capital-map-api";
import type {
  CapitalMapEntity,
  CapitalMapDeal,
  CapitalMapBlock,
  CapitalMapResponse,
  CapitalMapFilters,
  CapitalMapNode,
  CapitalFlowEdge,
  HoldingsNodeData,
  MasterSeriesNodeData,
  SeriesLlcNodeData,
  DealNodeData,
  BlockNodeData,
  CommandPaletteItem,
} from "./types";

interface UseCapitalMapDataOptions {
  expandedEntities: Set<number>;
  expandedDeals: Set<number>;
  filters: CapitalMapFilters;
  selectedNodeId: string | null;
  onToggleEntity: (entityId: number) => void;
  onToggleDeal: (dealId: number) => void;
  onSelectNode: (nodeId: string | null) => void;
}

// Check if an entity/deal matches the current filters
function entityMatchesFilters(
  entity: CapitalMapEntity,
  filters: CapitalMapFilters
): boolean {
  // Search filter
  if (filters.search.trim()) {
    const query = filters.search.toLowerCase();
    const nameMatch = entity.displayName.toLowerCase().includes(query);
    const dealsMatch = entity.linkedDeals.some(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.company?.toLowerCase().includes(query)
    );
    const childMatch = entity.childEntities.some((c) =>
      entityMatchesFilters(c, filters)
    );
    if (!nameMatch && !dealsMatch && !childMatch) return false;
  }

  // Entity type filter
  if (filters.entityTypes.size > 0 && !filters.entityTypes.has(entity.entityType)) {
    // But still show if any child matches
    const childMatches = entity.childEntities.some((c) =>
      entityMatchesFilters(c, filters)
    );
    if (!childMatches) return false;
  }

  // Show inactive filter
  if (!filters.showInactive && entity.status === "inactive") {
    return false;
  }

  // Capital threshold
  if (
    filters.minCapitalCents !== null &&
    entity.capitalMetrics.committedCents < filters.minCapitalCents
  ) {
    return false;
  }

  return true;
}

function dealMatchesFilters(
  deal: CapitalMapDeal,
  filters: CapitalMapFilters
): boolean {
  // Search filter
  if (filters.search.trim()) {
    const query = filters.search.toLowerCase();
    const nameMatch = deal.name.toLowerCase().includes(query);
    const companyMatch = deal.company?.toLowerCase().includes(query);
    const investorMatch = deal.blocks.some((b) =>
      b.interests.some((i) => i.investorName.toLowerCase().includes(query))
    );
    if (!nameMatch && !companyMatch && !investorMatch) return false;
  }

  // Deal status filter
  if (filters.dealStatuses.size > 0 && !filters.dealStatuses.has(deal.status)) {
    return false;
  }

  // Capital threshold
  if (
    filters.minCapitalCents !== null &&
    deal.committedCents < filters.minCapitalCents
  ) {
    return false;
  }

  return true;
}

export function useCapitalMapData({
  expandedEntities,
  expandedDeals,
  filters,
  selectedNodeId,
  onToggleEntity,
  onToggleDeal,
  onSelectNode,
}: UseCapitalMapDataOptions) {
  const [data, setData] = useState<CapitalMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCapitalMap()
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch capital map data:", err);
        setError(err.message || "Failed to load capital map");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build nodes and edges from hierarchical data
  const { nodes, edges, maxCapitalCents } = useMemo(() => {
    if (!data?.root) return { nodes: [], edges: [], maxCapitalCents: 0 };

    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];
    let maxCap = 0;

    const hasActiveFilters =
      filters.search.trim() !== "" ||
      filters.entityTypes.size > 0 ||
      filters.dealStatuses.size > 0 ||
      !filters.showInactive ||
      filters.minCapitalCents !== null;

    // Process root (Holdings) node
    const root = data.root;
    const rootId = `holdings-${root.id}`;
    const rootIsExpanded = expandedEntities.has(root.id);
    const rootMatches = entityMatchesFilters(root, filters);

    const rootData: HoldingsNodeData = {
      label: root.displayName,
      entityId: root.id,
      isExpanded: rootIsExpanded,
      isSelected: selectedNodeId === rootId,
      isDimmed: hasActiveFilters && !rootMatches && filters.filterMode === "dim",
      capitalMetrics: root.capitalMetrics,
      childCount: root.childEntities.length,
      onToggle: () => onToggleEntity(root.id),
      onSelect: () => onSelectNode(rootId),
    };

    rawNodes.push({
      id: rootId,
      type: "holdings",
      position: { x: 0, y: 0 },
      data: rootData,
    });

    maxCap = Math.max(maxCap, root.capitalMetrics.committedCents);

    // Process child entities recursively (only if root is expanded)
    function processEntity(
      entity: CapitalMapEntity,
      parentNodeId: string,
      depth: number
    ) {
      const isSeriesLlc = entity.isSeriesLlc || entity.entityType === "series_llc";
      const nodeType = isSeriesLlc ? "series" : "master";
      const nodeId = `entity-${entity.id}`;
      const isExpanded = expandedEntities.has(entity.id);
      const matches = entityMatchesFilters(entity, filters);

      // In hide mode, skip non-matching entities
      if (hasActiveFilters && !matches && filters.filterMode === "hide") {
        return;
      }

      const isDimmed =
        hasActiveFilters && !matches && filters.filterMode === "dim";

      if (isSeriesLlc) {
        const nodeData: SeriesLlcNodeData = {
          label: entity.displayName,
          entityId: entity.id,
          entityType: entity.entityType,
          isExpanded,
          isSelected: selectedNodeId === nodeId,
          isDimmed,
          capitalMetrics: entity.capitalMetrics,
          dealCount: entity.linkedDeals.length,
          status: entity.status,
          onToggle: () => onToggleEntity(entity.id),
          onSelect: () => onSelectNode(nodeId),
        };

        rawNodes.push({
          id: nodeId,
          type: "series",
          position: { x: 0, y: 0 },
          data: nodeData,
        });
      } else {
        const nodeData: MasterSeriesNodeData = {
          label: entity.displayName,
          entityId: entity.id,
          entityType: entity.entityType,
          isExpanded,
          isSelected: selectedNodeId === nodeId,
          isDimmed,
          capitalMetrics: entity.capitalMetrics,
          childCount: entity.childEntities.length,
          status: entity.status,
          onToggle: () => onToggleEntity(entity.id),
          onSelect: () => onSelectNode(nodeId),
        };

        rawNodes.push({
          id: nodeId,
          type: "master",
          position: { x: 0, y: 0 },
          data: nodeData,
        });
      }

      // Add edge from parent
      rawEdges.push({
        id: `edge-${parentNodeId}-${nodeId}`,
        source: parentNodeId,
        target: nodeId,
        type: "capitalFlow",
        data: {
          capitalCents: entity.capitalMetrics.committedCents,
          maxCapitalCents: maxCap,
        },
      });

      maxCap = Math.max(maxCap, entity.capitalMetrics.committedCents);

      // Process linked deals (if expanded)
      if (isExpanded && isSeriesLlc) {
        entity.linkedDeals.forEach((deal) => {
          processDeal(deal, nodeId);
        });
      }

      // Process child entities (if expanded)
      if (isExpanded && entity.childEntities.length > 0) {
        entity.childEntities.forEach((child) => {
          processEntity(child, nodeId, depth + 1);
        });
      }
    }

    function processDeal(deal: CapitalMapDeal, parentNodeId: string) {
      const nodeId = `deal-${deal.id}`;
      const isExpanded = expandedDeals.has(deal.id);
      const matches = dealMatchesFilters(deal, filters);

      // In hide mode, skip non-matching deals
      if (hasActiveFilters && !matches && filters.filterMode === "hide") {
        return;
      }

      const isDimmed =
        hasActiveFilters && !matches && filters.filterMode === "dim";

      const nodeData: DealNodeData = {
        label: deal.name,
        dealId: deal.id,
        company: deal.company,
        dealStatus: deal.status,
        isExpanded,
        isSelected: selectedNodeId === nodeId,
        isDimmed,
        committedCents: deal.committedCents,
        wiredCents: deal.wiredCents,
        blockCount: deal.blocks.length,
        relationshipType: deal.relationshipType,
        economicRole: deal.economicRole,
        onToggle: () => onToggleDeal(deal.id),
        onSelect: () => onSelectNode(nodeId),
      };

      rawNodes.push({
        id: nodeId,
        type: "deal",
        position: { x: 0, y: 0 },
        data: nodeData,
      });

      rawEdges.push({
        id: `edge-${parentNodeId}-${nodeId}`,
        source: parentNodeId,
        target: nodeId,
        type: "capitalFlow",
        data: {
          capitalCents: deal.committedCents,
          maxCapitalCents: maxCap,
        },
      });

      maxCap = Math.max(maxCap, deal.committedCents);

      // Process blocks (if expanded)
      if (isExpanded) {
        deal.blocks.forEach((block) => {
          processBlock(block, nodeId, deal.id);
        });
      }
    }

    function processBlock(
      block: CapitalMapBlock,
      parentNodeId: string,
      dealId: number
    ) {
      const nodeId = `block-${block.id}`;

      const nodeData: BlockNodeData = {
        label: block.sellerName || `Block ${block.id}`,
        blockId: block.id,
        sellerName: block.sellerName,
        totalCents: block.totalCents,
        filledPct: block.filledPct,
        interests: block.interests,
        isExpanded: false,
        isSelected: selectedNodeId === nodeId,
        isDimmed: false,
        onToggle: () => {},
        onSelect: () => onSelectNode(nodeId),
      };

      rawNodes.push({
        id: nodeId,
        type: "block",
        position: { x: 0, y: 0 },
        data: nodeData,
      });

      rawEdges.push({
        id: `edge-${parentNodeId}-${nodeId}`,
        source: parentNodeId,
        target: nodeId,
        type: "capitalFlow",
        data: {
          capitalCents: block.totalCents || 0,
          maxCapitalCents: maxCap,
        },
      });
    }

    // Only process children if root is expanded
    if (rootIsExpanded) {
      root.childEntities.forEach((child) => {
        processEntity(child, rootId, 1);
      });

      // Also process deals directly linked to root
      root.linkedDeals.forEach((deal) => {
        processDeal(deal, rootId);
      });
    }

    // Update max capital in edge data
    rawEdges.forEach((edge) => {
      if (edge.data) {
        (edge.data as { maxCapitalCents: number }).maxCapitalCents = maxCap;
      }
    });

    const layouted = computeCapitalMapLayout(rawNodes, rawEdges);
    return { ...layouted, maxCapitalCents: maxCap };
  }, [
    data,
    expandedEntities,
    expandedDeals,
    filters,
    selectedNodeId,
    onToggleEntity,
    onToggleDeal,
    onSelectNode,
  ]);

  // Collect searchable items for command palette
  const searchableItems = useMemo((): CommandPaletteItem[] => {
    if (!data?.root) return [];

    const items: CommandPaletteItem[] = [];

    function collectFromEntity(entity: CapitalMapEntity) {
      items.push({
        id: `entity-${entity.id}`,
        type: "entity",
        label: entity.displayName,
        sublabel: entity.entityType.replace(/_/g, " "),
        entityId: entity.id,
      });

      entity.linkedDeals.forEach((deal) => {
        items.push({
          id: `deal-${deal.id}`,
          type: "deal",
          label: deal.name,
          sublabel: deal.company || deal.status,
          dealId: deal.id,
        });

        deal.blocks.forEach((block) => {
          block.interests.forEach((interest) => {
            items.push({
              id: `investor-${interest.id}`,
              type: "investor",
              label: interest.investorName,
              sublabel: `${deal.name}${interest.entityName ? ` via ${interest.entityName}` : ""}`,
              dealId: deal.id,
            });
          });
        });
      });

      entity.childEntities.forEach(collectFromEntity);
    }

    collectFromEntity(data.root);
    return items;
  }, [data]);

  // Collect unique entity types for filter
  const allEntityTypes = useMemo((): string[] => {
    if (!data?.root) return [];

    const types = new Set<string>();

    function collect(entity: CapitalMapEntity) {
      types.add(entity.entityType);
      entity.childEntities.forEach(collect);
    }

    collect(data.root);
    return Array.from(types);
  }, [data]);

  // Collect unique deal statuses for filter
  const allDealStatuses = useMemo((): string[] => {
    if (!data?.root) return [];

    const statuses = new Set<string>();

    function collect(entity: CapitalMapEntity) {
      entity.linkedDeals.forEach((d) => statuses.add(d.status));
      entity.childEntities.forEach(collect);
    }

    collect(data.root);
    return Array.from(statuses);
  }, [data]);

  return {
    nodes,
    edges,
    loading,
    error,
    maxCapitalCents,
    searchableItems,
    allEntityTypes,
    allDealStatuses,
    refetch: fetchData,
  };
}
