"use client";

import { Landmark, Building2, Wallet, Users, FileText } from "lucide-react";
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
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-slate-100 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-slate-100 rounded mb-2" />
                  <div className="h-4 w-32 bg-slate-100 rounded" />
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
        <div className="text-center p-8">
          <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
            <Landmark className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-900 mb-1">No entities found</h3>
          <p className="text-sm text-slate-500">
            Try adjusting your filters or create a new entity
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-2">
        {entities.map((entity) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            isActive={entity.id === activeEntityId}
            onClick={() => onSelectEntity(entity.id)}
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
}

function EntityCard({ entity, isActive, onClick }: EntityCardProps) {
  const statusColor = getStatusColor(entity.status);
  const typeColor = getEntityTypeColor(entity.entityType);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isActive
          ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200"
          : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            isActive ? "bg-indigo-100" : "bg-slate-50"
          }`}
        >
          <Landmark className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-slate-900 truncate">
                {entity.displayName}
              </h3>
              {entity.nameShort && entity.nameShort !== entity.displayName && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {entity.nameLegal}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full border ${statusColor}`}
            >
              {entity.statusLabel}
            </span>
          </div>

          {/* Meta Row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            {/* Entity Type */}
            <span className={`px-2 py-0.5 rounded-md border ${typeColor}`}>
              {entity.entityTypeLabel}
            </span>

            {/* Jurisdiction */}
            {entity.jurisdictionState && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {entity.jurisdictionState}
              </span>
            )}

            {/* EIN */}
            {entity.einLast4 && (
              <span className="font-mono">
                ••• {entity.einLast4}
              </span>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-2">
            {entity.stats.bankAccountsCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Wallet className="h-3 w-3" />
                {entity.stats.bankAccountsCount}
              </span>
            )}
            {entity.stats.signersCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Users className="h-3 w-3" />
                {entity.stats.signersCount}
              </span>
            )}
            {entity.stats.documentsCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <FileText className="h-3 w-3" />
                {entity.stats.documentsCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
