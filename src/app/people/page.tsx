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
import { Mail, LinkedinIcon, Building2 } from "lucide-react";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  org: string | null;
  orgKind: string | null;
  email: string | null;
  warmth: number;
  city: string | null;
  country: string | null;
  linkedin: string | null;
  lastContactedAt: string | null;
  tags: string[];
}

function WarmthBadge({ warmth }: { warmth: number }) {
  const labels = ["Cold", "Warm", "Hot", "Champion"];
  const styles = [
    "bg-slate-100 text-slate-600 hover:bg-slate-100",
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    "bg-orange-100 text-orange-800 hover:bg-orange-100",
    "bg-green-100 text-green-800 hover:bg-green-100",
  ];
  return (
    <Badge className={styles[warmth]}>
      {labels[warmth]}
    </Badge>
  );
}

function OrgKindBadge({ kind }: { kind: string | null }) {
  if (!kind) return null;
  const styles: Record<string, string> = {
    fund: "bg-blue-50 text-blue-700",
    company: "bg-purple-50 text-purple-700",
    spv: "bg-amber-50 text-amber-700",
    broker: "bg-slate-50 text-slate-600",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${styles[kind] || styles.broker}`}>
      {kind}
    </span>
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

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function PeoplePage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/people`)
      .then((res) => res.json())
      .then((data) => {
        setPeople(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch people:", err);
        setLoading(false);
      });
  }, []);

  const championsCount = people.filter((p) => p.warmth === 3).length;
  const hotCount = people.filter((p) => p.warmth === 2).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">People</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{people.length} total</span>
            <span>·</span>
            <span className="text-green-600">{championsCount} champions</span>
            <span>·</span>
            <span className="text-orange-600">{hotCount} hot</span>
          </div>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Warmth</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Links</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : people.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No people found
                </TableCell>
              </TableRow>
            ) : (
              people.map((person) => (
                <TableRow key={person.id} className="cursor-pointer" onClick={() => router.push(`/people/${person.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                        {getInitials(person.firstName, person.lastName)}
                      </div>
                      <div>
                        <div className="font-medium">{person.firstName} {person.lastName}</div>
                        <div className="text-xs text-muted-foreground">{person.title || "—"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {person.org ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{person.org}</span>
                        <OrgKindBadge kind={person.orgKind} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {person.email ? (
                      <a
                        href={`mailto:${person.email}`}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {person.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.city && person.country
                      ? `${person.city}, ${person.country}`
                      : person.city || person.country || "—"}
                  </TableCell>
                  <TableCell>
                    <WarmthBadge warmth={person.warmth} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(person.lastContactedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {person.linkedin && (
                        <a
                          href={person.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <LinkedinIcon className="h-4 w-4" />
                        </a>
                      )}
                      {!person.linkedin && <span className="text-muted-foreground">—</span>}
                    </div>
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
