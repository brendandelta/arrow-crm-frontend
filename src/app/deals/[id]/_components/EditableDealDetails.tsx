"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Plus,
  X,
  ExternalLink,
  FolderOpen,
  FileText,
  Presentation,
  ChevronRight,
  ChevronDown,
  DollarSign,
  User,
} from "lucide-react";
import { DEAL_PRIORITIES, getPriorityConfig } from "../../_components/priority";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

export interface DealDetailsData {
  priority: number;
  stage: string | null;
  confidence: number | null;
  sharePrice: number | null;
  valuation: number | null;
  source: string | null;
  sourceDetail: string | null;
  expectedClose: string | null;
  deadline: string | null;
  tags: string[] | null;
  notes: string | null;
  driveUrl: string | null;
  dataRoomUrl: string | null;
  deckUrl: string | null;
  owner: Owner | null;
  ownerId?: number | null;
}

interface EditableDealDetailsProps {
  deal: DealDetailsData;
  lpMode: boolean;
  onSave: (data: Partial<DealDetailsData>) => Promise<void>;
}

const STAGES = ["sourcing", "due_diligence", "negotiation", "documentation", "closing"];
const SOURCES = ["inbound", "outbound", "referral", "broker", "network", "conference"];

const STAGE_COLORS: Record<string, string> = {
  sourcing: "bg-slate-100 text-slate-700",
  due_diligence: "bg-sky-50 text-sky-700 border border-sky-200",
  negotiation: "bg-violet-50 text-violet-700 border border-violet-200",
  documentation: "bg-amber-50 text-amber-700 border border-amber-200",
  closing: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function formatLabel(val: string) {
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(cents: number | null) {
  if (!cents) return null;
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(2)}B`;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(2)}`;
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  // Parse as local date to avoid timezone shift for date-only strings
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ============ Main Component ============

export function EditableDealDetails({ deal, lpMode, onSave }: EditableDealDetailsProps) {
  const [tags, setTags] = useState<string[]>(deal.tags || []);
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTags(deal.tags || []); }, [deal.tags]);
  useEffect(() => { if (addingTag && tagInputRef.current) tagInputRef.current.focus(); }, [addingTag]);

  const saveField = (field: string, value: unknown) => {
    onSave({ [field]: value || null } as Partial<DealDetailsData>);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updated = [...tags, newTag.trim()];
      setTags(updated);
      setNewTag("");
      onSave({ tags: updated });
    }
  };

  const removeTag = (tag: string) => {
    const updated = tags.filter((t) => t !== tag);
    setTags(updated);
    onSave({ tags: updated.length > 0 ? updated : null });
  };

  const links = [
    { key: "driveUrl", label: "Drive", icon: FolderOpen, url: deal.driveUrl },
    { key: "dataRoomUrl", label: "Data Room", icon: FileText, url: deal.dataRoomUrl },
    { key: "deckUrl", label: "Deck", icon: Presentation, url: deal.deckUrl },
  ];

  const hasTermsData = !!(deal.valuation || deal.sharePrice || deal.source);
  const showTerms = hasTermsData || !lpMode;

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="px-5 py-4">
        {/* ═══ Zone A + Zone B: Two-column layout ═══ */}
        <div className="flex gap-8">
          {/* Zone A: Deal Controls (left) */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Stage */}
            <FieldRow label="Stage">
              <InlineSelect
                value={deal.stage || ""}
                options={STAGES}
                placeholder="Set stage"
                onSave={(val) => saveField("stage", val)}
                displayClass={STAGE_COLORS[deal.stage || ""] || "bg-slate-50 text-slate-600"}
              />
            </FieldRow>

            {/* Priority */}
            <FieldRow label="Priority">
              <InlinePrioritySelector
                value={deal.priority}
                onSave={(val) => saveField("priority", val)}
              />
            </FieldRow>

            {/* Close */}
            <FieldRow label="Close">
              <InlineDateCompact
                value={deal.expectedClose?.split("T")[0] || ""}
                onSave={(val) => saveField("expectedClose", val)}
              />
            </FieldRow>

            {/* Deadline */}
            {(!lpMode || deal.deadline) && (
              <FieldRow label="Deadline">
                <InlineDateCompact
                  value={deal.deadline?.split("T")[0] || ""}
                  onSave={(val) => saveField("deadline", val)}
                />
              </FieldRow>
            )}

            {/* Owner */}
            {(!lpMode || deal.owner) && (
              <FieldRow label="Owner">
                <InlineOwnerField
                  owner={deal.owner}
                  onSave={(ownerId) => onSave({ ownerId })}
                />
              </FieldRow>
            )}

            {/* Confidence */}
            <FieldRow label="Confidence">
              <ConfidenceMeter
                value={deal.confidence}
                onSave={(val) => saveField("confidence", val)}
              />
            </FieldRow>
          </div>

          {/* Zone B: Terms Snapshot (right) */}
          {showTerms && (
            <div className="shrink-0 space-y-3 min-w-[180px]">
              {/* Valuation */}
              {(!lpMode || deal.valuation) && (
                <FieldRow label="Valuation">
                  <InlineCurrencyField
                    value={deal.valuation}
                    placeholder="e.g. 10B, 500M"
                    onSave={(val) => saveField("valuation", val)}
                  />
                </FieldRow>
              )}

              {/* PPS */}
              {(!lpMode || deal.sharePrice) && (
                <FieldRow label="PPS">
                  <InlineSharePriceField
                    value={deal.sharePrice}
                    onSave={(val) => saveField("sharePrice", val)}
                  />
                </FieldRow>
              )}

              {/* Source */}
              {(!lpMode || deal.source) && (
                <FieldRow label="Source">
                  <InlineSelect
                    value={deal.source || ""}
                    options={SOURCES}
                    placeholder="—"
                    onSave={(val) => saveField("source", val)}
                  />
                </FieldRow>
              )}
            </div>
          )}
        </div>

        {/* ═══ Zone C: Links ═══ */}
        <div className="flex items-center gap-1 mt-4">
          {links.map((link) => (
            <LinkChip
              key={link.key}
              label={link.label}
              icon={link.icon}
              url={link.url}
              onSave={(val) => saveField(link.key, val)}
            />
          ))}
        </div>

        {/* ═══ "More" Drawer ═══ */}
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
            {moreOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            More
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            {/* Source Detail */}
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Source Detail</div>
              <InlineTextCompact
                value={deal.sourceDetail || ""}
                placeholder="Add context about source..."
                onSave={(val) => saveField("sourceDetail", val)}
              />
            </div>

            {/* Tags */}
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Tags</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[11px] font-normal pl-2 pr-1 py-0 h-5 flex items-center gap-0.5 bg-slate-100">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-500 transition-colors ml-0.5">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
                {addingTag ? (
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onBlur={() => { if (newTag.trim()) addTag(); setAddingTag(false); setNewTag(""); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { addTag(); setAddingTag(false); }
                      if (e.key === "Escape") { setAddingTag(false); setNewTag(""); }
                    }}
                    placeholder="tag"
                    className="text-[11px] border-b border-slate-300 outline-none w-14 py-0.5 bg-transparent"
                  />
                ) : (
                  <button
                    onClick={() => setAddingTag(true)}
                    className="text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notes */}
            {!lpMode && (
              <div>
                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Notes</div>
                <NotesEditor
                  value={deal.notes || ""}
                  onSave={(val) => saveField("notes", val)}
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* ═══ Clarification Line ═══ */}
        <div className="mt-4 text-[11px] text-slate-400 italic">
          KPIs are live-calculated from interests/blocks
        </div>
      </div>
    </Card>
  );
}

// ============ Inline Priority Selector ============

function InlinePrioritySelector({ value, onSave }: { value: number; onSave: (val: number) => void }) {
  const [editing, setEditing] = useState(false);
  const config = getPriorityConfig(value);

  if (editing) {
    return (
      <div className="flex gap-1">
        {DEAL_PRIORITIES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => { onSave(p.value); setEditing(false); }}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-full border transition-colors ${
              p.value === value ? p.color : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full border cursor-pointer transition-colors hover:opacity-80 ${config.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </button>
  );
}

// ============ Field Row Wrapper ============

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider w-20 shrink-0">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ============ InlineOwnerField ============

function InlineOwnerField({ owner, onSave }: {
  owner: Owner | null;
  onSave: (ownerId: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [users, setUsers] = useState<Owner[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing, users]);

  const startEdit = async () => {
    setEditing(true);
    if (users.length === 0) {
      setLoadingUsers(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  if (editing) {
    if (loadingUsers) {
      return <span className="text-[13px] text-slate-400">Loading...</span>;
    }
    return (
      <select
        ref={ref}
        value={owner?.id?.toString() || ""}
        onChange={(e) => {
          const val = e.target.value ? parseInt(e.target.value) : null;
          onSave(val);
          setEditing(false);
        }}
        onBlur={() => setEditing(false)}
        className="text-[13px] font-medium bg-transparent border-b border-slate-300 outline-none py-0 cursor-pointer"
      >
        <option value="">Unassigned</option>
        {users.map((u) => (
          <option key={u.id} value={u.id.toString()}>
            {u.firstName} {u.lastName}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="flex items-center gap-1.5 text-[13px] font-medium text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
    >
      <User className="h-3 w-3 text-slate-400" />
      {owner ? `${owner.firstName} ${owner.lastName}` : <span className="text-slate-300">Assign owner</span>}
    </button>
  );
}

// ============ Inline Compact Fields ============

function InlineSelect({ value, options, placeholder, onSave, displayClass }: {
  value: string;
  options: string[];
  placeholder?: string;
  onSave: (val: string) => void;
  displayClass?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  return editing ? (
    <select
      ref={ref}
      value={value}
      onChange={(e) => { onSave(e.target.value); setEditing(false); }}
      onBlur={() => setEditing(false)}
      className="text-[13px] font-medium bg-transparent border-b border-slate-300 outline-none py-0 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{formatLabel(opt)}</option>
      ))}
    </select>
  ) : (
    <button
      onClick={() => setEditing(true)}
      className={`text-[13px] font-medium cursor-pointer transition-colors ${
        displayClass
          ? `px-2 py-0.5 rounded-full text-[11px] ${displayClass}`
          : "text-slate-900 hover:text-indigo-600"
      }`}
    >
      {value ? formatLabel(value) : <span className="text-slate-300">{placeholder}</span>}
    </button>
  );
}

function InlineDateCompact({ value, onSave }: { value: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalValue(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  return editing ? (
    <input
      ref={ref}
      type="date"
      value={localValue}
      onChange={(e) => { setLocalValue(e.target.value); onSave(e.target.value); setEditing(false); }}
      onBlur={() => setEditing(false)}
      className="text-[13px] font-medium bg-transparent border-b border-slate-300 outline-none py-0"
    />
  ) : (
    <button onClick={() => setEditing(true)} className="text-[13px] font-medium text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer">
      {localValue ? formatDate(localValue) : <span className="text-slate-300">Set date</span>}
    </button>
  );
}

function InlineTextCompact({ value, placeholder, onSave }: {
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  return editing ? (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
      placeholder={placeholder}
      className="text-[13px] text-slate-700 bg-transparent border-b border-slate-300 outline-none py-0.5 w-full"
    />
  ) : (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="text-[13px] text-slate-700 hover:text-indigo-600 transition-colors cursor-text text-left">
      {value || <span className="text-slate-300 italic">{placeholder}</span>}
    </button>
  );
}

function InlineCurrencyField({ value, placeholder, onSave }: {
  value: number | null;
  placeholder?: string;
  onSave: (val: number | null) => void;
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

  return editing ? (
    <div className="flex items-center gap-0.5">
      <DollarSign className="h-3 w-3 text-slate-400" />
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value ? (formatCurrency(value)?.replace("$", "") || "") : ""); setEditing(false); } }}
        placeholder={placeholder}
        className="text-[13px] font-semibold text-slate-900 bg-transparent border-b border-slate-300 outline-none py-0.5 w-24"
      />
    </div>
  ) : (
    <button onClick={() => { setDraft(value ? (formatCurrency(value)?.replace("$", "") || "") : ""); setEditing(true); }} className="text-[13px] font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-text">
      {value ? formatCurrency(value) : <span className="text-slate-300 font-normal">{placeholder || "—"}</span>}
    </button>
  );
}

function InlineSharePriceField({ value, onSave }: {
  value: number | null;
  onSave: (val: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ? (value / 100).toFixed(2) : "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    const cents = draft ? Math.round(parseFloat(draft) * 100) : null;
    if (cents !== value) onSave(cents);
  };

  return editing ? (
    <div className="flex items-center gap-0.5">
      <DollarSign className="h-3 w-3 text-slate-400" />
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value ? (value / 100).toFixed(2) : ""); setEditing(false); } }}
        placeholder="0.00"
        className="text-[13px] font-semibold text-slate-900 bg-transparent border-b border-slate-300 outline-none py-0.5 w-20"
      />
    </div>
  ) : (
    <button onClick={() => { setDraft(value ? (value / 100).toFixed(2) : ""); setEditing(true); }} className="text-[13px] font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-text">
      {value ? `$${(value / 100).toFixed(2)}` : <span className="text-slate-300 font-normal">—</span>}
    </button>
  );
}

// ============ Confidence Meter ============

function ConfidenceMeter({ value, onSave, showLabel }: {
  value: number | null;
  onSave: (val: number | null) => void;
  showLabel?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() || "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    const num = draft ? parseInt(draft) : null;
    if (num !== value) onSave(num);
  };

  const pct = value || 0;
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : pct > 0 ? "bg-rose-400" : "bg-slate-200";

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        min="0"
        max="100"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value?.toString() || ""); setEditing(false); } }}
        className="text-[13px] font-medium text-slate-900 bg-transparent border-b border-slate-300 outline-none py-0 w-12"
        placeholder="0"
      />
    );
  }

  return (
    <button onClick={() => { setDraft(value?.toString() || ""); setEditing(true); }} className="flex items-center gap-1.5 cursor-pointer group">
      <div className="w-12 h-[5px] rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] font-medium text-slate-600 group-hover:text-indigo-600 transition-colors tabular-nums">
        {value !== null && value !== undefined ? `${value}%` : <span className="text-slate-300">—</span>}
      </span>
      {showLabel && value !== null && value !== undefined && (
        <span className="text-[11px] text-slate-400">
          {pct >= 70 ? "High" : pct >= 40 ? "Medium" : "Low"}
        </span>
      )}
    </button>
  );
}

// ============ Link Chip ============

function LinkChip({ label, icon: Icon, url, onSave }: {
  label: string;
  icon: typeof FolderOpen;
  url: string | null;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(url || "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== (url || "")) onSave(draft);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-50 rounded-md px-2 py-1 border border-slate-200">
        <Icon className="h-3 w-3 text-slate-400 shrink-0" />
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(url || ""); setEditing(false); } }}
          placeholder="https://..."
          className="text-[11px] bg-transparent outline-none w-40"
        />
      </div>
    );
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-md px-2.5 py-1 transition-colors border border-slate-200 hover:border-indigo-200"
        onContextMenu={(e) => { e.preventDefault(); setDraft(url); setEditing(true); }}
      >
        <Icon className="h-3 w-3" />
        {label}
        <ExternalLink className="h-2.5 w-2.5 opacity-50" />
      </a>
    );
  }

  return (
    <button
      onClick={() => { setDraft(""); setEditing(true); }}
      className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-slate-500 rounded-md px-2.5 py-1 transition-colors border border-dashed border-slate-200 hover:border-slate-300"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

// ============ Notes Editor ============

function NotesEditor({ value, onSave }: { value: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const isLong = value.length > 200;
  const displayText = !expanded && isLong ? value.slice(0, 200) + "..." : value;

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          rows={6}
          className="w-full text-[14px] leading-relaxed text-slate-700 bg-white border border-slate-200 rounded-lg px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none placeholder:text-slate-300"
          placeholder="Write your deal narrative here — context, thesis, key considerations..."
        />
        <div className="flex items-center gap-2">
          <button onClick={commit} className="px-3 py-1.5 text-[12px] font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700 transition-colors shadow-sm">
            Save
          </button>
          <button onClick={() => { setDraft(value); setEditing(false); }} className="px-3 py-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!value) {
    return (
      <button
        onClick={() => { setDraft(""); setEditing(true); }}
        className="text-[13px] text-slate-300 italic hover:text-slate-500 transition-colors cursor-text"
      >
        Add deal narrative...
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => { setDraft(value); setEditing(true); }}
        className="text-[14px] leading-relaxed text-slate-700 whitespace-pre-wrap text-left cursor-text hover:bg-slate-50 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors"
      >
        {displayText}
      </button>
      {isLong && !expanded && (
        <button onClick={() => setExpanded(true)} className="text-[12px] text-indigo-500 hover:text-indigo-700 mt-1 block">
          Show more
        </button>
      )}
      {isLong && expanded && (
        <button onClick={() => setExpanded(false)} className="text-[12px] text-indigo-500 hover:text-indigo-700 mt-1 block">
          Show less
        </button>
      )}
    </div>
  );
}
