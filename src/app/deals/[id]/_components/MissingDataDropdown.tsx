"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, Plus } from "lucide-react";

export interface MissingField {
  key: string;
  label: string;
}

interface MissingDataDropdownProps {
  missingFields: MissingField[];
  onAddClick?: (fieldKey: string) => void;
}

export function MissingDataDropdown({ missingFields, onAddClick }: MissingDataDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (missingFields.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {missingFields.length} missing
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-2">
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
              Missing Data
            </div>
            {missingFields.map((field) => (
              <button
                key={field.key}
                onClick={() => {
                  if (onAddClick) {
                    onAddClick(field.key);
                  }
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span>{field.label}</span>
                {onAddClick && (
                  <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                    <Plus className="h-3 w-3" />
                    Add
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to get missing fields for a deal
export function getDealMissingFields(deal: {
  expectedClose: string | null;
  deadline: string | null;
  sharePrice: number | null;
  valuation: number | null;
  source: string | null;
  stage: string | null;
  confidence: number | null;
  tags: string[] | null;
  notes: string | null;
  driveUrl: string | null;
  dataRoomUrl: string | null;
  deckUrl: string | null;
  owner: { id: number } | null;
}): MissingField[] {
  const missing: MissingField[] = [];

  if (!deal.expectedClose) missing.push({ key: "expectedClose", label: "Expected Close Date" });
  if (!deal.sharePrice) missing.push({ key: "sharePrice", label: "Share Price" });
  if (!deal.valuation) missing.push({ key: "valuation", label: "Valuation" });
  if (!deal.source) missing.push({ key: "source", label: "Source" });
  if (!deal.stage) missing.push({ key: "stage", label: "Stage" });
  if (!deal.confidence) missing.push({ key: "confidence", label: "Confidence" });
  if (!deal.tags?.length) missing.push({ key: "tags", label: "Tags" });
  if (!deal.notes) missing.push({ key: "notes", label: "Internal Notes" });
  if (!deal.driveUrl) missing.push({ key: "driveUrl", label: "Google Drive URL" });
  if (!deal.dataRoomUrl) missing.push({ key: "dataRoomUrl", label: "Data Room URL" });
  if (!deal.deckUrl) missing.push({ key: "deckUrl", label: "Deck URL" });
  if (!deal.owner) missing.push({ key: "owner", label: "Deal Owner" });

  return missing;
}
