"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "./utils";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

interface Deal {
  id: number;
  name: string;
  company: string | null;
  status: string;
  owner: Owner | null;
  blocksValue: number;
  totalCommitted: number;
  inventory: number;
  coverageRatio: number | null;
  expectedClose: string | null;
  daysUntilClose: number | null;
}

interface PipelineViewProps {
  deals: Deal[];
  onDealClick: (dealId: number) => void;
}

const PIPELINE_STAGES = [
  { key: "sourcing", label: "Sourcing", color: "bg-slate-500" },
  { key: "live", label: "Live", color: "bg-green-500" },
  { key: "closing", label: "Closing", color: "bg-blue-500" },
  { key: "closed", label: "Closed", color: "bg-purple-500" },
];

interface StageData {
  key: string;
  label: string;
  color: string;
  deals: Deal[];
  totalValue: number;
  avgCoverage: number | null;
}

function PipelineStage({
  stage,
  maxValue,
  isLast,
  onDealClick,
  expanded,
  onToggleExpand,
}: {
  stage: StageData;
  maxValue: number;
  isLast: boolean;
  onDealClick: (dealId: number) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const widthPercent = maxValue > 0 ? Math.max((stage.totalValue / maxValue) * 100, 20) : 20;

  return (
    <div className="flex items-stretch">
      {/* Stage Block */}
      <div
        className="relative flex flex-col cursor-pointer transition-all hover:opacity-90"
        style={{ width: `${widthPercent}%`, minWidth: "160px" }}
        onClick={onToggleExpand}
      >
        {/* Header */}
        <div className={`${stage.color} text-white px-4 py-3 rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{stage.label}</span>
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
              {stage.deals.length}
            </Badge>
          </div>
          <div className="text-2xl font-bold mt-1">
            {formatCurrency(stage.totalValue)}
          </div>
          {stage.avgCoverage !== null && (
            <div className="text-sm opacity-80 mt-0.5">
              {stage.avgCoverage}% avg coverage
            </div>
          )}
        </div>

        {/* Funnel Body */}
        <div
          className={`flex-1 bg-gradient-to-b from-slate-100 to-slate-50 border-x border-b rounded-b-lg min-h-[100px] ${
            expanded ? "pb-2" : ""
          }`}
        >
          {expanded && stage.deals.length > 0 && (
            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
              {stage.deals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDealClick(deal.id);
                  }}
                  className="p-2 bg-white rounded border text-sm hover:shadow-sm hover:border-slate-300 cursor-pointer transition-all"
                >
                  <div className="font-medium truncate">{deal.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {deal.company || "—"}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="font-medium">{formatCurrency(deal.blocksValue)}</span>
                    {deal.coverageRatio !== null && (
                      <span className="text-muted-foreground">{deal.coverageRatio}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!expanded && stage.deals.length > 0 && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Click to expand
            </div>
          )}
          {stage.deals.length === 0 && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No deals
            </div>
          )}
        </div>
      </div>

      {/* Connector Arrow */}
      {!isLast && (
        <div className="flex items-center px-2">
          <ChevronRight className="h-8 w-8 text-slate-300" />
        </div>
      )}
    </div>
  );
}

function PipelineSummary({ stages }: { stages: StageData[] }) {
  const totalDeals = stages.reduce((sum, s) => sum + s.deals.length, 0);
  const totalValue = stages.reduce((sum, s) => sum + s.totalValue, 0);
  const closedStage = stages.find((s) => s.key === "closed");
  const sourcingStage = stages.find((s) => s.key === "sourcing");

  const conversionRate =
    sourcingStage && sourcingStage.deals.length > 0 && closedStage
      ? ((closedStage.deals.length / sourcingStage.deals.length) * 100).toFixed(1)
      : null;

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg mb-6">
      <div>
        <div className="text-sm text-muted-foreground">Total Deals</div>
        <div className="text-2xl font-bold">{totalDeals}</div>
      </div>
      <div>
        <div className="text-sm text-muted-foreground">Total Pipeline Value</div>
        <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
      </div>
      <div>
        <div className="text-sm text-muted-foreground">Closed Value</div>
        <div className="text-2xl font-bold text-purple-600">
          {formatCurrency(closedStage?.totalValue || 0)}
        </div>
      </div>
      <div>
        <div className="text-sm text-muted-foreground">Conversion Rate</div>
        <div className="text-2xl font-bold flex items-center gap-2">
          {conversionRate ? (
            <>
              {conversionRate}%
              {parseFloat(conversionRate) >= 20 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </>
          ) : (
            "—"
          )}
        </div>
      </div>
    </div>
  );
}

export function PipelineView({ deals, onDealClick }: PipelineViewProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  // Build stage data (excluding "dead" deals from pipeline)
  const stages: StageData[] = PIPELINE_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.status === stage.key);
    const totalValue = stageDeals.reduce((sum, d) => sum + (d.blocksValue || 0), 0);
    const coverages = stageDeals
      .map((d) => d.coverageRatio)
      .filter((c): c is number => c !== null);
    const avgCoverage =
      coverages.length > 0
        ? Math.round(coverages.reduce((sum, c) => sum + c, 0) / coverages.length)
        : null;

    return {
      ...stage,
      deals: stageDeals,
      totalValue,
      avgCoverage,
    };
  });

  const maxValue = Math.max(...stages.map((s) => s.totalValue), 1);

  // Dead deals shown separately
  const deadDeals = deals.filter((d) => d.status === "dead");

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <PipelineSummary stages={stages} />

      {/* Pipeline Funnel */}
      <div className="flex items-stretch overflow-x-auto pb-4">
        {stages.map((stage, index) => (
          <PipelineStage
            key={stage.key}
            stage={stage}
            maxValue={maxValue}
            isLast={index === stages.length - 1}
            onDealClick={onDealClick}
            expanded={expandedStage === stage.key}
            onToggleExpand={() =>
              setExpandedStage(expandedStage === stage.key ? null : stage.key)
            }
          />
        ))}
      </div>

      {/* Dead Deals Section */}
      {deadDeals.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Dead Deals</h3>
            <Badge variant="secondary">{deadDeals.length}</Badge>
            <span className="text-sm text-muted-foreground">
              · {formatCurrency(deadDeals.reduce((sum, d) => sum + (d.blocksValue || 0), 0))}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {deadDeals.slice(0, 8).map((deal) => (
              <div
                key={deal.id}
                onClick={() => onDealClick(deal.id)}
                className="p-2 bg-slate-50 rounded border text-sm hover:bg-slate-100 cursor-pointer"
              >
                <div className="font-medium truncate text-muted-foreground">{deal.name}</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(deal.blocksValue)}</div>
              </div>
            ))}
            {deadDeals.length > 8 && (
              <div className="p-2 bg-slate-50 rounded border text-sm flex items-center justify-center text-muted-foreground">
                +{deadDeals.length - 8} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
