/**
 * Navigation Registry - Visual Identity Configuration System
 *
 * This is the canonical source of truth for all navigable objects in the application.
 * Each entry defines an object type's visual identity: icon, color palette, and metadata.
 *
 * Colors use a carefully curated palette that feels premium, modern, and cohesive.
 * Icons are consistent with the object's conceptual meaning.
 */

import {
  Home,
  CircleDollarSign,
  Building2,
  Landmark,
  Users,
  CheckSquare,
  FolderKanban,
  Map as MapIcon,
  Calendar,
  FileText,
  KeyRound,
  BarChart3,
  Settings,
  Shield,
  Bell,
  type LucideIcon,
} from "lucide-react";

/**
 * Color palette for object types
 * Each color is defined with multiple variants for different use cases:
 * - primary: Main brand color (buttons, icons)
 * - light: Light background tint
 * - border: Subtle border color
 * - text: Text color variant
 * - gradient: CSS gradient for premium effects
 */
export interface ObjectColorPalette {
  /** Primary color (hex) - used for buttons, active states */
  primary: string;
  /** Light background tint (hex) - used for backgrounds, hover states */
  light: string;
  /** Border color (hex) - subtle borders */
  border: string;
  /** Text color on light background */
  text: string;
  /** Darker shade for hover states */
  dark: string;
  /** CSS gradient string for premium effects */
  gradient: string;
  /** Shadow color with opacity */
  shadow: string;
  /** Tailwind class utilities */
  tw: {
    bg: string;
    bgLight: string;
    border: string;
    text: string;
    textLight: string;
    ring: string;
    hover: string;
  };
}

/**
 * Navigation item configuration
 */
export interface NavigationItem {
  /** Unique identifier for this item */
  id: string;
  /** Display title */
  title: string;
  /** Primary URL path */
  url: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Color palette for visual identity */
  color: ObjectColorPalette;
  /** Sub-navigation items */
  items?: {
    id: string;
    title: string;
    url: string;
  }[];
  /** Whether this item is a separator/divider */
  isSeparator?: boolean;
  /** Required permission to view this item */
  permission?: string;
  /** Whether this item can be hidden by users */
  canHide?: boolean;
  /** Whether this item can be reordered */
  canReorder?: boolean;
  /** Default position in sidebar */
  defaultOrder: number;
  /** Keywords for search */
  keywords?: string[];
}

// ============================================================================
// COLOR PALETTES - Premium, Modern, Cohesive
// ============================================================================

const COLORS = {
  // Dashboard - Warm Slate (neutral anchor)
  slate: {
    primary: "#475569",
    light: "#f8fafc",
    border: "#e2e8f0",
    text: "#334155",
    dark: "#334155",
    gradient: "linear-gradient(135deg, #475569 0%, #334155 100%)",
    shadow: "rgba(71, 85, 105, 0.25)",
    tw: {
      bg: "bg-slate-600",
      bgLight: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-600",
      textLight: "text-slate-500",
      ring: "ring-slate-500/20",
      hover: "hover:bg-slate-700",
    },
  },

  // Deals - Rich Emerald (money, growth, success)
  emerald: {
    primary: "#059669",
    light: "#ecfdf5",
    border: "#a7f3d0",
    text: "#047857",
    dark: "#047857",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    shadow: "rgba(5, 150, 105, 0.25)",
    tw: {
      bg: "bg-emerald-600",
      bgLight: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-600",
      textLight: "text-emerald-500",
      ring: "ring-emerald-500/20",
      hover: "hover:bg-emerald-700",
    },
  },

  // Organizations - Deep Blue (trust, stability, corporate)
  blue: {
    primary: "#2563eb",
    light: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    dark: "#1d4ed8",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    shadow: "rgba(37, 99, 235, 0.25)",
    tw: {
      bg: "bg-blue-600",
      bgLight: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      textLight: "text-blue-500",
      ring: "ring-blue-500/20",
      hover: "hover:bg-blue-700",
    },
  },

  // Internal Entities - Royal Indigo (internal, important, structured)
  indigo: {
    primary: "#4f46e5",
    light: "#eef2ff",
    border: "#c7d2fe",
    text: "#4338ca",
    dark: "#4338ca",
    gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    shadow: "rgba(79, 70, 229, 0.25)",
    tw: {
      bg: "bg-indigo-600",
      bgLight: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-600",
      textLight: "text-indigo-500",
      ring: "ring-indigo-500/20",
      hover: "hover:bg-indigo-700",
    },
  },

  // People - Warm Violet (human, personal, relationships)
  violet: {
    primary: "#7c3aed",
    light: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
    dark: "#6d28d9",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    shadow: "rgba(124, 58, 237, 0.25)",
    tw: {
      bg: "bg-violet-600",
      bgLight: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-600",
      textLight: "text-violet-500",
      ring: "ring-violet-500/20",
      hover: "hover:bg-violet-700",
    },
  },

  // Tasks - Focused Amber (action, urgency, attention)
  amber: {
    primary: "#d97706",
    light: "#fffbeb",
    border: "#fde68a",
    text: "#b45309",
    dark: "#b45309",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    shadow: "rgba(217, 119, 6, 0.25)",
    tw: {
      bg: "bg-amber-600",
      bgLight: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-600",
      textLight: "text-amber-500",
      ring: "ring-amber-500/20",
      hover: "hover:bg-amber-700",
    },
  },

  // Projects - Creative Fuchsia (organization, creativity, planning)
  fuchsia: {
    primary: "#c026d3",
    light: "#fdf4ff",
    border: "#f5d0fe",
    text: "#a21caf",
    dark: "#a21caf",
    gradient: "linear-gradient(135deg, #d946ef 0%, #c026d3 100%)",
    shadow: "rgba(192, 38, 211, 0.25)",
    tw: {
      bg: "bg-fuchsia-600",
      bgLight: "bg-fuchsia-50",
      border: "border-fuchsia-200",
      text: "text-fuchsia-600",
      textLight: "text-fuchsia-500",
      ring: "ring-fuchsia-500/20",
      hover: "hover:bg-fuchsia-700",
    },
  },

  // Map - Geographic Teal (location, exploration, overview)
  teal: {
    primary: "#0d9488",
    light: "#f0fdfa",
    border: "#99f6e4",
    text: "#0f766e",
    dark: "#0f766e",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
    shadow: "rgba(13, 148, 136, 0.25)",
    tw: {
      bg: "bg-teal-600",
      bgLight: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-600",
      textLight: "text-teal-500",
      ring: "ring-teal-500/20",
      hover: "hover:bg-teal-700",
    },
  },

  // Events - Lively Rose (calendar, occasions, time)
  rose: {
    primary: "#e11d48",
    light: "#fff1f2",
    border: "#fecdd3",
    text: "#be123c",
    dark: "#be123c",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
    shadow: "rgba(225, 29, 72, 0.25)",
    tw: {
      bg: "bg-rose-600",
      bgLight: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-600",
      textLight: "text-rose-500",
      ring: "ring-rose-500/20",
      hover: "hover:bg-rose-700",
    },
  },

  // Documents - Neutral Sky (files, information, storage)
  sky: {
    primary: "#0284c7",
    light: "#f0f9ff",
    border: "#bae6fd",
    text: "#0369a1",
    dark: "#0369a1",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    shadow: "rgba(2, 132, 199, 0.25)",
    tw: {
      bg: "bg-sky-600",
      bgLight: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-600",
      textLight: "text-sky-500",
      ring: "ring-sky-500/20",
      hover: "hover:bg-sky-700",
    },
  },

  // Vault - Secure Orange (security, locked, protected)
  orange: {
    primary: "#ea580c",
    light: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    dark: "#c2410c",
    gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    shadow: "rgba(234, 88, 12, 0.25)",
    tw: {
      bg: "bg-orange-600",
      bgLight: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-600",
      textLight: "text-orange-500",
      ring: "ring-orange-500/20",
      hover: "hover:bg-orange-700",
    },
  },

  // Analytics - Data Cyan (insights, metrics, analysis)
  cyan: {
    primary: "#0891b2",
    light: "#ecfeff",
    border: "#a5f3fc",
    text: "#0e7490",
    dark: "#0e7490",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    shadow: "rgba(8, 145, 178, 0.25)",
    tw: {
      bg: "bg-cyan-600",
      bgLight: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-600",
      textLight: "text-cyan-500",
      ring: "ring-cyan-500/20",
      hover: "hover:bg-cyan-700",
    },
  },

  // Settings - Neutral Stone (configuration, system)
  stone: {
    primary: "#57534e",
    light: "#fafaf9",
    border: "#e7e5e4",
    text: "#44403c",
    dark: "#44403c",
    gradient: "linear-gradient(135deg, #78716c 0%, #57534e 100%)",
    shadow: "rgba(87, 83, 78, 0.25)",
    tw: {
      bg: "bg-stone-600",
      bgLight: "bg-stone-50",
      border: "border-stone-200",
      text: "text-stone-600",
      textLight: "text-stone-500",
      ring: "ring-stone-500/20",
      hover: "hover:bg-stone-700",
    },
  },
} as const;

// ============================================================================
// NAVIGATION REGISTRY - Canonical Item Catalog
// ============================================================================

export const NAVIGATION_REGISTRY: NavigationItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    url: "/",
    icon: Home,
    color: COLORS.slate,
    canHide: false,
    canReorder: true,
    defaultOrder: 0,
    keywords: ["home", "overview", "main"],
  },
  {
    id: "deals",
    title: "Deals",
    url: "/deals",
    icon: CircleDollarSign,
    color: COLORS.emerald,
    canHide: true,
    canReorder: true,
    defaultOrder: 1,
    keywords: ["transactions", "investments", "pipeline"],
    items: [
      { id: "deals-all", title: "All Deals", url: "/deals" },
      { id: "deals-live", title: "Live", url: "/deals/live" },
      { id: "deals-sourcing", title: "Sourcing", url: "/deals/sourcing" },
    ],
  },
  {
    id: "organizations",
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
    color: COLORS.blue,
    canHide: true,
    canReorder: true,
    defaultOrder: 2,
    keywords: ["companies", "funds", "entities", "firms"],
    items: [
      { id: "orgs-all", title: "All", url: "/organizations" },
      { id: "orgs-funds", title: "Funds", url: "/organizations/funds" },
      { id: "orgs-companies", title: "Companies", url: "/organizations/companies" },
    ],
  },
  {
    id: "internal-entities",
    title: "Internal Entities",
    url: "/internal-entities",
    icon: Landmark,
    color: COLORS.indigo,
    canHide: true,
    canReorder: true,
    defaultOrder: 3,
    keywords: ["legal", "corporate", "structure", "llc", "holdings"],
  },
  {
    id: "people",
    title: "People",
    url: "/people",
    icon: Users,
    color: COLORS.violet,
    canHide: true,
    canReorder: true,
    defaultOrder: 4,
    keywords: ["contacts", "persons", "relationships"],
    items: [
      { id: "people-all", title: "All Contacts", url: "/people" },
      { id: "people-champions", title: "Champions", url: "/people/champions" },
      { id: "people-hot", title: "Hot", url: "/people/hot" },
    ],
  },
  {
    id: "tasks",
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
    color: COLORS.amber,
    canHide: true,
    canReorder: true,
    defaultOrder: 5,
    keywords: ["todos", "action items", "work"],
    items: [
      { id: "tasks-all", title: "All Tasks", url: "/tasks" },
      { id: "tasks-my", title: "My Tasks", url: "/tasks/my" },
      { id: "tasks-by-deal", title: "By Deal", url: "/tasks/by-deal" },
      { id: "tasks-by-project", title: "By Project", url: "/tasks/by-project" },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
    color: COLORS.fuchsia,
    canHide: true,
    canReorder: true,
    defaultOrder: 6,
    keywords: ["initiatives", "workstreams", "boards"],
  },
  {
    id: "map",
    title: "Map",
    url: "/map",
    icon: MapIcon,
    color: COLORS.teal,
    canHide: true,
    canReorder: true,
    defaultOrder: 7,
    keywords: ["geography", "location", "visualization"],
  },
  {
    id: "events",
    title: "Events",
    url: "/events",
    icon: Calendar,
    color: COLORS.rose,
    canHide: true,
    canReorder: true,
    defaultOrder: 8,
    keywords: ["calendar", "meetings", "schedule"],
  },
  {
    id: "documents",
    title: "Documents",
    url: "/documents",
    icon: FileText,
    color: COLORS.sky,
    canHide: true,
    canReorder: true,
    defaultOrder: 9,
    keywords: ["files", "attachments", "papers"],
  },
  {
    id: "vault",
    title: "Vault",
    url: "/vault",
    icon: KeyRound,
    color: COLORS.orange,
    canHide: true,
    canReorder: true,
    defaultOrder: 10,
    keywords: ["secure", "sensitive", "confidential"],
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a navigation item by its ID
 */
export function getNavigationItem(id: string): NavigationItem | undefined {
  return NAVIGATION_REGISTRY.find((item) => item.id === id);
}

/**
 * Get the color palette for a navigation item
 */
export function getItemColor(id: string): ObjectColorPalette | undefined {
  return getNavigationItem(id)?.color;
}

/**
 * Get navigation item by URL path
 */
export function getNavigationItemByPath(path: string): NavigationItem | undefined {
  // Exact match first
  let item = NAVIGATION_REGISTRY.find((item) => item.url === path);
  if (item) return item;

  // Check if path starts with any item's URL (for nested routes)
  return NAVIGATION_REGISTRY.find((item) => {
    if (path.startsWith(item.url + "/")) return true;
    // Check sub-items
    return item.items?.some((sub) => path === sub.url || path.startsWith(sub.url + "/"));
  });
}

/**
 * Get default sidebar order
 */
export function getDefaultSidebarOrder(): string[] {
  return NAVIGATION_REGISTRY
    .filter((item) => !item.isSeparator)
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map((item) => item.id);
}

/**
 * Create a map of ID to NavigationItem for quick lookups
 */
export function createNavigationMap() {
  const map = new globalThis.Map<string, NavigationItem>();
  for (const item of NAVIGATION_REGISTRY) {
    map.set(item.id, item);
  }
  return map;
}

// Export color definitions for use elsewhere
export { COLORS };
