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
  Search,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Plus,
  Briefcase,
} from "lucide-react";
import { getPageIdentity } from "@/lib/page-registry";
import { cn } from "@/lib/utils";

// Get page identity for theming
const pageIdentity = getPageIdentity("organizations");
const theme = pageIdentity?.theme;
const Icon = pageIdentity?.icon || Building2;

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
  broker: { label: "Broker", bg: "bg-slate-100", text: "text-slate-600" },
  law_firm: { label: "Law Firm", bg: "bg-emerald-100", text: "text-emerald-700" },
  bank: { label: "Bank", bg: "bg-cyan-100", text: "text-cyan-700" },
  service_provider: { label: "Service", bg: "bg-rose-100", text: "text-rose-700" },
  other: { label: "Other", bg: "bg-gray-100", text: "text-gray-600" },
};

const WARMTH_CONFIG = [
  { label: "Cold", color: "bg-slate-400", hoverBg: "hover:bg-slate-100" },
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
                : `bg-white border-slate-200 text-slate-600 ${w.hoverBg}`
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
              i <= warmth ? WARMTH_CONFIG[warmth].color : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
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
      className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
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
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#FAFBFC]">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                theme && `bg-gradient-to-br ${theme.gradient} ${theme.shadow}`
              )}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Organizations
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {loading ? (
                    <span className="inline-block w-32 h-4 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{stats.total} total</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-blue-600">{stats.funds} funds</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-purple-600">{stats.companies} companies</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-orange-600">{stats.hot} hot+</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity",
                  theme && `bg-gradient-to-r ${theme.gradient}`
                )} style={{ opacity: 0.15 }} />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search organizations..."
                    className={cn(
                      "w-72 h-11 pl-11 pr-4 text-sm rounded-xl transition-all duration-200",
                      "bg-slate-50 border border-slate-200/80",
                      "placeholder:text-slate-400",
                      "focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                    )}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-colors",
                  showFilters || hasActiveFilters
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 flex items-center justify-center h-5 w-5 bg-blue-600 text-white text-xs rounded-full">
                    {[kindFilter !== "all", warmthFilter !== "all", search.length > 0].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Add Organization Button */}
              <button
                onClick={() => router.push("/organizations/new")}
                className={cn(
                  "group relative flex items-center gap-2.5 h-11 px-5",
                  "text-white text-sm font-medium rounded-xl",
                  "shadow-lg active:scale-[0.98] transition-all duration-200",
                  theme && `bg-gradient-to-b ${theme.gradient} ${theme.shadow}`,
                  theme && "hover:shadow-xl"
                )}
              >
                <Plus className="h-4 w-4" />
                <span>Add Organization</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="px-8 pb-4">
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {/* Kind Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Type</span>
                <select
                  value={kindFilter}
                  onChange={(e) => setKindFilter(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Warmth</span>
                <select
                  value={warmthFilter}
                  onChange={(e) => setWarmthFilter(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">All Warmth</option>
                  {WARMTH_CONFIG.map((w, i) => (
                    <option key={i} value={i.toString()}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1" />

              {/* Results Count */}
              {hasActiveFilters && (
                <div className="text-sm text-slate-500">
                  Showing {filteredOrgs.length} of {organizations.length}
                </div>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setKindFilter("all");
                    setWarmthFilter("all");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
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
                <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    Loading organizations...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Building2 className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">
                    {organizations.length === 0 ? "No organizations yet" : "No organizations match your filters"}
                  </p>
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
                  {organizations.length === 0 && (
                    <button
                      onClick={() => router.push("/organizations/new")}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add your first organization
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow
                  key={org.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors group"
                  onClick={() => router.push(`/organizations/${org.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                        `bg-gradient-to-br ${theme?.gradient || "from-blue-500 to-blue-600"}`
                      )}>
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{org.name}</div>
                        {org.sector && (
                          <div className="text-xs text-slate-500">{org.sector}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <KindBadge kind={org.kind} />
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {org.city && org.country
                      ? `${org.city}, ${org.country}`
                      : org.city || org.country || (
                          <span className="text-slate-300">—</span>
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
                      <span className="text-slate-300">—</span>
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
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {org.peopleCount}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {org.dealsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        {org.dealsCount}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
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
    </div>
  );
}
