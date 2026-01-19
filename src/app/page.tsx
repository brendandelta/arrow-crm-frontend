"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CircleDollarSign,
  Building2,
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight
} from "lucide-react";

interface DashboardData {
  stats: {
    deals: { total: number; live: number; sourcing: number };
    organizations: { total: number; funds: number; companies: number };
    people: { total: number; champions: number; hot: number };
    meetings: { total: number; thisWeek: number };
    pipeline: { committed: number; closed: number };
  };
  liveDeals: Array<{
    id: number;
    name: string;
    company: string | null;
    committed: number;
    blocks: number;
    interests: number;
  }>;
  recentMeetings: Array<{
    id: number;
    title: string;
    deal: string | null;
    attendees: number;
    startsAt: string;
  }>;
}

function formatCurrency(cents: number) {
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
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/dashboard`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Failed to load dashboard</span>
      </div>
    );
  }

  const { stats, liveDeals, recentMeetings } = data;

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => router.push("/deals")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deals.total}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.deals.live} live</span> · {stats.deals.sourcing} sourcing
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => router.push("/organizations")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.organizations.funds} funds · {stats.organizations.companies} companies
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => router.push("/people")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.people.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.people.champions} champions · {stats.people.hot} hot
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pipeline.committed)}</div>
            <p className="text-xs text-muted-foreground">
              soft-circled commitments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Live Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Live Deals
              <Badge variant="secondary">{stats.deals.live}</Badge>
            </CardTitle>
            <CardDescription>Deals currently in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No live deals</p>
              ) : (
                liveDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-slate-50 -mx-2 px-2 py-1 rounded transition-colors"
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{deal.name}</p>
                      <p className="text-xs text-muted-foreground">{deal.company || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{deal.blocks} blocks</Badge>
                      <Badge variant="outline">{deal.interests} interests</Badge>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Recent Meetings
              <Badge variant="secondary">{stats.meetings.thisWeek} this week</Badge>
            </CardTitle>
            <CardDescription>Your latest interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent meetings</p>
              ) : (
                recentMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-slate-50 -mx-2 px-2 py-1 rounded transition-colors"
                    onClick={() => router.push(`/meetings/${meeting.id}`)}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.deal || "Internal"} · {meeting.attendees} attendees
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatDate(meeting.startsAt)}</span>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
