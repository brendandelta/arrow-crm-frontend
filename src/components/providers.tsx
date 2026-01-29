"use client";

import { ToastProvider } from "@/components/ui/toast";
import { LPModeProvider } from "@/contexts/LPModeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/auth/AuthGate";
import { SidebarPreferencesProvider } from "@/contexts/SidebarPreferencesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <LPModeProvider>
            <SidebarPreferencesProvider>
              <AuthGate>{children}</AuthGate>
            </SidebarPreferencesProvider>
          </LPModeProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
