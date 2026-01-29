"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
  Users,
  Briefcase,
  Calendar,
  Pencil,
} from "lucide-react";
import { LinkedInIcon, TwitterIcon } from "@/components/icons/SocialIcons";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface Organization {
  id: number;
  name: string;
  legalName: string | null;
  kind: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  phone: string | null;
  email: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  sector: string | null;
  subSector: string | null;
  stage: string | null;
  employeeRange: string | null;
  warmth: number;
  tags: string[];
  notes: string | null;
  meta: Record<string, unknown>;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  people: Array<{
    id: number;
    firstName: string;
    lastName: string;
    title: string | null;
    email: string | null;
    warmth: number;
  }>;
  deals: Array<{
    id: number;
    name: string;
    status: string;
    kind: string;
    committed: number | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ============ Configuration ============

const KIND_OPTIONS = ["fund", "company", "spv", "broker", "law_firm", "bank", "service_provider", "other"] as const;
const KIND_CONFIG: Record<string, { label: string; color: string; bg: string; text: string }> = {
  fund: { label: "Fund", color: "bg-blue-500", bg: "bg-blue-100", text: "text-blue-700" },
  company: { label: "Company", color: "bg-purple-500", bg: "bg-purple-100", text: "text-purple-700" },
  spv: { label: "SPV", color: "bg-amber-500", bg: "bg-amber-100", text: "text-amber-700" },
  broker: { label: "Broker", color: "bg-muted0", bg: "bg-muted", text: "text-muted-foreground" },
  law_firm: { label: "Law Firm", color: "bg-emerald-500", bg: "bg-emerald-100", text: "text-emerald-700" },
  bank: { label: "Bank", color: "bg-cyan-500", bg: "bg-cyan-100", text: "text-cyan-700" },
  service_provider: { label: "Service", color: "bg-rose-500", bg: "bg-rose-100", text: "text-rose-700" },
  other: { label: "Other", color: "bg-gray-500", bg: "bg-gray-100", text: "text-gray-600" },
};

const WARMTH_CONFIG = [
  { label: "Cold", color: "bg-muted-foreground", hoverBg: "hover:bg-muted" },
  { label: "Warm", color: "bg-yellow-500", hoverBg: "hover:bg-yellow-50" },
  { label: "Hot", color: "bg-orange-500", hoverBg: "hover:bg-orange-50" },
  { label: "Champion", color: "bg-green-500", hoverBg: "hover:bg-green-50" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  live: { label: "Live", bg: "bg-green-100", text: "text-green-700" },
  sourcing: { label: "Sourcing", bg: "bg-muted", text: "text-muted-foreground" },
  closing: { label: "Closing", bg: "bg-blue-100", text: "text-blue-700" },
  closed: { label: "Closed", bg: "bg-purple-100", text: "text-purple-700" },
  dead: { label: "Dead", bg: "bg-red-100", text: "text-red-600" },
};

// ============ Utility Functions ============

function formatCurrency(cents: number | null) {
  if (!cents || cents === 0) return null;
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${dollars.toFixed(0)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr: string | null) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLabel(str: string) {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============ Inline Editor Components ============

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider w-24 shrink-0">{label}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function InlineText({ value, placeholder, onSave }: {
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
      className="text-[13px] text-foreground bg-transparent border-b border-border outline-none py-0.5 w-full"
    />
  ) : (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="text-[13px] text-foreground hover:text-indigo-600 transition-colors cursor-text text-left">
      {value || <span className="text-muted-foreground/60 italic">{placeholder}</span>}
    </button>
  );
}

function InlineSelect({ value, options, placeholder, onSave, displayClass }: {
  value: string;
  options: readonly string[];
  placeholder?: string;
  onSave: (val: string) => void;
  displayClass?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const config = KIND_CONFIG[value];

  return editing ? (
    <select
      ref={ref}
      value={value}
      onChange={(e) => { onSave(e.target.value); setEditing(false); }}
      onBlur={() => setEditing(false)}
      className="text-[13px] font-medium bg-transparent border-b border-border outline-none py-0 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{KIND_CONFIG[opt]?.label || formatLabel(opt)}</option>
      ))}
    </select>
  ) : (
    <button
      onClick={() => setEditing(true)}
      className={`text-[13px] font-medium cursor-pointer transition-colors ${
        displayClass || (config ? `px-2 py-0.5 rounded-full text-[11px] ${config.bg} ${config.text}` : "text-foreground hover:text-indigo-600")
      }`}
    >
      {value ? (config?.label || formatLabel(value)) : <span className="text-muted-foreground/60">{placeholder}</span>}
    </button>
  );
}

function InlineDate({ value, onSave }: { value: string; onSave: (val: string) => void }) {
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
      className="text-[13px] font-medium bg-transparent border-b border-border outline-none py-0"
    />
  ) : (
    <button onClick={() => setEditing(true)} className="text-[13px] font-medium text-foreground hover:text-indigo-600 transition-colors cursor-pointer">
      {localValue ? formatDate(localValue) : <span className="text-muted-foreground/60">Set date</span>}
    </button>
  );
}

function InlineWarmthSelector({ warmth, onSave }: { warmth: number; onSave: (val: number) => void }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="flex items-center gap-1" onMouseLeave={() => setEditing(false)}>
        {WARMTH_CONFIG.map((w, i) => (
          <button
            key={i}
            onClick={() => { onSave(i); setEditing(false); }}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
              i === warmth
                ? `${w.color} text-white border-transparent`
                : `bg-card border-border text-muted-foreground ${w.hoverBg}`
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-2 group cursor-pointer">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-2 w-4 rounded-full transition-all ${i <= warmth ? WARMTH_CONFIG[warmth].color : "bg-muted"}`} />
        ))}
      </div>
      <span className="text-sm text-muted-foreground group-hover:text-indigo-600 transition-colors font-medium">
        {WARMTH_CONFIG[warmth].label}
      </span>
    </button>
  );
}

function LinkChip({ label, icon: Icon, url, onSave }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
      <div className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-2 border border-border">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(url || ""); setEditing(false); } }}
          placeholder="https://..."
          className="text-sm bg-transparent outline-none flex-1 min-w-0"
        />
      </div>
    );
  }

  if (url) {
    return (
      <a
        href={url.startsWith("http") ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-indigo-600 bg-muted hover:bg-indigo-50 rounded-lg transition-colors"
        onContextMenu={(e) => { e.preventDefault(); setDraft(url); setEditing(true); }}
      >
        <Icon className="h-4 w-4" />
        {label}
        <ExternalLink className="h-3 w-3 opacity-50" />
      </a>
    );
  }

  return (
    <button
      onClick={() => { setDraft(""); setEditing(true); }}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-muted-foreground rounded-lg transition-colors border border-dashed border-border hover:border-border"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function NotesEditor({ value, onSave }: { value: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
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

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="w-full text-sm leading-relaxed text-foreground bg-card border border-border rounded-lg px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none placeholder:text-muted-foreground/60"
          placeholder="Add notes about this organization..."
        />
        <div className="flex items-center gap-2">
          <button onClick={commit} className="px-3 py-1.5 text-xs font-medium text-background bg-foreground rounded-md hover:bg-foreground/90 transition-colors">
            Save
          </button>
          <button onClick={() => { setDraft(value); setEditing(false); }} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-muted-foreground transition-colors">
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
        className="w-full text-left text-sm text-muted-foreground hover:text-muted-foreground py-3 px-4 border border-dashed border-border rounded-lg hover:border-border transition-colors"
      >
        Click to add notes...
      </button>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="w-full text-left bg-amber-50 border border-amber-100 rounded-lg p-4 hover:bg-amber-100/50 transition-colors cursor-text"
    >
      <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>
    </button>
  );
}

function TagsEditor({ tags, onSave }: { tags: string[]; onSave: (tags: string[]) => void }) {
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (addingTag && tagInputRef.current) tagInputRef.current.focus(); }, [addingTag]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onSave([...tags, newTag.trim()]);
      setNewTag("");
    }
    setAddingTag(false);
  };

  const removeTag = (tag: string) => {
    onSave(tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-[11px] font-normal pl-2.5 pr-1 py-0.5 h-6 flex items-center gap-1 bg-muted">
          {tag}
          <button onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-rose-500 transition-colors ml-0.5">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {addingTag ? (
        <input
          ref={tagInputRef}
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onBlur={() => { if (newTag.trim()) addTag(); else setAddingTag(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTag();
            if (e.key === "Escape") { setAddingTag(false); setNewTag(""); }
          }}
          placeholder="tag name"
          className="text-[11px] border-b border-border outline-none w-20 py-0.5 bg-transparent"
        />
      ) : (
        <button onClick={() => setAddingTag(true)} className="text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1">
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ============ Main Component ============

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);

  // Fetch organization
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrg(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch organization:", err);
        setLoading(false);
      });
  }, [params.id]);

  // Save field
  const saveField = useCallback(async (field: string, value: unknown) => {
    if (!org) return;

    const oldOrg = org;
    // Optimistic update
    setOrg((prev) => prev ? { ...prev, [field]: value } : prev);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations/${org.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        }
      );
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Saved");
    } catch {
      setOrg(oldOrg);
      toast.error("Failed to save");
    }
  }, [org]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 border-2 border-border border-t-slate-600 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Building2 className="h-12 w-12 text-muted-foreground/60" />
        <span className="text-muted-foreground">Organization not found</span>
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const location = [org.address.city, org.address.state, org.address.country].filter(Boolean).join(", ");
  const kindConfig = KIND_CONFIG[org.kind] || KIND_CONFIG.other;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground mb-1">{org.name}</h1>
                {org.sector && <p className="text-muted-foreground">{org.sector}</p>}
                {location && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {location}
                  </p>
                )}
              </div>
            </div>

            {/* Inline Editable Properties */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <FieldRow label="Type">
                <InlineSelect
                  value={org.kind}
                  options={KIND_OPTIONS}
                  placeholder="Select type"
                  onSave={(val) => saveField("kind", val)}
                />
              </FieldRow>
              <FieldRow label="Warmth">
                <InlineWarmthSelector
                  warmth={org.warmth}
                  onSave={(val) => saveField("warmth", val)}
                />
              </FieldRow>
              <FieldRow label="Sector">
                <InlineText
                  value={org.sector || ""}
                  placeholder="Add sector"
                  onSave={(val) => saveField("sector", val || null)}
                />
              </FieldRow>
              <FieldRow label="Sub-sector">
                <InlineText
                  value={org.subSector || ""}
                  placeholder="Add sub-sector"
                  onSave={(val) => saveField("subSector", val || null)}
                />
              </FieldRow>
              <FieldRow label="Last Contact">
                <InlineDate
                  value={org.lastContactedAt?.split("T")[0] || ""}
                  onSave={(val) => saveField("lastContactedAt", val || null)}
                />
              </FieldRow>
              <FieldRow label="Follow Up">
                <InlineDate
                  value={org.nextFollowUpAt?.split("T")[0] || ""}
                  onSave={(val) => saveField("nextFollowUpAt", val || null)}
                />
              </FieldRow>
            </div>

            {/* Links */}
            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-border">
              <LinkChip label="Website" icon={Globe} url={org.website} onSave={(val) => saveField("website", val || null)} />
              <LinkChip label="LinkedIn" icon={LinkedInIcon} url={org.linkedinUrl} onSave={(val) => saveField("linkedinUrl", val || null)} />
              <LinkChip label="Twitter" icon={TwitterIcon} url={org.twitterUrl} onSave={(val) => saveField("twitterUrl", val || null)} />
              {org.email && (
                <a href={`mailto:${org.email}`} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-indigo-600 bg-muted hover:bg-indigo-50 rounded-lg transition-colors">
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              )}
              {org.phone && (
                <a href={`tel:${org.phone}`} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-indigo-600 bg-muted hover:bg-indigo-50 rounded-lg transition-colors">
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              )}
            </div>

            {/* More Section */}
            <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="mt-4">
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {moreOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                More Details
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <FieldRow label="Legal Name">
                    <InlineText
                      value={org.legalName || ""}
                      placeholder="Add legal name"
                      onSave={(val) => saveField("legalName", val || null)}
                    />
                  </FieldRow>
                  <FieldRow label="Stage">
                    <InlineText
                      value={org.stage || ""}
                      placeholder="e.g., Series B"
                      onSave={(val) => saveField("stage", val || null)}
                    />
                  </FieldRow>
                  <FieldRow label="Employees">
                    <InlineText
                      value={org.employeeRange || ""}
                      placeholder="e.g., 50-100"
                      onSave={(val) => saveField("employeeRange", val || null)}
                    />
                  </FieldRow>
                  <FieldRow label="Email">
                    <InlineText
                      value={org.email || ""}
                      placeholder="Add email"
                      onSave={(val) => saveField("email", val || null)}
                    />
                  </FieldRow>
                  <FieldRow label="Phone">
                    <InlineText
                      value={org.phone || ""}
                      placeholder="Add phone"
                      onSave={(val) => saveField("phone", val || null)}
                    />
                  </FieldRow>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">People</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">{org.people.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Deals</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">{org.deals.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Last Contact</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {formatDateShort(org.lastContactedAt) || <span className="text-muted-foreground/60 font-normal">Never</span>}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Follow Up</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {formatDateShort(org.nextFollowUpAt) || <span className="text-muted-foreground/60 font-normal">Not set</span>}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Description</h2>
        <NotesEditor
          value={org.description || ""}
          onSave={(val) => saveField("description", val || null)}
        />
      </div>

      {/* Tags */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Tags</h2>
        <TagsEditor tags={org.tags || []} onSave={(tags) => saveField("tags", tags.length > 0 ? tags : null)} />
      </div>

      {/* Notes */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Notes</h2>
        <NotesEditor
          value={org.notes || ""}
          onSave={(val) => saveField("notes", val || null)}
        />
      </div>

      {/* People & Deals */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* People */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              People <span className="text-muted-foreground/60">({org.people.length})</span>
            </h2>
          </div>
          {org.people.length === 0 ? (
            <div className="p-5 text-center text-muted-foreground text-sm">No people at this organization</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {org.people.map((person) => (
                <Link
                  key={person.id}
                  href={`/people/${person.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                    {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{person.firstName} {person.lastName}</div>
                    {person.title && <div className="text-xs text-muted-foreground truncate">{person.title}</div>}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${WARMTH_CONFIG[person.warmth].color}`} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Deals */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Deals <span className="text-muted-foreground/60">({org.deals.length})</span>
            </h2>
          </div>
          {org.deals.length === 0 ? (
            <div className="p-5 text-center text-muted-foreground text-sm">No deals with this organization</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {org.deals.map((deal) => {
                const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.sourcing;
                return (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm">{deal.name}</div>
                      {formatCurrency(deal.committed) && (
                        <div className="text-xs text-muted-foreground">{formatCurrency(deal.committed)} committed</div>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground mb-8">
        Added {formatDate(org.createdAt)}
      </div>
    </div>
  );
}
