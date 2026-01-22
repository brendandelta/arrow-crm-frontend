"use client";

import { useState, useEffect } from "react";
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
  Flame,
  CheckCircle2
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
  block: Block | null; // null for new block
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

export function BlockSlideOut({ block, dealId, onClose, onSave, onDelete }: BlockSlideOutProps) {
  const isNew = !block;
  const [editing, setEditing] = useState(isNew);
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

  // Auto-calculate total when shares or price changes
  useEffect(() => {
    const shares = parseInt(formData.shares) || 0;
    const priceCents = parseCurrency(formData.priceCents) || 0;
    if (shares > 0 && priceCents > 0) {
      const total = shares * priceCents;
      setFormData(prev => ({
        ...prev,
        totalCents: formatCurrency(total)
      }));
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
        if (!isNew) setEditing(false);
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
              {isNew ? "Add Block" : "Block Details"}
            </h2>
            {!isNew && block?.createdAt && (
              <p className="text-xs text-muted-foreground">
                Created {new Date(block.createdAt).toLocaleDateString()}
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
              {/* Status & Heat Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {BLOCK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Heat Level</label>
                  <div className="flex gap-1">
                    {HEAT_LEVELS.map((h) => (
                      <button
                        key={h.value}
                        onClick={() => setFormData({ ...formData, heat: h.value })}
                        className={`flex-1 py-2 text-xs font-medium rounded border transition-colors ${
                          formData.heat === h.value
                            ? getHeatColor(h.value)
                            : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {h.value >= 2 && <Flame className="h-3 w-3 mx-auto mb-0.5" />}
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Share Details */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Share Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Share Class</label>
                    <select
                      value={formData.shareClass}
                      onChange={(e) => setFormData({ ...formData, shareClass: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Select class...</option>
                      {SHARE_CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Number of Shares</label>
                    <input
                      type="text"
                      value={formData.shares}
                      onChange={(e) => setFormData({ ...formData, shares: e.target.value.replace(/[^0-9]/g, "") })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Price per Share ($)</label>
                    <input
                      type="text"
                      value={formData.priceCents}
                      onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Total Value ($)</label>
                    <input
                      type="text"
                      value={formData.totalCents}
                      onChange={(e) => setFormData({ ...formData, totalCents: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-slate-50"
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Minimum Size ($)</label>
                    <input
                      type="text"
                      value={formData.minSizeCents}
                      onChange={(e) => setFormData({ ...formData, minSizeCents: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Discount (%)</label>
                    <input
                      type="text"
                      value={formData.discountPct}
                      onChange={(e) => setFormData({ ...formData, discountPct: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-500 mb-1">Implied Valuation ($)</label>
                  <input
                    type="text"
                    value={formData.impliedValuationCents}
                    onChange={(e) => setFormData({ ...formData, impliedValuationCents: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Terms & Expiration */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Terms & Timeline</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Terms</label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[80px]"
                    placeholder="Deal terms, conditions, restrictions..."
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-500 mb-1">Expires At</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Source */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Source</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Source Type</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Select...</option>
                      {SOURCES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Source Detail</label>
                    <input
                      type="text"
                      value={formData.sourceDetail}
                      onChange={(e) => setFormData({ ...formData, sourceDetail: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="Name, company..."
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="verified"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="verified" className="text-sm text-slate-600">
                    Verified block
                  </label>
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
              {/* Status & Heat */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b">
                <Badge className={`${
                  formData.status === "available" ? "bg-green-100 text-green-700" :
                  formData.status === "reserved" ? "bg-yellow-100 text-yellow-700" :
                  formData.status === "sold" ? "bg-purple-100 text-purple-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </Badge>
                <Badge className={getHeatColor(block?.heat || 0)}>
                  {block?.heat && block.heat >= 2 && <Flame className="h-3 w-3 mr-1" />}
                  {HEAT_LEVELS.find(h => h.value === block?.heat)?.label || "Cold"}
                </Badge>
                {block?.verified && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              {/* Seller */}
              <FieldRow label="Seller" missing={!block?.seller} icon={Building2}>
                {block?.seller ? (
                  <div>
                    <span className="font-medium">{block.seller.name}</span>
                    <span className="text-muted-foreground ml-2">({block.seller.kind})</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Contact */}
              <FieldRow label="Contact" missing={!block?.contact} icon={User}>
                {block?.contact ? (
                  <div>
                    <div className="font-medium">{block.contact.firstName} {block.contact.lastName}</div>
                    {block.contact.email && <div className="text-muted-foreground">{block.contact.email}</div>}
                    {block.contact.phone && <div className="text-muted-foreground">{block.contact.phone}</div>}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Share Class */}
              <FieldRow label="Share Class" missing={!block?.shareClass}>
                {block?.shareClass || <span className="text-muted-foreground italic">Not set</span>}
              </FieldRow>

              {/* Shares */}
              <FieldRow label="Number of Shares" missing={!block?.shares}>
                {block?.shares ? block.shares.toLocaleString() : <span className="text-muted-foreground italic">Not set</span>}
              </FieldRow>

              {/* Price */}
              <FieldRow label="Price per Share" missing={!block?.priceCents} icon={DollarSign}>
                {block?.priceCents ? (
                  <span className="font-semibold">${(block.priceCents / 100).toFixed(2)}</span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Total */}
              <FieldRow label="Total Value" missing={!block?.totalCents} icon={DollarSign}>
                {block?.totalCents ? (
                  <span className="text-xl font-bold">${(block.totalCents / 100).toLocaleString()}</span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Min Size */}
              <FieldRow label="Minimum Size" missing={!block?.minSizeCents}>
                {block?.minSizeCents ? (
                  `$${(block.minSizeCents / 100).toLocaleString()}`
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Discount */}
              <FieldRow label="Discount" missing={!block?.discountPct}>
                {block?.discountPct ? (
                  `${block.discountPct}%`
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Implied Valuation */}
              <FieldRow label="Implied Valuation" missing={!block?.impliedValuationCents}>
                {block?.impliedValuationCents ? (
                  `$${(block.impliedValuationCents / 100).toLocaleString()}`
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Terms */}
              <FieldRow label="Terms" missing={!block?.terms} icon={FileText}>
                {block?.terms ? (
                  <p className="whitespace-pre-wrap">{block.terms}</p>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Expires */}
              <FieldRow label="Expires At" missing={!block?.expiresAt} icon={Calendar}>
                {block?.expiresAt ? (
                  new Date(block.expiresAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                  })
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Source */}
              <FieldRow label="Source" missing={!block?.source}>
                {block?.source ? (
                  <span>
                    {block.source.charAt(0).toUpperCase() + block.source.slice(1)}
                    {block.sourceDetail && ` - ${block.sourceDetail}`}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Internal Notes */}
              <FieldRow label="Internal Notes" missing={!block?.internalNotes}>
                {block?.internalNotes ? (
                  <p className="whitespace-pre-wrap">{block.internalNotes}</p>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </FieldRow>

              {/* Mapped Interests */}
              {block?.mappedInterests && block.mappedInterests.length > 0 && (
                <div className="pt-4 mt-4 border-t">
                  <h3 className="text-sm font-semibold mb-3">Mapped Interests ({block.mappedInterests.length})</h3>
                  <div className="space-y-2">
                    {block.mappedInterests.map((interest) => (
                      <div
                        key={interest.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <span className="font-medium">{interest.investor || "—"}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
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
              <span className="text-sm text-red-600">Delete this block?</span>
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
                  {isNew ? "Create Block" : "Save Changes"}
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
