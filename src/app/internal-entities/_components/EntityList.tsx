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
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-lg border border-slate-200 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-slate-100 rounded" />
                  <div className="h-3 w-28 bg-slate-50 rounded" />
                  <div className="flex gap-2">
                    <div className="h-5 w-14 bg-slate-50 rounded" />
                    <div className="h-5 w-16 bg-slate-50 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!entities || entities.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="h-12 w-12 mx-auto mb-4 rounded-lg bg-slate-100 flex items-center justify-center">
            <Landmark className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-900 mb-1">No entities found</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Try adjusting your filters or create a new entity to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-4 space-y-2">
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

function EntityCard({ entity, isActive, onClick }: EntityCardProps) {
  const statusColor = getStatusColor(entity.status);
  const typeColor = getEntityTypeColor(entity.entityType);

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-4 rounded-lg border transition-colors ${
        isActive
          ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
            isActive
              ? "bg-gradient-to-br from-indigo-500 to-indigo-600"
              : "bg-slate-100 group-hover:bg-indigo-100"
          }`}
        >
          <Landmark className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-600"}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex-1">
              <h3 className={`text-sm font-medium truncate ${
                isActive ? "text-indigo-900" : "text-slate-900"
              }`}>
                {entity.displayName}
              </h3>
              {entity.nameShort && entity.nameShort !== entity.displayName && (
                <p className="text-xs text-slate-500 truncate">
                  {entity.nameLegal}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusColor}`}
              >
                {entity.statusLabel}
              </span>
              <ChevronRight className={`h-4 w-4 ${
                isActive ? "text-indigo-500" : "text-slate-300 group-hover:text-slate-400"
              }`} />
            </div>
          </div>

          {/* Meta Row */}
          <div className="flex items-center flex-wrap gap-1.5 mb-2">
            {/* Entity Type Badge */}
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border ${typeColor}`}>
              {entity.entityTypeLabel}
            </span>

            {/* Jurisdiction */}
            {entity.jurisdictionState && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-600 bg-slate-50 rounded border border-slate-200">
                <Building2 className="h-2.5 w-2.5 text-slate-400" />
                {entity.jurisdictionState}
              </span>
            )}

            {/* EIN */}
            {entity.einLast4 && (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-50 rounded border border-slate-200">
                ••• {entity.einLast4}
              </span>
            )}
          </div>

          {/* Stats Row */}
          {entity.stats && (entity.stats.bankAccountsCount > 0 || entity.stats.signersCount > 0 || entity.stats.documentsCount > 0) && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              {entity.stats.bankAccountsCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Wallet className="h-3 w-3 text-slate-400" />
                  <span className="font-medium">{entity.stats.bankAccountsCount}</span>
                  <span className="text-slate-400">accounts</span>
                </span>
              )}
              {entity.stats.signersCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Users className="h-3 w-3 text-slate-400" />
                  <span className="font-medium">{entity.stats.signersCount}</span>
                  <span className="text-slate-400">signers</span>
                </span>
              )}
              {entity.stats.documentsCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <FileText className="h-3 w-3 text-slate-400" />
                  <span className="font-medium">{entity.stats.documentsCount}</span>
                  <span className="text-slate-400">docs</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
