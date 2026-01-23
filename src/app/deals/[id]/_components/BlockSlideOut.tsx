"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  Loader2,
  Trash2,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  Flame,
  CheckCircle2,
  Layers,
  Percent,
  TrendingUp,
  Hash,
} from "lucide-react";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
}

interface Organization {
  id: number;
  name: string;
  kind: string;
}

interface MappedInterest {
  id: number;
  investor: string | null;
  committedCents: number | null;
  status: string;
}

interface Block {
  id: number;
  seller: { id: number; name: string; kind: string } | null;
  sellerType?: string | null;
  contact?: Person | null;
  broker?: { id: number; name: string } | null;
  brokerContact?: Person | null;
  shareClass?: string | null;
  shares?: number | null;
  priceCents?: number | null;
  totalCents?: number | null;
  minSizeCents?: number | null;
  impliedValuationCents?: number | null;
  discountPct?: number | null;
  status: string;
  heat: number;
  heatLabel: string;
  terms?: string | null;
  expiresAt?: string | null;
  source?: string | null;
  sourceDetail?: string | null;
  verified?: boolean;
  internalNotes?: string | null;
  createdAt?: string;
  mappedInterests?: MappedInterest[];
  mappedInterestsCount?: number;
  mappedCommittedCents?: number;
}

interface BlockSlideOutProps {
  block: Block | null;
  dealId: number;
  onClose: () => void;
  onSave: (block: Block) => void;
  onDelete?: (blockId: number) => void;
}

const BLOCK_STATUSES = ["available", "reserved", "sold", "withdrawn"];
const HEAT_LEVELS = [
  { value: 0, label: "Cold" },
  { value: 1, label: "Warm" },
  { value: 2, label: "Hot" },
  { value: 3, label: "On Fire" },
];
const SHARE_CLASSES = ["Common", "Preferred", "Series A", "Series B", "Series C", "Series D", "Series E", "RSU", "Options"];
const SOURCES = ["direct", "broker", "referral", "inbound", "outbound", "network"];

function formatCurrency(cents: number | null | undefined) {
  if (cents === null || cents === undefined || cents === 0) return "";
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(value: string): number | null {
  if (!value) return null;
  const clean = value.replace(/[$,]/g, "").trim();
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

const inputClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text";
const selectClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-pointer appearance-none";
const textareaClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text resize-none min-h-[80px]";

export function BlockSlideOut({ block, dealId, onClose, onSave, onDelete }: BlockSlideOutProps) {
  const isNew = !block;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    sellerId: block?.seller?.id || null as number | null,
    sellerName: block?.seller?.name || "",
    shareClass: block?.shareClass || "",
    shares: block?.shares?.toString() || "",
    priceCents: formatCurrency(block?.priceCents),
    totalCents: formatCurrency(block?.totalCents),
    minSizeCents: formatCurrency(block?.minSizeCents),
    impliedValuationCents: formatCurrency(block?.impliedValuationCents),
    discountPct: block?.discountPct?.toString() || "",
    status: block?.status || "available",
    heat: block?.heat ?? 0,
    terms: block?.terms || "",
    expiresAt: block?.expiresAt?.split("T")[0] || "",
    source: block?.source || "",
    sourceDetail: block?.sourceDetail || "",
    verified: block?.verified || false,
    internalNotes: block?.internalNotes || "",
  });

  useEffect(() => {
    const shares = parseInt(formData.shares) || 0;
    const priceCents = parseCurrency(formData.priceCents) || 0;
    if (shares > 0 && priceCents > 0) {
      const total = shares * priceCents;
      setFormData(prev => ({ ...prev, totalCents: formatCurrency(total) }));
    }
  }, [formData.shares, formData.priceCents]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        block: {
          deal_id: dealId,
          seller_id: formData.sellerId,
          share_class: formData.shareClass || null,
          shares: formData.shares ? parseInt(formData.shares) : null,
          price_cents: parseCurrency(formData.priceCents),
          total_cents: parseCurrency(formData.totalCents),
          min_size_cents: parseCurrency(formData.minSizeCents),
          implied_valuation_cents: parseCurrency(formData.impliedValuationCents),
          discount_pct: formData.discountPct ? parseFloat(formData.discountPct) : null,
          status: formData.status,
          heat: formData.heat,
          terms: formData.terms || null,
          expires_at: formData.expiresAt || null,
          source: formData.source || null,
          source_detail: formData.sourceDetail || null,
          verified: formData.verified,
          internal_notes: formData.internalNotes || null,
        },
      };

      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/blocks`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/blocks/${block.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
      } else {
        console.error("Failed to save block");
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!block || !onDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/blocks/${block.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onDelete(block.id);
        onClose();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeleting(false);
  };

  const getHeatColor = (heat: number) => {
    const colors: Record<number, string> = {
      0: "bg-slate-100 text-slate-600 border-slate-200",
      1: "bg-yellow-100 text-yellow-700 border-yellow-200",
      2: "bg-orange-100 text-orange-700 border-orange-200",
      3: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[heat] || colors[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold">
              {isNew ? "New Block" : "Block"}
            </h2>
            {!isNew && block?.createdAt && (
              <p className="text-xs text-muted-foreground">
                Created {new Date(block.createdAt).toLocaleDateString()}
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
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</span>
              </div>
              <div className="flex gap-2 px-3">
                {BLOCK_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFormData({ ...formData, status: s })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      formData.status === s
                        ? s === "available" ? "bg-green-50 border-green-200 text-green-700"
                          : s === "reserved" ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                          : s === "sold" ? "bg-purple-50 border-purple-200 text-purple-700"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                        : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Heat */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-2 px-3">
                <Flame className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Heat</span>
              </div>
              <div className="flex gap-1.5 px-3">
                {HEAT_LEVELS.map((h) => (
                  <button
                    key={h.value}
                    onClick={() => setFormData({ ...formData, heat: h.value })}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      formData.heat === h.value
                        ? getHeatColor(h.value)
                        : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Verified */}
            <div className="py-2 px-3">
              <button
                onClick={() => setFormData({ ...formData, verified: !formData.verified })}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  formData.verified
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {formData.verified ? "Verified" : "Not verified"}
              </button>
            </div>

            {/* Share Class */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Share Class</span>
              </div>
              <select
                value={formData.shareClass}
                onChange={(e) => setFormData({ ...formData, shareClass: e.target.value })}
                className={selectClass}
              >
                <option value="">Select class...</option>
                {SHARE_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Shares */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Shares</span>
              </div>
              <input
                type="text"
                value={formData.shares}
                onChange={(e) => setFormData({ ...formData, shares: e.target.value.replace(/[^0-9]/g, "") })}
                className={inputClass}
                placeholder="Number of shares"
              />
            </div>

            {/* Price per Share */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Price / Share</span>
              </div>
              <input
                type="text"
                value={formData.priceCents}
                onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>

            {/* Total Value */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Value</span>
              </div>
              <input
                type="text"
                value={formData.totalCents}
                onChange={(e) => setFormData({ ...formData, totalCents: e.target.value })}
                className={`${inputClass} text-slate-500`}
                placeholder="Auto-calculated"
              />
            </div>

            {/* Min Size */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Minimum Size</span>
              </div>
              <input
                type="text"
                value={formData.minSizeCents}
                onChange={(e) => setFormData({ ...formData, minSizeCents: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>

            {/* Discount */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Percent className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Discount</span>
              </div>
              <input
                type="text"
                value={formData.discountPct}
                onChange={(e) => setFormData({ ...formData, discountPct: e.target.value })}
                className={inputClass}
                placeholder="0"
              />
            </div>

            {/* Implied Valuation */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Implied Valuation</span>
              </div>
              <input
                type="text"
                value={formData.impliedValuationCents}
                onChange={(e) => setFormData({ ...formData, impliedValuationCents: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>

            {/* Terms */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Terms</span>
              </div>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className={textareaClass}
                placeholder="Deal terms, conditions..."
              />
            </div>

            {/* Expires At */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Expires</span>
              </div>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className={selectClass}
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
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Detail */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Source Detail</span>
              </div>
              <input
                type="text"
                value={formData.sourceDetail}
                onChange={(e) => setFormData({ ...formData, sourceDetail: e.target.value })}
                className={inputClass}
                placeholder="Name, company..."
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

            {/* Mapped Interests (read-only display) */}
            {block?.mappedInterests && block.mappedInterests.length > 0 && (
              <div className="py-4 mt-2 border-t">
                <div className="flex items-center gap-2 mb-3 px-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Mapped Interests ({block.mappedInterests.length})
                  </span>
                </div>
                <div className="space-y-2 px-3">
                  {block.mappedInterests.map((interest) => (
                    <div
                      key={interest.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <span className="text-sm font-medium">{interest.investor || "—"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                          ${((interest.committedCents || 0) / 100).toLocaleString()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {interest.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
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
