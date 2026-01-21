"use client";

import { LayoutList, LayoutGrid, GitBranch } from "lucide-react";

type ViewMode = "table" | "board" | "pipeline";

interface ViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  availableViews?: ViewMode[];
}

const viewConfig: Record<
  ViewMode,
  { icon: typeof LayoutList; label: string; description: string }
> = {
  table: {
    icon: LayoutList,
    label: "Table",
    description: "View deals in a table format",
  },
  board: {
    icon: LayoutGrid,
    label: "Board",
    description: "Kanban-style board view",
  },
  pipeline: {
    icon: GitBranch,
    label: "Pipeline",
    description: "Pipeline funnel view",
  },
};

export function ViewToggle({
  activeView,
  onViewChange,
  availableViews = ["table", "board", "pipeline"],
}: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 p-1 bg-white">
      {availableViews.map((view) => {
        const config = viewConfig[view];
        const Icon = config.icon;
        const isActive = activeView === view;
        const isDisabled = view === "pipeline"; // Table and board are functional

        return (
          <button
            key={view}
            onClick={() => !isDisabled && onViewChange(view)}
            disabled={isDisabled}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all
              ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : isDisabled
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }
            `}
            title={isDisabled ? "Coming soon" : config.description}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Compact icon-only version
export function ViewToggleCompact({
  activeView,
  onViewChange,
}: {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}) {
  const views: ViewMode[] = ["table", "board", "pipeline"];

  return (
    <div className="inline-flex items-center rounded-md border border-slate-200 bg-white">
      {views.map((view) => {
        const config = viewConfig[view];
        const Icon = config.icon;
        const isActive = activeView === view;
        const isDisabled = view === "pipeline";

        return (
          <button
            key={view}
            onClick={() => !isDisabled && onViewChange(view)}
            disabled={isDisabled}
            className={`
              p-2 transition-colors
              ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : isDisabled
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }
              ${view === "table" ? "rounded-l-md" : ""}
              ${view === "pipeline" ? "rounded-r-md" : ""}
            `}
            title={isDisabled ? `${config.label} (Coming soon)` : config.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
