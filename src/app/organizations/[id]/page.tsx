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
  Calendar
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
      </div>

      {/* Contact Info */}
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

      {/* Stats Row */}
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Last Contact
            </div>
            <div className="text-2xl font-semibold">{formatDate(org.lastContactedAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Follow Up
            </div>
            <div className="text-2xl font-semibold">{formatDate(org.nextFollowUpAt)}</div>
          </CardContent>
        </Card>
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
                        <div className="text-xs text-muted-foreground">{person.title || "—"}</div>
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
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(deal.committed)} committed
                      </div>
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

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          {org.description && (
            <p className="text-sm mb-4">{org.description}</p>
          )}
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {org.legalName && (
              <div>
                <dt className="text-muted-foreground">Legal Name</dt>
                <dd className="font-medium">{org.legalName}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Sector</dt>
              <dd className="font-medium">{org.sector || "—"}</dd>
            </div>
            {org.subSector && (
              <div>
                <dt className="text-muted-foreground">Sub-Sector</dt>
                <dd className="font-medium">{org.subSector}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Stage</dt>
              <dd className="font-medium">{org.stage || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Employees</dt>
              <dd className="font-medium">{org.employeeRange || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(org.createdAt)}</dd>
            </div>
          </dl>
          {org.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {org.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          {org.notes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm text-muted-foreground mb-2">Notes</h4>
              <p className="text-sm whitespace-pre-wrap">{org.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
