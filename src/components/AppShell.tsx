"use client";

import { AppSidebar } from "@/components/Sidebar/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TweakModeButton } from "@/components/TweakModeButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="font-medium">Arrow CRM</span>
          <div className="ml-auto">
            <TweakModeButton />
          </div>
        </header>
        <main className="flex-1 p-4 pt-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
