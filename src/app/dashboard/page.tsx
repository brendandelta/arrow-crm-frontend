"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LayoutDashboard, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DashboardData,
  type DashboardPreferences,
  type DashboardFilters,
  fetchDashboardDataFromEndpoints,
  getDashboardPreferences,
  DEFAULT_PREFERENCES,
} from "@/lib/dashboard-api";
import { TruthBar } from "./_components/TruthBar";
import { AttentionModule } from "./_components/AttentionModule";
import { ActiveDealsModule } from "./_components/ActiveDealsModule";
import { CapitalModule } from "./_components/CapitalModule";
import { RelationshipsModule } from "./_components/RelationshipsModule";
import { EventsModule } from "./_components/EventsModule";
import { AlertsModule } from "./_components/AlertsModule";
import { CommandPalette, useCommandPalette } from "./_components/CommandPalette";
import { DashboardPreferences as DashboardPreferencesPanel } from "./_components/DashboardPreferences";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [filters, setFilters] = useState<DashboardFilters>({
    timeframe: "this_week",
    scope: "mine",
  });

  // Command palette state
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();

  // Load preferences on mount
  useEffect(() => {
    const savedPrefs = getDashboardPreferences();
    setPreferences(savedPrefs);
    setFilters({
      timeframe: savedPrefs.attentionTimeframe,
      scope: savedPrefs.attentionScope,
    });
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDashboardDataFromEndpoints(filters);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle preference changes
  const handlePreferencesChange = useCallback((newPrefs: DashboardPreferences) => {
    setPreferences(newPrefs);
    setFilters({
      timeframe: newPrefs.attentionTimeframe,
      scope: newPrefs.attentionScope,
    });
  }, []);

  // Handle attention filter changes
  const handleTimeframeChange = useCallback((timeframe: "today" | "this_week" | "all") => {
    setFilters((prev) => ({ ...prev, timeframe }));
  }, []);

  const handleScopeChange = useCallback((scope: "mine" | "team") => {
    setFilters((prev) => ({ ...prev, scope }));
  }, []);

  // Handle alert dismiss
  const handleDismissAlert = useCallback((alertId: string) => {
    if (!data) return;
    setData({
      ...data,
      alerts: data.alerts.filter((a) => a.id !== alertId),
    });
  }, [data]);

  // Module visibility helper
  const isModuleVisible = useCallback(
    (moduleId: string) => !preferences.hiddenModules.includes(moduleId),
    [preferences.hiddenModules]
  );

  // Render modules in order
  const renderModule = useCallback(
    (moduleId: string) => {
      if (!isModuleVisible(moduleId)) return null;

      switch (moduleId) {
        case "truth_bar":
          return (
            <TruthBar
              key={moduleId}
              metrics={data?.truthBar || null}
              loading={loading}
            />
          );
        case "attention":
          return (
            <AttentionModule
              key={moduleId}
              items={data?.attentionItems || []}
              loading={loading}
              timeframe={filters.timeframe}
              scope={filters.scope}
              onTimeframeChange={handleTimeframeChange}
              onScopeChange={handleScopeChange}
            />
          );
        case "active_deals":
          return (
            <ActiveDealsModule
              key={moduleId}
              deals={data?.activeDeals || []}
              loading={loading}
            />
          );
        case "capital":
          return (
            <CapitalModule
              key={moduleId}
              entities={data?.capitalByEntity || []}
              loading={loading}
            />
          );
        case "relationships":
          return (
            <RelationshipsModule
              key={moduleId}
              signals={data?.relationshipSignals || []}
              loading={loading}
            />
          );
        case "events":
          return (
            <EventsModule
              key={moduleId}
              events={data?.upcomingEvents || []}
              loading={loading}
            />
          );
        case "alerts":
          // Only render alerts if there are any
          if (!loading && (!data?.alerts || data.alerts.length === 0)) return null;
          return (
            <AlertsModule
              key={moduleId}
              alerts={data?.alerts || []}
              loading={loading}
              onDismiss={handleDismissAlert}
            />
          );
        default:
          return null;
      }
    },
    [data, loading, filters, handleTimeframeChange, handleScopeChange, handleDismissAlert, isModuleVisible]
  );

  // Separate truth bar from other modules (it's always at top)
  const orderedModules = useMemo(() => {
    return preferences.moduleOrder.filter((id) => id !== "truth_bar");
  }, [preferences.moduleOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80">
      {/* Header with glass morphism */}
      <div className="sticky top-0 z-30">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />

        <div className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="max-w-7xl mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              {/* Title section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                  <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <LayoutDashboard className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
                  <p className="text-sm text-slate-500">
                    Your command center for Arrow Fund operations
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Command Palette trigger */}
                <button
                  onClick={() => setCommandOpen(true)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    "bg-slate-100/80 hover:bg-slate-200/80 transition-colors",
                    "text-sm text-slate-600"
                  )}
                >
                  <Command className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden sm:flex h-5 items-center gap-0.5 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>

                {/* Preferences */}
                <DashboardPreferencesPanel
                  preferences={preferences}
                  onPreferencesChange={handlePreferencesChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Truth Bar - always at top */}
        {isModuleVisible("truth_bar") && (
          <div className="mb-6">
            <TruthBar metrics={data?.truthBar || null} loading={loading} />
          </div>
        )}

        {/* Alerts - show at top if present */}
        {isModuleVisible("alerts") && !loading && data?.alerts && data.alerts.length > 0 && (
          <div className="mb-6">
            <AlertsModule
              alerts={data.alerts}
              loading={loading}
              onDismiss={handleDismissAlert}
            />
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - primary action items */}
          <div className="space-y-6">
            {isModuleVisible("attention") && (
              <AttentionModule
                items={data?.attentionItems || []}
                loading={loading}
                timeframe={filters.timeframe}
                scope={filters.scope}
                onTimeframeChange={handleTimeframeChange}
                onScopeChange={handleScopeChange}
              />
            )}
            {isModuleVisible("active_deals") && (
              <ActiveDealsModule
                deals={data?.activeDeals || []}
                loading={loading}
              />
            )}
          </div>

          {/* Right column - context and upcoming */}
          <div className="space-y-6">
            {isModuleVisible("capital") && data?.capitalByEntity && data.capitalByEntity.length > 0 && (
              <CapitalModule
                entities={data.capitalByEntity}
                loading={loading}
              />
            )}
            {isModuleVisible("relationships") && (
              <RelationshipsModule
                signals={data?.relationshipSignals || []}
                loading={loading}
              />
            )}
            {isModuleVisible("events") && (
              <EventsModule
                events={data?.upcomingEvents || []}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
