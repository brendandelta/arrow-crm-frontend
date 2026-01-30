"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  Loader2,
  Trash2,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  Target,
  Link2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { EntityLinksSection } from "./EntityLinksSection";
import { UniversalDocumentUploader } from "@/components/documents/UniversalDocumentUploader";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { apiFetch, toastApiError } from "@/lib/api-error";

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

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    prospecting: "bg-slate-100 text-slate-600 border-slate-200",
    contacted: "bg-slate-200 text-slate-700 border-slate-300",
    soft_circled: "bg-blue-100 text-blue-700 border-blue-200",
    committed: "bg-purple-100 text-purple-700 border-purple-200",
    allocated: "bg-indigo-100 text-indigo-700 border-indigo-200",
    funded: "bg-emerald-100 text-emerald-700 border-emerald-200",
    declined: "bg-red-100 text-red-600 border-red-200",
    withdrawn: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return colors[status] || colors.prospecting;
}

const inputClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text";
const selectClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-pointer appearance-none";
const textareaClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text resize-none min-h-[80px]";

export function InterestSlideOut({
  interest,
  dealId,
  blocks,
  onClose,
  onSave,
  onDelete
}: InterestSlideOutProps) {
  const isNew = !interest;
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
      };

      const endpoint = isNew ? "/api/interests" : `/api/interests/${interest.id}`;
      const updated = await apiFetch<Interest>(endpoint, {
        method: isNew ? "POST" : "PATCH",
        body: payload,
      });

      toast.success(isNew ? "Interest created" : "Interest saved");
      onSave(updated);
    } catch (err) {
      toastApiError(err, { entity: "interest", action: isNew ? "create" : "save" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!interest || !onDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/interests/${interest.id}`, { method: "DELETE" });
      toast.success("Interest deleted");
      onDelete(interest.id);
      onClose();
    } catch (err) {
      toastApiError(err, { entity: "interest", action: "delete" });
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
              {isNew ? "Add Interest" : "Interest"}
            </h2>
            {!isNew && interest?.createdAt && (
              <p className="text-xs text-muted-foreground">
                Created {new Date(interest.createdAt).toLocaleDateString()}
                {interest.isStale && (
                  <span className="ml-2 text-amber-600">
                    <AlertCircle className="h-3 w-3 inline mr-0.5" />
                    Stale
                  </span>
                )}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-1">
            {/* Status */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-2 px-3">
                <Target className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 px-3">
                {INTEREST_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setFormData({ ...formData, status: s.value })}
                    className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-colors ${
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

            {/* Investor (read-only if existing) */}
            {interest?.investor && (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-1 px-3">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Investor</span>
                </div>
                <div className="px-3 py-2 text-sm font-medium">
                  {interest.investor.name}
                  <span className="text-slate-400 ml-2">({interest.investor.kind})</span>
                </div>
              </div>
            )}

            {/* Target Amount */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Target className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Target Amount</span>
              </div>
              <input
                type="text"
                value={formData.targetCents}
                onChange={(e) => setFormData({ ...formData, targetCents: e.target.value })}
                className={inputClass}
                placeholder="e.g., 500K, 1M"
              />
            </div>

            {/* Committed Amount */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Committed</span>
              </div>
              <input
                type="text"
                value={formData.committedCents}
                onChange={(e) => setFormData({ ...formData, committedCents: e.target.value })}
                className={`${inputClass} font-semibold`}
                placeholder="e.g., 500K, 1M"
              />
            </div>

            {/* Min / Max */}
            <div className="py-2 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 px-3">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Minimum</span>
                </div>
                <input
                  type="text"
                  value={formData.minCents}
                  onChange={(e) => setFormData({ ...formData, minCents: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., 250K"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 px-3">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Maximum</span>
                </div>
                <input
                  type="text"
                  value={formData.maxCents}
                  onChange={(e) => setFormData({ ...formData, maxCents: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., 2M"
                />
              </div>
            </div>

            {/* Block Allocation */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Link2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Allocated Block</span>
              </div>
              <select
                value={formData.allocatedBlockId}
                onChange={(e) => setFormData({ ...formData, allocatedBlockId: e.target.value })}
                className={selectClass}
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

            {/* Allocated Amount */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Allocated Amount</span>
              </div>
              <input
                type="text"
                value={formData.allocatedCents}
                onChange={(e) => setFormData({ ...formData, allocatedCents: e.target.value })}
                className={inputClass}
                placeholder="e.g., 500K"
              />
            </div>

            {/* Source */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Source</span>
              </div>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className={selectClass}
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
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Next Step</span>
              </div>
              <input
                type="text"
                value={formData.nextStep}
                onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
                className={inputClass}
                placeholder="e.g., Follow up call, Send term sheet"
              />
            </div>

            {/* Next Step Due */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Due Date</span>
              </div>
              <input
                type="date"
                value={formData.nextStepAt}
                onChange={(e) => setFormData({ ...formData, nextStepAt: e.target.value })}
                className={selectClass}
              />
            </div>

            {/* Internal Notes */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Internal Notes</span>
              </div>
              <textarea
                value={formData.internalNotes}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                className={textareaClass}
                placeholder="Notes visible only to your team..."
              />
            </div>

            {/* Linked Entities */}
            {!isNew && interest && (
              <div className="py-3 border-t mt-2">
                <EntityLinksSection
                  linkedObjectType="Interest"
                  linkedObjectId={interest.id}
                  linkedObjectLabel={interest.investor?.name || `Interest #${interest.id}`}
                  collapsible
                  defaultExpanded={false}
                  compact
                />
              </div>
            )}

            {/* Documents Upload */}
            {!isNew && interest && (
              <Collapsible className="py-3 border-t">
                <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 text-left">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Documents</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 ml-auto transition-transform group-data-[state=open]:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pt-3">
                  <UniversalDocumentUploader
                    parentType="Interest"
                    parentId={interest.id}
                    dealId={dealId}
                    defaultLinks={[
                      {
                        linkableType: "Interest",
                        linkableId: interest.id,
                        linkableLabel: interest.investor?.name || `Interest #${interest.id}`,
                        relationship: "deal_material",
                      },
                      {
                        linkableType: "Deal",
                        linkableId: dealId,
                        linkableLabel: "Parent Deal",
                        relationship: "deal_material",
                      },
                    ]}
                    compact
                    showCancel={false}
                    uploadButtonText="Upload"
                  />
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Contact Info (read-only) */}
            {interest?.contact && (
              <div className="py-4 mt-2 border-t">
                <div className="flex items-center gap-2 mb-2 px-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Contact</span>
                </div>
                <div className="px-3 text-sm">
                  <div className="font-medium">{interest.contact.firstName} {interest.contact.lastName}</div>
                  {interest.contact.email && <div className="text-slate-500">{interest.contact.email}</div>}
                  {interest.contact.phone && <div className="text-slate-500">{interest.contact.phone}</div>}
                </div>
              </div>
            )}

            {/* Updated At */}
            {interest?.updatedAt && (
              <div className="pt-4 mt-2 border-t text-xs text-muted-foreground px-3">
                Last updated: {new Date(interest.updatedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          {!isNew && onDelete && (
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                  >
                    No
                  </button>
                </div>
              )}
            </>
          )}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isNew ? "Create" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
