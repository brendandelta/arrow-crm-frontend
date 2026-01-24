"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LoginScreen } from "./LoginScreen";
import { QuoteDisplay } from "./QuoteDisplay";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, showingQuote } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (showingQuote) {
    return <QuoteDisplay />;
  }

  return <>{children}</>;
}
