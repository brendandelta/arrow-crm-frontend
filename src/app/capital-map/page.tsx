"use client";

import { CapitalMapView } from "./_components/CapitalMapView";

export default function CapitalMapPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Capital Map</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize entity hierarchy and capital flow
          </p>
        </div>
      </div>

      {/* Capital Map View */}
      <CapitalMapView />
    </div>
  );
}
