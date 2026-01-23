"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { MindMapCanvas } from "./mind-map/MindMapCanvas";
import { useMindMapData } from "./mind-map/useMindMapData";
import { AddTargetModal } from "./mind-map/AddTargetModal";
import { AddInterestModal } from "./mind-map/AddInterestModal";
import { EditFollowUpModal } from "./mind-map/EditFollowUpModal";

export function MindMapView() {
  const {
    nodes,
    edges,
    loading,
    searchQuery,
    setSearchQuery,
    highlightedNodeIds,
    refetch,
  } = useMindMapData();

  // Modal state
  const [addModalDealId, setAddModalDealId] = useState<number | null>(null);
  const [addModalType, setAddModalType] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{
    itemId: number;
    itemType: "target" | "interest";
    currentStep: string;
    currentDate: string | null;
  } | null>(null);

  const handleAddItem = useCallback((dealId: number, type: string) => {
    setAddModalDealId(dealId);
    setAddModalType(type);
  }, []);

  const handleEditFollowUp = useCallback(
    (itemId: number, itemType: string, currentStep: string, currentDate: string | null) => {
      setEditModal({
        itemId,
        itemType: itemType as "target" | "interest",
        currentStep,
        currentDate,
      });
    },
    []
  );

  const handleSaveTarget = useCallback(
    async (data: { deal_id: number; target_type: string; target_id: number; role: string; status: string }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create target");
      refetch();
    },
    [refetch]
  );

  const handleSaveInterest = useCallback(
    async (data: { deal_id: number; investor_id: number; committed_cents: number | null; status: string; contact_id?: number; decision_maker_id?: number; introduced_by_id?: number }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/interests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create interest");
      refetch();
    },
    [refetch]
  );

  const handleSaveFollowUp = useCallback(
    async (data: { itemId: number; itemType: string; next_step: string; next_step_at: string | null }) => {
      const endpoint = data.itemType === "target"
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets/${data.itemId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/interests/${data.itemId}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next_step: data.next_step, next_step_at: data.next_step_at }),
      });
      if (!res.ok) throw new Error("Failed to update follow-up");
      refetch();
    },
    [refetch]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-slate-400">
        Loading mind map...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      {/* Search */}
      <div className="mb-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals or targets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-shadow shadow-sm"
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <MindMapCanvas
          nodes={nodes}
          edges={edges}
          highlightedNodeIds={highlightedNodeIds}
          onAddItem={handleAddItem}
          onEditFollowUp={handleEditFollowUp}
        />
      </div>

      {/* Add Target Modal */}
      {addModalDealId && addModalType === "targets" && (
        <AddTargetModal
          dealId={addModalDealId}
          onClose={() => { setAddModalDealId(null); setAddModalType(null); }}
          onSave={handleSaveTarget}
        />
      )}

      {/* Add Interest Modal */}
      {addModalDealId && addModalType === "interests" && (
        <AddInterestModal
          dealId={addModalDealId}
          onClose={() => { setAddModalDealId(null); setAddModalType(null); }}
          onSave={handleSaveInterest}
        />
      )}

      {/* Edit Follow-Up Modal */}
      {editModal && (
        <EditFollowUpModal
          itemId={editModal.itemId}
          itemType={editModal.itemType}
          currentStep={editModal.currentStep}
          currentDate={editModal.currentDate}
          onClose={() => setEditModal(null)}
          onSave={handleSaveFollowUp}
        />
      )}
    </div>
  );
}
