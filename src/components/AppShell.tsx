"use client";

import { CustomizableSidebar } from "@/components/Sidebar/CustomizableSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CustomizableSidebar />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        {/* Mobile sidebar trigger */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <SidebarTrigger className="h-9 w-9 rounded-lg bg-white shadow-md border border-slate-200" />
        </div>

        {/* Main content card */}
        <main className="flex-1 m-2 bg-white rounded-xl border border-slate-200/50 shadow-sm overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
