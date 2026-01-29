"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Briefcase,
} from "lucide-react";
import { PageHeader, PageSearch } from "@/components/PageHeader";

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

// ============ Configuration ============

const KIND_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  fund: { label: "Fund", bg: "bg-blue-100", text: "text-blue-700" },
  company: { label: "Company", bg: "bg-purple-100", text: "text-purple-700" },
  spv: { label: "SPV", bg: "bg-amber-100", text: "text-amber-700" },
  broker: { label: "Broker", bg: "bg-muted", text: "text-muted-foreground" },
  law_firm: { label: "Law Firm", bg: "bg-emerald-100", text: "text-emerald-700" },
  bank: { label: "Bank", bg: "bg-cyan-100", text: "text-cyan-700" },
  service_provider: { label: "Service", bg: "bg-rose-100", text: "text-rose-700" },
  other: { label: "Other", bg: "bg-gray-100", text: "text-gray-600" },
};

const WARMTH_CONFIG = [
  { label: "Cold", color: "bg-muted-foreground", hoverBg: "hover:bg-muted" },
  { label: "Warm", color: "bg-yellow-500", hoverBg: "hover:bg-yellow-50" },
  { label: "Hot", color: "bg-orange-500", hoverBg: "hover:bg-orange-50" },
  { label: "Champion", color: "bg-green-500", hoverBg: "hover:bg-green-50" },
];

type SortField = "name" | "kind" | "warmth" | "peopleCount" | "dealsCount" | "lastContactedAt";
type SortDir = "asc" | "desc";

// ============ Subcomponents ============

function KindBadge({ kind }: { kind: string }) {
  const config = KIND_CONFIG[kind] || KIND_CONFIG.other;
  return (
    <Badge className={`${config.bg} ${config.text} font-medium`}>
      {config.label}
    </Badge>
  );
}

function InlineWarmthSelector({
  warmth,
  orgId,
  onUpdate,
}: {
  warmth: number;
  orgId: number;
  onUpdate: (orgId: number, newWarmth: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setEditing(false)}
      >
        {WARMTH_CONFIG.map((w, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(orgId, i);
              setEditing(false);
            }}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-full border transition-all ${
              i === warmth
                ? `${w.color} text-white border-transparent`
                : `bg-card border-border text-muted-foreground ${w.hoverBg}`
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="flex items-center gap-2 group"
    >
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 w-3 rounded-full transition-all ${
              i <= warmth ? WARMTH_CONFIG[warmth].color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {WARMTH_CONFIG[warmth].label}
      </span>
    </button>
  );
}

function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: { field: SortField; dir: SortDir } | null;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort?.field === field;
  const dir = isActive ? currentSort.dir : null;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {isActive && (
        dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      )}
    </button>
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

// ============ Main Component ============

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [warmthFilter, setWarmthFilter] = useState<string>("all");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir } | null>({ field: "name", dir: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch organizations
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

  // Inline warmth update
  const updateWarmth = useCallback(async (orgId: number, newWarmth: number) => {
    const oldOrgs = organizations;
    // Optimistic update
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, warmth: newWarmth } : o))
    );
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations/${orgId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ warmth: newWarmth }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Updated warmth to ${WARMTH_CONFIG[newWarmth].label}`);
    } catch {
      setOrganizations(oldOrgs);
      toast.error("Failed to update warmth");
    }
  }, [organizations]);

  // Sorting
  const handleSort = (field: SortField) => {
    if (sort?.field === field) {
      setSort({ field, dir: sort.dir === "asc" ? "desc" : "asc" });
    } else {
      setSort({ field, dir: "asc" });
    }
  };

  // Filtered & Sorted organizations
  const filteredOrgs = useMemo(() => {
    let result = [...organizations];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.sector?.toLowerCase().includes(q) ||
          o.city?.toLowerCase().includes(q) ||
          o.country?.toLowerCase().includes(q)
      );
    }

    // Kind filter
    if (kindFilter !== "all") {
      result = result.filter((o) => o.kind === kindFilter);
    }

    // Warmth filter
    if (warmthFilter !== "all") {
      result = result.filter((o) => o.warmth === parseInt(warmthFilter));
    }

    // Sort
    if (sort) {
      result.sort((a, b) => {
        let aVal: string | number | null;
        let bVal: string | number | null;

        switch (sort.field) {
          case "name":
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case "kind":
            aVal = a.kind;
            bVal = b.kind;
            break;
          case "warmth":
            aVal = a.warmth;
            bVal = b.warmth;
            break;
          case "peopleCount":
            aVal = a.peopleCount;
            bVal = b.peopleCount;
            break;
          case "dealsCount":
            aVal = a.dealsCount;
            bVal = b.dealsCount;
            break;
          case "lastContactedAt":
            aVal = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
            bVal = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
            break;
          default:
            return 0;
        }

        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (aVal < bVal) return sort.dir === "asc" ? -1 : 1;
        if (aVal > bVal) return sort.dir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [organizations, search, kindFilter, warmthFilter, sort]);

  // Stats
  const stats = useMemo(() => ({
    total: organizations.length,
    funds: organizations.filter((o) => o.kind === "fund").length,
    companies: organizations.filter((o) => o.kind === "company").length,
    hot: organizations.filter((o) => o.warmth >= 2).length,
  }), [organizations]);

  // Available kinds for filter
  const availableKinds = useMemo(() => {
    const kinds = new Set(organizations.map((o) => o.kind));
    return Array.from(kinds).sort();
  }, [organizations]);

  const hasActiveFilters = kindFilter !== "all" || warmthFilter !== "all" || search.length > 0;

  return (
    <div className="flex flex-col">
      <PageHeader
        subtitle={
          <span className="flex items-center gap-2">
            <span>{stats.total} total</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-blue-600">{stats.funds} funds</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-purple-600">{stats.companies} companies</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-orange-600">{stats.hot} hot+</span>
          </span>
        }
        primaryActionLabel="Add Organization"
        onPrimaryAction={() => router.push("/organizations/new")}
        search={
          <PageSearch
            value={search}
            onChange={setSearch}
            placeholder="Search organizations..."
          />
        }
      />

      <div className="px-8 py-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-foreground text-background border-foreground"
              : "bg-card text-muted-foreground border-border hover:border-border"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-card/20 rounded">
              {[kindFilter !== "all", warmthFilter !== "all", search.length > 0].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg border border-border">
          {/* Kind Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</span>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="text-sm px-2 py-1 rounded border border-border bg-card focus:outline-none focus:ring-2 focus:ring-slate-400/20"
            >
              <option value="all">All Types</option>
              {availableKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_CONFIG[kind]?.label || kind}
                </option>
              ))}
            </select>
          </div>

          {/* Warmth Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Warmth</span>
            <select
              value={warmthFilter}
              onChange={(e) => setWarmthFilter(e.target.value)}
              className="text-sm px-2 py-1 rounded border border-border bg-card focus:outline-none focus:ring-2 focus:ring-slate-400/20"
            >
              <option value="all">All Warmth</option>
              {WARMTH_CONFIG.map((w, i) => (
                <option key={i} value={i.toString()}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch("");
                setKindFilter("all");
                setWarmthFilter("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-auto"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredOrgs.length} of {organizations.length} organizations
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[280px]">
                <SortableHeader label="Organization" field="name" currentSort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortableHeader label="Type" field="kind" currentSort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>
                <SortableHeader label="Warmth" field="warmth" currentSort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader label="People" field="peopleCount" currentSort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader label="Deals" field="dealsCount" currentSort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortableHeader label="Last Contact" field="lastContactedAt" currentSort={sort} onSort={handleSort} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-border border-t-slate-600 rounded-full animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Building2 className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-muted-foreground">No organizations found</p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setKindFilter("all");
                        setWarmthFilter("all");
                      }}
                      className="text-sm text-blue-600 hover:underline mt-1"
                    >
                      Clear filters
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow
                  key={org.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => router.push(`/organizations/${org.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted transition-colors">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{org.name}</div>
                        {org.sector && (
                          <div className="text-xs text-muted-foreground">{org.sector}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <KindBadge kind={org.kind} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {org.city && org.country
                      ? `${org.city}, ${org.country}`
                      : org.city || org.country || (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                  </TableCell>
                  <TableCell>
                    {org.website ? (
                      <a
                        href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {getDomain(org.website)}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <InlineWarmthSelector
                      warmth={org.warmth}
                      orgId={org.id}
                      onUpdate={updateWarmth}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {org.peopleCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {org.peopleCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {org.dealsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        {org.dealsCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
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
