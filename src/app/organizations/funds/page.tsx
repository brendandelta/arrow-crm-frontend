"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Users, ExternalLink, ArrowLeft, Landmark } from "lucide-react";

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

function WarmthIndicator({ warmth }: { warmth: number }) {
  const labels = ["Cold", "Warm", "Hot", "Champion"];
  const colors = [
    "bg-slate-300",
    "bg-yellow-400",
    "bg-orange-500",
    "bg-green-500",
  ];
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 w-2.5 rounded-full ${i <= warmth ? colors[warmth] : "bg-slate-100"}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-slate-500">{labels[warmth]}</span>
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

export default function FundsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`)
      .then((res) => res.json())
      .then((data) => {
        const allOrgs = Array.isArray(data) ? data : [];
        setOrganizations(allOrgs.filter((o: Organization) => o.kind === "fund"));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch organizations:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="h-[calc(100vh-1.5rem)] flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/organizations")}
            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Landmark className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">Funds</h1>
            <p className="text-xs text-slate-500">{organizations.length} total</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="w-[240px] text-[10px] font-medium text-slate-500 uppercase tracking-wider py-2.5 px-4">Fund</TableHead>
                <TableHead className="text-[10px] font-medium text-slate-500 uppercase tracking-wider py-2.5 px-4">Location</TableHead>
                <TableHead className="text-[10px] font-medium text-slate-500 uppercase tracking-wider py-2.5 px-4">Website</TableHead>
                <TableHead className="text-[10px] font-medium text-slate-500 uppercase tracking-wider py-2.5 px-4">Warmth</TableHead>
                <TableHead className="text-[10px] font-medium text-slate-500 uppercase tracking-wider py-2.5 px-4 text-right">People</TableHead>
                <TableHead className="text-[10px] font-medium text-slate-500 uppercase tracking-wider py-2.5 px-4 text-right">Deals</TableHead>
                <TableHead className="text-[10px] font-medium text-slate-500 uppercase tracking-wider py-2.5 px-4">Last Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-slate-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center mb-2">
                        <Landmark className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-500">No funds found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow
                    key={org.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                    onClick={() => router.push(`/organizations/${org.id}`)}
                  >
                    <TableCell className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-900 truncate">{org.name}</div>
                          {org.sector && (
                            <div className="text-[10px] text-slate-500 truncate">{org.sector}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-xs text-slate-500">
                      {org.city && org.country ? `${org.city}, ${org.country}` : org.city || org.country || "—"}
                    </TableCell>
                    <TableCell className="py-2.5 px-4">
                      {org.website ? (
                        <a
                          href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getDomain(org.website)}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-4">
                      <WarmthIndicator warmth={org.warmth} />
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-right">
                      {org.peopleCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Users className="h-3 w-3 text-slate-400" />
                          {org.peopleCount}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-right text-xs text-slate-600 tabular-nums">
                      {org.dealsCount > 0 ? org.dealsCount : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-xs text-slate-500">
                      {formatDate(org.lastContactedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
