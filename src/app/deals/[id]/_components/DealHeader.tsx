"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Calendar, ExternalLink, FileText, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "../../_components/PriorityBadge";

interface Company {
  id: number;
  name: string;
  sector: string | null;
  website: string | null;
  logoUrl: string | null;
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

interface DealHeaderProps {
  name: string;
  company: Company | null;
  status: string;
  kind: string;
  priority: number;
  owner: Owner | null;
  softCircled: number;
  totalCommitted: number;
  wired: number;
  inventory: number;
  coverageRatio: number | null;
  expectedClose: string | null;
  daysUntilClose: number | null;
  driveUrl: string | null;
  dataRoomUrl: string | null;
  deckUrl: string | null;
  lpMode: boolean;
  onLpModeToggle: () => void;
  onBack: () => void;
}

function formatCurrency(cents: number) {
  if (!cents || cents === 0) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-green-100 text-green-800",
    sourcing: "bg-muted text-muted-foreground",
    closing: "bg-blue-100 text-blue-800",
    closed: "bg-purple-100 text-purple-800",
    dead: "bg-red-100 text-red-800",
  };
  return (
    <Badge className={styles[status] || styles.sourcing}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}


export function DealHeader({
  name,
  company,
  status,
  kind,
  priority,
  owner,
  softCircled,
  totalCommitted,
  wired,
  inventory,
  coverageRatio,
  expectedClose,
  daysUntilClose,
  driveUrl,
  dataRoomUrl,
  deckUrl,
  lpMode,
  onLpModeToggle,
  onBack,
}: DealHeaderProps) {
  const isCloseUrgent = daysUntilClose !== null && daysUntilClose <= 7 && daysUntilClose >= 0;
  const isOverdue = daysUntilClose !== null && daysUntilClose < 0;

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </button>

        <div className="flex items-center gap-3">
          {/* External Links */}
          {driveUrl && (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Drive
            </a>
          )}
          {dataRoomUrl && (
            <a
              href={dataRoomUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Data Room
            </a>
          )}
          {deckUrl && (
            <a
              href={deckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Deck
            </a>
          )}

          {/* LP Mode Toggle */}
          <button
            onClick={onLpModeToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
              lpMode
                ? "bg-purple-100 border-purple-300 text-purple-700"
                : "bg-card border-border text-muted-foreground hover:border-border"
            }`}
          >
            {lpMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            LP Preview {lpMode ? "On" : "Off"}
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex items-start justify-between">
        {/* Left: Name, Company, Badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{name}</h1>
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
            <Badge variant="outline" className="capitalize">
              {kind}
            </Badge>
          </div>

          {company && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <Link
                href={`/organizations/${company.id}`}
                className="hover:underline font-medium"
              >
                {company.name}
              </Link>
              {company.sector && (
                <>
                  <span>·</span>
                  <span>{company.sector}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Owner and Close Date */}
        <div className="text-right space-y-1">
          {owner && (
            <div className="flex items-center gap-2 justify-end">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {owner.firstName.charAt(0)}
                {owner.lastName.charAt(0)}
              </div>
              <span className="text-sm">
                {owner.firstName} {owner.lastName}
              </span>
            </div>
          )}

          {expectedClose && (
            <div
              className={`flex items-center gap-1.5 justify-end text-sm ${
                isOverdue
                  ? "text-red-600"
                  : isCloseUrgent
                  ? "text-amber-600"
                  : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{formatDate(expectedClose)}</span>
              {daysUntilClose !== null && (
                <span className="text-xs">
                  {isOverdue
                    ? `(${Math.abs(daysUntilClose)}d overdue)`
                    : daysUntilClose === 0
                    ? "(Today)"
                    : `(${daysUntilClose}d)`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="flex items-center gap-6 py-3 px-4 bg-muted rounded-lg">
        <MetricItem label="Soft Circled" value={formatCurrency(softCircled)} color="text-blue-600" />
        <div className="w-px h-8 bg-border" />
        <MetricItem
          label="Committed"
          value={formatCurrency(totalCommitted)}
          color="text-purple-600"
        />
        <div className="w-px h-8 bg-border" />
        <MetricItem label="Wired" value={formatCurrency(wired)} color="text-emerald-600" />
        <div className="w-px h-8 bg-border" />
        <MetricItem label="Inventory" value={formatCurrency(inventory)} />
        <div className="w-px h-8 bg-border" />
        <MetricItem
          label="Coverage"
          value={coverageRatio !== null ? `${coverageRatio}%` : "—"}
          color={
            coverageRatio === null
              ? undefined
              : coverageRatio >= 80
              ? "text-green-600"
              : coverageRatio >= 50
              ? "text-amber-600"
              : "text-red-600"
          }
        />
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-lg font-semibold ${color || ""}`}>{value}</div>
    </div>
  );
}
