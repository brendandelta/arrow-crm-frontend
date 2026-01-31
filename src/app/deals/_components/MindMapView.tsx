"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { MindMapCanvas } from "./mind-map/MindMapCanvas";
import { useMindMapData } from "./mind-map/useMindMapData";
import { MindMapFilterRail } from "./mind-map/MindMapFilterRail";
import { MindMapInspector, type SelectedNode } from "./mind-map/MindMapInspector";
import { MindMapCommandPalette } from "./mind-map/MindMapCommandPalette";
import { OutreachTargetModal } from "@/app/deals/[id]/_components/OutreachTargetModal";
import { InterestSlideOut } from "@/app/deals/[id]/_components/InterestSlideOut";
import { DEFAULT_MIND_MAP_FILTERS, type MindMapFilters } from "./mind-map/types";

export function MindMapView() {
  const router = useRouter();

  // ---- Filter state ----
  const [filters, setFilters] = useState<MindMapFilters>({ ...DEFAULT_MIND_MAP_FILTERS });
  const [railOpen, setRailOpen] = useState(true);

  // ---- Collapse/expand state ----
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());

  // ---- Data ----
  const {
    nodes,
    edges,
    loading,
    allOwners,
    allDeals,
    allChildren,
    refetch,
  } = useMindMapData({ expandedBranches, filters });

  // ---- Inspector state ----
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  // ---- Command palette ----
  const [commandOpen, setCommandOpen] = useState(false);

  // ---- Create modal state ----
  const [createModal, setCreateModal] = useState<{
    type: "target" | "interest";
    dealId: number;
  } | null>(null);

  // ---- Edit modal state ----
  const [editTarget, setEditTarget] = useState<{
    targetId: number;
    dealId: number;
  } | null>(null);

  const [editInterest, setEditInterest] = useState<{
    interestId: number;
    dealId: number;
  } | null>(null);

  // ---- Callbacks ----

  const handleToggleBranch = useCallback((dealId: number, categoryType: string) => {
    setExpandedBranches((prev) => {
      const key = `${categoryType}-${dealId}`;
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleSelectNode = useCallback(
    (nodeId: string, nodeType: string, data: Record<string, unknown>) => {
      setSelectedNode({ id: nodeId, type: nodeType, data });
    },
    []
  );

  const handleAddItem = useCallback((dealId: number, type: string) => {
    setCreateModal({
      type: type === "interests" ? "interest" : "target",
      dealId,
    });
  }, []);

  const handleNavigate = useCallback(
    (dealId: number) => {
      router.push(`/deals/${dealId}`);
    },
    [router]
  );

  const handleAddTarget = useCallback((dealId: number) => {
    setCreateModal({ type: "target", dealId });
  }, []);

  const handleAddInterest = useCallback((dealId: number) => {
    setCreateModal({ type: "interest", dealId });
  }, []);

  const handleEditTarget = useCallback((targetId: number, dealId: number) => {
    setEditTarget({ targetId, dealId });
  }, []);

  const handleEditInterest = useCallback((interestId: number, dealId: number) => {
    setEditInterest({ interestId, dealId });
  }, []);

  // Command palette handlers
  const handleCommandSelectDeal = useCallback(
    (dealId: number) => {
      const nodeId = `deal-${dealId}`;
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        handleSelectNode(
          nodeId,
          "deal",
          node.data as unknown as Record<string, unknown>
        );
      }
    },
    [nodes, handleSelectNode]
  );

  const handleCommandSelectChild = useCallback(
    (childId: number, childType: "target" | "interest", dealId: number) => {
      // Ensure branch is expanded
      const branchKey = `${childType === "target" ? "targets" : "interests"}-${dealId}`;
      setExpandedBranches((prev) => {
        const next = new Set(prev);
        next.add(branchKey);
        return next;
      });

      const nodeId = `${childType}-${dealId}-${childId}`;
      // Use setTimeout to allow the branch expansion to render first
      setTimeout(() => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          handleSelectNode(
            nodeId,
            childType,
            node.data as unknown as Record<string, unknown>
          );
        }
      }, 100);
    },
    [nodes, handleSelectNode]
  );

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Loading mind map...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Rail toggle + command palette shortcut hint */}
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => setRailOpen(!railOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          {railOpen ? (
            <PanelLeftClose className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          )}
          {railOpen ? "Hide Filters" : "Show Filters"}
        </button>
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <kbd className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded">
            {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "\u2318" : "Ctrl+"}K
          </kbd>
          <span>Jump to node</span>
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex rounded-xl border border-slate-200 overflow-hidden">
        {/* Left filter rail */}
        {railOpen && (
          <MindMapFilterRail
            filters={filters}
            onFiltersChange={setFilters}
            owners={allOwners}
          />
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <MindMapCanvas
            nodes={nodes}
            edges={edges}
            onAddItem={handleAddItem}
            onToggleBranch={handleToggleBranch}
            onSelectNode={handleSelectNode}
            selectedNodeId={selectedNode?.id ?? null}
          />
        </div>
      </div>

      {/* Right inspector */}
      <MindMapInspector
        selectedNode={selectedNode}
        open={selectedNode !== null}
        onClose={() => setSelectedNode(null)}
        onNavigate={handleNavigate}
        onAddTarget={handleAddTarget}
        onAddInterest={handleAddInterest}
        onEditTarget={handleEditTarget}
        onEditInterest={handleEditInterest}
      />

      {/* Command palette */}
      <MindMapCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        deals={allDeals}
        children={allChildren}
        onSelectDeal={handleCommandSelectDeal}
        onSelectChild={handleCommandSelectChild}
      />

      {/* Create Target Modal */}
      {createModal?.type === "target" && (
        <OutreachTargetModal
          dealId={createModal.dealId}
          onClose={() => setCreateModal(null)}
          onSaved={() => {
            setCreateModal(null);
            refetch();
          }}
        />
      )}

      {/* Create Interest SlideOut */}
      {createModal?.type === "interest" && (
        <InterestSlideOut
          interest={null}
          dealId={createModal.dealId}
          blocks={[]}
          onClose={() => setCreateModal(null)}
          onSave={() => {
            setCreateModal(null);
            refetch();
          }}
        />
      )}

      {/* Edit Target Modal */}
      {editTarget && (
        <OutreachTargetModal
          dealId={editTarget.dealId}
          target={{
            id: editTarget.targetId,
            dealId: editTarget.dealId,
            targetType: "Organization",
            targetId: 0,
            status: "not_started",
            role: null,
            priority: 1,
            notes: null,
            ownerId: null,
          }}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            refetch();
          }}
        />
      )}

      {/* Edit Interest SlideOut */}
      {editInterest && (
        <InterestSlideOut
          interest={{
            id: editInterest.interestId,
            investor: null,
            contact: null,
            decisionMaker: null,
            targetCents: null,
            minCents: null,
            maxCents: null,
            committedCents: null,
            allocatedCents: null,
            allocatedBlockId: null,
            status: "prospecting",
            source: null,
            nextStep: null,
            nextStepAt: null,
            internalNotes: null,
            createdAt: "",
            updatedAt: "",
            isStale: false,
          }}
          dealId={editInterest.dealId}
          blocks={[]}
          onClose={() => setEditInterest(null)}
          onSave={() => {
            setEditInterest(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
