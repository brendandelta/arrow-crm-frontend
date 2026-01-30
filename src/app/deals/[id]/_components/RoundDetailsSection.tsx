"use client";

import { useState } from "react";
import {
  DollarSign,
  Calendar,
  Target,
  FileText,
  TrendingUp,
  Building2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoundDetailsProps {
  deal: {
    id: number;
    name: string;
    target: number | null; // Raise amount in cents
    valuation: number | null; // Valuation in cents
    sharePrice: number | null; // Share price in cents
    shareClass: string | null;
    expectedClose: string | null;
    deadline: string | null;
    structureNotes: string | null;
    softCircled: number; // In cents
    committed: number; // In cents
    wired: number; // In cents
  };
  onSave?: (data: Partial<RoundDetailsProps["deal"]>) => Promise<void>;
}

function formatCurrency(cents: number | null | undefined): string {
  if (!cents) return "—";
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(2)}B`;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(0)}K`;
  return `$${dollars.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysUntil(dateStr: string | null): { days: number; label: string; urgent: boolean } | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), label: `${Math.abs(diffDays)}d overdue`, urgent: true };
  }
  if (diffDays === 0) {
    return { days: 0, label: "Today", urgent: true };
  }
  if (diffDays <= 7) {
    return { days: diffDays, label: `${diffDays}d`, urgent: true };
  }
  return { days: diffDays, label: `${diffDays}d`, urgent: false };
}

export function RoundDetailsSection({ deal, onSave }: RoundDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);

  const closeDateInfo = getDaysUntil(deal.expectedClose);
  const deadlineInfo = getDaysUntil(deal.deadline);

  // Calculate progress toward target
  const progressPercent = deal.target && deal.committed
    ? Math.min(100, Math.round((deal.committed / deal.target) * 100))
    : null;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Target className="h-4 w-4 text-indigo-600" />
            </div>
            Round Details
          </CardTitle>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-0">
            Primary
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Raise Target */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <TrendingUp className="h-3 w-3" />
              Raise Target
            </div>
            <div className="text-xl font-semibold text-slate-900">
              {formatCurrency(deal.target)}
            </div>
            {progressPercent !== null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{progressPercent}% committed</span>
                  <span>{formatCurrency(deal.committed)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Valuation */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <Building2 className="h-3 w-3" />
              Valuation
            </div>
            <div className="text-xl font-semibold text-slate-900">
              {formatCurrency(deal.valuation)}
            </div>
            {deal.shareClass && (
              <div className="text-xs text-slate-500">
                {deal.shareClass}
              </div>
            )}
          </div>
        </div>

        {/* Share Price */}
        {deal.sharePrice && (
          <div className="flex items-center justify-between py-2.5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <DollarSign className="h-4 w-4 text-slate-400" />
              Share Price
            </div>
            <div className="text-sm font-medium text-slate-900">
              {formatCurrency(deal.sharePrice)}/share
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Timeline
          </div>

          {/* Expected Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              Expected Close
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {formatDate(deal.expectedClose)}
              </span>
              {closeDateInfo && (
                <Badge
                  variant="secondary"
                  className={
                    closeDateInfo.urgent
                      ? "bg-amber-50 text-amber-700 border-0"
                      : "bg-slate-100 text-slate-600 border-0"
                  }
                >
                  {closeDateInfo.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Deadline */}
          {deal.deadline && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-red-400" />
                Deadline
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">
                  {formatDate(deal.deadline)}
                </span>
                {deadlineInfo && (
                  <Badge
                    variant="secondary"
                    className={
                      deadlineInfo.urgent
                        ? "bg-red-50 text-red-700 border-0"
                        : "bg-slate-100 text-slate-600 border-0"
                    }
                  >
                    {deadlineInfo.label}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Capital Summary */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Capital Progress
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {formatCurrency(deal.softCircled)}
              </div>
              <div className="text-xs text-slate-500">Soft Circled</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-lg font-semibold text-indigo-700">
                {formatCurrency(deal.committed)}
              </div>
              <div className="text-xs text-indigo-600">Committed</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-lg font-semibold text-emerald-700">
                {formatCurrency(deal.wired)}
              </div>
              <div className="text-xs text-emerald-600">Wired</div>
            </div>
          </div>
        </div>

        {/* Structure Notes */}
        {deal.structureNotes && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <FileText className="h-3 w-3" />
              Terms & Structure
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {deal.structureNotes}
            </p>
          </div>
        )}

        {/* Empty State for Structure Notes */}
        {!deal.structureNotes && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              <FileText className="h-3 w-3" />
              Terms & Structure
            </div>
            <p className="text-sm text-slate-400 italic">
              No terms or structure notes added yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
