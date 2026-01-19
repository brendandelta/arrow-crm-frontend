"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Users, ExternalLink } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  kind: string;
  sector: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  warmth: number;
  peopleCount: number;
  dealsCount: number;
  lastContactedAt: string | null;
}

function KindBadge({ kind }: { kind: string }) {
  const styles: Record<string, string> = {
    fund: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    company: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    spv: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    broker: "bg-slate-100 text-slate-600 hover:bg-slate-100",
    law_firm: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
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

function WarmthIndicator({ warmth }: { warmth: number }) {
  const labels = ["Cold", "Warm", "Hot", "Champion"];
  const colors = [
    "bg-slate-200",
    "bg-yellow-400",
    "bg-orange-500",
    "bg-green-500",
  ];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 w-3 rounded-full ${i <= warmth ? colors[warmth] : "bg-slate-100"}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{labels[warmth]}</span>
    </div>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`)
      .then((res) => res.json())
      .then((data) => {
        setOrganizations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch organizations:", err);
        setLoading(false);
      });
  }, []);

  const fundCount = organizations.filter((o) => o.kind === "fund").length;
  const companyCount = organizations.filter((o) => o.kind === "company").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Organizations</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{organizations.length} total</span>
            <span>·</span>
            <span>{fundCount} funds</span>
            <span>·</span>
            <span>{companyCount} companies</span>
          </div>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Organization</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Warmth</TableHead>
              <TableHead className="text-right">People</TableHead>
              <TableHead className="text-right">Deals</TableHead>
              <TableHead>Last Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id} className="cursor-pointer" onClick={() => router.push(`/organizations/${org.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-xs text-muted-foreground">{org.sector || "—"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><KindBadge kind={org.kind} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {org.city && org.country ? `${org.city}, ${org.country}` : org.city || org.country || "—"}
                  </TableCell>
                  <TableCell>
                    {org.website ? (
                      <a
                        href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {getDomain(org.website)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <WarmthIndicator warmth={org.warmth} />
                  </TableCell>
                  <TableCell className="text-right">
                    {org.peopleCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {org.peopleCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {org.dealsCount > 0 ? org.dealsCount : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(org.lastContactedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
