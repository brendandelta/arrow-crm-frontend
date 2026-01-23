"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Search, ArrowRight, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface SearchResult {
  id: number;
  name: string;
  kind?: string;
  firstName?: string;
  lastName?: string;
  org?: string;
}

interface DealTarget {
  id?: number;
  dealId: number;
  targetType: string;
  targetId: number;
  targetName?: string;
  status: string;
  role: string | null;
  priority: number;
  nextStep: string | null;
  nextStepAt: string | null;
  notes: string | null;
  ownerId: number | null;
  ownerName?: string | null;
  firstContactedAt?: string | null;
  lastContactedAt?: string | null;
  activityCount?: number;
}

interface OutreachTargetModalProps {
  dealId: number;
  target?: DealTarget | null;
  onClose: () => void;
  onSaved: () => void;
  onConvertToInterest?: (target: DealTarget) => void;
}

const STATUSES = [
  { value: "not_started", label: "Not Started", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "contacted", label: "Contacted", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "engaged", label: "Engaged", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "negotiating", label: "Negotiating", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "committed", label: "Committed", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "passed", label: "Passed", color: "bg-red-50 text-red-600 border-red-200" },
  { value: "on_hold", label: "On Hold", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
];

const PRIORITIES = [
  { value: 0, label: "Now", color: "bg-red-50 text-red-700 border-red-200" },
  { value: 1, label: "High", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: 2, label: "Medium", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: 3, label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200" },
];

const ROLES = [
  { value: "lead_investor", label: "Lead Investor" },
  { value: "co_investor", label: "Co-Investor" },
  { value: "advisor", label: "Advisor" },
  { value: "strategic_partner", label: "Strategic Partner" },
  { value: "other", label: "Other" },
];

function TargetSearchInput({ targetType, onSelect }: {
  targetType: "Organization" | "Person";
  onSelect: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    setCreating(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const endpoint = targetType === "Organization" ? "organizations" : "people";
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${endpoint}?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: SearchResult[] = targetType === "Organization"
            ? data.slice(0, 8).map((o: Record<string, unknown>) => ({ id: o.id, name: o.name as string, kind: o.kind as string }))
            : data.slice(0, 8).map((p: Record<string, unknown>) => ({
                id: p.id, name: `${p.firstName} ${p.lastName}`,
                firstName: p.firstName as string, lastName: p.lastName as string, org: p.org as string,
              }));
          setResults(mapped);
          setOpen(true);
        }
      } catch {}
      setLoading(false);
    }, 250);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      if (targetType === "Organization") {
        if (!newName.trim()) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim(), kind: "company" }),
        });
        if (res.ok) {
          const data = await res.json();
          onSelect({ id: data.id, name: data.name });
          reset();
        }
      } else {
        if (!newName.trim() || !newLastName.trim()) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: newName.trim(), lastName: newLastName.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          onSelect({ id: data.id, name: `${newName.trim()} ${newLastName.trim()}` });
          reset();
        }
      }
    } catch {}
    setSaving(false);
  };

  const reset = () => {
    setQuery(""); setOpen(false); setCreating(false);
    setNewName(""); setNewLastName(""); setResults([]);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
          placeholder={`Search ${targetType === "Organization" ? "organizations" : "people"}...`}
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-slate-400" />}
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelect(r); reset(); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
            >
              <span className="font-medium">{r.name}</span>
              <span className="text-xs text-slate-400">{r.kind || r.org || ""}</span>
            </button>
          ))}
          {!creating && (
            <button
              onClick={() => {
                setCreating(true);
                const parts = query.trim().split(/\s+/);
                setNewName(parts[0] || "");
                setNewLastName(targetType === "Person" ? parts.slice(1).join(" ") : "");
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-blue-600 border-t"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new {targetType === "Organization" ? "organization" : "contact"}{query.length >= 2 ? `: "${query}"` : ""}
            </button>
          )}
          {creating && (
            <div className="p-3 border-t space-y-2">
              {targetType === "Organization" ? (
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm rounded border border-slate-200 focus:border-slate-300 focus:outline-none"
                  placeholder="Organization name"
                  autoFocus
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-sm rounded border border-slate-200 focus:border-slate-300 focus:outline-none"
                    placeholder="First name"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-sm rounded border border-slate-200 focus:border-slate-300 focus:outline-none"
                    placeholder="Last name"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={saving || !newName.trim() || (targetType === "Person" && !newLastName.trim())}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
                <button onClick={() => setCreating(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function OutreachTargetModal({ dealId, target, onClose, onSaved, onConvertToInterest }: OutreachTargetModalProps) {
  const isEdit = !!target;
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [targetType, setTargetType] = useState<"Organization" | "Person">(
    (target?.targetType as "Organization" | "Person") || "Organization"
  );
  const [selectedTarget, setSelectedTarget] = useState<{ id: number; name: string } | null>(
    target ? { id: target.targetId, name: target.targetName || "" } : null
  );
  const [status, setStatus] = useState(target?.status || "not_started");
  const [role, setRole] = useState(target?.role || "");
  const [priority, setPriority] = useState(target?.priority ?? 2);
  const [ownerId, setOwnerId] = useState<number | null>(target?.ownerId || null);
  const [nextStep, setNextStep] = useState(target?.nextStep || "");
  const [nextStepAt, setNextStepAt] = useState(target?.nextStepAt?.split("T")[0] || "");
  const [notes, setNotes] = useState(target?.notes || "");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`)
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSave = async () => {
    if (!selectedTarget) return;
    setSaving(true);
    try {
      const payload = {
        deal_id: dealId,
        target_type: targetType,
        target_id: selectedTarget.id,
        status,
        role: role || null,
        priority,
        owner_id: ownerId,
        next_step: nextStep || null,
        next_step_at: nextStepAt || null,
        notes: notes || null,
      };

      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets/${target.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error("Failed to save target:", err);
    }
    setSaving(false);
  };

  const handleConvert = () => {
    if (target && onConvertToInterest) {
      onConvertToInterest(target);
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? "Edit Outreach Target" : "Add Outreach Target"}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Target Selection */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Target Type
              </label>
              <div className="flex gap-2 mb-3">
                {(["Organization", "Person"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setTargetType(type); setSelectedTarget(null); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                      targetType === type
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {selectedTarget ? (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium">{selectedTarget.name}</span>
                  <button onClick={() => setSelectedTarget(null)} className="p-1 hover:bg-slate-200 rounded">
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              ) : (
                <TargetSearchInput
                  targetType={targetType}
                  onSelect={(r) => setSelectedTarget({ id: r.id as number, name: r.name })}
                />
              )}
            </div>
          )}

          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Target
              </label>
              <Link
                href={target.targetType === "Organization" ? `/organizations/${target.targetId}` : `/people/${target.targetId}`}
                className="group/link flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/60 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 group-hover/link:text-indigo-700 transition-colors">
                    {target.targetName}
                  </span>
                  <span className="text-xs text-slate-400 group-hover/link:text-indigo-400 transition-colors">
                    {target.targetType}
                  </span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover/link:text-indigo-500 transition-colors" />
              </Link>
              {target.activityCount !== undefined && target.activityCount > 0 && (
                <div className="mt-1.5 text-xs text-slate-400">
                  {target.activityCount} activities · First contact: {target.firstContactedAt ? new Date(target.firstContactedAt).toLocaleDateString() : "—"}
                  {target.lastContactedAt && ` · Last: ${new Date(target.lastContactedAt).toLocaleDateString()}`}
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    status === s.value ? s.color : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Priority
            </label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    priority === p.value ? p.color : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              <option value="">Select role...</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Owner
            </label>
            <select
              value={ownerId || ""}
              onChange={(e) => setOwnerId(e.target.value ? parseInt(e.target.value) : null)}
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>

          {/* Next Step */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Next Step
            </label>
            <input
              type="text"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              className={inputClass}
              placeholder="What's the next action?"
            />
          </div>

          {/* Next Step Due Date */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Follow-up Date
            </label>
            <input
              type="date"
              value={nextStepAt}
              onChange={(e) => setNextStepAt(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} resize-none min-h-[80px]`}
              placeholder="Internal notes about this target..."
            />
          </div>

          {/* Convert to Interest (only for committed targets) */}
          {isEdit && status === "committed" && onConvertToInterest && (
            <div className="pt-2 border-t">
              <button
                type="button"
                onClick={handleConvert}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                Convert to Interest
              </button>
              <p className="text-xs text-slate-400 mt-1.5 text-center">
                Creates an interest record from this committed target
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedTarget}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save" : "Add Target"}
          </button>
        </div>
      </div>
    </div>
  );
}
