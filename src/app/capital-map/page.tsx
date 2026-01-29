"use client";

import { Network } from "lucide-react";
import { CapitalMapView } from "./_components/CapitalMapView";
import { getPageIdentity } from "@/lib/page-registry";
import { cn } from "@/lib/utils";

// Get page identity for theming
const pageIdentity = getPageIdentity("capital-map");
const theme = pageIdentity?.theme;
const PageIcon = pageIdentity?.icon || Network;

export default function CapitalMapPage() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#FAFBFC]">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                theme && `bg-gradient-to-br ${theme.gradient} ${theme.shadow}`
              )}>
                <PageIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Capital Map
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Visualize entity hierarchy and capital flow
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <CapitalMapView />
      </div>
    </div>
  );
}
