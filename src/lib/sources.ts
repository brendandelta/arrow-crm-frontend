// Source management — categories, defaults, colors, and helpers

export interface Source {
  name: string;
  category: SourceCategory;
  description?: string;
}

export type SourceCategory =
  | "relationship"
  | "event"
  | "digital"
  | "outbound"
  | "inbound"
  | "other";

export const SOURCE_CATEGORIES: {
  value: SourceCategory;
  label: string;
  color: string;
  badgeStyle: string;
}[] = [
  {
    value: "relationship",
    label: "Relationship",
    color: "bg-violet-500",
    badgeStyle: "bg-violet-50 text-violet-700",
  },
  {
    value: "event",
    label: "Event",
    color: "bg-amber-500",
    badgeStyle: "bg-amber-50 text-amber-700",
  },
  {
    value: "digital",
    label: "Digital",
    color: "bg-sky-500",
    badgeStyle: "bg-sky-50 text-sky-700",
  },
  {
    value: "outbound",
    label: "Outbound",
    color: "bg-emerald-500",
    badgeStyle: "bg-emerald-50 text-emerald-700",
  },
  {
    value: "inbound",
    label: "Inbound",
    color: "bg-blue-500",
    badgeStyle: "bg-blue-50 text-blue-700",
  },
  {
    value: "other",
    label: "Other",
    color: "bg-muted-foreground",
    badgeStyle: "bg-muted text-muted-foreground",
  },
];

export const DEFAULT_SOURCES: Source[] = [
  // Relationship
  { name: "Referral", category: "relationship", description: "Introduced by existing contact" },
  { name: "Warm Intro", category: "relationship", description: "Warm introduction via mutual connection" },
  { name: "Existing Relationship", category: "relationship", description: "Pre-existing professional relationship" },
  { name: "Co-Investor", category: "relationship", description: "Met through co-investment" },

  // Event
  { name: "Conference", category: "event", description: "Met at a conference or summit" },
  { name: "Dinner / Event", category: "event", description: "Met at a dinner or private event" },
  { name: "Roadshow", category: "event", description: "Met during a roadshow" },

  // Digital
  { name: "LinkedIn", category: "digital", description: "Connected via LinkedIn" },
  { name: "Email Campaign", category: "digital", description: "Responded to email campaign" },
  { name: "Website", category: "digital", description: "Inbound from website" },

  // Outbound
  { name: "Cold Outreach", category: "outbound", description: "Proactive cold outreach" },
  { name: "Cold Call", category: "outbound", description: "Proactive cold call" },
  { name: "Research", category: "outbound", description: "Identified through research" },

  // Inbound
  { name: "Inbound", category: "inbound", description: "Reached out to us directly" },
  { name: "RFP", category: "inbound", description: "Responded to or sent RFP" },

  // Other
  { name: "Other", category: "other" },
];

// Get the category config for a source category value
export function getCategoryConfig(category: SourceCategory) {
  return (
    SOURCE_CATEGORIES.find((c) => c.value === category) ??
    SOURCE_CATEGORIES[SOURCE_CATEGORIES.length - 1]
  );
}

// Resolve a source string to its Source object (matches by name, case-insensitive)
export function resolveSource(sourceName: string | null): Source | null {
  if (!sourceName) return null;
  const lower = sourceName.toLowerCase().trim();
  // Try exact match first
  const exact = DEFAULT_SOURCES.find((s) => s.name.toLowerCase() === lower);
  if (exact) return exact;
  // Try matching legacy enum values (e.g. "cold_outreach" -> "Cold Outreach")
  const normalized = lower.replace(/_/g, " ");
  const legacy = DEFAULT_SOURCES.find((s) => s.name.toLowerCase() === normalized);
  if (legacy) return legacy;
  // Unknown source — categorize as "other"
  return { name: sourceName, category: "other" };
}

// Get badge style for a source string
export function getSourceBadgeStyle(sourceName: string | null): string {
  const source = resolveSource(sourceName);
  if (!source) return "";
  return getCategoryConfig(source.category).badgeStyle;
}

// localStorage key for user-created sources
const CUSTOM_SOURCES_KEY = "arrow-crm-custom-sources";

// Get all sources (default + user-created)
export function getAllSources(): Source[] {
  const custom = getCustomSources();
  return [...DEFAULT_SOURCES, ...custom];
}

// Get user-created sources from localStorage
export function getCustomSources(): Source[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_SOURCES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

// Save a new custom source to localStorage
export function addCustomSource(source: Source): void {
  const existing = getCustomSources();
  // Don't add duplicates
  if (existing.some((s) => s.name.toLowerCase() === source.name.toLowerCase())) return;
  if (DEFAULT_SOURCES.some((s) => s.name.toLowerCase() === source.name.toLowerCase())) return;
  localStorage.setItem(CUSTOM_SOURCES_KEY, JSON.stringify([...existing, source]));
}
