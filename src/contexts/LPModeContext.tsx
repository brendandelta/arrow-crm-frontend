"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface LPModeContextType {
  lpMode: boolean;
  setLpMode: (enabled: boolean) => void;
  toggleLpMode: () => void;
}

const LPModeContext = createContext<LPModeContextType | undefined>(undefined);

export function LPModeProvider({ children }: { children: ReactNode }) {
  const [lpMode, setLpMode] = useState(false);

  const toggleLpMode = useCallback(() => {
    setLpMode((prev) => !prev);
  }, []);

  return (
    <LPModeContext.Provider value={{ lpMode, setLpMode, toggleLpMode }}>
      {children}
    </LPModeContext.Provider>
  );
}

export function useLPMode() {
  const context = useContext(LPModeContext);
  if (context === undefined) {
    throw new Error("useLPMode must be used within a LPModeProvider");
  }
  return context;
}

// Helper component for conditional rendering based on LP mode
export function LPModeHidden({ children }: { children: ReactNode }) {
  const { lpMode } = useLPMode();
  if (lpMode) return null;
  return <>{children}</>;
}

// Helper component to show content only in LP mode
export function LPModeOnly({ children }: { children: ReactNode }) {
  const { lpMode } = useLPMode();
  if (!lpMode) return null;
  return <>{children}</>;
}

// Items that should be hidden in LP mode:
// - Advantages panel
// - Internal notes
// - Detailed task info
// - Confidential documents
// - Risk flags (or show sanitized version)
// - Internal comments/activities

// Hook to get LP-safe data
export function useLPSafeData<T extends object>(data: T, sensitiveKeys: (keyof T)[]): Partial<T> {
  const { lpMode } = useLPMode();

  if (!lpMode) return data;

  const safeData = { ...data };
  for (const key of sensitiveKeys) {
    delete safeData[key];
  }
  return safeData;
}
