"use client";

import { LayoutList, Workflow, Network } from "lucide-react";

type ViewMode = "table" | "flow" | "mindmap";

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
  flow: {
    icon: Workflow,
    label: "Flow",
    description: "Stage board with inspector and analytics",
  },
  mindmap: {
    icon: Network,
    label: "Mind Map",
    description: "Visual graph of deals and relationships",
  },
};

export function ViewToggle({
  activeView,
  onViewChange,
  availableViews = ["table", "flow", "mindmap"],
}: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border p-1 bg-card">
      {availableViews.map((view) => {
        const config = viewConfig[view];
        const Icon = config.icon;
        const isActive = activeView === view;

        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all
              ${
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }
            `}
            title={config.description}
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
  const views: ViewMode[] = ["table", "flow", "mindmap"];

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-card">
      {views.map((view) => {
        const config = viewConfig[view];
        const Icon = config.icon;
        const isActive = activeView === view;

        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`
              p-2 transition-colors
              ${
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }
              ${view === "table" ? "rounded-l-md" : ""}
              ${view === "mindmap" ? "rounded-r-md" : ""}
            `}
            title={config.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
