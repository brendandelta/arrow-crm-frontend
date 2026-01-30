"use client";

import { useState, useRef, useEffect } from "react";
import {
  DollarSign,
  Calendar,
  Target,
  FileText,
  TrendingUp,
  Building2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface PrimaryCustomFields {
  round_type?: string;
  security_type?: string;
  valuation_type?: string;
  lead_investor?: string;
  pro_rata?: boolean;
  board_rights?: boolean;
  major_terms_summary?: string;
  use_of_funds_summary?: string;
}

interface RoundDetailsProps {
  deal: {
    id: number;
    name: string;
    target: number | null;
    minRaise: number | null;
    maxRaise: number | null;
    valuation: number | null;
    sharePrice: number | null;
    shareClass: string | null;
    expectedClose: string | null;
    deadline: string | null;
    structureNotes: string | null;
    softCircled: number;
    committed: number;
    wired: number;
    customFields?: {
      primary?: PrimaryCustomFields;
    };
  };
  onSave?: (data: {
    target?: number | null;
    minRaise?: number | null;
    maxRaise?: number | null;
    valuation?: number | null;
    sharePrice?: number | null;
    shareClass?: string | null;
    structureNotes?: string | null;
    customFields?: { primary: PrimaryCustomFields };
  }) => Promise<void>;
}

function formatCurrency(cents: number | null | undefined): string {
  if (!cents) return "—";
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(2)}B`;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(0)}K`;
  return `$${dollars.toLocaleString()}`;
}

function parseCurrencyToCents(value: string): number | null {
  if (!value) return null;
  let clean = value.replace(/[$,]/g, "").trim();
  let multiplier = 1;
  if (clean.toLowerCase().endsWith("b")) { multiplier = 1_000_000_000; clean = clean.slice(0, -1); }
  else if (clean.toLowerCase().endsWith("m")) { multiplier = 1_000_000; clean = clean.slice(0, -1); }
  else if (clean.toLowerCase().endsWith("k")) { multiplier = 1_000; clean = clean.slice(0, -1); }
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return Math.round(num * multiplier * 100);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysUntil(dateStr: string | null): { days: number; label: string; urgent: boolean } | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), label: `${Math.abs(diffDays)}d overdue`, urgent: true };
  }
  if (diffDays === 0) {
    return { days: 0, label: "Today", urgent: true };
  }
  if (diffDays <= 7) {
    return { days: diffDays, label: `${diffDays}d`, urgent: true };
  }
  return { days: diffDays, label: `${diffDays}d`, urgent: false };
}

const ROUND_TYPES = ["Seed", "Series A", "Series B", "Series C", "Series D", "Series E+", "Bridge", "Extension"];
const SECURITY_TYPES = ["SAFE", "Equity", "Convertible Note", "Preferred Stock", "Common Stock"];
const VALUATION_TYPES = ["Pre-money", "Post-money"];

// ============ Inline Editable Components ============

function InlineCurrencyField({ value, placeholder, onSave, label }: {
  value: number | null;
  placeholder?: string;
  onSave: (val: number | null) => void;
  label?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ? (formatCurrency(value)?.replace("$", "") || "") : "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    const cents = parseCurrencyToCents(draft);
    if (cents !== value) onSave(cents);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-0.5">
        <DollarSign className="h-3 w-3 text-slate-400" />
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value ? (formatCurrency(value)?.replace("$", "") || "") : ""); setEditing(false); } }}
          placeholder={placeholder}
          className="text-xl font-semibold text-slate-900 bg-transparent border-b border-indigo-300 outline-none py-0.5 w-28"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value ? (formatCurrency(value)?.replace("$", "") || "") : ""); setEditing(true); }}
      className="text-xl font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer text-left"
    >
      {value ? formatCurrency(value) : <span className="text-slate-300">{placeholder || "—"}</span>}
    </button>
  );
}

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
        className={`bg-transparent border-b border-indigo-300 outline-none py-0.5 ${className || "text-sm text-slate-700"}`}
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

function InlineSelectField({ value, options, placeholder, onSave }: {
  value: string | null;
  options: string[];
  placeholder?: string;
  onSave: (val: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  if (editing) {
    return (
      <select
        ref={ref}
        value={value || ""}
        onChange={(e) => { onSave(e.target.value || null); setEditing(false); }}
        onBlur={() => setEditing(false)}
        className="text-xs font-medium bg-transparent border-b border-indigo-300 outline-none py-0.5 cursor-pointer"
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
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
          rows={4}
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

function InlineToggle({ value, label, onSave }: {
  value: boolean;
  label: string;
  onSave: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onSave(!value)}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
        value
          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${value ? "bg-indigo-500" : "bg-slate-300"}`} />
      {label}
    </button>
  );
}

export function RoundDetailsSection({ deal, onSave }: RoundDetailsProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryFields = deal.customFields?.primary || {};

  const closeDateInfo = getDaysUntil(deal.expectedClose);
  const deadlineInfo = getDaysUntil(deal.deadline);

  const progressPercent = deal.target && deal.committed
    ? Math.min(100, Math.round((deal.committed / deal.target) * 100))
    : null;

  const handleSave = async (field: string, value: unknown) => {
    if (!onSave) return;
    await onSave({ [field]: value } as any);
  };

  const handleCustomFieldSave = async (field: keyof PrimaryCustomFields, value: unknown) => {
    if (!onSave) return;
    await onSave({
      customFields: {
        primary: {
          ...primaryFields,
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
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Target className="h-4 w-4 text-indigo-600" />
            </div>
            Round Details
          </CardTitle>
          <div className="flex items-center gap-2">
            <InlineSelectField
              value={primaryFields.round_type || null}
              options={ROUND_TYPES}
              placeholder="Round Type"
              onSave={(val) => handleCustomFieldSave("round_type", val)}
            />
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-0">
              Primary
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Raise Target */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <TrendingUp className="h-3 w-3" />
              Raise Target
            </div>
            <InlineCurrencyField
              value={deal.target}
              placeholder="Set target"
              onSave={(val) => handleSave("target", val)}
            />
            {progressPercent !== null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{progressPercent}% committed</span>
                  <span>{formatCurrency(deal.committed)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
            {/* Min/Max Raise */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Min:</span>
              <InlineCurrencyField
                value={deal.minRaise}
                placeholder="—"
                onSave={(val) => handleSave("minRaise", val)}
              />
              <span className="mx-1">|</span>
              <span>Max:</span>
              <InlineCurrencyField
                value={deal.maxRaise}
                placeholder="—"
                onSave={(val) => handleSave("maxRaise", val)}
              />
            </div>
          </div>

          {/* Valuation */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <Building2 className="h-3 w-3" />
              Valuation
            </div>
            <InlineCurrencyField
              value={deal.valuation}
              placeholder="Set valuation"
              onSave={(val) => handleSave("valuation", val)}
            />
            <div className="flex items-center gap-2">
              <InlineSelectField
                value={primaryFields.valuation_type || null}
                options={VALUATION_TYPES}
                placeholder="Pre/Post"
                onSave={(val) => handleCustomFieldSave("valuation_type", val)}
              />
              {deal.shareClass && (
                <span className="text-xs text-slate-500">• {deal.shareClass}</span>
              )}
              {!deal.shareClass && (
                <InlineTextField
                  value={deal.shareClass}
                  placeholder="Share class"
                  onSave={(val) => handleSave("shareClass", val)}
                  className="text-xs text-slate-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Share Price & Security Type */}
        <div className="flex items-center justify-between py-2.5 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <DollarSign className="h-4 w-4 text-slate-400" />
            Share Price
          </div>
          <div className="flex items-center gap-3">
            <InlineCurrencyField
              value={deal.sharePrice}
              placeholder="Set PPS"
              onSave={(val) => handleSave("sharePrice", val)}
            />
            <span className="text-sm text-slate-400">/share</span>
            <InlineSelectField
              value={primaryFields.security_type || null}
              options={SECURITY_TYPES}
              placeholder="Security type"
              onSave={(val) => handleCustomFieldSave("security_type", val)}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Timeline
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              Expected Close
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {formatDate(deal.expectedClose)}
              </span>
              {closeDateInfo && (
                <Badge
                  variant="secondary"
                  className={
                    closeDateInfo.urgent
                      ? "bg-amber-50 text-amber-700 border-0"
                      : "bg-slate-100 text-slate-600 border-0"
                  }
                >
                  {closeDateInfo.label}
                </Badge>
              )}
            </div>
          </div>

          {deal.deadline && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-red-400" />
                Deadline
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">
                  {formatDate(deal.deadline)}
                </span>
                {deadlineInfo && (
                  <Badge
                    variant="secondary"
                    className={
                      deadlineInfo.urgent
                        ? "bg-red-50 text-red-700 border-0"
                        : "bg-slate-100 text-slate-600 border-0"
                    }
                  >
                    {deadlineInfo.label}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Capital Summary */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Capital Progress
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {formatCurrency(deal.softCircled)}
              </div>
              <div className="text-xs text-slate-500">Soft Circled</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-lg font-semibold text-indigo-700">
                {formatCurrency(deal.committed)}
              </div>
              <div className="text-xs text-indigo-600">Committed</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-lg font-semibold text-emerald-700">
                {formatCurrency(deal.wired)}
              </div>
              <div className="text-xs text-emerald-600">Wired</div>
            </div>
          </div>
        </div>

        {/* Structure Notes */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <FileText className="h-3 w-3" />
            Terms & Structure
          </div>
          <InlineTextarea
            value={deal.structureNotes}
            placeholder="Add terms or structure notes..."
            onSave={(val) => handleSave("structureNotes", val)}
          />
        </div>

        {/* Primary Terms Drawer */}
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="pt-2 border-t border-slate-100">
          <CollapsibleTrigger className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
            {moreOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Primary Terms
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            {/* Lead Investor */}
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Lead Investor</div>
              <InlineTextField
                value={primaryFields.lead_investor || null}
                placeholder="Add lead investor..."
                onSave={(val) => handleCustomFieldSave("lead_investor", val)}
              />
            </div>

            {/* Rights Toggles */}
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Rights & Terms</div>
              <div className="flex items-center gap-2 flex-wrap">
                <InlineToggle
                  value={primaryFields.pro_rata ?? false}
                  label="Pro Rata"
                  onSave={(val) => handleCustomFieldSave("pro_rata", val)}
                />
                <InlineToggle
                  value={primaryFields.board_rights ?? false}
                  label="Board Rights"
                  onSave={(val) => handleCustomFieldSave("board_rights", val)}
                />
              </div>
            </div>

            {/* Major Terms Summary */}
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Major Terms Summary</div>
              <InlineTextarea
                value={primaryFields.major_terms_summary || null}
                placeholder="Summarize key terms..."
                onSave={(val) => handleCustomFieldSave("major_terms_summary", val as string)}
              />
            </div>

            {/* Use of Funds */}
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Use of Funds</div>
              <InlineTextarea
                value={primaryFields.use_of_funds_summary || null}
                placeholder="How will funds be used..."
                onSave={(val) => handleCustomFieldSave("use_of_funds_summary", val as string)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
