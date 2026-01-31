"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
  broker: { label: "Broker", color: "bg-slate-500", bg: "bg-slate-100", text: "text-slate-600" },
  law_firm: { label: "Law Firm", color: "bg-emerald-500", bg: "bg-emerald-100", text: "text-emerald-700" },
  bank: { label: "Bank", color: "bg-cyan-500", bg: "bg-cyan-100", text: "text-cyan-700" },
  service_provider: { label: "Service", color: "bg-rose-500", bg: "bg-rose-100", text: "text-rose-700" },
  other: { label: "Other", color: "bg-gray-500", bg: "bg-gray-100", text: "text-gray-600" },
};

const WARMTH_CONFIG = [
  { label: "Cold", color: "bg-slate-400", hoverBg: "hover:bg-slate-100" },
  { label: "Warm", color: "bg-yellow-500", hoverBg: "hover:bg-yellow-50" },
  { label: "Hot", color: "bg-orange-500", hoverBg: "hover:bg-orange-50" },
  { label: "Champion", color: "bg-green-500", hoverBg: "hover:bg-green-50" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  live: { label: "Live", bg: "bg-green-100", text: "text-green-700" },
  sourcing: { label: "Sourcing", bg: "bg-slate-100", text: "text-slate-600" },
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
    <div className="flex items-center gap-2">
      <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-20 shrink-0">{label}</div>
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
      className="text-xs text-slate-700 bg-transparent border-b border-slate-300 outline-none py-0.5 w-full"
    />
  ) : (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="text-xs text-slate-700 hover:text-blue-600 transition-colors cursor-text text-left">
      {value || <span className="text-slate-300 italic">{placeholder}</span>}
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
      className="text-xs font-medium bg-transparent border-b border-slate-300 outline-none py-0 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{KIND_CONFIG[opt]?.label || formatLabel(opt)}</option>
      ))}
    </select>
  ) : (
    <button
      onClick={() => setEditing(true)}
      className={`text-xs font-medium cursor-pointer transition-colors ${
        displayClass || (config ? `px-1.5 py-0.5 rounded text-[10px] ${config.bg} ${config.text}` : "text-slate-900 hover:text-blue-600")
      }`}
    >
      {value ? (config?.label || formatLabel(value)) : <span className="text-slate-300">{placeholder}</span>}
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
      className="text-xs font-medium bg-transparent border-b border-slate-300 outline-none py-0"
    />
  ) : (
    <button onClick={() => setEditing(true)} className="text-xs font-medium text-slate-900 hover:text-blue-600 transition-colors cursor-pointer">
      {localValue ? formatDate(localValue) : <span className="text-slate-300">Set date</span>}
    </button>
  );
}

function InlineWarmthSelector({ warmth, onSave }: { warmth: number; onSave: (val: number) => void }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="flex items-center gap-0.5" onMouseLeave={() => setEditing(false)}>
        {WARMTH_CONFIG.map((w, i) => (
          <button
            key={i}
            onClick={() => { onSave(i); setEditing(false); }}
            className={`px-1.5 py-0.5 text-[9px] font-medium rounded border transition-colors ${
              i === warmth
                ? `${w.color} text-white border-transparent`
                : `bg-white border-slate-200 text-slate-600 ${w.hoverBg}`
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 group cursor-pointer">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 w-2.5 rounded-full transition-colors ${i <= warmth ? WARMTH_CONFIG[warmth].color : "bg-slate-200"}`} />
        ))}
      </div>
      <span className="text-[10px] text-slate-600 group-hover:text-blue-600 transition-colors font-medium">
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
      <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200">
        <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(url || ""); setEditing(false); } }}
          placeholder="https://..."
          className="text-xs bg-transparent outline-none flex-1 min-w-0"
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
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
        onContextMenu={(e) => { e.preventDefault(); setDraft(url); setEditing(true); }}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
        <ExternalLink className="h-2.5 w-2.5 opacity-50" />
      </a>
    );
  }

  return (
    <button
      onClick={() => { setDraft(""); setEditing(true); }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-600 rounded-lg transition-colors border border-dashed border-slate-200 hover:border-slate-300"
    >
      <Icon className="h-3.5 w-3.5" />
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
          rows={3}
          className="w-full text-xs leading-relaxed text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:border-slate-300 outline-none resize-none placeholder:text-slate-300"
          placeholder="Add notes about this organization..."
        />
        <div className="flex items-center gap-1.5">
          <button onClick={commit} className="px-2.5 py-1 text-[10px] font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors">
            Save
          </button>
          <button onClick={() => { setDraft(value); setEditing(false); }} className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors">
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
        className="w-full text-left text-xs text-slate-400 hover:text-slate-600 py-2.5 px-3 border border-dashed border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
      >
        Click to add notes...
      </button>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="w-full text-left bg-amber-50 border border-amber-100 rounded-lg p-3 hover:bg-amber-100/50 transition-colors cursor-text"
    >
      <p className="text-xs text-slate-700 whitespace-pre-wrap">{value}</p>
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
    <div className="flex items-center gap-1 flex-wrap">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-normal pl-2 pr-1 py-0.5 h-5 bg-slate-100 rounded">
          {tag}
          <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-500 transition-colors">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
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
          className="text-[10px] border-b border-slate-300 outline-none w-16 py-0.5 bg-transparent"
        />
      ) : (
        <button onClick={() => setAddingTag(true)} className="text-slate-300 hover:text-slate-500 transition-colors p-0.5">
          <Plus className="h-3 w-3" />
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
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <div className="h-3.5 w-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <Building2 className="h-8 w-8 text-slate-300" />
        <span className="text-xs text-slate-500">Organization not found</span>
        <button onClick={() => router.back()} className="text-xs text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const location = [org.address.city, org.address.state, org.address.country].filter(Boolean).join(", ");
  const kindConfig = KIND_CONFIG[org.kind] || KIND_CONFIG.other;

  return (
    <div className="h-[calc(100vh-1.5rem)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
        </div>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{org.name}</h1>
                {org.sector && <p className="text-xs text-slate-600">{org.sector}</p>}
                {location && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </p>
                )}
              </div>
            </div>

            {/* Inline Editable Properties */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
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
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
              <LinkChip label="Website" icon={Globe} url={org.website} onSave={(val) => saveField("website", val || null)} />
              <LinkChip label="LinkedIn" icon={LinkedInIcon} url={org.linkedinUrl} onSave={(val) => saveField("linkedinUrl", val || null)} />
              <LinkChip label="Twitter" icon={TwitterIcon} url={org.twitterUrl} onSave={(val) => saveField("twitterUrl", val || null)} />
              {org.email && (
                <a href={`mailto:${org.email}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              )}
              {org.phone && (
                <a href={`tel:${org.phone}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              )}
            </div>

            {/* More Section */}
            <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="mt-3">
              <CollapsibleTrigger className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
                {moreOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                More Details
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">People</span>
            </div>
            <div className="text-lg font-semibold text-slate-900">{org.people.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Deals</span>
            </div>
            <div className="text-lg font-semibold text-slate-900">{org.deals.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Last Contact</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {formatDateShort(org.lastContactedAt) || <span className="text-slate-300 font-normal">Never</span>}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Follow Up</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {formatDateShort(org.nextFollowUpAt) || <span className="text-slate-300 font-normal">Not set</span>}
            </div>
          </div>
        </div>

      {/* Description */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <h2 className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2">Description</h2>
        <NotesEditor
          value={org.description || ""}
          onSave={(val) => saveField("description", val || null)}
        />
      </div>

      {/* Tags */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <h2 className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2">Tags</h2>
        <TagsEditor tags={org.tags || []} onSave={(tags) => saveField("tags", tags.length > 0 ? tags : null)} />
      </div>

      {/* Notes */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <h2 className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2">Notes</h2>
        <NotesEditor
          value={org.notes || ""}
          onSave={(val) => saveField("notes", val || null)}
        />
      </div>

      {/* People & Deals */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* People */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              People <span className="text-slate-300">({org.people.length})</span>
            </h2>
          </div>
          {org.people.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No people at this organization</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {org.people.map((person) => (
                <Link
                  key={person.id}
                  href={`/people/${person.id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-500 flex-shrink-0">
                    {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-xs">{person.firstName} {person.lastName}</div>
                    {person.title && <div className="text-[10px] text-slate-500 truncate">{person.title}</div>}
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${WARMTH_CONFIG[person.warmth].color}`} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Deals */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Deals <span className="text-slate-300">({org.deals.length})</span>
            </h2>
          </div>
          {org.deals.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No deals with this organization</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {org.deals.map((deal) => {
                const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.sourcing;
                return (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-xs">{deal.name}</div>
                      {formatCurrency(deal.committed) && (
                        <div className="text-[10px] text-slate-500">{formatCurrency(deal.committed)} committed</div>
                      )}
                    </div>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${status.bg} ${status.text}`}>
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
      <div className="text-[10px] text-slate-400 pb-4">
        Added {formatDate(org.createdAt)}
      </div>
      </div>
    </div>
  );
}
