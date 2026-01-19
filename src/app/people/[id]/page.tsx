"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Briefcase,
  ExternalLink
} from "lucide-react";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  prefix: string | null;
  suffix: string | null;
  emails: Array<{ value: string; label?: string; primary?: boolean }>;
  phones: Array<{ value: string; label?: string; primary?: boolean }>;
  preferredContact: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  title: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  bio: string | null;
  birthday: string | null;
  avatarUrl: string | null;
  warmth: number;
  tags: string[];
  notes: string | null;
  source: string | null;
  sourceDetail: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  contactCount: number;
  currentEmployment: {
    title: string | null;
    organization: {
      id: number;
      name: string;
      kind: string;
    };
  } | null;
  employments: Array<{
    id: number;
    title: string | null;
    department: string | null;
    isCurrent: boolean;
    isPrimary: boolean;
    startedAt: string | null;
    endedAt: string | null;
    organization: {
      id: number;
      name: string;
      kind: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
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

function OrgKindBadge({ kind }: { kind: string }) {
  const styles: Record<string, string> = {
    fund: "bg-blue-100 text-blue-800",
    company: "bg-purple-100 text-purple-800",
    spv: "bg-amber-100 text-amber-800",
    broker: "bg-slate-100 text-slate-600",
  };
  return <Badge className={styles[kind] || styles.broker}>{kind}</Badge>;
}

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/people/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setPerson(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch person:", err);
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

  if (!person) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Person not found</span>
      </div>
    );
  }

  const fullName = [person.prefix, person.firstName, person.lastName, person.suffix]
    .filter(Boolean)
    .join(" ");

  const address = [
    person.address.line1,
    person.address.line2,
    [person.address.city, person.address.state].filter(Boolean).join(", "),
    person.address.postalCode,
    person.address.country
  ].filter(Boolean).join(", ");

  const primaryEmail = person.emails?.find((e) => e.primary)?.value || person.emails?.[0]?.value;
  const primaryPhone = person.phones?.find((p) => p.primary)?.value || person.phones?.[0]?.value;

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
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-medium text-slate-600">
              {person.firstName.charAt(0)}{person.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{fullName}</h1>
                <WarmthBadge warmth={person.warmth} />
              </div>
              {person.currentEmployment && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{person.currentEmployment.title}</span>
                  <span>at</span>
                  <Link
                    href={`/organizations/${person.currentEmployment.organization.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {person.currentEmployment.organization.name}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-6">
            {primaryEmail && (
              <a
                href={`mailto:${primaryEmail}`}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Mail className="h-4 w-4" />
                {primaryEmail}
              </a>
            )}
            {primaryPhone && (
              <a
                href={`tel:${primaryPhone}`}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Phone className="h-4 w-4" />
                {primaryPhone}
              </a>
            )}
            {address && (
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {address}
              </span>
            )}
            {person.linkedinUrl && (
              <a
                href={person.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn
              </a>
            )}
            {person.twitterUrl && (
              <a
                href={person.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Twitter
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
              <Briefcase className="h-4 w-4" />
              Organizations
            </div>
            <div className="text-2xl font-semibold">{person.employments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Mail className="h-4 w-4" />
              Contact Count
            </div>
            <div className="text-2xl font-semibold">{person.contactCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Last Contact
            </div>
            <div className="text-2xl font-semibold">{formatDate(person.lastContactedAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Follow Up
            </div>
            <div className="text-2xl font-semibold">{formatDate(person.nextFollowUpAt)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bio */}
      {person.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{person.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Employment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Employment History
            <Badge variant="secondary">{person.employments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {person.employments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No employment history</p>
          ) : (
            <div className="space-y-3">
              {person.employments.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/organizations/${emp.organization.id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-slate-200 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-medium">{emp.title || "—"}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{emp.organization.name}</span>
                        {emp.department && <span>· {emp.department}</span>}
                      </div>
                      {(emp.startedAt || emp.endedAt) && (
                        <div className="text-xs text-muted-foreground">
                          {formatDate(emp.startedAt)} — {emp.isCurrent ? "Present" : formatDate(emp.endedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {emp.isCurrent && <Badge className="bg-green-100 text-green-800">Current</Badge>}
                    {emp.isPrimary && <Badge variant="outline">Primary</Badge>}
                    <OrgKindBadge kind={emp.organization.kind} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Contact Info */}
      {(person.emails?.length > 1 || person.phones?.length > 1) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {person.emails?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Emails</h4>
                  <div className="space-y-2">
                    {person.emails.map((email, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <a href={`mailto:${email.value}`} className="text-blue-600 hover:underline">
                          {email.value}
                        </a>
                        {email.label && <Badge variant="outline" className="text-xs">{email.label}</Badge>}
                        {email.primary && <Badge className="text-xs bg-green-100 text-green-800">Primary</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {person.phones?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Phones</h4>
                  <div className="space-y-2">
                    {person.phones.map((phone, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <a href={`tel:${phone.value}`} className="text-blue-600 hover:underline">
                          {phone.value}
                        </a>
                        {phone.label && <Badge variant="outline" className="text-xs">{phone.label}</Badge>}
                        {phone.primary && <Badge className="text-xs bg-green-100 text-green-800">Primary</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {person.nickname && (
              <div>
                <dt className="text-muted-foreground">Nickname</dt>
                <dd className="font-medium">{person.nickname}</dd>
              </div>
            )}
            {person.birthday && (
              <div>
                <dt className="text-muted-foreground">Birthday</dt>
                <dd className="font-medium">{formatDate(person.birthday)}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Source</dt>
              <dd className="font-medium">{person.source || "—"}</dd>
            </div>
            {person.sourceDetail && (
              <div>
                <dt className="text-muted-foreground">Source Detail</dt>
                <dd className="font-medium">{person.sourceDetail}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Preferred Contact</dt>
              <dd className="font-medium">{person.preferredContact || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(person.createdAt)}</dd>
            </div>
          </dl>
          {person.tags?.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {person.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          {person.notes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm text-muted-foreground mb-2">Notes</h4>
              <p className="text-sm whitespace-pre-wrap">{person.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
