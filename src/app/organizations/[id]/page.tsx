"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  AlertCircle
} from "lucide-react";

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

function formatCurrency(cents: number | null) {
  if (!cents || cents === 0) return null;
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
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateShort(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

const kindConfig: Record<string, { label: string; color: string }> = {
  fund: { label: "Fund", color: "bg-blue-500" },
  company: { label: "Company", color: "bg-purple-500" },
  spv: { label: "SPV", color: "bg-amber-500" },
  broker: { label: "Broker", color: "bg-slate-500" },
  law_firm: { label: "Law Firm", color: "bg-emerald-500" },
};

const warmthConfig = [
  { label: "Cold", color: "bg-slate-500" },
  { label: "Warm", color: "bg-yellow-500" },
  { label: "Hot", color: "bg-orange-500" },
  { label: "Champion", color: "bg-green-500" },
];

function KindIndicator({ kind }: { kind: string }) {
  const config = kindConfig[kind] || kindConfig.broker;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-sm text-slate-600">{config.label}</span>
    </div>
  );
}

function WarmthIndicator({ warmth }: { warmth: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${warmthConfig[warmth].color}`} />
      <span className="text-sm text-slate-600">{warmthConfig[warmth].label}</span>
    </div>
  );
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  live: { label: "Live", bg: "bg-green-100", text: "text-green-700" },
  sourcing: { label: "Sourcing", bg: "bg-slate-100", text: "text-slate-600" },
  closing: { label: "Closing", bg: "bg-blue-100", text: "text-blue-700" },
  closed: { label: "Closed", bg: "bg-purple-100", text: "text-purple-700" },
};

function getMissingFields(org: Organization): string[] {
  const missing: string[] = [];
  if (!org.website) missing.push("Website");
  if (!org.email) missing.push("Email");
  if (!org.phone) missing.push("Phone");
  if (!org.linkedinUrl) missing.push("LinkedIn");
  if (!org.description) missing.push("Description");
  if (!org.sector) missing.push("Sector");
  if (!org.stage) missing.push("Stage");
  if (!org.employeeRange) missing.push("Employees");
  if (!org.lastContactedAt) missing.push("Last Contact");
  if (!org.tags?.length) missing.push("Tags");
  if (!org.address.city && !org.address.country) missing.push("Location");
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

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-slate-400">Organization not found</span>
      </div>
    );
  }

  const location = [org.address.city, org.address.state, org.address.country]
    .filter(Boolean)
    .join(", ");

  const missingFields = getMissingFields(org);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <MissingDataDropdown missingFields={missingFields} />
      </div>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-10 w-10 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-1">{org.name}</h1>
              {org.sector && (
                <p className="text-slate-600">{org.sector}</p>
              )}
              {location && (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <KindIndicator kind={org.kind} />
              <WarmthIndicator warmth={org.warmth} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 mt-4">
            {org.website && (
              <a
                href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Globe className="h-4 w-4" />
                Website
              </a>
            )}
            {org.email && (
              <a
                href={`mailto:${org.email}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
            {org.phone && (
              <a
                href={`tel:${org.phone}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
            {org.linkedinUrl && (
              <a
                href={org.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Globe className="h-4 w-4" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-2xl font-semibold text-slate-900">{org.people.length}</div>
          <div className="text-sm text-slate-500">People</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-2xl font-semibold text-slate-900">{org.deals.length}</div>
          <div className="text-sm text-slate-500">Deals</div>
        </div>
        {org.lastContactedAt && (
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-2xl font-semibold text-slate-900">{formatDateShort(org.lastContactedAt)}</div>
            <div className="text-sm text-slate-500">Last Contact</div>
          </div>
        )}
        {org.nextFollowUpAt && (
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-2xl font-semibold text-slate-900">{formatDateShort(org.nextFollowUpAt)}</div>
            <div className="text-sm text-slate-500">Follow Up</div>
          </div>
        )}
      </div>

      {/* Description */}
      {org.description && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">About</h2>
          <p className="text-slate-700 leading-relaxed">{org.description}</p>
        </div>
      )}

      {/* People & Deals */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* People */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
            People <span className="text-slate-300">({org.people.length})</span>
          </h2>
          {org.people.length === 0 ? (
            <p className="text-slate-400 text-sm">No people at this organization</p>
          ) : (
            <div className="space-y-2">
              {org.people.map((person) => (
                <Link
                  key={person.id}
                  href={`/people/${person.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors -mx-3"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-medium text-slate-500 flex-shrink-0">
                    {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900">{person.firstName} {person.lastName}</div>
                    {person.title && (
                      <div className="text-sm text-slate-500 truncate">{person.title}</div>
                    )}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${warmthConfig[person.warmth].color}`} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Deals */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
            Deals <span className="text-slate-300">({org.deals.length})</span>
          </h2>
          {org.deals.length === 0 ? (
            <p className="text-slate-400 text-sm">No deals with this organization</p>
          ) : (
            <div className="space-y-2">
              {org.deals.map((deal) => {
                const status = statusConfig[deal.status] || statusConfig.sourcing;
                return (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors -mx-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{deal.name}</div>
                      {formatCurrency(deal.committed) && (
                        <div className="text-sm text-slate-500">{formatCurrency(deal.committed)} committed</div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {org.tags?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {org.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {org.notes && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Notes</h2>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-slate-700 whitespace-pre-wrap">{org.notes}</p>
          </div>
        </div>
      )}

      {/* Details */}
      {(org.legalName || org.stage || org.employeeRange || org.subSector) && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {org.legalName && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Legal Name</div>
                <div className="text-slate-700">{org.legalName}</div>
              </div>
            )}
            {org.subSector && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Sub-Sector</div>
                <div className="text-slate-700">{org.subSector}</div>
              </div>
            )}
            {org.stage && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Stage</div>
                <div className="text-slate-700">{org.stage}</div>
              </div>
            )}
            {org.employeeRange && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Employees</div>
                <div className="text-slate-700">{org.employeeRange}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-100 pt-4 mt-8">
        <div className="text-xs text-slate-400">
          Added {formatDate(org.createdAt)}
        </div>
      </div>
    </div>
  );
}
