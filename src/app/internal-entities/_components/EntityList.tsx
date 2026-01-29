"use client";

import { Landmark, Building2, Wallet, Users, FileText, ChevronRight } from "lucide-react";
import type { InternalEntitySummary } from "@/lib/internal-entities-api";
import { getStatusColor, getEntityTypeColor } from "@/lib/internal-entities-api";

interface EntityListProps {
  entities: InternalEntitySummary[];
  loading: boolean;
  activeEntityId: number | null;
  onSelectEntity: (id: number) => void;
}

export function EntityList({
  entities,
  loading,
  activeEntityId,
  onSelectEntity,
}: EntityListProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="p-5 bg-card rounded-2xl border border-border animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-muted rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-48 bg-muted rounded-lg" />
                  <div className="h-4 w-32 bg-muted rounded-lg" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-muted rounded-lg" />
                    <div className="h-6 w-20 bg-muted rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-12">
          <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
            <Landmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No entities found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your filters or create a new entity to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-3">
        {entities.map((entity, index) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            isActive={entity.id === activeEntityId}
            onClick={() => onSelectEntity(entity.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

interface EntityCardProps {
  entity: InternalEntitySummary;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

function EntityCard({ entity, isActive, onClick, index }: EntityCardProps) {
  const statusColor = getStatusColor(entity.status);
  const typeColor = getEntityTypeColor(entity.entityType);

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-br from-indigo-50 to-white border-indigo-200 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-200"
          : "bg-card border-border/60 hover:border-border hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5"
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
            isActive
              ? "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30"
              : "bg-gradient-to-br from-slate-100 to-slate-50 group-hover:from-indigo-100 group-hover:to-indigo-50"
          }`}
        >
          <Landmark className={`h-5 w-5 transition-colors ${isActive ? "text-white" : "text-muted-foreground group-hover:text-indigo-600"}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold truncate transition-colors ${
                isActive ? "text-indigo-900" : "text-foreground"
              }`}>
                {entity.displayName}
              </h3>
              {entity.nameShort && entity.nameShort !== entity.displayName && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {entity.nameLegal}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusColor}`}
              >
                {entity.statusLabel}
              </span>
              <ChevronRight className={`h-4 w-4 transition-all duration-200 ${
                isActive
                  ? "text-indigo-500 translate-x-0"
                  : "text-muted-foreground/60 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              }`} />
            </div>
          </div>

          {/* Meta Row */}
          <div className="flex items-center flex-wrap gap-2 mb-3">
            {/* Entity Type Badge */}
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${typeColor}`}>
              {entity.entityTypeLabel}
            </span>

            {/* Jurisdiction */}
            {entity.jurisdictionState && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground bg-muted rounded-lg">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                {entity.jurisdictionState}
              </span>
            )}

            {/* EIN */}
            {entity.einLast4 && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono text-muted-foreground bg-muted rounded-lg">
                ••• {entity.einLast4}
              </span>
            )}
          </div>

          {/* Stats Row */}
          {(entity.stats.bankAccountsCount > 0 || entity.stats.signersCount > 0 || entity.stats.documentsCount > 0) && (
            <div className="flex items-center gap-4 pt-3 border-t border-border">
              {entity.stats.bankAccountsCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{entity.stats.bankAccountsCount}</span>
                  <span className="text-muted-foreground">accounts</span>
                </span>
              )}
              {entity.stats.signersCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{entity.stats.signersCount}</span>
                  <span className="text-muted-foreground">signers</span>
                </span>
              )}
              {entity.stats.documentsCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{entity.stats.documentsCount}</span>
                  <span className="text-muted-foreground">docs</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
