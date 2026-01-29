"use client";

import { useState, useEffect, useRef } from "react";
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
  Plus,
  Search,
  Users,
  UserPlus,
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

interface BlockContactEntry {
  id?: number;
  personId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes: string;
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
  sellerContacts?: BlockContactEntry[];
  brokerContacts?: BlockContactEntry[];
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

interface PersonSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
  organization?: string;
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

const inputClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-muted hover:border-border focus:bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text";
const selectClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-muted hover:border-border focus:bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-pointer appearance-none";
const textareaClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-muted hover:border-border focus:bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text resize-none min-h-[80px]";

function PersonSearchInput({ onSelect, excludeIds, placeholder }: {
  onSelect: (person: PersonSearchResult) => void;
  excludeIds: number[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPerson, setNewPerson] = useState({ firstName: "", lastName: "", email: "" });
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    setCreating(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: PersonSearchResult[] = data.map((p: Record<string, unknown>) => ({
            id: p.id as number,
            firstName: p.firstName as string,
            lastName: p.lastName as string,
            title: p.title as string | undefined,
            email: p.email as string | undefined,
            phone: p.phone as string | undefined,
            organization: p.org as string | undefined,
          }));
          setResults(mapped.filter((p) => !excludeIds.includes(p.id)).slice(0, 8));
          setOpen(true);
        }
      } catch {}
      setLoading(false);
    }, 250);
  };

  const handleCreate = async () => {
    if (!newPerson.firstName.trim() || !newPerson.lastName.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: newPerson.firstName.trim(),
        lastName: newPerson.lastName.trim(),
      };
      if (newPerson.email.trim()) {
        payload.emails = [{ address: newPerson.email.trim(), label: "work" }];
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        onSelect({
          id: data.id,
          firstName: newPerson.firstName.trim(),
          lastName: newPerson.lastName.trim(),
          email: newPerson.email.trim() || undefined,
        });
        setQuery("");
        setOpen(false);
        setCreating(false);
        setNewPerson({ firstName: "", lastName: "", email: "" });
      }
    } catch {}
    setSaving(false);
  };

  const parseQueryName = () => {
    const parts = query.trim().split(/\s+/);
    return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-slate-400/50"
          placeholder={placeholder || "Search people..."}
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {results.map((person) => (
            <button
              key={person.id}
              onClick={() => { onSelect(person); setQuery(""); setOpen(false); setResults([]); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
            >
              <div>
                <span className="font-medium">{person.firstName} {person.lastName}</span>
                {person.title && <span className="text-muted-foreground ml-1.5">· {person.title}</span>}
              </div>
              {person.organization && <span className="text-xs text-muted-foreground">{person.organization}</span>}
            </button>
          ))}
          {!creating && (
            <button
              onClick={() => { const parsed = parseQueryName(); setCreating(true); setNewPerson({ firstName: parsed.firstName, lastName: parsed.lastName, email: "" }); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-blue-600 border-t"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create new contact{query.length >= 2 ? `: "${query}"` : ""}</span>
            </button>
          )}
          {creating && (
            <div className="p-3 border-t space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPerson.firstName}
                  onChange={(e) => setNewPerson({ ...newPerson, firstName: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 text-sm rounded border border-border focus:border-border focus:outline-none"
                  placeholder="First name"
                  autoFocus
                />
                <input
                  type="text"
                  value={newPerson.lastName}
                  onChange={(e) => setNewPerson({ ...newPerson, lastName: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 text-sm rounded border border-border focus:border-border focus:outline-none"
                  placeholder="Last name"
                />
              </div>
              <input
                type="email"
                value={newPerson.email}
                onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm rounded border border-border focus:border-border focus:outline-none"
                placeholder="Email (optional)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={saving || !newPerson.firstName.trim() || !newPerson.lastName.trim()}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-background bg-foreground hover:bg-foreground/90 rounded disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ORG_KINDS = ["fund", "company", "spv", "broker", "bank", "law_firm", "other"];

function OrgSearchInput({ value, onSelect, onClear }: {
  value: { id: number; name: string } | null;
  onSelect: (org: { id: number; name: string }) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: number; name: string; kind: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", kind: "company" });
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    setCreating(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.slice(0, 8));
          setOpen(true);
        }
      } catch {}
      setLoading(false);
    }, 250);
  };

  const handleCreate = async () => {
    if (!newOrg.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrg.name.trim(), kind: newOrg.kind }),
      });
      if (res.ok) {
        const data = await res.json();
        onSelect({ id: data.id, name: data.name });
        setQuery("");
        setOpen(false);
        setCreating(false);
        setNewOrg({ name: "", kind: "company" });
      }
    } catch {}
    setSaving(false);
  };

  if (value) {
    return (
      <div className="flex items-center justify-between p-2.5 bg-muted rounded-lg group">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{value.name}</span>
        </div>
        <button
          onClick={onClear}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-slate-400/50"
          placeholder="Search organizations..."
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {results.map((org) => (
            <button
              key={org.id}
              onClick={() => { onSelect({ id: org.id, name: org.name }); setQuery(""); setOpen(false); setResults([]); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
            >
              <span className="font-medium">{org.name}</span>
              {org.kind && <span className="text-xs text-muted-foreground">{org.kind}</span>}
            </button>
          ))}
          {!creating && (
            <button
              onClick={() => { setCreating(true); setNewOrg({ name: query, kind: "company" }); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-blue-600 border-t"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create new organization{query.length >= 2 ? `: "${query}"` : ""}</span>
            </button>
          )}
          {creating && (
            <div className="p-3 border-t space-y-2">
              <input
                type="text"
                value={newOrg.name}
                onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm rounded border border-border focus:border-border focus:outline-none"
                placeholder="Organization name"
                autoFocus
              />
              <select
                value={newOrg.kind}
                onChange={(e) => setNewOrg({ ...newOrg, kind: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm rounded border border-border focus:border-border focus:outline-none"
              >
                {ORG_KINDS.map((k) => (
                  <option key={k} value={k}>{k.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={saving || !newOrg.name.trim()}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-background bg-foreground hover:bg-foreground/90 rounded disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BlockSlideOut({ block, dealId, onClose, onSave, onDelete }: BlockSlideOutProps) {
  const isNew = !block;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [sellerContacts, setSellerContacts] = useState<BlockContactEntry[]>(
    block?.sellerContacts || []
  );
  const [brokerContacts, setBrokerContacts] = useState<BlockContactEntry[]>(
    block?.brokerContacts || []
  );

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
      const blockContactsPayload = [
        ...sellerContacts.map((c) => ({ person_id: c.personId, role: "seller_contact", notes: c.notes || null })),
        ...brokerContacts.map((c) => ({ person_id: c.personId, role: "broker_contact", notes: c.notes || null })),
      ];

      const payload = {
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
        block_contacts: blockContactsPayload,
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
      0: "bg-muted text-muted-foreground border-border",
      1: "bg-yellow-100 text-yellow-700 border-yellow-200",
      2: "bg-orange-100 text-orange-700 border-orange-200",
      3: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[heat] || colors[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-card shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
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
          <button onClick={onClose} className="p-2 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-1">
            {/* Status */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-2 px-3">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
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
                          : "bg-muted border-border text-muted-foreground"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
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
                <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Heat</span>
              </div>
              <div className="flex gap-1.5 px-3">
                {HEAT_LEVELS.map((h) => (
                  <button
                    key={h.value}
                    onClick={() => setFormData({ ...formData, heat: h.value })}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      formData.heat === h.value
                        ? getHeatColor(h.value)
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
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
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {formData.verified ? "Verified" : "Not verified"}
              </button>
            </div>

            {/* Seller Organization */}
            <div className="py-3 border-t mt-2">
              <div className="flex items-center gap-2 mb-2 px-3">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Seller Organization</span>
              </div>
              <div className="px-3">
                <OrgSearchInput
                  value={formData.sellerId ? { id: formData.sellerId, name: formData.sellerName } : null}
                  onSelect={(org) => setFormData({ ...formData, sellerId: org.id, sellerName: org.name })}
                  onClear={() => setFormData({ ...formData, sellerId: null, sellerName: "" })}
                />
              </div>
            </div>

            {/* Seller Contacts */}
            <div className="py-3 border-t">
              <div className="flex items-center justify-between mb-2 px-3">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Seller Contacts {sellerContacts.length > 0 && `(${sellerContacts.length})`}
                  </span>
                </div>
              </div>
              <div className="px-3 space-y-2">
                {sellerContacts.map((contact, idx) => (
                  <div key={contact.personId} className="p-2.5 bg-muted rounded-lg group">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{contact.firstName} {contact.lastName}</div>
                      <button
                        onClick={() => setSellerContacts(sellerContacts.filter((_, i) => i !== idx))}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                    {(contact.email || contact.phone) && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {contact.email}{contact.email && contact.phone ? " · " : ""}{contact.phone}
                      </div>
                    )}
                    <input
                      type="text"
                      value={contact.notes}
                      onChange={(e) => {
                        const updated = [...sellerContacts];
                        updated[idx] = { ...updated[idx], notes: e.target.value };
                        setSellerContacts(updated);
                      }}
                      className="mt-1.5 w-full px-2 py-1 text-xs rounded border border-transparent bg-transparent hover:bg-card hover:border-border focus:bg-card focus:border-border focus:outline-none transition-all"
                      placeholder="Add note..."
                    />
                  </div>
                ))}
                <PersonSearchInput
                  excludeIds={sellerContacts.map((c) => c.personId)}
                  placeholder="Add seller contact..."
                  onSelect={(person) => {
                    setSellerContacts([...sellerContacts, {
                      personId: person.id,
                      firstName: person.firstName,
                      lastName: person.lastName,
                      email: person.email,
                      phone: person.phone,
                      notes: "",
                    }]);
                  }}
                />
              </div>
            </div>

            {/* Broker / Access Source Contacts */}
            <div className="py-3 border-t">
              <div className="flex items-center justify-between mb-2 px-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Broker / Source Contacts {brokerContacts.length > 0 && `(${brokerContacts.length})`}
                  </span>
                </div>
              </div>
              <div className="px-3 space-y-2">
                {brokerContacts.map((contact, idx) => (
                  <div key={contact.personId} className="p-2.5 bg-muted rounded-lg group">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{contact.firstName} {contact.lastName}</div>
                      <button
                        onClick={() => setBrokerContacts(brokerContacts.filter((_, i) => i !== idx))}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                    {(contact.email || contact.phone) && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {contact.email}{contact.email && contact.phone ? " · " : ""}{contact.phone}
                      </div>
                    )}
                    <input
                      type="text"
                      value={contact.notes}
                      onChange={(e) => {
                        const updated = [...brokerContacts];
                        updated[idx] = { ...updated[idx], notes: e.target.value };
                        setBrokerContacts(updated);
                      }}
                      className="mt-1.5 w-full px-2 py-1 text-xs rounded border border-transparent bg-transparent hover:bg-card hover:border-border focus:bg-card focus:border-border focus:outline-none transition-all"
                      placeholder="Add note..."
                    />
                  </div>
                ))}
                <PersonSearchInput
                  excludeIds={brokerContacts.map((c) => c.personId)}
                  placeholder="Add broker/source contact..."
                  onSelect={(person) => {
                    setBrokerContacts([...brokerContacts, {
                      personId: person.id,
                      firstName: person.firstName,
                      lastName: person.lastName,
                      email: person.email,
                      phone: person.phone,
                      notes: "",
                    }]);
                  }}
                />
              </div>
            </div>

            {/* Share Class */}
            <div className="py-2 border-t">
              <div className="flex items-center gap-2 mb-1 px-3">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Share Class</span>
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
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Shares</span>
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
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price / Share</span>
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
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Value</span>
              </div>
              <input
                type="text"
                value={formData.totalCents}
                onChange={(e) => setFormData({ ...formData, totalCents: e.target.value })}
                className={`${inputClass} text-muted-foreground`}
                placeholder="Auto-calculated"
              />
            </div>

            {/* Min Size */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Minimum Size</span>
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
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Discount</span>
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
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Implied Valuation</span>
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
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Terms</span>
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
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expires</span>
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
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</span>
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
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source Detail</span>
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
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Internal Notes</span>
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
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Mapped Interests ({block.mappedInterests.length})
                  </span>
                </div>
                <div className="space-y-2 px-3">
                  {block.mappedInterests.map((interest) => (
                    <div
                      key={interest.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="text-sm font-medium">{interest.investor || "—"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
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
        <div className="sticky bottom-0 bg-card border-t px-6 py-4 flex items-center justify-between">
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
                    className="px-3 py-1 text-sm text-muted-foreground hover:bg-muted rounded"
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-md disabled:opacity-50 transition-colors"
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
