"use client";

import { useState, useEffect, useCallback } from "react";
import { Command } from "lucide-react";
import { toast } from "sonner";
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
import { getPageIdentity } from "@/lib/page-registry";

// Get page identity for theming
const pageIdentity = getPageIdentity("dashboard");
const theme = pageIdentity?.theme;
const Icon = pageIdentity?.icon;

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
      toast.error("Failed to load dashboard data");
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

  // Stats for header
  const attentionCount = data?.attentionItems?.length || 0;
  const criticalCount = data?.attentionItems?.filter((i) => i.severity === "critical").length || 0;
  const alertCount = data?.alerts?.length || 0;

  return (
    <div className="h-[calc(100vh-1.5rem)] flex flex-col bg-[#FAFBFC]">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          {/* Title section */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center",
              theme && `bg-gradient-to-br ${theme.gradient}`
            )}>
              {Icon && <Icon className="h-4.5 w-4.5 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
              {!loading && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span>{attentionCount} items need attention</span>
                  {criticalCount > 0 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-red-600">{criticalCount} critical</span>
                    </>
                  )}
                  {alertCount > 0 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-amber-600">{alertCount} alerts</span>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Command Palette trigger */}
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-xs text-slate-600"
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

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
          {/* Truth Bar - 5 stat cards in a row */}
          {isModuleVisible("truth_bar") && (
            <TruthBar metrics={data?.truthBar || null} loading={loading} />
          )}

          {/* Alerts */}
          {isModuleVisible("alerts") && !loading && data?.alerts && data.alerts.length > 0 && (
            <AlertsModule
              alerts={data.alerts}
              loading={loading}
              onDismiss={handleDismissAlert}
            />
          )}

          {/* Two column layout for main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column - Attention & Follow-ups */}
            <div className="space-y-4">
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
              {isModuleVisible("relationships") && (
                <RelationshipsModule
                  signals={data?.relationshipSignals || []}
                  loading={loading}
                />
              )}
              {isModuleVisible("capital") && data?.capitalByEntity && data.capitalByEntity.length > 0 && (
                <CapitalModule
                  entities={data.capitalByEntity}
                  loading={loading}
                />
              )}
            </div>

            {/* Right column - Deals & Events */}
            <div className="space-y-4">
              {isModuleVisible("active_deals") && (
                <ActiveDealsModule
                  deals={data?.activeDeals || []}
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
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
