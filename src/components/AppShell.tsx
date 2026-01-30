"use client";

import { CustomizableSidebar } from "@/components/Sidebar/CustomizableSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CustomizableSidebar />

      {/* Main content wrapper */}
      <div className="flex-1 min-h-screen bg-slate-50 p-2 pl-0">
        {/* Mobile sidebar trigger */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <SidebarTrigger className="h-9 w-9 rounded-lg bg-white shadow-md border border-slate-200" />
        </div>

        {/* Main content card - grows with content, no inner scroll */}
        <main className="min-h-[calc(100vh-1rem)] bg-white rounded-xl border border-slate-200/50 shadow-sm">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
