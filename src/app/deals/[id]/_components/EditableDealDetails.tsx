"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ExternalLink, Link as LinkIcon } from "lucide-react";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

interface DealDetailsData {
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
  notionUrl: string | null;
  owner: Owner | null;
}

interface EditableDealDetailsProps {
  deal: DealDetailsData;
  lpMode: boolean;
  onSave: (data: Partial<DealDetailsData>) => Promise<void>;
}

const STAGES = ["sourcing", "diligence", "negotiation", "documentation", "closing"];
const SOURCES = ["inbound", "outbound", "referral", "broker", "network", "conference"];

function formatCurrency(cents: number | null) {
  if (!cents) return null;
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(2)}B`;
  }
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(2)}M`;
  }
  return `$${dollars.toFixed(2)}`;
}

function parseCurrencyToCents(value: string): number | null {
  if (!value) return null;
  let clean = value.replace(/[$,]/g, "").trim();
  let multiplier = 1;

  if (clean.toLowerCase().endsWith("b")) {
    multiplier = 1_000_000_000;
    clean = clean.slice(0, -1);
  } else if (clean.toLowerCase().endsWith("m")) {
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

// ============ Inline Editable Fields ============

function InlineText({
  label,
  value,
  placeholder,
  onSave,
  prefix,
  suffix,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
  prefix?: string;
  suffix?: string;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  };

  return (
    <div className="group">
      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          placeholder={placeholder}
          className="w-full text-sm font-medium bg-transparent border-b border-slate-300 focus:border-slate-900 outline-none py-0.5 transition-colors"
        />
      ) : (
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="w-full text-left text-sm font-medium text-slate-900 py-0.5 border-b border-transparent group-hover:border-slate-200 transition-colors cursor-text min-h-[24px]"
        >
          {value ? (
            <span>{prefix}{value}{suffix}</span>
          ) : (
            <span className="text-slate-300">{placeholder || "—"}</span>
          )}
        </button>
      )}
    </div>
  );
}

function InlineSelect({
  label,
  value,
  options,
  placeholder,
  onSave,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editing]);

  const commit = (val: string) => {
    setEditing(false);
    if (val !== value) {
      onSave(val);
    }
  };

  return (
    <div className="group">
      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      {editing ? (
        <select
          ref={selectRef}
          value={value}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setEditing(false)}
          className="w-full text-sm font-medium bg-transparent border-b border-slate-300 focus:border-slate-900 outline-none py-0.5 cursor-pointer"
        >
          <option value="">{placeholder || "Select..."}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left text-sm font-medium text-slate-900 py-0.5 border-b border-transparent group-hover:border-slate-200 transition-colors cursor-pointer min-h-[24px]"
        >
          {value ? (
            <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
          ) : (
            <span className="text-slate-300">{placeholder || "—"}</span>
          )}
        </button>
      )}
    </div>
  );
}

function InlineDate({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const commit = (val: string) => {
    setEditing(false);
    if (val !== value) {
      onSave(val);
    }
  };

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="group">
      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      {editing ? (
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setEditing(false)}
          className="w-full text-sm font-medium bg-transparent border-b border-slate-300 focus:border-slate-900 outline-none py-0.5"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left text-sm font-medium text-slate-900 py-0.5 border-b border-transparent group-hover:border-slate-200 transition-colors cursor-pointer min-h-[24px]"
        >
          {value ? (
            <span>{formatDisplay(value)}</span>
          ) : (
            <span className="text-slate-300">Set date</span>
          )}
        </button>
      )}
    </div>
  );
}

function InlineNotes({
  value,
  onSave,
}: {
  value: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  };

  return (
    <div className="group">
      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
        Notes
      </div>
      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          rows={3}
          className="w-full text-sm bg-transparent border border-slate-200 rounded px-2 py-1.5 focus:border-slate-400 outline-none resize-none"
          placeholder="Internal notes..."
        />
      ) : (
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="w-full text-left text-sm text-slate-700 py-0.5 border-b border-transparent group-hover:border-slate-200 transition-colors cursor-text min-h-[24px]"
        >
          {value ? (
            <span className="line-clamp-2 whitespace-pre-wrap">{value}</span>
          ) : (
            <span className="text-slate-300">Add notes...</span>
          )}
        </button>
      )}
    </div>
  );
}

function InlineLink({
  label,
  url,
  onSave,
  placeholder,
}: {
  label: string;
  url: string;
  onSave: (val: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(url);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== url) {
      onSave(draft);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <LinkIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(url); setEditing(false); }
          }}
          placeholder={placeholder || "https://..."}
          className="flex-1 text-xs bg-transparent border-b border-slate-300 focus:border-slate-900 outline-none py-0.5"
        />
      </div>
    );
  }

  if (url) {
    return (
      <div className="flex items-center gap-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
        >
          {label}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
        <button
          onClick={() => { setDraft(url); setEditing(true); }}
          className="text-slate-300 hover:text-slate-500 transition-colors"
          title="Edit link"
        >
          <LinkIcon className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(""); setEditing(true); }}
      className="text-xs text-slate-300 hover:text-slate-500 transition-colors flex items-center gap-0.5"
    >
      <Plus className="h-3 w-3" />
      {label}
    </button>
  );
}

// ============ Main Component ============

export function EditableDealDetails({ deal, lpMode, onSave }: EditableDealDetailsProps) {
  const [tags, setTags] = useState<string[]>(deal.tags || []);
  const [newTag, setNewTag] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Sync tags from prop changes (after save/refresh)
  useEffect(() => {
    setTags(deal.tags || []);
  }, [deal.tags]);

  useEffect(() => {
    if (addingTag && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [addingTag]);

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

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <InlineSelect
          label="Stage"
          value={deal.stage || ""}
          options={STAGES}
          placeholder="Set stage"
          onSave={(val) => saveField("stage", val)}
        />
        <InlineText
          label="Confidence"
          value={deal.confidence?.toString() || ""}
          placeholder="0-100"
          suffix="%"
          type="number"
          onSave={(val) => saveField("confidence", val ? parseInt(val) : null)}
        />
        <InlineText
          label="Share Price"
          value={deal.sharePrice ? (deal.sharePrice / 100).toFixed(2) : ""}
          placeholder="0.00"
          prefix="$"
          type="number"
          onSave={(val) => saveField("sharePrice", val ? Math.round(parseFloat(val) * 100) : null)}
        />
        <InlineText
          label="Valuation"
          value={deal.valuation ? formatCurrency(deal.valuation)?.replace("$", "") || "" : ""}
          placeholder="e.g. 10B, 500M"
          prefix="$"
          onSave={(val) => saveField("valuation", parseCurrencyToCents(val))}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-4" />

      {/* Row 2: Timeline & Source */}
      <div className="grid grid-cols-4 gap-6">
        <InlineDate
          label="Expected Close"
          value={deal.expectedClose?.split("T")[0] || ""}
          onSave={(val) => saveField("expectedClose", val)}
        />
        <InlineDate
          label="Deadline"
          value={deal.deadline?.split("T")[0] || ""}
          onSave={(val) => saveField("deadline", val)}
        />
        <InlineSelect
          label="Source"
          value={deal.source || ""}
          options={SOURCES}
          placeholder="Set source"
          onSave={(val) => saveField("source", val)}
        />
        <InlineText
          label="Source Detail"
          value={deal.sourceDetail || ""}
          placeholder="Details..."
          onSave={(val) => saveField("sourceDetail", val)}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-4" />

      {/* Row 3: Links & Tags */}
      <div className="flex items-start justify-between gap-6">
        {/* Links */}
        <div>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Links
          </div>
          <div className="flex items-center gap-4">
            <InlineLink
              label="Drive"
              url={deal.driveUrl || ""}
              onSave={(val) => saveField("driveUrl", val)}
            />
            <InlineLink
              label="Data Room"
              url={deal.dataRoomUrl || ""}
              onSave={(val) => saveField("dataRoomUrl", val)}
            />
            <InlineLink
              label="Deck"
              url={deal.deckUrl || ""}
              onSave={(val) => saveField("deckUrl", val)}
            />
            <InlineLink
              label="Notion"
              url={deal.notionUrl || ""}
              onSave={(val) => saveField("notionUrl", val)}
              placeholder="https://notion.so/..."
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex-1 max-w-xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Tags
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-0.5 pr-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors"
                >
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
                className="text-xs border-b border-slate-300 outline-none w-16 py-0.5"
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
      </div>

      {/* Row 4: Notes (if not LP mode) */}
      {!lpMode && (
        <>
          <div className="border-t border-slate-100 my-4" />
          <InlineNotes
            value={deal.notes || ""}
            onSave={(val) => saveField("notes", val)}
          />
        </>
      )}
    </div>
  );
}
