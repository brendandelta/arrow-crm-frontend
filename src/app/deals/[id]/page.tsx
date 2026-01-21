"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Tag,
  Plus,
  X,
  Flame,
  User,
  Briefcase,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// Types
interface Organization {
  id: number;
  name: string;
  kind?: string;
}

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
}

interface Block {
  id: number;
  seller: Organization | null;
  sellerType: string | null;
  contact: Person | null;
  broker: Organization | null;
  brokerContact: Person | null;
  shareClass: string | null;
  shares: number | null;
  priceCents: number | null;
  totalCents: number | null;
  minSizeCents: number | null;
  impliedValuationCents: number | null;
  discountPct: number | null;
  status: string;
  heat: number;
  heatLabel: string;
  terms: string | null;
  expiresAt: string | null;
  source: string | null;
  sourceDetail: string | null;
  verified: boolean;
  internalNotes: string | null;
  createdAt: string;
}

interface Interest {
  id: number;
  investor: Organization | null;
  contact: Person | null;
  decisionMaker: Person | null;
  targetCents: number | null;
  minCents: number | null;
  maxCents: number | null;
  committedCents: number | null;
  allocatedCents: number | null;
  allocatedBlockId: number | null;
  status: string;
  source: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  internalNotes: string | null;
  createdAt: string;
}

interface Deal {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
    kind: string;
    sector: string | null;
    website: string | null;
    logoUrl: string | null;
  } | null;
  status: string | null;
  stage: string | null;
  kind: string | null;
  priority: number;
  confidence: number | null;
  committed: number;
  closed: number;
  target: number | null;
  valuation: number | null;
  sharePrice: number | null;
  shareClass: string | null;
  expectedClose: string | null;
  deadline: string | null;
  sourcedAt: string | null;
  qualifiedAt: string | null;
  closedAt: string | null;
  source: string | null;
  sourceDetail: string | null;
  driveUrl: string | null;
  dataRoomUrl: string | null;
  deckUrl: string | null;
  notionUrl: string | null;
  tags: string[] | null;
  notes: string | null;
  structureNotes: string | null;
  blocks: Block[] | null;
  interests: Interest[] | null;
  recentActivities: Array<{
    id: number;
    kind: string;
    subject: string | null;
    occurredAt: string;
    startsAt: string | null;
    outcome: string | null;
  }> | null;
  createdAt: string;
  updatedAt: string;
}

// Utilities
function formatCurrency(cents: number | null | undefined) {
  if (!cents || cents === 0) return "—";
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatPersonName(person: Person | null) {
  if (!person) return "—";
  return `${person.firstName} ${person.lastName}`;
}

// Badge Components
function StatusBadge({ status }: { status: unknown }) {
  const styles: Record<string, string> = {
    live: "bg-green-100 text-green-800",
    sourcing: "bg-slate-100 text-slate-600",
    closing: "bg-blue-100 text-blue-800",
    closed: "bg-purple-100 text-purple-800",
    dead: "bg-red-100 text-red-800",
  };
  const s = typeof status === "string" ? status : "sourcing";
  return (
    <Badge className={styles[s] || styles.sourcing}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </Badge>
  );
}

function HeatBadge({ heat, label }: { heat: number; label: string }) {
  const styles: Record<number, string> = {
    0: "bg-slate-100 text-slate-600",
    1: "bg-yellow-100 text-yellow-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-red-100 text-red-700",
  };
  const icons: Record<number, React.ReactNode> = {
    0: null,
    1: null,
    2: <Flame className="h-3 w-3" />,
    3: <><Flame className="h-3 w-3" /><Flame className="h-3 w-3" /></>,
  };
  return (
    <Badge className={`${styles[heat]} flex items-center gap-1`}>
      {icons[heat]}
      {label}
    </Badge>
  );
}

function BlockStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: "bg-green-100 text-green-700",
    reserved: "bg-yellow-100 text-yellow-700",
    sold: "bg-purple-100 text-purple-700",
    withdrawn: "bg-slate-100 text-slate-600",
  };
  return (
    <Badge className={styles[status] || styles.available}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function InterestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    prospecting: "bg-slate-100 text-slate-600",
    pending: "bg-blue-100 text-blue-700",
    approved: "bg-cyan-100 text-cyan-700",
    committed: "bg-green-100 text-green-700",
    funded: "bg-purple-100 text-purple-700",
    declined: "bg-red-100 text-red-600",
    withdrawn: "bg-slate-100 text-slate-500",
  };
  return (
    <Badge className={styles[status] || styles.prospecting}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Missing Data Functions
function getMissingDealFields(deal: Deal): string[] {
  const missing: string[] = [];
  if (!deal.company) missing.push("Underlying Company");
  if (!deal.stage) missing.push("Stage");
  if (!deal.confidence) missing.push("Confidence");
  if (!deal.valuation) missing.push("Valuation");
  if (!deal.sharePrice) missing.push("Share Price");
  if (!deal.shareClass) missing.push("Share Class");
  if (!deal.target) missing.push("Target Amount");
  if (!deal.expectedClose) missing.push("Expected Close");
  if (!deal.deadline) missing.push("Deadline");
  if (!deal.source) missing.push("Source");
  if (!deal.sourcedAt) missing.push("Sourced Date");
  if (!deal.driveUrl) missing.push("Drive Link");
  if (!deal.dataRoomUrl) missing.push("Data Room");
  if (!deal.deckUrl) missing.push("Deck");
  if (!deal.tags || deal.tags.length === 0) missing.push("Tags");
  if (!deal.structureNotes) missing.push("Structure Notes");
  if (!deal.notes) missing.push("Internal Notes");
  return missing;
}

function MissingDataDropdown({ missingFields }: { missingFields: string[] }) {
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
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-2">
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Missing Data</div>
            {missingFields.map((field) => (
              <div key={field} className="px-3 py-1.5 text-sm text-slate-600">
                {field}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Block Slide-out Panel
function BlockSlideOut({
  block,
  onClose,
  onUpdate,
}: {
  block: Block;
  onClose: () => void;
  onUpdate: (block: Block) => void;
}) {
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
          {/* Status & Heat */}
          <div className="flex items-center gap-3">
            <BlockStatusBadge status={editing ? formData.status : block.status} />
            <HeatBadge heat={editing ? formData.heat : block.heat} label={block.heatLabel} />
            {block.verified && (
              <Badge className="bg-blue-100 text-blue-700">Verified</Badge>
            )}
          </div>

          {/* Allocation */}
          {(block.totalCents || block.shares || block.priceCents) && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Allocation</h3>
              {block.totalCents && (
                <div className="text-3xl font-semibold">{formatCurrency(block.totalCents)}</div>
              )}
              {(block.shares || block.priceCents) && (
                <div className="text-sm text-muted-foreground mt-1">
                  {block.shares?.toLocaleString()} shares {block.priceCents && `@ ${formatCurrency(block.priceCents)}/share`}
                </div>
              )}
              {block.shareClass && (
                <div className="text-sm text-muted-foreground">Class: {block.shareClass}</div>
              )}
            </div>
          )}

          {/* Seller */}
          {block.seller && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Seller</h3>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Link href={`/organizations/${block.seller.id}`} className="font-medium hover:underline">
                  {block.seller.name}
                </Link>
                <Badge variant="outline" className="text-xs">{block.seller.kind}</Badge>
              </div>
            </div>
          )}

          {/* Contact */}
          {block.contact && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Link href={`/people/${block.contact.id}`} className="font-medium hover:underline">
                    {formatPersonName(block.contact)}
                  </Link>
                </div>
                {block.contact.title && (
                  <div className="text-sm text-muted-foreground ml-6">{block.contact.title}</div>
                )}
                {block.contact.email && (
                  <a href={`mailto:${block.contact.email}`} className="text-sm text-blue-600 hover:underline ml-6 block">
                    {block.contact.email}
                  </a>
                )}
                {block.contact.phone && (
                  <div className="text-sm text-muted-foreground ml-6">{block.contact.phone}</div>
                )}
              </div>
            </div>
          )}

          {/* Broker / Source */}
          {(block.broker || block.brokerContact || block.source) && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Broker / Source</h3>
              <div className="space-y-2">
                {block.broker && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{block.broker.name}</span>
                  </div>
                )}
                {block.brokerContact && (
                  <div className="flex items-center gap-2 ml-6">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Link href={`/people/${block.brokerContact.id}`} className="hover:underline">
                      {formatPersonName(block.brokerContact)}
                    </Link>
                  </div>
                )}
                {block.source && !block.broker && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Source:</span> {block.source}
                    {block.sourceDetail && ` - ${block.sourceDetail}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terms */}
          {(editing || block.terms) && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Terms</h3>
              {editing ? (
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="e.g., 2nd layer SPV with 0/0/13 terms"
                />
              ) : (
                <p className="text-sm">{block.terms}</p>
              )}
            </div>
          )}

          {/* Heat (editable) */}
          {editing && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Heat Score</h3>
              <div className="flex gap-2">
                {[
                  { value: 0, label: "Cold" },
                  { value: 1, label: "Warm" },
                  { value: 2, label: "Hot" },
                  { value: 3, label: "Fire" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, heat: option.value })}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      formData.heat === option.value
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status (editable) */}
          {editing && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          )}

          {/* Notes */}
          {(editing || block.internalNotes) && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Internal Notes</h3>
              {editing ? (
                <textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={4}
                  placeholder="Add notes about this block..."
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{block.internalNotes}</p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {block.expiresAt && (
                <div>
                  <dt className="text-muted-foreground">Expires</dt>
                  <dd className="font-medium">{formatDate(block.expiresAt)}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">{formatDate(block.createdAt)}</dd>
              </div>
              {block.impliedValuationCents && (
                <div>
                  <dt className="text-muted-foreground">Implied Valuation</dt>
                  <dd className="font-medium">{formatCurrency(block.impliedValuationCents)}</dd>
                </div>
              )}
              {block.discountPct && (
                <div>
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="font-medium">{block.discountPct}%</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800"
            >
              Edit Block
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Add Block Slide-out Panel
function AddBlockSlideOut({
  dealId,
  onClose,
  onCreated,
}: {
  dealId: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    seller_id: "",
    contact_id: "",
    broker_id: "",
    broker_contact_id: "",
    shares: "",
    price_cents: "",
    share_class: "",
    min_size_cents: "",
    terms: "",
    heat: 0,
    status: "available",
    expires_at: "",
    source: "",
    source_detail: "",
    internal_notes: "",
  });

  useEffect(() => {
    // Fetch organizations and people for dropdowns
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`).then(r => r.json()),
    ]).then(([orgs, ppl]) => {
      setOrganizations(orgs);
      setPeople(ppl);
    });
  }, []);

  const fundOrganizations = organizations.filter(o => o.kind === "fund");
  const brokerOrganizations = organizations.filter(o => o.kind === "broker" || o.kind === "fund");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Calculate total_cents from shares * price
    const shares = parseInt(formData.shares) || 0;
    const priceCents = parseInt(formData.price_cents) || 0;
    const totalCents = shares * priceCents;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/blocks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deal_id: dealId,
            seller_id: formData.seller_id || null,
            contact_id: formData.contact_id || null,
            broker_id: formData.broker_id || null,
            broker_contact_id: formData.broker_contact_id || null,
            shares: formData.shares ? parseInt(formData.shares) : null,
            price_cents: formData.price_cents ? parseInt(formData.price_cents) : null,
            total_cents: totalCents || null,
            share_class: formData.share_class || null,
            min_size_cents: formData.min_size_cents ? parseInt(formData.min_size_cents) : null,
            terms: formData.terms || null,
            heat: formData.heat,
            status: formData.status,
            expires_at: formData.expires_at || null,
            source: formData.source || null,
            source_detail: formData.source_detail || null,
            internal_notes: formData.internal_notes || null,
          }),
        }
      );
      if (res.ok) {
        onCreated();
        onClose();
      } else {
        const error = await res.json();
        console.error("Failed to create block:", error);
      }
    } catch (err) {
      console.error("Failed to create block:", err);
    }
    setSaving(false);
  };

  // Calculate total for display
  const calculatedTotal = (parseInt(formData.shares) || 0) * (parseInt(formData.price_cents) || 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Block</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Seller */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Seller (Fund)
            </label>
            <select
              value={formData.seller_id}
              onChange={(e) => setFormData({ ...formData, seller_id: e.target.value, contact_id: "" })}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select seller...</option>
              {fundOrganizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seller Contact */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Seller Contact
            </label>
            <select
              value={formData.contact_id}
              onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select contact...</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.firstName} {person.lastName}
                  {person.title ? ` - ${person.title}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Shares & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Shares
              </label>
              <input
                type="number"
                value={formData.shares}
                onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="e.g., 10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Price (cents)
              </label>
              <input
                type="number"
                value={formData.price_cents}
                onChange={(e) => setFormData({ ...formData, price_cents: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="e.g., 5000"
              />
            </div>
          </div>

          {/* Calculated Total */}
          {calculatedTotal > 0 && (
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{formatCurrency(calculatedTotal)}</span>
            </div>
          )}

          {/* Share Class & Min Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Share Class
              </label>
              <input
                type="text"
                value={formData.share_class}
                onChange={(e) => setFormData({ ...formData, share_class: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="e.g., Series B"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Min Size (cents)
              </label>
              <input
                type="number"
                value={formData.min_size_cents}
                onChange={(e) => setFormData({ ...formData, min_size_cents: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="e.g., 50000000"
              />
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Terms
            </label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={2}
              placeholder="e.g., 2nd layer SPV with 0/0/13 terms"
            />
          </div>

          {/* Heat Score */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Heat Score
            </label>
            <div className="flex gap-2">
              {[
                { value: 0, label: "Cold" },
                { value: 1, label: "Warm" },
                { value: 2, label: "Hot" },
                { value: 3, label: "Fire" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, heat: option.value })}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    formData.heat === option.value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status & Expires */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Expires
              </label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          {/* Broker (optional) */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3">Broker (Optional)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Broker Firm
                </label>
                <select
                  value={formData.broker_id}
                  onChange={(e) => setFormData({ ...formData, broker_id: e.target.value, broker_contact_id: "" })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">No broker</option>
                  {brokerOrganizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              {formData.broker_id && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Broker Contact
                  </label>
                  <select
                    value={formData.broker_contact_id}
                    onChange={(e) => setFormData({ ...formData, broker_contact_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Select contact...</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Source (optional) */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3">Source (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Source
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="e.g., Inbound"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Source Detail
                </label>
                <input
                  type="text"
                  value={formData.source_detail}
                  onChange={(e) => setFormData({ ...formData, source_detail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="e.g., Email"
                />
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Internal Notes
            </label>
            <textarea
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
              placeholder="Add any notes about this block..."
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Block"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setDeal(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch deal:", err);
        setLoading(false);
      });
  }, [params.id]);

  const handleBlockUpdate = (updatedBlock: Block) => {
    if (!deal) return;
    setDeal({
      ...deal,
      blocks: (deal.blocks || []).map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
    });
    setSelectedBlock(updatedBlock);
  };

  const refreshDeal = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${params.id}`)
      .then((res) => res.json())
      .then((data) => setDeal(data))
      .catch((err) => console.error("Failed to refresh deal:", err));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Deal not found</span>
      </div>
    );
  }

  const progress =
    deal.committed > 0 && deal.closed > 0
      ? Math.min(100, Math.round((deal.closed / deal.committed) * 100))
      : 0;

  const missingFields = getMissingDealFields(deal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <MissingDataDropdown missingFields={missingFields} />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{deal.name}</h1>
            <StatusBadge status={deal.status} />
            {deal.kind && (
              <Badge variant="outline" className="capitalize">
                {deal.kind}
              </Badge>
            )}
          </div>
          {deal.company && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <Link
                href={`/organizations/${deal.company.id}`}
                className="hover:underline"
              >
                {deal.company.name}
              </Link>
              {deal.company.sector && (
                <>
                  <span>·</span>
                  <span>{deal.company.sector}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {deal.driveUrl && (
            <a
              href={deal.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Drive
            </a>
          )}
          {deal.dataRoomUrl && (
            <a
              href={deal.dataRoomUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Data Room
            </a>
          )}
          {deal.deckUrl && (
            <a
              href={deal.deckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Deck
            </a>
          )}
        </div>
      </div>

      {/* Stats Row - only show cards with data */}
      {(deal.committed > 0 || deal.valuation || (deal.interests?.length || 0) > 0 || deal.expectedClose) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {deal.committed > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="h-4 w-4" />
                  Committed
                </div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(deal.committed)}
                </div>
              </CardContent>
            </Card>
          )}
          {deal.valuation && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Valuation
                </div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(deal.valuation)}
                </div>
              </CardContent>
            </Card>
          )}
          {(deal.interests?.length || 0) > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Users className="h-4 w-4" />
                  Interests
                </div>
                <div className="text-2xl font-semibold">{deal.interests?.length || 0}</div>
              </CardContent>
            </Card>
          )}
          {deal.expectedClose && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  Expected Close
                </div>
                <div className="text-2xl font-semibold">
                  {formatDate(deal.expectedClose)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {deal.committed > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Funding Progress
              </span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
              <span>{formatCurrency(deal.closed)} closed</span>
              <span>{formatCurrency(deal.committed)} committed</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocks Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Blocks
            <Badge variant="secondary">{deal.blocks?.length || 0}</Badge>
          </CardTitle>
          <button
            onClick={() => setShowAddBlock(true)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add Block
          </button>
        </CardHeader>
        <CardContent>
          {!deal.blocks || deal.blocks.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No blocks yet
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Allocation</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Heat</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deal.blocks.map((block) => (
                    <TableRow
                      key={block.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setSelectedBlock(block)}
                    >
                      <TableCell>
                        {block.seller ? (
                          <div>
                            <div className="font-medium">{block.seller.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {block.seller.kind}
                            </div>
                          </div>
                        ) : block.source ? (
                          <span className="text-muted-foreground">{block.source}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {block.contact ? (
                          <div>
                            <div className="font-medium">
                              {formatPersonName(block.contact)}
                            </div>
                            {block.contact.title && (
                              <div className="text-xs text-muted-foreground">
                                {block.contact.title}
                              </div>
                            )}
                          </div>
                        ) : block.brokerContact ? (
                          <div>
                            <div className="font-medium">
                              {formatPersonName(block.brokerContact)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Broker
                            </div>
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {block.totalCents ? formatCurrency(block.totalCents) : null}
                      </TableCell>
                      <TableCell>
                        {block.terms && (
                          <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                            {block.terms}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {block.shares && (
                          <div className="text-sm">
                            {block.shares.toLocaleString()}
                          </div>
                        )}
                        {block.shareClass && (
                          <div className="text-xs text-muted-foreground">
                            {block.shareClass}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <HeatBadge heat={block.heat} label={block.heatLabel} />
                      </TableCell>
                      <TableCell>
                        <BlockStatusBadge status={block.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Investor Interests
            <Badge variant="secondary">{deal.interests?.length || 0}</Badge>
          </CardTitle>
          <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
            <Plus className="h-4 w-4" />
            Add Interest
          </button>
        </CardHeader>
        <CardContent>
          {!deal.interests || deal.interests.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No investor interests yet
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Committed</TableHead>
                    <TableHead>Next Step</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deal.interests.map((interest) => (
                    <TableRow key={interest.id} className="cursor-pointer hover:bg-slate-50">
                      <TableCell>
                        {interest.investor && (
                          <div>
                            <div className="font-medium">{interest.investor.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {interest.investor.kind}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {interest.contact && (
                          <div>
                            <div className="font-medium">
                              {formatPersonName(interest.contact)}
                            </div>
                            {interest.contact.title && (
                              <div className="text-xs text-muted-foreground">
                                {interest.contact.title}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {interest.targetCents ? formatCurrency(interest.targetCents) : null}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {interest.committedCents ? formatCurrency(interest.committedCents) : null}
                      </TableCell>
                      <TableCell>
                        {interest.nextStep && (
                          <div>
                            <div className="text-sm">{interest.nextStep}</div>
                            {interest.nextStepAt && (
                              <div className="text-xs text-muted-foreground">
                                {formatDate(interest.nextStepAt)}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <InterestStatusBadge status={interest.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {deal.recentActivities && deal.recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Recent Activity
              <Badge variant="secondary">{deal.recentActivities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deal.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{activity.subject || activity.kind.replace(/_/g, " ")}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(activity.startsAt || activity.occurredAt)}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{activity.kind.replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {deal.stage && (
              <div>
                <dt className="text-muted-foreground">Stage</dt>
                <dd className="font-medium">{deal.stage}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Priority</dt>
              <dd className="font-medium">P{deal.priority}</dd>
            </div>
            {deal.confidence && (
              <div>
                <dt className="text-muted-foreground">Confidence</dt>
                <dd className="font-medium">{deal.confidence}%</dd>
              </div>
            )}
            {deal.sharePrice && (
              <div>
                <dt className="text-muted-foreground">Share Price</dt>
                <dd className="font-medium">{formatCurrency(deal.sharePrice)}</dd>
              </div>
            )}
            {deal.shareClass && (
              <div>
                <dt className="text-muted-foreground">Share Class</dt>
                <dd className="font-medium">{deal.shareClass}</dd>
              </div>
            )}
            {deal.source && (
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-medium">{deal.source}</dd>
              </div>
            )}
            {deal.sourcedAt && (
              <div>
                <dt className="text-muted-foreground">Sourced</dt>
                <dd className="font-medium">{formatDate(deal.sourcedAt)}</dd>
              </div>
            )}
            {deal.deadline && (
              <div>
                <dt className="text-muted-foreground">Deadline</dt>
                <dd className="font-medium">{formatDate(deal.deadline)}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(deal.createdAt)}</dd>
            </div>
          </dl>
          {deal.tags && deal.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {deal.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {deal.structureNotes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm text-muted-foreground mb-2">
                Structure Notes
              </h4>
              <p className="text-sm whitespace-pre-wrap">{deal.structureNotes}</p>
            </div>
          )}
          {deal.notes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm text-muted-foreground mb-2">
                Internal Notes
              </h4>
              <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Slide-out */}
      {selectedBlock && (
        <BlockSlideOut
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onUpdate={handleBlockUpdate}
        />
      )}

      {/* Add Block Slide-out */}
      {showAddBlock && (
        <AddBlockSlideOut
          dealId={deal.id}
          onClose={() => setShowAddBlock(false)}
          onCreated={refreshDeal}
        />
      )}
    </div>
  );
}
