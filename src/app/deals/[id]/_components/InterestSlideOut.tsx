"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Pencil,
  Save,
  Loader2,
  Trash2,
  AlertCircle,
  Building2,
  User,
  DollarSign,
  Calendar,
  FileText,
  Target,
  Link2
} from "lucide-react";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
}

interface AllocatedBlock {
  id: number;
  seller: string | null;
  priceCents: number | null;
  status: string;
}

interface Interest {
  id: number;
  investor: { id: number; name: string; kind: string } | null;
  contact: Person | null;
  decisionMaker: Person | null;
  targetCents: number | null;
  minCents: number | null;
  maxCents: number | null;
  committedCents: number | null;
  allocatedCents: number | null;
  allocatedBlockId: number | null;
  allocatedBlock?: AllocatedBlock | null;
  status: string;
  source: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  isStale: boolean;
}

interface Block {
  id: number;
  seller: { id: number; name: string; kind: string } | null;
  priceCents?: number | null;
  status: string;
}

interface InterestSlideOutProps {
  interest: Interest | null;
  dealId: number;
  blocks: Block[];
  onClose: () => void;
  onSave: (interest: Interest) => void;
  onDelete?: (interestId: number) => void;
}

const INTEREST_STATUSES = [
  { value: "prospecting", label: "Prospecting" },
  { value: "contacted", label: "Contacted" },
  { value: "soft_circled", label: "Soft Circled" },
  { value: "committed", label: "Committed" },
  { value: "allocated", label: "Allocated" },
  { value: "funded", label: "Funded" },
  { value: "declined", label: "Declined" },
  { value: "withdrawn", label: "Withdrawn" },
];

const SOURCES = ["direct", "referral", "broker", "inbound", "outbound", "network", "conference", "cold_outreach"];

function formatCurrency(cents: number | null | undefined) {
  if (cents === null || cents === undefined || cents === 0) return "";
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrencyDisplay(cents: number | null | undefined) {
  if (cents === null || cents === undefined || cents === 0) return null;
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(2)}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(2)}K`;
  }
  return `$${dollars.toLocaleString()}`;
}

function parseCurrency(value: string): number | null {
  if (!value) return null;
  let clean = value.replace(/[$,]/g, "").trim();
  let multiplier = 1;

  if (clean.toLowerCase().endsWith("m")) {
    multiplier = 1_000_000;
    clean = clean.slice(0, -1);
  } else if (clean.toLowerCase().endsWith("k")) {
    multiplier = 1_000;
    clean = clean.slice(0, -1);
  }

  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return Math.round(num * multiplier * 100);
}

function FieldRow({
  label,
  children,
  missing = false,
  icon: Icon
}: {
  label: string;
  children: React.ReactNode;
  missing?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <label className="text-sm font-medium text-slate-500">{label}</label>
        {missing && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Missing
          </span>
        )}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    prospecting: "bg-slate-100 text-slate-600",
    contacted: "bg-slate-200 text-slate-700",
    soft_circled: "bg-blue-100 text-blue-700",
    committed: "bg-purple-100 text-purple-700",
    allocated: "bg-indigo-100 text-indigo-700",
    funded: "bg-emerald-100 text-emerald-700",
    declined: "bg-red-100 text-red-600",
    withdrawn: "bg-slate-100 text-slate-500",
  };
  return colors[status] || colors.prospecting;
}

export function InterestSlideOut({
  interest,
  dealId,
  blocks,
  onClose,
  onSave,
  onDelete
}: InterestSlideOutProps) {
  const isNew = !interest;
  const [editing, setEditing] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    investorId: interest?.investor?.id || null as number | null,
    investorName: interest?.investor?.name || "",
    status: interest?.status || "prospecting",
    targetCents: formatCurrency(interest?.targetCents),
    minCents: formatCurrency(interest?.minCents),
    maxCents: formatCurrency(interest?.maxCents),
    committedCents: formatCurrency(interest?.committedCents),
    allocatedCents: formatCurrency(interest?.allocatedCents),
    allocatedBlockId: interest?.allocatedBlockId?.toString() || "",
    source: interest?.source || "",
    nextStep: interest?.nextStep || "",
    nextStepAt: interest?.nextStepAt?.split("T")[0] || "",
    internalNotes: interest?.internalNotes || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        interest: {
          deal_id: dealId,
          investor_id: formData.investorId,
          status: formData.status,
          target_cents: parseCurrency(formData.targetCents),
          min_cents: parseCurrency(formData.minCents),
          max_cents: parseCurrency(formData.maxCents),
          committed_cents: parseCurrency(formData.committedCents),
          allocated_cents: parseCurrency(formData.allocatedCents),
          allocated_block_id: formData.allocatedBlockId ? parseInt(formData.allocatedBlockId) : null,
          source: formData.source || null,
          next_step: formData.nextStep || null,
          next_step_at: formData.nextStepAt || null,
          internal_notes: formData.internalNotes || null,
        },
      };

      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/interests`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/interests/${interest.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
        if (!isNew) setEditing(false);
      } else {
        console.error("Failed to save interest");
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!interest || !onDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/interests/${interest.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onDelete(interest.id);
        onClose();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold">
              {isNew ? "Add Interest" : "Interest Details"}
            </h2>
            {!isNew && interest?.createdAt && (
              <p className="text-xs text-muted-foreground">
                Created {new Date(interest.createdAt).toLocaleDateString()}
                {interest.isStale && (
                  <span className="ml-2 text-amber-600">• Stale (no activity in 7+ days)</span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isNew && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editing ? (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {INTEREST_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setFormData({ ...formData, status: s.value })}
                      className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${
                        formData.status === s.value
                          ? getStatusColor(s.value)
                          : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Investment Amounts */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Investment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Target Amount</label>
                    <input
                      type="text"
                      value={formData.targetCents}
                      onChange={(e) => setFormData({ ...formData, targetCents: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="e.g., 500K, 1M"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Committed Amount</label>
                    <input
                      type="text"
                      value={formData.committedCents}
                      onChange={(e) => setFormData({ ...formData, committedCents: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="e.g., 500K, 1M"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Minimum</label>
                    <input
                      type="text"
                      value={formData.minCents}
                      onChange={(e) => setFormData({ ...formData, minCents: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="e.g., 250K"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Maximum</label>
                    <input
                      type="text"
                      value={formData.maxCents}
                      onChange={(e) => setFormData({ ...formData, maxCents: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="e.g., 2M"
                    />
                  </div>
                </div>
              </div>

              {/* Block Allocation */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Block Allocation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Allocated Block</label>
                    <select
                      value={formData.allocatedBlockId}
                      onChange={(e) => setFormData({ ...formData, allocatedBlockId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Not allocated</option>
                      {blocks.map((block) => (
                        <option key={block.id} value={block.id}>
                          {block.seller?.name || `Block #${block.id}`}
                          {block.priceCents && ` - $${(block.priceCents / 100).toFixed(2)}/sh`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Allocated Amount</label>
                    <input
                      type="text"
                      value={formData.allocatedCents}
                      onChange={(e) => setFormData({ ...formData, allocatedCents: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="e.g., 500K"
                    />
                  </div>
                </div>
              </div>

              {/* Source */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Source</h3>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Select source...</option>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Next Step */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Next Step</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-500 mb-1">Action</label>
                    <input
                      type="text"
                      value={formData.nextStep}
                      onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="e.g., Follow up call, Send term sheet"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.nextStepAt}
                      onChange={(e) => setFormData({ ...formData, nextStepAt: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Internal Notes</h3>
                <textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[100px]"
                  placeholder="Notes visible only to your team..."
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-1">
              {/* Status Badge */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b">
                <Badge className={getStatusColor(interest?.status || "prospecting")}>
                  {INTEREST_STATUSES.find(s => s.value === interest?.status)?.label || interest?.status}
                </Badge>
                {interest?.isStale && (
                  <Badge className="bg-amber-100 text-amber-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Stale
                  </Badge>
                )}
              </div>

              {/* Investor */}
              <FieldRow label="Investor" missing={!interest?.investor} icon={Building2}>
                {interest?.investor ? (
                  <div>
                    <span className="font-medium">{interest.investor.name}</span>
                    <span className="text-muted-foreground ml-2">({interest.investor.kind})</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Contact */}
              <FieldRow label="Contact" missing={!interest?.contact} icon={User}>
                {interest?.contact ? (
                  <div>
                    <div className="font-medium">{interest.contact.firstName} {interest.contact.lastName}</div>
                    {interest.contact.email && <div className="text-muted-foreground">{interest.contact.email}</div>}
                    {interest.contact.phone && <div className="text-muted-foreground">{interest.contact.phone}</div>}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Decision Maker */}
              <FieldRow label="Decision Maker" missing={!interest?.decisionMaker} icon={User}>
                {interest?.decisionMaker ? (
                  <div>
                    <div className="font-medium">{interest.decisionMaker.firstName} {interest.decisionMaker.lastName}</div>
                    {interest.decisionMaker.email && <div className="text-muted-foreground">{interest.decisionMaker.email}</div>}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Target Amount */}
              <FieldRow label="Target Amount" missing={!interest?.targetCents} icon={Target}>
                {interest?.targetCents ? (
                  <span className="font-semibold">{formatCurrencyDisplay(interest.targetCents)}</span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Min/Max Range */}
              <FieldRow label="Investment Range" missing={!interest?.minCents && !interest?.maxCents}>
                {interest?.minCents || interest?.maxCents ? (
                  <span>
                    {formatCurrencyDisplay(interest.minCents) || "—"} - {formatCurrencyDisplay(interest.maxCents) || "—"}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Committed */}
              <FieldRow label="Committed Amount" missing={!interest?.committedCents} icon={DollarSign}>
                {interest?.committedCents ? (
                  <span className="text-xl font-bold">{formatCurrencyDisplay(interest.committedCents)}</span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Allocated Block */}
              <FieldRow label="Allocated Block" missing={!interest?.allocatedBlock} icon={Link2}>
                {interest?.allocatedBlock ? (
                  <div>
                    <div className="font-medium">{interest.allocatedBlock.seller || "—"}</div>
                    <div className="text-muted-foreground">
                      {interest.allocatedBlock.priceCents && `$${(interest.allocatedBlock.priceCents / 100).toFixed(2)}/sh`}
                      {" • "}
                      {interest.allocatedBlock.status}
                    </div>
                    {interest.allocatedCents && (
                      <div className="font-medium mt-1">
                        Allocated: {formatCurrencyDisplay(interest.allocatedCents)}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Not allocated</span>
                )}
              </FieldRow>

              {/* Source */}
              <FieldRow label="Source" missing={!interest?.source}>
                {interest?.source ? (
                  <span>{interest.source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Next Step */}
              <FieldRow label="Next Step" missing={!interest?.nextStep} icon={Calendar}>
                {interest?.nextStep ? (
                  <div>
                    <div className="font-medium">{interest.nextStep}</div>
                    {interest.nextStepAt && (
                      <div className="text-muted-foreground">
                        Due: {new Date(interest.nextStepAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Internal Notes */}
              <FieldRow label="Internal Notes" missing={!interest?.internalNotes} icon={FileText}>
                {interest?.internalNotes ? (
                  <p className="whitespace-pre-wrap">{interest.internalNotes}</p>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Updated At */}
              {interest?.updatedAt && (
                <div className="pt-4 mt-4 border-t text-xs text-muted-foreground">
                  Last updated: {new Date(interest.updatedAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          {!isNew && onDelete && !editing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Delete this interest?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
            </div>
          )}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3 ml-auto">
              {editing && !isNew && (
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
              )}
              {editing ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isNew ? "Create Interest" : "Save Changes"}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
