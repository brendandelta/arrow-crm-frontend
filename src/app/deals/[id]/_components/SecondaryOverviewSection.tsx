"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Calendar,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface SecondaryCustomFields {
  settlement_notes?: string;
  preferred_close_window?: string;
  diligence_state_summary?: string;
  broker_notes?: string;
  rofr_status_summary?: string;
  issuer_transfer_restrictions_summary?: string;
}

interface SecondaryOverviewProps {
  deal: {
    id: number;
    customFields?: {
      secondary?: SecondaryCustomFields;
    };
  };
  onSave?: (data: {
    customFields: { secondary: SecondaryCustomFields };
  }) => Promise<void>;
}

// ============ Inline Editable Components ============

function InlineTextField({ value, placeholder, onSave, className }: {
  value: string | null;
  placeholder?: string;
  onSave: (val: string | null) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    const newVal = draft.trim() || null;
    if (newVal !== value) onSave(newVal);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value || ""); setEditing(false); } }}
        placeholder={placeholder}
        className={`bg-transparent border-b border-indigo-300 outline-none py-0.5 w-full ${className || "text-sm text-slate-700"}`}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value || ""); setEditing(true); }}
      className={`hover:text-indigo-600 transition-colors cursor-pointer text-left ${className || "text-sm text-slate-700"}`}
    >
      {value || <span className="text-slate-300 italic">{placeholder}</span>}
    </button>
  );
}

function InlineTextarea({ value, placeholder, onSave }: {
  value: string | null;
  placeholder?: string;
  onSave: (val: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    const newVal = draft.trim() || null;
    if (newVal !== value) onSave(newVal);
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none"
          placeholder={placeholder}
        />
        <div className="flex items-center gap-2">
          <button onClick={commit} className="px-2.5 py-1 text-xs font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700 transition-colors">
            Save
          </button>
          <button onClick={() => { setDraft(value || ""); setEditing(false); }} className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value || ""); setEditing(true); }}
      className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap text-left hover:bg-slate-50 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors cursor-pointer w-full"
    >
      {value || <span className="text-slate-400 italic">{placeholder}</span>}
    </button>
  );
}

export function SecondaryOverviewSection({ deal, onSave }: SecondaryOverviewProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const secondaryFields = deal.customFields?.secondary || {};

  const handleFieldSave = async (field: keyof SecondaryCustomFields, value: unknown) => {
    if (!onSave) return;
    await onSave({
      customFields: {
        secondary: {
          ...secondaryFields,
          [field]: value,
        },
      },
    });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-amber-600" />
            </div>
            Secondary Overview
          </CardTitle>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-0">
            Deal-Level
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          High-level deal metadata. Block-specific terms live in the Blocks tab.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preferred Close Window */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            <Calendar className="h-3 w-3" />
            Preferred Close Window
          </div>
          <InlineTextField
            value={secondaryFields.preferred_close_window || null}
            placeholder="e.g. Q1 2025, March 15-30, ASAP"
            onSave={(val) => handleFieldSave("preferred_close_window", val)}
          />
        </div>

        {/* Settlement Notes */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            <FileText className="h-3 w-3" />
            Settlement Notes
          </div>
          <InlineTextarea
            value={secondaryFields.settlement_notes || null}
            placeholder="Settlement requirements, wire instructions, escrow details..."
            onSave={(val) => handleFieldSave("settlement_notes", val)}
          />
        </div>

        {/* Diligence State Summary */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            <AlertCircle className="h-3 w-3" />
            Diligence Summary
          </div>
          <InlineTextarea
            value={secondaryFields.diligence_state_summary || null}
            placeholder="Current diligence status, pending items, blockers..."
            onSave={(val) => handleFieldSave("diligence_state_summary", val)}
          />
        </div>

        {/* More Details Drawer */}
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="pt-2 border-t border-slate-100">
          <CollapsibleTrigger className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
            {moreOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            More Details
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            {/* ROFR Status Summary */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                <Shield className="h-3 w-3" />
                ROFR Status
              </div>
              <InlineTextarea
                value={secondaryFields.rofr_status_summary || null}
                placeholder="Right of first refusal status across blocks..."
                onSave={(val) => handleFieldSave("rofr_status_summary", val)}
              />
            </div>

            {/* Issuer Transfer Restrictions */}
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Issuer Transfer Restrictions
              </div>
              <InlineTextarea
                value={secondaryFields.issuer_transfer_restrictions_summary || null}
                placeholder="Transfer approval requirements, blackout periods..."
                onSave={(val) => handleFieldSave("issuer_transfer_restrictions_summary", val)}
              />
            </div>

            {/* Broker Notes */}
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Broker Notes
              </div>
              <InlineTextarea
                value={secondaryFields.broker_notes || null}
                placeholder="Notes about broker relationships, commissions..."
                onSave={(val) => handleFieldSave("broker_notes", val)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
