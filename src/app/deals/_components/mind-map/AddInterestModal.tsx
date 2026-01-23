"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Loader2, Search } from "lucide-react";

interface Organization {
  id: number;
  name: string;
}

interface AddInterestModalProps {
  dealId: number;
  onClose: () => void;
  onSave: (data: { deal_id: number; investor_id: number; committed_cents: number | null; status: string }) => Promise<void>;
}

export function AddInterestModal({ dealId, onClose, onSave }: AddInterestModalProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [committedAmount, setCommittedAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`)
      .then((res) => res.json())
      .then((data) => {
        setOrganizations(Array.isArray(data) ? data : data.organizations || []);
        setLoadingOrgs(false);
      })
      .catch((err) => {
        console.error("Failed to fetch organizations:", err);
        setLoadingOrgs(false);
      });
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    const q = searchQuery.toLowerCase();
    return organizations.filter((org) => org.name.toLowerCase().includes(q));
  }, [organizations, searchQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      const committedCents = committedAmount
        ? Math.round(parseFloat(committedAmount) * 100)
        : null;
      await onSave({
        deal_id: dealId,
        investor_id: selectedId,
        committed_cents: committedCents,
        status: "prospecting",
      });
      onClose();
    } catch (err) {
      console.error("Failed to add interest:", err);
    } finally {
      setSaving(false);
    }
  }

  const selectedOrg = organizations.find((o) => o.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Add Interest</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {/* Investor Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Investor Organization
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              />
            </div>
            {selectedOrg && (
              <div className="mb-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg flex items-center justify-between">
                <span>{selectedOrg.name}</span>
                <button type="button" onClick={() => setSelectedId(null)} className="text-indigo-400 hover:text-indigo-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
              {loadingOrgs ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                </div>
              ) : filteredOrgs.length === 0 ? (
                <div className="py-3 px-3 text-sm text-slate-400 text-center">
                  No results found
                </div>
              ) : (
                filteredOrgs.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedId(org.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
                      selectedId === org.id ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                    }`}
                  >
                    {org.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Committed Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Committed Amount (optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={committedAmount}
                onChange={(e) => setCommittedAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedId}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Interest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
