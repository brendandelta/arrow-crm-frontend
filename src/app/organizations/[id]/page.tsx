"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Users,
  CircleDollarSign,
  Tag,
  Calendar,
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

function KindBadge({ kind }: { kind: string }) {
  const styles: Record<string, string> = {
    fund: "bg-blue-100 text-blue-800",
    company: "bg-purple-100 text-purple-800",
    spv: "bg-amber-100 text-amber-800",
    broker: "bg-slate-100 text-slate-600",
    law_firm: "bg-emerald-100 text-emerald-800",
  };
  const labels: Record<string, string> = {
    fund: "Fund",
    company: "Company",
    spv: "SPV",
    broker: "Broker",
    law_firm: "Law Firm",
  };
  return (
    <Badge className={styles[kind] || styles.broker}>
      {labels[kind] || kind}
    </Badge>
  );
}

function WarmthBadge({ warmth }: { warmth: number }) {
  const labels = ["Cold", "Warm", "Hot", "Champion"];
  const styles = [
    "bg-slate-100 text-slate-600",
    "bg-yellow-100 text-yellow-800",
    "bg-orange-100 text-orange-800",
    "bg-green-100 text-green-800",
  ];
  return <Badge className={styles[warmth]}>{labels[warmth]}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-green-100 text-green-800",
    sourcing: "bg-slate-100 text-slate-600",
    closing: "bg-blue-100 text-blue-800",
    closed: "bg-purple-100 text-purple-800",
  };
  return <Badge className={styles[status] || styles.sourcing}>{status}</Badge>;
}

function getMissingFields(org: Organization): string[] {
  const missing: string[] = [];

  if (!org.website) missing.push("Website");
  if (!org.email) missing.push("Email");
  if (!org.phone) missing.push("Phone");
  if (!org.linkedinUrl) missing.push("LinkedIn");
  if (!org.twitterUrl) missing.push("Twitter");
  if (!org.description) missing.push("Description");
  if (!org.legalName) missing.push("Legal Name");
  if (!org.sector) missing.push("Sector");
  if (!org.subSector) missing.push("Sub-Sector");
  if (!org.stage) missing.push("Stage");
  if (!org.employeeRange) missing.push("Employee Range");
  if (!org.lastContactedAt) missing.push("Last Contacted");
  if (!org.nextFollowUpAt) missing.push("Next Follow Up");
  if (!org.tags?.length) missing.push("Tags");
  if (!org.notes) missing.push("Notes");
  if (!org.address.line1 && !org.address.city && !org.address.country) missing.push("Address");

  return missing;
}

function MissingDataDropdown({ missingFields }: { missingFields: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (missingFields.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
      >
        <AlertCircle className="h-4 w-4" />
        {missingFields.length} missing field{missingFields.length !== 1 ? "s" : ""}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-md shadow-lg z-10">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1">Missing Data</div>
            {missingFields.map((field) => (
              <div key={field} className="px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded">
                {field}
              </div>
            ))}
          </div>
        </div>
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
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Organization not found</span>
      </div>
    );
  }

  const address = [
    org.address.line1,
    org.address.line2,
    [org.address.city, org.address.state].filter(Boolean).join(", "),
    org.address.postalCode,
    org.address.country
  ].filter(Boolean).join(", ");

  const missingFields = getMissingFields(org);

  // Build details array with only non-empty fields
  const details: Array<{ label: string; value: string }> = [];
  if (org.legalName) details.push({ label: "Legal Name", value: org.legalName });
  if (org.sector) details.push({ label: "Sector", value: org.sector });
  if (org.subSector) details.push({ label: "Sub-Sector", value: org.subSector });
  if (org.stage) details.push({ label: "Stage", value: org.stage });
  if (org.employeeRange) details.push({ label: "Employees", value: org.employeeRange });
  details.push({ label: "Created", value: formatDate(org.createdAt)! });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-slate-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{org.name}</h1>
                <KindBadge kind={org.kind} />
                <WarmthBadge warmth={org.warmth} />
              </div>
              {org.sector && (
                <p className="text-muted-foreground">{org.sector}</p>
              )}
            </div>
          </div>
        </div>
        <MissingDataDropdown missingFields={missingFields} />
      </div>

      {/* Contact Info - only show if there's any contact info */}
      {(org.website || org.email || org.phone || address || org.linkedinUrl) && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-6">
              {org.website && (
                <a
                  href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {org.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {org.email && (
                <a
                  href={`mailto:${org.email}`}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {org.email}
                </a>
              )}
              {org.phone && (
                <a
                  href={`tel:${org.phone}`}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {org.phone}
                </a>
              )}
              {address && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {address}
                </span>
              )}
              {org.linkedinUrl && (
                <a
                  href={org.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row - only show cards with actual data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" />
              People
            </div>
            <div className="text-2xl font-semibold">{org.people.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CircleDollarSign className="h-4 w-4" />
              Deals
            </div>
            <div className="text-2xl font-semibold">{org.deals.length}</div>
          </CardContent>
        </Card>
        {org.lastContactedAt && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Last Contact
              </div>
              <div className="text-2xl font-semibold">{formatDate(org.lastContactedAt)}</div>
            </CardContent>
          </Card>
        )}
        {org.nextFollowUpAt && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Follow Up
              </div>
              <div className="text-2xl font-semibold">{formatDate(org.nextFollowUpAt)}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* People */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              People
              <Badge variant="secondary">{org.people.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {org.people.length === 0 ? (
              <p className="text-muted-foreground text-sm">No people at this organization</p>
            ) : (
              <div className="space-y-3">
                {org.people.map((person) => (
                  <Link
                    key={person.id}
                    href={`/people/${person.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                        {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{person.firstName} {person.lastName}</div>
                        {person.title && (
                          <div className="text-xs text-muted-foreground">{person.title}</div>
                        )}
                      </div>
                    </div>
                    <WarmthBadge warmth={person.warmth} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Deals
              <Badge variant="secondary">{org.deals.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {org.deals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No deals with this organization</p>
            ) : (
              <div className="space-y-3">
                {org.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{deal.name}</div>
                      {formatCurrency(deal.committed) && (
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(deal.committed)} committed
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={deal.status} />
                      <Badge variant="outline">{deal.kind}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details - only show if there are any details */}
      {(org.description || details.length > 0 || org.tags?.length > 0 || org.notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            {org.description && (
              <p className="text-sm mb-4">{org.description}</p>
            )}
            {details.length > 0 && (
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {details.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {org.tags?.length > 0 && (
              <div className={details.length > 0 || org.description ? "mt-4 pt-4 border-t" : ""}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {org.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            {org.notes && (
              <div className={details.length > 0 || org.description || org.tags?.length > 0 ? "mt-4 pt-4 border-t" : ""}>
                <h4 className="text-sm text-muted-foreground mb-2">Notes</h4>
                <p className="text-sm whitespace-pre-wrap">{org.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
