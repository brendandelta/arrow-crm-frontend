/**
 * Page Registry - Unified Identity System
 *
 * Central source of truth for page identity including:
 * - Icons (Lucide icons)
 * - Colors (theme colors with gradients)
 * - Labels and metadata
 * - Default sidebar order and grouping
 *
 * This system ensures visual consistency across:
 * - Sidebar navigation
 * - Page headers
 * - Primary action buttons
 * - Any UI representing these object types
 */

import {
  Home,
  CircleDollarSign,
  Building2,
  Landmark,
  Users,
  CheckSquare,
  FolderKanban,
  Map,
  Calendar,
  FileText,
  KeyRound,
  Settings,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

/**
 * Color theme for a page/object type
 * Each color set provides consistent styling across all contexts
 */
export interface PageColorTheme {
  // Primary gradient for icons and headers
  gradient: string;
  // Solid color for simpler contexts
  solid: string;
  // Light background for cards/sections
  bgLight: string;
  // Border color
  border: string;
  // Text color for labels on light bg
  text: string;
  // Hover state for buttons
  hoverGradient: string;
  // Shadow color for elevated elements
  shadow: string;
  // Ring color for focus states
  ring: string;
}

/**
 * Complete page identity definition
 */
export interface PageIdentity {
  // Unique identifier (matches route segment)
  id: string;
  // Display label
  label: string;
  // Short label for collapsed sidebar
  shortLabel?: string;
  // Description for tooltips
  description?: string;
  // Primary route
  href: string;
  // Lucide icon component
  icon: LucideIcon;
  // Color theme
  theme: PageColorTheme;
  // Sub-navigation items
  children?: {
    id: string;
    label: string;
    href: string;
  }[];
  // Default sidebar group
  group: "main" | "workspace" | "admin";
  // Default order within group (lower = higher)
  defaultOrder: number;
  // Whether this is a core navigation item (can't be hidden)
  isCore?: boolean;
  // Permission required to view (if any)
  permission?: string;
}

/**
 * Premium color palette
 * Designed to be harmonious, modern, and sophisticated
 * Inspired by the Internal Entities indigo/purple treatment
 */
const COLORS = {
  // Dashboard - Slate/Neutral (anchor)
  slate: {
    gradient: "from-slate-600 to-slate-700",
    solid: "#475569",
    bgLight: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    hoverGradient: "from-slate-700 to-slate-800",
    shadow: "shadow-slate-500/20",
    ring: "ring-slate-500/20",
  },
  // Deals - Emerald/Teal (money, growth)
  emerald: {
    gradient: "from-emerald-500 to-teal-600",
    solid: "#10b981",
    bgLight: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    hoverGradient: "from-emerald-600 to-teal-700",
    shadow: "shadow-emerald-500/25",
    ring: "ring-emerald-500/20",
  },
  // Organizations - Blue (corporate, trust)
  blue: {
    gradient: "from-blue-500 to-blue-600",
    solid: "#3b82f6",
    bgLight: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    hoverGradient: "from-blue-600 to-blue-700",
    shadow: "shadow-blue-500/25",
    ring: "ring-blue-500/20",
  },
  // Internal Entities - Indigo/Purple (premium, institutional)
  indigo: {
    gradient: "from-indigo-500 to-indigo-600",
    solid: "#6366f1",
    bgLight: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    hoverGradient: "from-indigo-600 to-indigo-700",
    shadow: "shadow-indigo-500/25",
    ring: "ring-indigo-500/20",
  },
  // People - Violet (personal, relationships)
  violet: {
    gradient: "from-violet-500 to-purple-600",
    solid: "#8b5cf6",
    bgLight: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    hoverGradient: "from-violet-600 to-purple-700",
    shadow: "shadow-violet-500/25",
    ring: "ring-violet-500/20",
  },
  // Tasks - Amber/Orange (action, urgency)
  amber: {
    gradient: "from-amber-500 to-orange-500",
    solid: "#f59e0b",
    bgLight: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    hoverGradient: "from-amber-600 to-orange-600",
    shadow: "shadow-amber-500/25",
    ring: "ring-amber-500/20",
  },
  // Projects - Cyan (coordination, clarity)
  cyan: {
    gradient: "from-cyan-500 to-sky-600",
    solid: "#06b6d4",
    bgLight: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    hoverGradient: "from-cyan-600 to-sky-700",
    shadow: "shadow-cyan-500/25",
    ring: "ring-cyan-500/20",
  },
  // Map - Rose/Pink (location, warmth)
  rose: {
    gradient: "from-rose-500 to-pink-600",
    solid: "#f43f5e",
    bgLight: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    hoverGradient: "from-rose-600 to-pink-700",
    shadow: "shadow-rose-500/25",
    ring: "ring-rose-500/20",
  },
  // Events - Fuchsia (time, occasions)
  fuchsia: {
    gradient: "from-fuchsia-500 to-pink-600",
    solid: "#d946ef",
    bgLight: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    text: "text-fuchsia-700",
    hoverGradient: "from-fuchsia-600 to-pink-700",
    shadow: "shadow-fuchsia-500/25",
    ring: "ring-fuchsia-500/20",
  },
  // Documents - Sky/Blue (files, information)
  sky: {
    gradient: "from-sky-500 to-blue-600",
    solid: "#0ea5e9",
    bgLight: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    hoverGradient: "from-sky-600 to-blue-700",
    shadow: "shadow-sky-500/25",
    ring: "ring-sky-500/20",
  },
  // Vault - Purple/Violet (security, premium)
  purple: {
    gradient: "from-purple-500 to-violet-600",
    solid: "#a855f7",
    bgLight: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    hoverGradient: "from-purple-600 to-violet-700",
    shadow: "shadow-purple-500/25",
    ring: "ring-purple-500/20",
  },
  // Analytics - Green (data, insights)
  green: {
    gradient: "from-green-500 to-emerald-600",
    solid: "#22c55e",
    bgLight: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    hoverGradient: "from-green-600 to-emerald-700",
    shadow: "shadow-green-500/25",
    ring: "ring-green-500/20",
  },
} as const;

/**
 * Master page registry
 * Order here represents default sidebar order
 */
export const PAGE_REGISTRY: PageIdentity[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    description: "Overview and quick actions",
    href: "/",
    icon: Home,
    theme: COLORS.slate,
    group: "main",
    defaultOrder: 0,
    isCore: true,
  },
  {
    id: "deals",
    label: "Deals",
    description: "Investment deals and pipeline",
    href: "/deals",
    icon: CircleDollarSign,
    theme: COLORS.emerald,
    group: "main",
    defaultOrder: 1,
    isCore: true,
    children: [
      { id: "deals-all", label: "All Deals", href: "/deals" },
      { id: "deals-live", label: "Live", href: "/deals/live" },
      { id: "deals-sourcing", label: "Sourcing", href: "/deals/sourcing" },
    ],
  },
  {
    id: "organizations",
    label: "Organizations",
    shortLabel: "Orgs",
    description: "Companies, funds, and entities",
    href: "/organizations",
    icon: Building2,
    theme: COLORS.blue,
    group: "main",
    defaultOrder: 2,
    children: [
      { id: "orgs-all", label: "All", href: "/organizations" },
      { id: "orgs-funds", label: "Funds", href: "/organizations/funds" },
      { id: "orgs-companies", label: "Companies", href: "/organizations/companies" },
    ],
  },
  {
    id: "internal-entities",
    label: "Internal Entities",
    shortLabel: "Entities",
    description: "Arrow Fund internal legal entities",
    href: "/internal-entities",
    icon: Landmark,
    theme: COLORS.indigo,
    group: "main",
    defaultOrder: 3,
  },
  {
    id: "people",
    label: "People",
    shortLabel: "People",
    description: "Contacts and relationships",
    href: "/people",
    icon: Users,
    theme: COLORS.violet,
    group: "main",
    defaultOrder: 4,
    children: [
      { id: "people-all", label: "All Contacts", href: "/people" },
      { id: "people-champions", label: "Champions", href: "/people/champions" },
      { id: "people-hot", label: "Hot", href: "/people/hot" },
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Action items and follow-ups",
    href: "/tasks",
    icon: CheckSquare,
    theme: COLORS.amber,
    group: "workspace",
    defaultOrder: 5,
    children: [
      { id: "tasks-all", label: "All Tasks", href: "/tasks" },
      { id: "tasks-my", label: "My Tasks", href: "/tasks/my" },
      { id: "tasks-by-deal", label: "By Deal", href: "/tasks/by-deal" },
      { id: "tasks-by-project", label: "By Project", href: "/tasks/by-project" },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    description: "Initiatives and workstreams",
    href: "/projects",
    icon: FolderKanban,
    theme: COLORS.cyan,
    group: "workspace",
    defaultOrder: 6,
  },
  {
    id: "map",
    label: "Map",
    description: "Geographic visualization",
    href: "/map",
    icon: Map,
    theme: COLORS.rose,
    group: "workspace",
    defaultOrder: 7,
  },
  {
    id: "events",
    label: "Events",
    description: "Meetings and calendar",
    href: "/events",
    icon: Calendar,
    theme: COLORS.fuchsia,
    group: "workspace",
    defaultOrder: 8,
  },
  {
    id: "documents",
    label: "Documents",
    description: "Files and attachments",
    href: "/documents",
    icon: FileText,
    theme: COLORS.sky,
    group: "workspace",
    defaultOrder: 9,
  },
  {
    id: "vault",
    label: "Vault",
    description: "Secure credentials",
    href: "/vault",
    icon: KeyRound,
    theme: COLORS.purple,
    group: "workspace",
    defaultOrder: 10,
  },
  {
    id: "capital-map",
    label: "Capital Map",
    description: "Entity hierarchy and capital flow",
    href: "/capital-map",
    icon: BarChart3,
    theme: COLORS.green,
    group: "workspace",
    defaultOrder: 11,
  },
];

/**
 * Quick lookup object by page ID
 */
export const PAGE_REGISTRY_MAP: Record<string, PageIdentity> = Object.fromEntries(
  PAGE_REGISTRY.map((page) => [page.id, page])
);

/**
 * Get page identity by ID
 */
export function getPageIdentity(id: string): PageIdentity | undefined {
  return PAGE_REGISTRY_MAP[id];
}

/**
 * Get page identity by pathname
 * Matches the most specific route
 */
export function getPageIdentityByPath(pathname: string): PageIdentity | undefined {
  // Exact match first
  const exact = PAGE_REGISTRY.find((page) => page.href === pathname);
  if (exact) return exact;

  // Check children for exact match
  for (const page of PAGE_REGISTRY) {
    if (page.children) {
      const child = page.children.find((c) => c.href === pathname);
      if (child) return page;
    }
  }

  // Prefix match (e.g., /deals/123 matches /deals)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    const prefix = `/${segments[0]}`;
    return PAGE_REGISTRY.find((page) => page.href === prefix);
  }

  return undefined;
}

/**
 * Get pages by group
 */
export function getPagesByGroup(group: PageIdentity["group"]): PageIdentity[] {
  return PAGE_REGISTRY.filter((page) => page.group === group).sort(
    (a, b) => a.defaultOrder - b.defaultOrder
  );
}

/**
 * Default export for convenience
 */
export default PAGE_REGISTRY;
