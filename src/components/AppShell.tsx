"use client";

import { CustomizableSidebar } from "@/components/Sidebar/CustomizableSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CustomizableSidebar />
      <SidebarInset>
        {/* Minimal floating sidebar trigger */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <SidebarTrigger className="h-9 w-9 rounded-lg bg-white shadow-md border border-slate-200" />
        </div>

        {/* Main content - pages handle their own headers */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
