"use client";

import { ToastProvider } from "@/components/ui/toast";
import { LPModeProvider } from "@/contexts/LPModeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/auth/AuthGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <LPModeProvider>
          <AuthGate>{children}</AuthGate>
        </LPModeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
