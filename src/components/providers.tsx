"use client";

import { ToastProvider } from "@/components/ui/toast";
import { LPModeProvider } from "@/contexts/LPModeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <LPModeProvider>{children}</LPModeProvider>
    </ToastProvider>
  );
}
