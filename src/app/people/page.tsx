"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Building2,
  X,
  Search,
  Columns3,
  ChevronDown,
  Plus,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import { ContactSlideOut } from "./_components/ContactSlideOut";
import { LinkedInIcon, TwitterIcon, InstagramIcon } from "@/components/icons/SocialIcons";
import { OrgKindBadge } from "@/components/OrgKindBadge";
import { SourceBadge } from "@/components/SourceBadge";
import { FilterableColumnHeader } from "./_components/FilterableColumnHeader";
import { PhoneCell } from "./_components/PhoneCell";
import { ActionsDropdown } from "./_components/ActionsDropdown";
import { BulkActionBar } from "./_components/BulkActionBar";
import {
  ColumnFilter,
  ColumnFilters,
  ColumnType,
  SortDirection,
  SortConfig,
  OPERATORS_BY_TYPE,
  applyFilter,
} from "@/lib/table-filters";
import {
  getAllSources,
  SOURCE_CATEGORIES,
  resolveSource,
} from "@/lib/sources";
import {
  SmartSearchBar,
  ExplainTooltip,
} from "./_components/SmartSearchBar";
import type {
  SmartSearchQuery,
  SmartSearchResult,
  ParsedPerson,
} from "@/lib/smart-search";
import { getPageIdentity } from "@/lib/page-registry";
import { cn } from "@/lib/utils";

// Get page identity for theming
const pageIdentity = getPageIdentity("people");
const theme = pageIdentity?.theme;

// Column definitions
const ALL_COLUMNS = [
  { id: "name", label: "Name", required: true },
  { id: "organization", label: "Organization", required: false },
  { id: "title", label: "Title", required: false },
  { id: "email", label: "Email", required: false },
  { id: "phone", label: "Phone", required: false },
  { id: "location", label: "Location", required: false },
  { id: "warmth", label: "Warmth", required: false },
  { id: "tags", label: "Tags", required: false },
  { id: "source", label: "Source", required: false },
  { id: "lastContact", label: "Last Contact", required: false },
  { id: "nextFollowUp", label: "Next Follow-up", required: false },
  { id: "contactCount", label: "# Contacts", required: false },
  { id: "links", label: "Links", required: false },
  { id: "createdAt", label: "Created", required: false },
] as const;

type ColumnId = typeof ALL_COLUMNS[number]["id"];

// Default visible columns (not all are shown by default)
const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = [
  "name", "organization", "email", "phone", "location", "warmth", "lastContact", "links"
];

const WARMTH_OPTIONS = [
  { value: "all", label: "All Warmth" },
  { value: "0", label: "Cold" },
  { value: "1", label: "Warm" },
  { value: "2", label: "Hot" },
  { value: "3", label: "Champion" },
];

// Warmth configuration for inline editing
const WARMTH_CONFIG = [
  { label: "Cold", color: "bg-slate-400", hoverBg: "hover:bg-slate-100" },
  { label: "Warm", color: "bg-yellow-500", hoverBg: "hover:bg-yellow-50" },
  { label: "Hot", color: "bg-orange-500", hoverBg: "hover:bg-orange-50" },
  { label: "Champion", color: "bg-red-500", hoverBg: "hover:bg-red-50" },
];

// Inline warmth selector for quick editing in the table
function InlineWarmthSelector({
  warmth,
  personId,
  onUpdate,
}: {
  warmth: number;
  personId: number;
  onUpdate: (personId: number, newWarmth: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const config = WARMTH_CONFIG[warmth] || WARMTH_CONFIG[0];

  if (editing) {
    return (
      <div className="flex items-center gap-1" onMouseLeave={() => setEditing(false)}>
        {WARMTH_CONFIG.map((w, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(personId, i);
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
      className={`px-2 py-0.5 text-[11px] font-medium rounded-full text-white ${config.color} hover:opacity-90 transition-opacity`}
    >
      {config.label}
    </button>
  );
}

const ORG_KIND_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "fund", label: "Fund" },
  { value: "company", label: "Company" },
  { value: "bank", label: "Bank" },
  { value: "broker", label: "Broker" },
  { value: "service_provider", label: "Service Provider" },
  { value: "other", label: "Other" },
];

// Source filter options — built from the canonical source list
function buildSourceOptions(people: Person[]) {
  // Get unique source values actually used by people
  const usedSources = new Set(people.map((p) => p.source).filter(Boolean) as string[]);
  // Merge with known sources for complete list
  const allSources = getAllSources();
  const knownNames = new Set(allSources.map((s) => s.name));
  const options: { value: string; label: string }[] = [{ value: "all", label: "All Sources" }];
  for (const src of allSources) {
    if (usedSources.has(src.name)) {
      options.push({ value: src.name, label: src.name });
    }
  }
  // Add any used sources not in the known list
  for (const name of usedSources) {
    if (!knownNames.has(name)) {
      options.push({ value: name, label: name });
    }
  }
  return options;
}

// Source category filter options
const SOURCE_CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  ...SOURCE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  org: string | null;
  orgId: number | null;
  orgKind: string | null;
  email: string | null;
  phone: string | null;
  warmth: number;
  city: string | null;
  state: string | null;
  country: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  source: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  contactCount: number;
  tags: string[];
  createdAt: string;
}

// Column configuration with types
const COLUMN_TYPES: Record<string, ColumnType> = {
  name: "text",
  organization: "select",
  title: "text",
  email: "text",
  phone: "text",
  location: "text",
  warmth: "warmth",
  tags: "multi_select",
  source: "select",
  lastContact: "date",
  nextFollowUp: "date",
  contactCount: "number",
  links: "text",
  createdAt: "date",
};

// Helper to get field value from person for filtering
function getPersonFieldValue(person: Person, columnId: string): string | number | null | string[] {
  switch (columnId) {
    case "name":
      return `${person.firstName} ${person.lastName}`;
    case "organization":
      return person.org;
    case "title":
      return person.title;
    case "email":
      return person.email;
    case "phone":
      return person.phone;
    case "location":
      return [person.city, person.state, person.country].filter(Boolean).join(", ") || null;
    case "warmth":
      return person.warmth.toString();
    case "tags":
      return person.tags;
    case "source":
      return person.source;
    case "lastContact":
      return person.lastContactedAt;
    case "nextFollowUp":
      return person.nextFollowUpAt;
    case "contactCount":
      return person.contactCount;
    case "createdAt":
      return person.createdAt;
    default:
      return null;
  }
}

const DATE_COLUMNS = ["lastContact", "nextFollowUp", "createdAt"];

function matchesColumnFilter(person: Person, columnId: string, filter: ColumnFilter): boolean {
  const fieldValue = getPersonFieldValue(person, columnId);
  if (fieldValue === null && columnId === "default") return true;
  return applyFilter(fieldValue, filter, DATE_COLUMNS.includes(columnId));
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

// localStorage keys for persisting user preferences
const STORAGE_KEYS = {
  visibleColumns: "arrow-crm-people-columns",
  columnFilters: "arrow-crm-people-column-filters",
  sortConfig: "arrow-crm-people-sort",
  warmthFilter: "arrow-crm-people-warmth-filter",
  orgKindFilter: "arrow-crm-people-org-kind-filter",
  sourceFilter: "arrow-crm-people-source-filter",
};

// Helper to safely parse JSON from localStorage
function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(`Failed to parse stored value for ${key}:`, e);
  }
  return fallback;
}

export default function PeoplePage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [showContactSlideOut, setShowContactSlideOut] = useState(false);

  // Search and filter state - initialized from localStorage
  const [searchQuery, setSearchQuery] = useState("");
  const [warmthFilter, setWarmthFilter] = useState("all");
  const [orgKindFilter, setOrgKindFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState("all");

  // Smart Search state
  const [smartSearchResults, setSmartSearchResults] = useState<SmartSearchResult[] | null>(null);
  const [searchSource, setSearchSource] = useState<"deterministic" | "llm" | null>(null);
  const useSmartSearch = true;

  // Smart search result map for quick lookup (must be before filteredPeople)
  const smartResultMap = useMemo(() => {
    if (!smartSearchResults) return null;
    const map = new Map<number, SmartSearchResult>();
    for (const r of smartSearchResults) {
      map.set(r.personId, r);
    }
    return map;
  }, [smartSearchResults]);

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(
    new Set(DEFAULT_VISIBLE_COLUMNS)
  );

  // Column-level filters and sorting
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Dropdown state
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Load persisted preferences from localStorage on mount
  useEffect(() => {
    const storedColumns = getStoredValue<ColumnId[]>(STORAGE_KEYS.visibleColumns, []);
    if (storedColumns.length > 0) {
      setVisibleColumns(new Set(storedColumns));
    }

    const storedColumnFilters = getStoredValue<ColumnFilters>(STORAGE_KEYS.columnFilters, {});
    if (Object.keys(storedColumnFilters).length > 0) {
      setColumnFilters(storedColumnFilters);
    }

    const storedSortConfig = getStoredValue<SortConfig>(STORAGE_KEYS.sortConfig, null);
    if (storedSortConfig) {
      setSortConfig(storedSortConfig);
    }

    const storedWarmthFilter = getStoredValue<string>(STORAGE_KEYS.warmthFilter, "all");
    setWarmthFilter(storedWarmthFilter);

    const storedOrgKindFilter = getStoredValue<string>(STORAGE_KEYS.orgKindFilter, "all");
    setOrgKindFilter(storedOrgKindFilter);

    const storedSourceFilter = getStoredValue<string>(STORAGE_KEYS.sourceFilter, "all");
    setSourceFilter(storedSourceFilter);

    setIsInitialized(true);
  }, []);

  // Persist visible columns to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.visibleColumns, JSON.stringify(Array.from(visibleColumns)));
    }
  }, [visibleColumns, isInitialized]);

  // Persist column filters to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.columnFilters, JSON.stringify(columnFilters));
    }
  }, [columnFilters, isInitialized]);

  // Persist sort config to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.sortConfig, JSON.stringify(sortConfig));
    }
  }, [sortConfig, isInitialized]);

  // Persist global filters to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.warmthFilter, JSON.stringify(warmthFilter));
    }
  }, [warmthFilter, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.orgKindFilter, JSON.stringify(orgKindFilter));
    }
  }, [orgKindFilter, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.sourceFilter, JSON.stringify(sourceFilter));
    }
  }, [sourceFilter, isInitialized]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`)
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter people based on search, global filters, and column filters
  const filteredPeople = people.filter((person) => {
    // Smart search takes over filtering when active
    if (useSmartSearch && smartSearchResults !== null) {
      if (!smartResultMap?.has(person.id)) return false;
      // Still apply global filters on top of smart search
    } else if (searchQuery) {
      // Fallback: basic text search
      const query = searchQuery.toLowerCase();
      const searchableText = [
        person.firstName,
        person.lastName,
        person.email,
        person.org,
        person.title,
        person.city,
        person.country,
        ...(person.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    // Warmth filter (global)
    if (warmthFilter !== "all" && person.warmth !== parseInt(warmthFilter)) {
      return false;
    }

    // Org kind filter (global)
    if (orgKindFilter !== "all" && person.orgKind !== orgKindFilter) {
      return false;
    }

    // Source filter (global)
    if (sourceFilter !== "all" && person.source !== sourceFilter) {
      return false;
    }

    // Source category filter (global)
    if (sourceCategoryFilter !== "all") {
      const resolved = resolveSource(person.source);
      if (!resolved || resolved.category !== sourceCategoryFilter) {
        return false;
      }
    }

    // Column-level filters
    for (const [columnId, filter] of Object.entries(columnFilters)) {
      if (!matchesColumnFilter(person, columnId, filter)) {
        return false;
      }
    }

    return true;
  });

  // Apply sorting — smart search results override sort with relevance score
  const sortedPeople = [...filteredPeople].sort((a, b) => {
    // When smart search is active and no explicit sort, sort by relevance score
    if (useSmartSearch && smartSearchResults !== null && !sortConfig) {
      const scoreA = smartResultMap?.get(a.id)?.score ?? 0;
      const scoreB = smartResultMap?.get(b.id)?.score ?? 0;
      return scoreB - scoreA;
    }
    if (!sortConfig) return 0;

    const { columnId, direction } = sortConfig;
    if (!direction) return 0;

    let aValue: string | number | null = null;
    let bValue: string | number | null = null;

    switch (columnId) {
      case "name":
        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
        break;
      case "organization":
        aValue = a.org?.toLowerCase() || "";
        bValue = b.org?.toLowerCase() || "";
        break;
      case "title":
        aValue = a.title?.toLowerCase() || "";
        bValue = b.title?.toLowerCase() || "";
        break;
      case "email":
        aValue = a.email?.toLowerCase() || "";
        bValue = b.email?.toLowerCase() || "";
        break;
      case "location":
        aValue = [a.city, a.country].filter(Boolean).join(", ").toLowerCase();
        bValue = [b.city, b.country].filter(Boolean).join(", ").toLowerCase();
        break;
      case "warmth":
        aValue = a.warmth;
        bValue = b.warmth;
        break;
      case "source":
        aValue = a.source?.toLowerCase() || "";
        bValue = b.source?.toLowerCase() || "";
        break;
      case "lastContact":
        aValue = a.lastContactedAt || "";
        bValue = b.lastContactedAt || "";
        break;
      case "nextFollowUp":
        aValue = a.nextFollowUpAt || "";
        bValue = b.nextFollowUpAt || "";
        break;
      case "contactCount":
        aValue = a.contactCount;
        bValue = b.contactCount;
        break;
      case "createdAt":
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      default:
        return 0;
    }

    if (aValue === null || aValue === "") aValue = direction === "asc" ? "\uffff" : "";
    if (bValue === null || bValue === "") bValue = direction === "asc" ? "\uffff" : "";

    let comparison = 0;
    if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return direction === "asc" ? comparison : -comparison;
  });

  const championsCount = people.filter((p) => p.warmth === 3).length;
  const hotCount = people.filter((p) => p.warmth === 2).length;

  // Analytics: new this week + top sources
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newThisWeek = people.filter(
    (p) => new Date(p.createdAt) >= oneWeekAgo
  ).length;

  const sourceCounts = people.reduce<Record<string, number>>((acc, p) => {
    if (p.source) {
      const resolved = resolveSource(p.source);
      const name = resolved?.name ?? p.source;
      acc[name] = (acc[name] || 0) + 1;
    }
    return acc;
  }, {});
  const topSources = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Build source filter options dynamically
  const sourceFilterOptions = buildSourceOptions(people);

  // Smart search helpers
  const knownOrgs = useMemo(
    () => [...new Set(people.map((p) => p.org).filter(Boolean) as string[])],
    [people]
  );

  const knownSources = useMemo(
    () => [...new Set(people.map((p) => p.source).filter(Boolean) as string[])],
    [people]
  );

  const parsedPeople: ParsedPerson[] = useMemo(
    () =>
      people.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        title: p.title,
        org: p.org,
        orgId: p.orgId,
        orgKind: p.orgKind,
        email: p.email,
        warmth: p.warmth,
        source: p.source,
        tags: p.tags,
        city: p.city,
        state: p.state,
        country: p.country,
        createdAt: p.createdAt,
        lastContactedAt: p.lastContactedAt,
      })),
    [people]
  );

  const handleSmartSearchResults = useCallback(
    (results: SmartSearchResult[] | null, _query: SmartSearchQuery | null, source: "deterministic" | "llm") => {
      setSmartSearchResults(results);
      setSearchSource(results ? source : null);
    },
    []
  );

  const selectedPeople = sortedPeople.filter(p => selectedIds.has(p.id));
  const allSelected = sortedPeople.length > 0 && sortedPeople.every(p => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const activeFiltersCount =
    (warmthFilter !== "all" ? 1 : 0) +
    (orgKindFilter !== "all" ? 1 : 0) +
    (sourceFilter !== "all" ? 1 : 0) +
    (sourceCategoryFilter !== "all" ? 1 : 0);

  const columnFiltersCount = Object.keys(columnFilters).length;

  // Helper to get column values for filter dropdowns
  const getColumnValues = (columnId: string): string[] => {
    switch (columnId) {
      case "name":
        return people.map((p) => `${p.firstName} ${p.lastName}`);
      case "organization":
        return people.map((p) => p.org).filter(Boolean) as string[];
      case "title":
        return people.map((p) => p.title).filter(Boolean) as string[];
      case "email":
        return people.map((p) => p.email).filter(Boolean) as string[];
      case "location":
        return people.map((p) => [p.city, p.country].filter(Boolean).join(", ")).filter(Boolean);
      case "source":
        return people.map((p) => p.source).filter(Boolean) as string[];
      case "tags":
        return people.flatMap((p) => p.tags || []);
      default:
        return [];
    }
  };

  const handleColumnFilterChange = (columnId: string, filter: ColumnFilter | undefined) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      if (filter) {
        newFilters[columnId] = filter;
      } else {
        delete newFilters[columnId];
      }
      return newFilters;
    });
  };

  const handleSortChange = (columnId: string, direction: SortDirection) => {
    setSortConfig(direction ? { columnId, direction } : null);
  };

  const toggleColumn = (columnId: ColumnId) => {
    const column = ALL_COLUMNS.find(c => c.id === columnId);
    if (column?.required) return;

    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    setVisibleColumns(newVisible);
  };

  const resetFilters = () => {
    setWarmthFilter("all");
    setOrgKindFilter("all");
    setSourceFilter("all");
    setSourceCategoryFilter("all");
    setColumnFilters({});
    setSortConfig(null);
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      // Deselect all filtered people
      const newSelected = new Set(selectedIds);
      sortedPeople.forEach(p => newSelected.delete(p.id));
      setSelectedIds(newSelected);
    } else {
      // Select all filtered people
      const newSelected = new Set(selectedIds);
      sortedPeople.forEach(p => newSelected.add(p.id));
      setSelectedIds(newSelected);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkUpdate = (updates: Partial<Person>) => {
    // Update local state immediately for responsiveness
    setPeople(prevPeople =>
      prevPeople.map(person =>
        selectedIds.has(person.id) ? { ...person, ...updates } : person
      )
    );
  };

  // Inline warmth update with optimistic UI
  const updatePersonWarmth = useCallback(async (personId: number, newWarmth: number) => {
    const oldPerson = people.find(p => p.id === personId);
    if (!oldPerson) return;

    // Optimistic update
    setPeople(prev => prev.map(p => p.id === personId ? { ...p, warmth: newWarmth } : p));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${personId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ warmth: newWarmth }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Updated to ${WARMTH_CONFIG[newWarmth].label}`);
    } catch {
      // Rollback on error
      setPeople(prev => prev.map(p => p.id === personId ? oldPerson : p));
      toast.error("Failed to update warmth");
    }
  }, [people]);

  const visibleColumnCount = visibleColumns.size + 1; // +1 for checkbox column

  const Icon = pageIdentity?.icon || Users;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#FAFBFC]">
      {/* Premium Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="relative px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )} />
                <div className={cn(
                  "relative h-11 w-11 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-[1.02]",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )}>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
                  <Icon className="relative h-5 w-5 text-white drop-shadow-sm" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  People
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {loading ? (
                    <span className="inline-block w-32 h-4 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{people.length} contacts</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-violet-600">{newThisWeek} new this week</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-red-500">{championsCount} champions</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-orange-500">{hotCount} hot</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Smart Search */}
              <div className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity",
                  theme && `bg-gradient-to-r ${theme.gradient}`
                )} style={{ opacity: 0.15 }} />
                <div className="relative">
                  {useSmartSearch ? (
                    <SmartSearchBar
                      people={parsedPeople}
                      knownOrgs={knownOrgs}
                      knownSources={knownSources}
                      onResults={handleSmartSearchResults}
                    />
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search people..."
                        className={cn(
                          "w-72 h-11 pl-11 pr-4 text-sm rounded-xl transition-all duration-200",
                          "bg-slate-50 border border-slate-200/80",
                          "placeholder:text-slate-400",
                          "focus:outline-none focus:bg-white focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* New Contact Button */}
              <button
                onClick={() => setShowContactSlideOut(true)}
                className={cn(
                  "group relative flex items-center gap-2.5 h-11 px-5",
                  "text-white text-sm font-medium rounded-xl",
                  "shadow-lg active:scale-[0.98] transition-all duration-200",
                  theme && `bg-gradient-to-b ${theme.gradient} ${theme.shadow}`,
                  theme && `hover:shadow-xl`
                )}
              >
                <Plus className="h-4 w-4" />
                <span>New Contact</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary toolbar */}
        <div className="px-8 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Top Sources Analytics */}
            {topSources.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Top Sources:</span>
                {topSources.slice(0, 4).map(([name, count]) => {
                  const resolved = resolveSource(name);
                  const config = resolved
                    ? SOURCE_CATEGORIES.find((c) => c.value === resolved.category)
                    : null;
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        setSourceFilter(name);
                        setShowFilterDropdown(false);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        sourceFilter === name
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {config && (
                        <span className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
                      )}
                      <span>{name}</span>
                      <span className="text-slate-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex-1" />

            {/* Columns Dropdown */}
            <div ref={columnDropdownRef} className="relative">
              <button
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Columns3 className="h-4 w-4" />
                <span>Columns</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showColumnDropdown ? "rotate-180" : ""}`} />
              </button>

              {showColumnDropdown && (
                <div className="absolute z-50 top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide px-2 py-1">
                      Show Columns
                    </div>
                    {ALL_COLUMNS.map((column) => (
                      <div
                        key={column.id}
                        onClick={() => !column.required && toggleColumn(column.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${
                          column.required ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        <Checkbox
                          checked={visibleColumns.has(column.id)}
                          disabled={column.required}
                          onCheckedChange={() => !column.required && toggleColumn(column.id)}
                        />
                        <span>{column.label}</span>
                        {column.required && (
                          <span className="text-xs text-slate-400 ml-auto">Required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filters Dropdown */}
            <div ref={filterDropdownRef} className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                  activeFiltersCount > 0
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center h-5 w-5 bg-violet-600 text-white text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {showFilterDropdown && (
                <div className="absolute z-50 top-full right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                        Warmth
                      </label>
                      <select
                        value={warmthFilter}
                        onChange={(e) => setWarmthFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        {WARMTH_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                        Organization Type
                      </label>
                      <select
                        value={orgKindFilter}
                        onChange={(e) => setOrgKindFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        {ORG_KIND_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                        Source
                      </label>
                      <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        {sourceFilterOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                        Source Category
                      </label>
                      <select
                        value={sourceCategoryFilter}
                        onChange={(e) => setSourceCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        {SOURCE_CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {activeFiltersCount > 0 && (
                      <button
                        onClick={resetFilters}
                        className="w-full text-sm text-violet-600 hover:text-violet-800 py-1.5"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Results count when filtered */}
            {(searchQuery || smartSearchResults !== null || activeFiltersCount > 0 || columnFiltersCount > 0) && (
              <div className="text-sm text-slate-500">
                {smartSearchResults !== null ? (
                  <span>
                    <span className="text-violet-600 font-medium">{sortedPeople.length}</span>
                    {searchSource === "llm" ? " AI-powered results" : " results ranked by relevance"}
                  </span>
                ) : (
                  <>Showing {sortedPeople.length} of {people.length}</>
                )}
              </div>
            )}

            {/* Active column filters indicator */}
            {columnFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(columnFilters).map(([columnId, filter]) => {
                  const column = ALL_COLUMNS.find((c) => c.id === columnId);
                  const operatorLabel = OPERATORS_BY_TYPE[COLUMN_TYPES[columnId]]?.find(
                    (o) => o.value === filter.operator
                  )?.label;
                  return (
                    <span
                      key={columnId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-full border border-violet-200"
                    >
                      <span className="font-medium">{column?.label}:</span>
                      <span>{operatorLabel}</span>
                      <button
                        onClick={() => handleColumnFilterChange(columnId, undefined)}
                        className="ml-1 hover:text-violet-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                <button
                  onClick={() => setColumnFilters({})}
                  className="text-xs text-violet-600 hover:text-violet-800"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Actions Dropdown - only show when contacts are selected */}
            {selectedIds.size > 0 && (
              <ActionsDropdown
                selectedPeople={selectedPeople}
                onClearSelection={clearSelection}
                onBulkUpdate={handleBulkUpdate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                        }
                      }}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  {visibleColumns.has("name") && (
                    <TableHead className="w-[200px]">
                      <FilterableColumnHeader
                        label="Name"
                        columnId="name"
                        columnType={COLUMN_TYPES.name}
                        values={getColumnValues("name")}
                        filter={columnFilters.name}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "name" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("organization") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Organization"
                        columnId="organization"
                        columnType={COLUMN_TYPES.organization}
                        values={getColumnValues("organization")}
                        filter={columnFilters.organization}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "organization" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("title") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Title"
                        columnId="title"
                        columnType={COLUMN_TYPES.title}
                        values={getColumnValues("title")}
                        filter={columnFilters.title}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "title" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("email") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Email"
                        columnId="email"
                        columnType={COLUMN_TYPES.email}
                        values={getColumnValues("email")}
                        filter={columnFilters.email}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "email" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("phone") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Phone"
                        columnId="phone"
                        columnType={COLUMN_TYPES.phone}
                        values={[]}
                        filter={columnFilters.phone}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "phone" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("location") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Location"
                        columnId="location"
                        columnType={COLUMN_TYPES.location}
                        values={getColumnValues("location")}
                        filter={columnFilters.location}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "location" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("warmth") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Warmth"
                        columnId="warmth"
                        columnType={COLUMN_TYPES.warmth}
                        values={[]}
                        filter={columnFilters.warmth}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "warmth" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("tags") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Tags"
                        columnId="tags"
                        columnType={COLUMN_TYPES.tags}
                        values={getColumnValues("tags")}
                        filter={columnFilters.tags}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "tags" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("source") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Source"
                        columnId="source"
                        columnType={COLUMN_TYPES.source}
                        values={getColumnValues("source")}
                        filter={columnFilters.source}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "source" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("lastContact") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Last Contact"
                        columnId="lastContact"
                        columnType={COLUMN_TYPES.lastContact}
                        values={[]}
                        filter={columnFilters.lastContact}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "lastContact" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("nextFollowUp") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Next Follow-up"
                        columnId="nextFollowUp"
                        columnType={COLUMN_TYPES.nextFollowUp}
                        values={[]}
                        filter={columnFilters.nextFollowUp}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "nextFollowUp" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("contactCount") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="# Contacts"
                        columnId="contactCount"
                        columnType={COLUMN_TYPES.contactCount}
                        values={[]}
                        filter={columnFilters.contactCount}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "contactCount" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has("links") && <TableHead className="text-xs uppercase tracking-wide text-slate-500">Links</TableHead>}
                  {visibleColumns.has("createdAt") && (
                    <TableHead>
                      <FilterableColumnHeader
                        label="Created"
                        columnId="createdAt"
                        columnType={COLUMN_TYPES.createdAt}
                        values={[]}
                        filter={columnFilters.createdAt}
                        onFilterChange={handleColumnFilterChange}
                        sortDirection={sortConfig?.columnId === "createdAt" ? sortConfig.direction : null}
                        onSortChange={handleSortChange}
                      />
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                        Loading contacts...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedPeople.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-slate-300" />
                        <p className="text-muted-foreground">
                          {people.length === 0 ? "No contacts yet" : "No results match your filters"}
                        </p>
                        {people.length === 0 && (
                          <button
                            onClick={() => setShowContactSlideOut(true)}
                            className="mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
                          >
                            Add your first contact
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedPeople.map((person) => (
                    <TableRow
                      key={person.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedIds.has(person.id) ? "bg-violet-50" : "hover:bg-slate-50"
                      )}
                      onClick={() => router.push(`/people/${person.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(person.id)}
                          onCheckedChange={() => toggleSelect(person.id)}
                          aria-label={`Select ${person.firstName} ${person.lastName}`}
                        />
                      </TableCell>
                      {visibleColumns.has("name") && (
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium text-white",
                              `bg-gradient-to-br ${theme?.gradient || "from-violet-500 to-purple-600"}`
                            )}>
                              {getInitials(person.firstName, person.lastName)}
                            </div>
                            <div className="font-medium text-slate-900">{person.firstName} {person.lastName}</div>
                            {/* Smart search explainability */}
                            {smartResultMap?.has(person.id) && (
                              <ExplainTooltip
                                explanations={smartResultMap.get(person.id)!.explanations}
                              />
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.has("organization") && (
                        <TableCell>
                          {person.org ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-slate-700">{person.org}</span>
                              <OrgKindBadge kind={person.orgKind} />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has("title") && (
                        <TableCell className="text-sm text-slate-600">
                          {person.title || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                      {visibleColumns.has("email") && (
                        <TableCell>
                          {person.email ? (
                            <a
                              href={`mailto:${person.email}`}
                              className="text-sm text-violet-600 hover:underline flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {person.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has("phone") && (
                        <TableCell>
                          <PhoneCell phone={person.phone} />
                        </TableCell>
                      )}
                      {visibleColumns.has("location") && (
                        <TableCell className="text-muted-foreground text-sm">
                          {person.city && person.country
                            ? `${person.city}, ${person.country}`
                            : person.city || person.state || person.country || "—"}
                        </TableCell>
                      )}
                      {visibleColumns.has("warmth") && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <InlineWarmthSelector
                            warmth={person.warmth}
                            personId={person.id}
                            onUpdate={updatePersonWarmth}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.has("tags") && (
                        <TableCell>
                          {person.tags && person.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {person.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {person.tags.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{person.tags.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has("source") && (
                        <TableCell className="text-sm">
                          {person.source ? (
                            <SourceBadge source={person.source} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has("lastContact") && (
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(person.lastContactedAt)}
                        </TableCell>
                      )}
                      {visibleColumns.has("nextFollowUp") && (
                        <TableCell className="text-sm">
                          {person.nextFollowUpAt ? (
                            <span className={new Date(person.nextFollowUpAt) < new Date() ? "text-red-600" : "text-muted-foreground"}>
                              {formatDate(person.nextFollowUpAt)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has("contactCount") && (
                        <TableCell className="text-sm text-muted-foreground text-center">
                          {person.contactCount || 0}
                        </TableCell>
                      )}
                      {visibleColumns.has("links") && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {person.linkedin && (
                              <a
                                href={person.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0A66C2] hover:text-[#004182]"
                                onClick={(e) => e.stopPropagation()}
                                title="LinkedIn"
                              >
                                <LinkedInIcon className="h-4 w-4" />
                              </a>
                            )}
                            {person.twitter && (
                              <a
                                href={person.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-800 hover:text-black"
                                onClick={(e) => e.stopPropagation()}
                                title="X (Twitter)"
                              >
                                <TwitterIcon className="h-4 w-4" />
                              </a>
                            )}
                            {person.instagram && (
                              <a
                                href={person.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#E4405F] hover:text-[#C13584]"
                                onClick={(e) => e.stopPropagation()}
                                title="Instagram"
                              >
                                <InstagramIcon className="h-4 w-4" />
                              </a>
                            )}
                            {!person.linkedin && !person.twitter && !person.instagram && (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.has("createdAt") && (
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(person.createdAt)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {selectedPeople.length > 0 && (
        <BulkActionBar selectedPeople={selectedPeople} onClear={clearSelection} />
      )}

      <ContactSlideOut
        isOpen={showContactSlideOut}
        onClose={() => setShowContactSlideOut(false)}
        onSave={(newContact) => {
          // Add the new contact to the list and navigate to their page
          router.push(`/people/${newContact.id}`);
        }}
      />
    </div>
  );
}
