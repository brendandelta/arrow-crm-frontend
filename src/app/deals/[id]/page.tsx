"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Tag
} from "lucide-react";

interface Deal {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
    sector: string | null;
    website: string | null;
  };
  status: string;
  stage: string;
  kind: string;
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
  tags: string[];
  notes: string | null;
  structureNotes: string | null;
  blocks: Array<{
    id: number;
    status: string;
    shares: number | null;
    pricePerShare: number | null;
    total: number | null;
    shareClass: string | null;
    source: string | null;
  }>;
  interests: Array<{
    id: number;
    investor: string | null;
    status: string;
    target: number | null;
    committed: number | null;
  }>;
  meetings: Array<{
    id: number;
    title: string;
    startsAt: string;
    kind: string | null;
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-green-100 text-green-800",
    sourcing: "bg-slate-100 text-slate-600",
    closing: "bg-blue-100 text-blue-800",
    closed: "bg-purple-100 text-purple-800",
    dead: "bg-red-100 text-red-800",
  };
  return (
    <Badge className={styles[status] || styles.sourcing}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function InterestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    prospecting: "bg-slate-100 text-slate-600",
    contacted: "bg-blue-100 text-blue-800",
    interested: "bg-yellow-100 text-yellow-800",
    committed: "bg-green-100 text-green-800",
    allocated: "bg-purple-100 text-purple-800",
    passed: "bg-red-100 text-red-800",
  };
  return (
    <Badge className={styles[status] || styles.prospecting} variant="outline">
      {status}
    </Badge>
  );
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/deals/${params.id}`)
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

  const progress = deal.committed > 0 && deal.closed > 0
    ? Math.min(100, Math.round((deal.closed / deal.committed) * 100))
    : 0;

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
            <h1 className="text-2xl font-semibold">{deal.name}</h1>
            <StatusBadge status={deal.status} />
            <Badge variant="outline" className="capitalize">{deal.kind}</Badge>
          </div>
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
        </div>
        <div className="flex items-center gap-2">
          {deal.driveUrl && (
            <a href={deal.driveUrl} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <FileText className="h-4 w-4" />
              Drive
            </a>
          )}
          {deal.dataRoomUrl && (
            <a href={deal.dataRoomUrl} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <ExternalLink className="h-4 w-4" />
              Data Room
            </a>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Committed
            </div>
            <div className="text-2xl font-semibold">{formatCurrency(deal.committed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Valuation
            </div>
            <div className="text-2xl font-semibold">{formatCurrency(deal.valuation)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" />
              Interests
            </div>
            <div className="text-2xl font-semibold">{deal.interests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" />
              Expected Close
            </div>
            <div className="text-2xl font-semibold">{formatDate(deal.expectedClose)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {deal.committed > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Funding Progress</span>
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

      <div className="grid md:grid-cols-2 gap-4">
        {/* Blocks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Blocks
              <Badge variant="secondary">{deal.blocks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deal.blocks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No blocks yet</p>
            ) : (
              <div className="space-y-3">
                {deal.blocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                    <div>
                      <div className="font-medium">{formatCurrency(block.total)}</div>
                      <div className="text-xs text-muted-foreground">
                        {block.shares?.toLocaleString()} shares · {block.shareClass || "Common"}
                      </div>
                    </div>
                    <Badge variant="outline">{block.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Investor Interests
              <Badge variant="secondary">{deal.interests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deal.interests.length === 0 ? (
              <p className="text-muted-foreground text-sm">No interests yet</p>
            ) : (
              <div className="space-y-3">
                {deal.interests.map((interest) => (
                  <div key={interest.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                    <div>
                      <div className="font-medium">{interest.investor || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">
                        Target: {formatCurrency(interest.target)}
                      </div>
                    </div>
                    <InterestStatusBadge status={interest.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Meetings */}
      {deal.meetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Recent Meetings
              <Badge variant="secondary">{deal.meetings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deal.meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{meeting.title}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(meeting.startsAt)}</div>
                    </div>
                  </div>
                  {meeting.kind && <Badge variant="outline">{meeting.kind}</Badge>}
                </div>
              ))}
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
            <div>
              <dt className="text-muted-foreground">Stage</dt>
              <dd className="font-medium">{deal.stage || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Priority</dt>
              <dd className="font-medium">P{deal.priority}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Confidence</dt>
              <dd className="font-medium">{deal.confidence ? `${deal.confidence}%` : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Share Price</dt>
              <dd className="font-medium">{formatCurrency(deal.sharePrice)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Share Class</dt>
              <dd className="font-medium">{deal.shareClass || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Source</dt>
              <dd className="font-medium">{deal.source || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sourced</dt>
              <dd className="font-medium">{formatDate(deal.sourcedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Deadline</dt>
              <dd className="font-medium">{formatDate(deal.deadline)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(deal.createdAt)}</dd>
            </div>
          </dl>
          {deal.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {deal.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          {deal.notes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm text-muted-foreground mb-2">Notes</h4>
              <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
