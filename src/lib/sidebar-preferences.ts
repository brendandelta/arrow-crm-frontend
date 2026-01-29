/**
 * Sidebar Preferences System
 *
 * Manages per-user sidebar customization including:
 * - Item order (drag-and-drop reordering)
 * - Pinned items (appear at top)
 * - Hidden items (removed from view but recoverable)
 * - Collapsed sections
 *
 * Persistence:
 * - localStorage for immediate persistence
 * - Backend sync for cross-device consistency (when available)
 *
 * Design principles:
 * - Optimistic UI updates
 * - Graceful handling of new/removed pages
 * - Permission filtering at merge time
 */

import { PAGE_REGISTRY, type PageIdentity } from "./page-registry";

/**
 * User preference for a single sidebar item
 */
export interface SidebarItemPreference {
  pageId: string;
  order: number;
  isPinned: boolean;
  isHidden: boolean;
  isExpanded?: boolean; // For items with children
}

/**
 * Complete sidebar preferences for a user
 */
export interface SidebarPreferences {
  version: number;
  items: SidebarItemPreference[];
  collapsedGroups: string[];
  lastUpdated: string;
}

/**
 * Resolved sidebar item ready for rendering
 */
export interface ResolvedSidebarItem extends PageIdentity {
  order: number;
  isPinned: boolean;
  isHidden: boolean;
  isExpanded: boolean;
}

const STORAGE_KEY = "arrow-sidebar-preferences";
const PREFERENCES_VERSION = 1;

/**
 * Get default preferences based on page registry
 */
export function getDefaultPreferences(): SidebarPreferences {
  return {
    version: PREFERENCES_VERSION,
    items: PAGE_REGISTRY.map((page) => ({
      pageId: page.id,
      order: page.defaultOrder,
      isPinned: false,
      isHidden: false,
      isExpanded: true,
    })),
    collapsedGroups: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Load preferences from localStorage
 */
export function loadPreferences(): SidebarPreferences {
  if (typeof window === "undefined") {
    return getDefaultPreferences();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultPreferences();
    }

    const parsed = JSON.parse(stored) as SidebarPreferences;

    // Version migration if needed
    if (parsed.version !== PREFERENCES_VERSION) {
      return migratePreferences(parsed);
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load sidebar preferences:", error);
    return getDefaultPreferences();
  }
}

/**
 * Save preferences to localStorage
 */
export function savePreferences(preferences: SidebarPreferences): void {
  if (typeof window === "undefined") return;

  try {
    const updated = {
      ...preferences,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save sidebar preferences:", error);
  }
}

/**
 * Migrate preferences from older versions
 */
function migratePreferences(old: SidebarPreferences): SidebarPreferences {
  // For now, just reset to defaults if version mismatch
  // In the future, implement actual migrations
  return getDefaultPreferences();
}

/**
 * Merge user preferences with current page catalog
 * Handles:
 * - New pages added to catalog
 * - Pages removed from catalog
 * - Permission filtering
 */
export function resolveItems(
  preferences: SidebarPreferences,
  userPermissions?: string[]
): ResolvedSidebarItem[] {
  const prefMap = new Map(
    preferences.items.map((item) => [item.pageId, item])
  );

  const resolved: ResolvedSidebarItem[] = [];

  // Process all pages in registry
  for (const page of PAGE_REGISTRY) {
    // Skip if user doesn't have required permission
    if (page.permission && userPermissions && !userPermissions.includes(page.permission)) {
      continue;
    }

    const pref = prefMap.get(page.id);

    resolved.push({
      ...page,
      order: pref?.order ?? page.defaultOrder,
      isPinned: pref?.isPinned ?? false,
      isHidden: pref?.isHidden ?? false,
      isExpanded: pref?.isExpanded ?? true,
    });
  }

  // Sort: pinned items first (by order), then unpinned (by order)
  return resolved.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.order - b.order;
  });
}

/**
 * Get visible items only (not hidden)
 */
export function getVisibleItems(
  preferences: SidebarPreferences,
  userPermissions?: string[]
): ResolvedSidebarItem[] {
  return resolveItems(preferences, userPermissions).filter((item) => !item.isHidden);
}

/**
 * Get hidden items for recovery UI
 */
export function getHiddenItems(
  preferences: SidebarPreferences,
  userPermissions?: string[]
): ResolvedSidebarItem[] {
  return resolveItems(preferences, userPermissions).filter((item) => item.isHidden);
}

/**
 * Update item order after drag-and-drop
 * @param items Current visible items in their new order
 */
export function updateItemOrder(
  preferences: SidebarPreferences,
  newOrder: string[]
): SidebarPreferences {
  const items = preferences.items.map((item) => {
    const newIndex = newOrder.indexOf(item.pageId);
    if (newIndex !== -1) {
      return { ...item, order: newIndex };
    }
    return item;
  });

  return { ...preferences, items };
}

/**
 * Toggle pin status for an item
 */
export function togglePin(
  preferences: SidebarPreferences,
  pageId: string
): SidebarPreferences {
  const items = preferences.items.map((item) => {
    if (item.pageId === pageId) {
      return { ...item, isPinned: !item.isPinned };
    }
    return item;
  });

  return { ...preferences, items };
}

/**
 * Toggle hidden status for an item
 */
export function toggleHidden(
  preferences: SidebarPreferences,
  pageId: string
): SidebarPreferences {
  const page = PAGE_REGISTRY.find((p) => p.id === pageId);

  // Core items cannot be hidden
  if (page?.isCore) {
    return preferences;
  }

  const items = preferences.items.map((item) => {
    if (item.pageId === pageId) {
      return { ...item, isHidden: !item.isHidden };
    }
    return item;
  });

  return { ...preferences, items };
}

/**
 * Toggle expanded status for items with children
 */
export function toggleExpanded(
  preferences: SidebarPreferences,
  pageId: string
): SidebarPreferences {
  const items = preferences.items.map((item) => {
    if (item.pageId === pageId) {
      return { ...item, isExpanded: !item.isExpanded };
    }
    return item;
  });

  return { ...preferences, items };
}

/**
 * Toggle group collapsed status
 */
export function toggleGroupCollapsed(
  preferences: SidebarPreferences,
  groupId: string
): SidebarPreferences {
  const collapsedGroups = preferences.collapsedGroups.includes(groupId)
    ? preferences.collapsedGroups.filter((g) => g !== groupId)
    : [...preferences.collapsedGroups, groupId];

  return { ...preferences, collapsedGroups };
}

/**
 * Reset to default preferences
 */
export function resetToDefaults(): SidebarPreferences {
  const defaults = getDefaultPreferences();
  savePreferences(defaults);
  return defaults;
}

/**
 * React hook for sidebar preferences
 * Provides state management with automatic persistence
 */
import { useState, useEffect, useCallback, useMemo } from "react";

export function useSidebarPreferences(userPermissions?: string[]) {
  const [preferences, setPreferences] = useState<SidebarPreferences>(getDefaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loaded = loadPreferences();
    setPreferences(loaded);
    setIsLoaded(true);
  }, []);

  // Debounced save
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      savePreferences(preferences);
    }, 300);

    return () => clearTimeout(timer);
  }, [preferences, isLoaded]);

  // Memoized resolved items
  const visibleItems = useMemo(
    () => getVisibleItems(preferences, userPermissions),
    [preferences, userPermissions]
  );

  const hiddenItems = useMemo(
    () => getHiddenItems(preferences, userPermissions),
    [preferences, userPermissions]
  );

  // Actions
  const reorder = useCallback((newOrder: string[]) => {
    setPreferences((prev) => updateItemOrder(prev, newOrder));
  }, []);

  const pin = useCallback((pageId: string) => {
    setPreferences((prev) => togglePin(prev, pageId));
  }, []);

  const hide = useCallback((pageId: string) => {
    setPreferences((prev) => toggleHidden(prev, pageId));
  }, []);

  const expand = useCallback((pageId: string) => {
    setPreferences((prev) => toggleExpanded(prev, pageId));
  }, []);

  const collapseGroup = useCallback((groupId: string) => {
    setPreferences((prev) => toggleGroupCollapsed(prev, groupId));
  }, []);

  const reset = useCallback(() => {
    setPreferences(resetToDefaults());
  }, []);

  const saveNow = useCallback(() => {
    savePreferences(preferences);
  }, [preferences]);

  return {
    preferences,
    visibleItems,
    hiddenItems,
    isLoaded,
    actions: {
      reorder,
      pin,
      hide,
      expand,
      collapseGroup,
      reset,
      saveNow,
    },
  };
}
