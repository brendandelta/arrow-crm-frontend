"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
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
  block: Block;
  onClose: () => void;
  onUpdate: (block: Block) => void;
}

export function BlockSlideOut({ block, onClose, onUpdate }: BlockSlideOutProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    heat: block.heat,
    terms: block.terms || "",
    status: block.status,
    internalNotes: block.internalNotes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/blocks/${block.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setEditing(false);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Block Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Seller</h3>
              <p className="font-medium">{block.seller?.name || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total</h3>
              <p className="text-2xl font-semibold">
                {block.totalCents
                  ? `$${(block.totalCents / 100).toLocaleString()}`
                  : "—"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Shares</h3>
                <p>{block.shares?.toLocaleString() || "—"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Price</h3>
                <p>{block.priceCents ? `$${(block.priceCents / 100).toFixed(2)}` : "—"}</p>
              </div>
            </div>
            {block.terms && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Terms</h3>
                <p className="text-sm">{block.terms}</p>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
