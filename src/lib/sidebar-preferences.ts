/**
 * Sidebar Preferences System
 *
 * Manages per-user sidebar customization including:
 * - Item ordering (drag-and-drop)
 * - Pinned items (appear at top)
 * - Hidden items (removed from view)
 * - Expanded/collapsed sections
 *
 * Preferences are persisted to localStorage with debounced saves.
 * The system gracefully handles new items added to the registry.
 */

import {
  NAVIGATION_REGISTRY,
  getDefaultSidebarOrder,
  type NavigationItem,
} from "./navigation-registry";

// ============================================================================
// TYPES
// ============================================================================

export interface SidebarItemPreference {
  /** Item ID from navigation registry */
  id: string;
  /** Whether item is pinned to top */
  pinned: boolean;
  /** Whether item is hidden */
  hidden: boolean;
  /** Custom order position (lower = higher in list) */
  order: number;
}

export interface SidebarPreferences {
  /** Version for future migrations */
  version: number;
  /** Item-level preferences */
  items: SidebarItemPreference[];
  /** Which sections are expanded */
  expandedSections: string[];
  /** Last updated timestamp */
  updatedAt: string;
}

export interface ResolvedSidebarItem extends NavigationItem {
  /** Whether item is pinned */
  pinned: boolean;
  /** Resolved order position */
  order: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "arrow-crm-sidebar-preferences";
const CURRENT_VERSION = 1;
const DEBOUNCE_MS = 500;

// ============================================================================
// DEFAULT PREFERENCES
// ============================================================================

function createDefaultPreferences(): SidebarPreferences {
  const defaultOrder = getDefaultSidebarOrder();

  return {
    version: CURRENT_VERSION,
    items: defaultOrder.map((id, index) => ({
      id,
      pinned: false,
      hidden: false,
      order: index,
    })),
    expandedSections: [],
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Load preferences from localStorage
 */
export function loadSidebarPreferences(): SidebarPreferences {
  if (typeof window === "undefined") {
    return createDefaultPreferences();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createDefaultPreferences();
    }

    const parsed = JSON.parse(stored) as SidebarPreferences;

    // Migrate if needed
    if (parsed.version !== CURRENT_VERSION) {
      return migratePreferences(parsed);
    }

    // Reconcile with current registry (handle new/removed items)
    return reconcileWithRegistry(parsed);
  } catch (error) {
    console.error("Failed to load sidebar preferences:", error);
    return createDefaultPreferences();
  }
}

/**
 * Save preferences to localStorage (debounced)
 */
export function saveSidebarPreferences(
  preferences: SidebarPreferences,
  immediate = false
): void {
  if (typeof window === "undefined") return;

  const save = () => {
    try {
      const toSave: SidebarPreferences = {
        ...preferences,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error("Failed to save sidebar preferences:", error);
    }
  };

  if (immediate) {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      saveTimeoutId = null;
    }
    save();
  } else {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }
    saveTimeoutId = setTimeout(save, DEBOUNCE_MS);
  }
}

/**
 * Reset preferences to defaults
 */
export function resetSidebarPreferences(): SidebarPreferences {
  const defaults = createDefaultPreferences();
  saveSidebarPreferences(defaults, true);
  return defaults;
}

// ============================================================================
// RECONCILIATION LOGIC
// ============================================================================

/**
 * Migrate preferences from older versions
 */
function migratePreferences(old: SidebarPreferences): SidebarPreferences {
  // For now, just reset to defaults on version mismatch
  // In the future, implement proper migrations here
  return createDefaultPreferences();
}

/**
 * Reconcile stored preferences with current navigation registry
 * - Adds new items that don't exist in preferences
 * - Removes items that no longer exist in registry
 * - Preserves user customizations for existing items
 */
function reconcileWithRegistry(
  preferences: SidebarPreferences
): SidebarPreferences {
  const registryIds = new Set(NAVIGATION_REGISTRY.map((item) => item.id));
  const prefsMap = new Map(preferences.items.map((item) => [item.id, item]));

  // Find new items in registry that aren't in preferences
  const newItems: SidebarItemPreference[] = [];
  let maxOrder = Math.max(...preferences.items.map((i) => i.order), -1);

  for (const registryItem of NAVIGATION_REGISTRY) {
    if (!prefsMap.has(registryItem.id)) {
      maxOrder++;
      newItems.push({
        id: registryItem.id,
        pinned: false,
        hidden: false,
        order: maxOrder,
      });
    }
  }

  // Filter out items that no longer exist in registry
  const validItems = preferences.items.filter((item) =>
    registryIds.has(item.id)
  );

  return {
    ...preferences,
    items: [...validItems, ...newItems],
  };
}

// ============================================================================
// PREFERENCE MANIPULATION
// ============================================================================

/**
 * Update a single item's preferences
 */
export function updateItemPreference(
  preferences: SidebarPreferences,
  itemId: string,
  updates: Partial<Omit<SidebarItemPreference, "id">>
): SidebarPreferences {
  return {
    ...preferences,
    items: preferences.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    ),
  };
}

/**
 * Reorder items by providing new order array
 */
export function reorderItems(
  preferences: SidebarPreferences,
  newOrder: string[]
): SidebarPreferences {
  const orderMap = new Map(newOrder.map((id, index) => [id, index]));

  return {
    ...preferences,
    items: preferences.items.map((item) => ({
      ...item,
      order: orderMap.get(item.id) ?? item.order,
    })),
  };
}

/**
 * Pin an item (moves to top section)
 */
export function pinItem(
  preferences: SidebarPreferences,
  itemId: string
): SidebarPreferences {
  return updateItemPreference(preferences, itemId, { pinned: true });
}

/**
 * Unpin an item
 */
export function unpinItem(
  preferences: SidebarPreferences,
  itemId: string
): SidebarPreferences {
  return updateItemPreference(preferences, itemId, { pinned: false });
}

/**
 * Hide an item
 */
export function hideItem(
  preferences: SidebarPreferences,
  itemId: string
): SidebarPreferences {
  return updateItemPreference(preferences, itemId, { hidden: true, pinned: false });
}

/**
 * Show a hidden item
 */
export function showItem(
  preferences: SidebarPreferences,
  itemId: string
): SidebarPreferences {
  return updateItemPreference(preferences, itemId, { hidden: false });
}

/**
 * Toggle section expanded state
 */
export function toggleSectionExpanded(
  preferences: SidebarPreferences,
  sectionId: string
): SidebarPreferences {
  const isExpanded = preferences.expandedSections.includes(sectionId);
  return {
    ...preferences,
    expandedSections: isExpanded
      ? preferences.expandedSections.filter((id) => id !== sectionId)
      : [...preferences.expandedSections, sectionId],
  };
}

/**
 * Set section expanded state
 */
export function setSectionExpanded(
  preferences: SidebarPreferences,
  sectionId: string,
  expanded: boolean
): SidebarPreferences {
  const isExpanded = preferences.expandedSections.includes(sectionId);

  if (expanded && !isExpanded) {
    return {
      ...preferences,
      expandedSections: [...preferences.expandedSections, sectionId],
    };
  } else if (!expanded && isExpanded) {
    return {
      ...preferences,
      expandedSections: preferences.expandedSections.filter(
        (id) => id !== sectionId
      ),
    };
  }
  return preferences;
}

// ============================================================================
// RESOLUTION FUNCTIONS
// ============================================================================

/**
 * Resolve preferences with registry to get final sidebar items
 * Returns items sorted by: pinned first, then by order
 */
export function resolveSidebarItems(
  preferences: SidebarPreferences,
  userPermissions?: string[]
): ResolvedSidebarItem[] {
  const registryMap = new Map(
    NAVIGATION_REGISTRY.map((item) => [item.id, item])
  );
  const prefsMap = new Map(preferences.items.map((item) => [item.id, item]));

  const resolved: ResolvedSidebarItem[] = [];

  for (const registryItem of NAVIGATION_REGISTRY) {
    // Check permissions
    if (
      registryItem.permission &&
      userPermissions &&
      !userPermissions.includes(registryItem.permission)
    ) {
      continue;
    }

    const pref = prefsMap.get(registryItem.id);

    // Skip hidden items
    if (pref?.hidden) {
      continue;
    }

    resolved.push({
      ...registryItem,
      pinned: pref?.pinned ?? false,
      order: pref?.order ?? registryItem.defaultOrder,
    });
  }

  // Sort: pinned items first, then by order
  return resolved.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.order - b.order;
  });
}

/**
 * Get list of hidden items for the "restore" UI
 */
export function getHiddenItems(
  preferences: SidebarPreferences
): NavigationItem[] {
  const hiddenIds = new Set(
    preferences.items.filter((item) => item.hidden).map((item) => item.id)
  );

  return NAVIGATION_REGISTRY.filter((item) => hiddenIds.has(item.id));
}

/**
 * Get list of pinned items
 */
export function getPinnedItems(
  preferences: SidebarPreferences
): NavigationItem[] {
  const pinnedIds = new Set(
    preferences.items.filter((item) => item.pinned).map((item) => item.id)
  );

  return NAVIGATION_REGISTRY.filter((item) => pinnedIds.has(item.id));
}
