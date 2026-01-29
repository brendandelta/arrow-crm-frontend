"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  type SidebarPreferences,
  type ResolvedSidebarItem,
  loadSidebarPreferences,
  saveSidebarPreferences,
  resetSidebarPreferences,
  resolveSidebarItems,
  getHiddenItems,
  pinItem,
  unpinItem,
  hideItem,
  showItem,
  reorderItems,
  setSectionExpanded,
} from "@/lib/sidebar-preferences";
import { type NavigationItem } from "@/lib/navigation-registry";

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface SidebarPreferencesContextValue {
  /** Current preferences state */
  preferences: SidebarPreferences | null;
  /** Resolved sidebar items (filtered, sorted, with preferences applied) */
  items: ResolvedSidebarItem[];
  /** Hidden items that can be restored */
  hiddenItems: NavigationItem[];
  /** Whether edit mode is active */
  isEditMode: boolean;
  /** Whether preferences are loaded */
  isLoaded: boolean;

  // Actions
  /** Toggle edit mode */
  setEditMode: (enabled: boolean) => void;
  /** Pin an item to the top */
  pinItem: (itemId: string) => void;
  /** Unpin an item */
  unpinItem: (itemId: string) => void;
  /** Hide an item from sidebar */
  hideItem: (itemId: string) => void;
  /** Restore a hidden item */
  showItem: (itemId: string) => void;
  /** Reorder items */
  reorderItems: (newOrder: string[]) => void;
  /** Check if a section is expanded */
  isSectionExpanded: (sectionId: string) => boolean;
  /** Toggle section expanded state */
  toggleSectionExpanded: (sectionId: string) => void;
  /** Reset all preferences to defaults */
  resetToDefaults: () => void;
  /** Save preferences immediately (used when exiting edit mode) */
  saveNow: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const SidebarPreferencesContext =
  createContext<SidebarPreferencesContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function SidebarPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<SidebarPreferences | null>(
    null
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loaded = loadSidebarPreferences();
    setPreferences(loaded);
    setIsLoaded(true);
  }, []);

  // Save preferences when they change (debounced)
  useEffect(() => {
    if (preferences && isLoaded) {
      saveSidebarPreferences(preferences);
    }
  }, [preferences, isLoaded]);

  // Computed values
  const items = useMemo(() => {
    if (!preferences) return [];
    return resolveSidebarItems(preferences);
  }, [preferences]);

  const hiddenItems = useMemo(() => {
    if (!preferences) return [];
    return getHiddenItems(preferences);
  }, [preferences]);

  // Actions
  const handlePinItem = useCallback((itemId: string) => {
    setPreferences((prev) => (prev ? pinItem(prev, itemId) : prev));
  }, []);

  const handleUnpinItem = useCallback((itemId: string) => {
    setPreferences((prev) => (prev ? unpinItem(prev, itemId) : prev));
  }, []);

  const handleHideItem = useCallback((itemId: string) => {
    setPreferences((prev) => (prev ? hideItem(prev, itemId) : prev));
  }, []);

  const handleShowItem = useCallback((itemId: string) => {
    setPreferences((prev) => (prev ? showItem(prev, itemId) : prev));
  }, []);

  const handleReorderItems = useCallback((newOrder: string[]) => {
    setPreferences((prev) => (prev ? reorderItems(prev, newOrder) : prev));
  }, []);

  const isSectionExpanded = useCallback(
    (sectionId: string) => {
      return preferences?.expandedSections.includes(sectionId) ?? false;
    },
    [preferences?.expandedSections]
  );

  const toggleSectionExpanded = useCallback((sectionId: string) => {
    setPreferences((prev) => {
      if (!prev) return prev;
      const isExpanded = prev.expandedSections.includes(sectionId);
      return setSectionExpanded(prev, sectionId, !isExpanded);
    });
  }, []);

  const handleResetToDefaults = useCallback(() => {
    const defaults = resetSidebarPreferences();
    setPreferences(defaults);
  }, []);

  const handleSaveNow = useCallback(() => {
    if (preferences) {
      saveSidebarPreferences(preferences, true);
    }
  }, [preferences]);

  const handleSetEditMode = useCallback(
    (enabled: boolean) => {
      setIsEditMode(enabled);
      // Save immediately when exiting edit mode
      if (!enabled && preferences) {
        saveSidebarPreferences(preferences, true);
      }
    },
    [preferences]
  );

  const value = useMemo<SidebarPreferencesContextValue>(
    () => ({
      preferences,
      items,
      hiddenItems,
      isEditMode,
      isLoaded,
      setEditMode: handleSetEditMode,
      pinItem: handlePinItem,
      unpinItem: handleUnpinItem,
      hideItem: handleHideItem,
      showItem: handleShowItem,
      reorderItems: handleReorderItems,
      isSectionExpanded,
      toggleSectionExpanded,
      resetToDefaults: handleResetToDefaults,
      saveNow: handleSaveNow,
    }),
    [
      preferences,
      items,
      hiddenItems,
      isEditMode,
      isLoaded,
      handleSetEditMode,
      handlePinItem,
      handleUnpinItem,
      handleHideItem,
      handleShowItem,
      handleReorderItems,
      isSectionExpanded,
      toggleSectionExpanded,
      handleResetToDefaults,
      handleSaveNow,
    ]
  );

  return (
    <SidebarPreferencesContext.Provider value={value}>
      {children}
    </SidebarPreferencesContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useSidebarPreferences(): SidebarPreferencesContextValue {
  const context = useContext(SidebarPreferencesContext);
  if (!context) {
    throw new Error(
      "useSidebarPreferences must be used within a SidebarPreferencesProvider"
    );
  }
  return context;
}
