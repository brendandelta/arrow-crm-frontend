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
import { ArrowLeft } from "lucide-react";
import { PriorityBadge } from "../_components/PriorityBadge";

interface Deal {
  id: number;
  name: string;
  company: string | null;
  sector: string | null;
  status: string;
  stage: string;
  kind: string;
  priority: number;
  blocks: number;
  interests: number;
  committed: number;
  closed: number;
  valuation: number | null;
  expectedClose: string | null;
  sourcedAt: string | null;
}

function formatCurrency(cents: number) {
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
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function SourcingDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals`)
      .then((res) => res.json())
      .then((data) => {
        const allDeals = Array.isArray(data) ? data : [];
        setDeals(allDeals.filter((d: Deal) => d.status === "sourcing"));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch deals:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/deals")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-semibold">Sourcing</h1>
          <Badge className="bg-muted text-muted-foreground hover:bg-muted">
            {deals.length} deals
          </Badge>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Deal</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Priority</TableHead>
              <TableHead className="text-right">Valuation</TableHead>
              <TableHead>Sourced</TableHead>
              <TableHead className="text-right">Interests</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No sourcing deals found
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow key={deal.id} className="cursor-pointer" onClick={() => router.push(`/deals/${deal.id}`)}>
                  <TableCell>
                    <div className="font-medium">{deal.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span>{deal.company || "—"}</span>
                      {deal.sector && (
                        <>
                          <span>·</span>
                          <span>{deal.sector}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{deal.kind}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <PriorityBadge priority={deal.priority} compact />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(deal.valuation || 0)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(deal.sourcedAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{deal.interests || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
