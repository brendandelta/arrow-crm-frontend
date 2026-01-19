"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  AlertCircle,
  Globe
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

const warmthConfig = [
  { label: "Cold", color: "bg-slate-500" },
  { label: "Warm", color: "bg-yellow-500" },
  { label: "Hot", color: "bg-orange-500" },
  { label: "Champion", color: "bg-green-500" },
];

function WarmthIndicator({ warmth }: { warmth: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${warmthConfig[warmth].color}`} />
      <span className="text-sm text-slate-600">{warmthConfig[warmth].label}</span>
    </div>
  );
}

function getMissingFields(person: Person): string[] {
  const missing: string[] = [];
  if (!person.emails?.length) missing.push("Email");
  if (!person.phones?.length) missing.push("Phone");
  if (!person.linkedinUrl) missing.push("LinkedIn");
  if (!person.bio) missing.push("Bio");
  if (!person.birthday) missing.push("Birthday");
  if (!person.source) missing.push("Source");
  if (!person.lastContactedAt) missing.push("Last Contacted");
  if (!person.tags?.length) missing.push("Tags");
  if (!person.address.city && !person.address.country) missing.push("Location");
  if (!person.currentEmployment) missing.push("Current Role");
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

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${params.id}`)
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
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-slate-400">Person not found</span>
      </div>
    );
  }

  const fullName = [person.prefix, person.firstName, person.lastName, person.suffix]
    .filter(Boolean)
    .join(" ");

  const location = [person.address.city, person.address.state, person.address.country]
    .filter(Boolean)
    .join(", ");

  const primaryEmail = person.emails?.find((e) => e.primary)?.value || person.emails?.[0]?.value;
  const primaryPhone = person.phones?.find((p) => p.primary)?.value || person.phones?.[0]?.value;
  const missingFields = getMissingFields(person);

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
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl font-semibold text-slate-500 flex-shrink-0">
          {person.firstName.charAt(0)}{person.lastName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-1">{fullName}</h1>
              {person.currentEmployment && (
                <p className="text-slate-600">
                  {person.currentEmployment.title && <span>{person.currentEmployment.title} at </span>}
                  <Link
                    href={`/organizations/${person.currentEmployment.organization.id}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {person.currentEmployment.organization.name}
                  </Link>
                </p>
              )}
              {location && (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </p>
              )}
            </div>
            <WarmthIndicator warmth={person.warmth} />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 mt-4">
            {primaryEmail && (
              <a
                href={`mailto:${primaryEmail}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
            {primaryPhone && (
              <a
                href={`tel:${primaryPhone}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
            {person.linkedinUrl && (
              <a
                href={person.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Globe className="h-4 w-4" />
                LinkedIn
              </a>
            )}
            {person.twitterUrl && (
              <a
                href={person.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Globe className="h-4 w-4" />
                Twitter
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {(person.contactCount > 0 || person.lastContactedAt || person.nextFollowUpAt) && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {person.contactCount > 0 && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-semibold text-slate-900">{person.contactCount}</div>
              <div className="text-sm text-slate-500">Interactions</div>
            </div>
          )}
          {person.lastContactedAt && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-semibold text-slate-900">{formatDateShort(person.lastContactedAt)}</div>
              <div className="text-sm text-slate-500">Last Contact</div>
            </div>
          )}
          {person.nextFollowUpAt && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-semibold text-slate-900">{formatDateShort(person.nextFollowUpAt)}</div>
              <div className="text-sm text-slate-500">Follow Up</div>
            </div>
          )}
        </div>
      )}

      {/* Bio */}
      {person.bio && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">About</h2>
          <p className="text-slate-700 leading-relaxed">{person.bio}</p>
        </div>
      )}

      {/* Contact Details */}
      {(primaryEmail || primaryPhone || person.emails?.length > 1 || person.phones?.length > 1) && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Contact</h2>
          <div className="space-y-2">
            {person.emails?.map((email, i) => (
              <div key={i} className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${email.value}`} className="text-slate-700 hover:text-blue-600">
                  {email.value}
                </a>
                {email.label && <span className="text-xs text-slate-400">{email.label}</span>}
                {email.primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
              </div>
            ))}
            {person.phones?.map((phone, i) => (
              <div key={i} className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <a href={`tel:${phone.value}`} className="text-slate-700 hover:text-blue-600">
                  {phone.value}
                </a>
                {phone.label && <span className="text-xs text-slate-400">{phone.label}</span>}
                {phone.primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employment History */}
      {person.employments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Experience</h2>
          <div className="space-y-4">
            {person.employments.map((emp) => (
              <Link
                key={emp.id}
                href={`/organizations/${emp.organization.id}`}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors -mx-4"
              >
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{emp.organization.name}</span>
                    {emp.isCurrent && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Current</span>
                    )}
                  </div>
                  {emp.title && <div className="text-sm text-slate-600">{emp.title}</div>}
                  {(emp.startedAt || emp.endedAt) && (
                    <div className="text-xs text-slate-400 mt-1">
                      {formatDate(emp.startedAt)} — {emp.isCurrent ? "Present" : formatDate(emp.endedAt)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {person.tags?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {person.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {person.notes && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Notes</h2>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-slate-700 whitespace-pre-wrap">{person.notes}</p>
          </div>
        </div>
      )}

      {/* Details */}
      {(person.source || person.birthday || person.nickname) && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {person.source && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Source</div>
                <div className="text-slate-700">{person.source}</div>
              </div>
            )}
            {person.sourceDetail && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Source Detail</div>
                <div className="text-slate-700">{person.sourceDetail}</div>
              </div>
            )}
            {person.birthday && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Birthday</div>
                <div className="text-slate-700">{formatDate(person.birthday)}</div>
              </div>
            )}
            {person.nickname && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Nickname</div>
                <div className="text-slate-700">{person.nickname}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-100 pt-4 mt-8">
        <div className="text-xs text-slate-400">
          Added {formatDate(person.createdAt)}
        </div>
      </div>
    </div>
  );
}
