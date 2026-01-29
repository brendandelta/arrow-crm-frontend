"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Landmark } from "lucide-react";
import { EntityFiltersRail } from "./_components/EntityFiltersRail";
import { EntityList } from "./_components/EntityList";
import { EntityDetailPanel } from "./_components/EntityDetailPanel";
import { NewEntityDialog } from "./_components/NewEntityDialog";
import { AddBankAccountDialog } from "./_components/AddBankAccountDialog";
import { AddSignerDialog } from "./_components/AddSignerDialog";
import {
  fetchInternalEntities,
  fetchInternalEntity,
  type InternalEntitySummary,
  type InternalEntityDetail,
  type EntityFilters,
  type EntityFacets,
} from "@/lib/internal-entities-api";

// localStorage keys
const STORAGE_KEYS = {
  filters: "arrow-crm-entities-filters",
  filtersCollapsed: "arrow-crm-entities-filters-collapsed",
};

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(`Failed to parse stored value for ${key}:`, e);
  }
  return fallback;
}

export default function InternalEntitiesPage() {
  const searchParams = useSearchParams();

  // State
  const [entities, setEntities] = useState<InternalEntitySummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facets, setFacets] = useState<EntityFacets>({
    entityType: [],
    status: [],
    jurisdictionState: [],
  });
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Filters
  const [filters, setFilters] = useState<EntityFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // UI state
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [activeEntityId, setActiveEntityId] = useState<number | null>(null);
  const [activeEntity, setActiveEntity] = useState<InternalEntityDetail | null>(null);
  const [loadingEntity, setLoadingEntity] = useState(false);

  // Dialogs
  const [showNewEntityDialog, setShowNewEntityDialog] = useState(false);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [showAddSignerDialog, setShowAddSignerDialog] = useState(false);

  // Initialize from localStorage and URL params
  useEffect(() => {
    const storedFilters = getStoredValue<EntityFilters>(STORAGE_KEYS.filters, {});
    const storedCollapsed = getStoredValue<boolean>(STORAGE_KEYS.filtersCollapsed, false);

    setFilters(storedFilters);
    setFiltersCollapsed(storedCollapsed);

    // Check URL for entity ID
    const entityId = searchParams.get("id");
    if (entityId) {
      setActiveEntityId(parseInt(entityId, 10));
    }

    setIsInitialized(true);
  }, [searchParams]);

  // Persist filters to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
    }
  }, [filters, isInitialized]);

  // Persist collapsed state
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.filtersCollapsed, JSON.stringify(filtersCollapsed));
    }
  }, [filtersCollapsed, isInitialized]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch entities
  useEffect(() => {
    if (!isInitialized) return;

    const loadEntities = async () => {
      setLoading(true);
      try {
        const response = await fetchInternalEntities({
          ...filters,
          q: debouncedQuery || undefined,
        });
        setEntities(response.internalEntities);
        setTotalCount(response.pageInfo.total);
        setFacets(response.facets);
      } catch (error) {
        console.error("Failed to fetch entities:", error);
        toast.error("Failed to load internal entities");
      } finally {
        setLoading(false);
      }
    };

    loadEntities();
  }, [isInitialized, filters, debouncedQuery]);

  // Fetch active entity details
  useEffect(() => {
    if (!activeEntityId) {
      setActiveEntity(null);
      return;
    }

    const loadEntity = async () => {
      setLoadingEntity(true);
      try {
        const entity = await fetchInternalEntity(activeEntityId);
        setActiveEntity(entity);
      } catch (error) {
        console.error("Failed to fetch entity:", error);
        toast.error("Failed to load entity details");
        setActiveEntity(null);
      } finally {
        setLoadingEntity(false);
      }
    };

    loadEntity();
  }, [activeEntityId]);

  // Update URL when active entity changes
  useEffect(() => {
    if (!isInitialized) return;

    const url = new URL(window.location.href);
    if (activeEntityId) {
      url.searchParams.set("id", activeEntityId.toString());
    } else {
      url.searchParams.delete("id");
    }
    window.history.replaceState({}, "", url.toString());
  }, [activeEntityId, isInitialized]);

  // Handlers
  const handleFiltersChange = useCallback((newFilters: EntityFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSelectEntity = useCallback((id: number) => {
    setActiveEntityId(id);
  }, []);

  const handleClosePreview = useCallback(() => {
    setActiveEntityId(null);
    setActiveEntity(null);
  }, []);

  const handleEntityUpdate = useCallback((entity: InternalEntityDetail) => {
    setActiveEntity(entity);
    // Also update in list
    setEntities((prev) =>
      prev.map((e) =>
        e.id === entity.id
          ? {
              ...e,
              nameLegal: entity.nameLegal,
              nameShort: entity.nameShort,
              displayName: entity.displayName,
              entityType: entity.entityType,
              entityTypeLabel: entity.entityTypeLabel,
              status: entity.status,
              statusLabel: entity.statusLabel,
              stats: {
                bankAccountsCount: entity.bankAccounts.filter(b => b.status === 'active').length,
                signersCount: entity.signers.length,
                documentsCount: entity.documentsCount,
              },
            }
          : e
      )
    );
  }, []);

  const handleNewEntitySuccess = useCallback((entity: InternalEntityDetail) => {
    // Add to beginning of list
    setEntities((prev) => [
      {
        id: entity.id,
        nameLegal: entity.nameLegal,
        nameShort: entity.nameShort,
        displayName: entity.displayName,
        entityType: entity.entityType,
        entityTypeLabel: entity.entityTypeLabel,
        jurisdictionCountry: entity.jurisdictionCountry,
        jurisdictionState: entity.jurisdictionState,
        formationDate: entity.formationDate,
        status: entity.status,
        statusLabel: entity.statusLabel,
        einMasked: entity.einMasked,
        einLast4: entity.einLast4,
        stats: {
          bankAccountsCount: entity.bankAccounts.filter(b => b.status === 'active').length,
          signersCount: entity.signers.length,
          documentsCount: entity.documentsCount,
        },
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      ...prev,
    ]);
    setTotalCount((prev) => prev + 1);
    setActiveEntityId(entity.id);
    setActiveEntity(entity);
    setShowNewEntityDialog(false);
  }, []);

  const handleBankAccountAdded = useCallback(() => {
    if (activeEntityId) {
      // Refresh entity details
      fetchInternalEntity(activeEntityId).then(setActiveEntity);
    }
    setShowAddBankDialog(false);
  }, [activeEntityId]);

  const handleSignerAdded = useCallback(() => {
    if (activeEntityId) {
      // Refresh entity details
      fetchInternalEntity(activeEntityId).then(setActiveEntity);
    }
    setShowAddSignerDialog(false);
  }, [activeEntityId]);

  const refreshActiveEntity = useCallback(async () => {
    if (activeEntityId) {
      const entity = await fetchInternalEntity(activeEntityId);
      setActiveEntity(entity);
    }
  }, [activeEntityId]);

  const handleEntityDeleted = useCallback(() => {
    // Remove from list
    setEntities((prev) => prev.filter((e) => e.id !== activeEntityId));
    setTotalCount((prev) => prev - 1);
    // Close the detail panel
    setActiveEntityId(null);
    setActiveEntity(null);
  }, [activeEntityId]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#FAFBFC]">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Landmark className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Internal Entities
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {loading ? (
                    <span className="inline-block w-24 h-4 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    <>
                      {totalCount} {totalCount === 1 ? "entity" : "entities"}
                      {entities.length !== totalCount && (
                        <span className="text-slate-400"> · {entities.length} showing</span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-72 h-11 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200/80 rounded-xl
                             placeholder:text-slate-400
                             focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10
                             transition-all duration-200"
                  />
                </div>
              </div>

              {/* New Entity Button */}
              <button
                onClick={() => setShowNewEntityDialog(true)}
                className="group relative flex items-center gap-2.5 h-11 px-5
                         bg-gradient-to-b from-indigo-500 to-indigo-600
                         text-white text-sm font-medium rounded-xl
                         shadow-lg shadow-indigo-500/25
                         hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30
                         active:scale-[0.98]
                         transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>New Entity</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filters Rail */}
        <EntityFiltersRail
          filters={filters}
          onFiltersChange={handleFiltersChange}
          facets={facets}
          isCollapsed={filtersCollapsed}
          onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
        />

        {/* Entities List */}
        <div className="flex-1 flex flex-col min-w-0">
          <EntityList
            entities={entities}
            loading={loading}
            activeEntityId={activeEntityId}
            onSelectEntity={handleSelectEntity}
          />
        </div>

        {/* Detail Panel */}
        {activeEntityId !== null && (
          <EntityDetailPanel
            entity={activeEntity}
            loading={loadingEntity}
            onClose={handleClosePreview}
            onUpdate={handleEntityUpdate}
            onDelete={handleEntityDeleted}
            onAddBankAccount={() => setShowAddBankDialog(true)}
            onAddSigner={() => setShowAddSignerDialog(true)}
            onRefresh={refreshActiveEntity}
          />
        )}
      </div>

      {/* Dialogs */}
      <NewEntityDialog
        open={showNewEntityDialog}
        onOpenChange={setShowNewEntityDialog}
        onSuccess={handleNewEntitySuccess}
      />

      {activeEntity && (
        <>
          <AddBankAccountDialog
            open={showAddBankDialog}
            onOpenChange={setShowAddBankDialog}
            entityId={activeEntity.id}
            onSuccess={handleBankAccountAdded}
          />
          <AddSignerDialog
            open={showAddSignerDialog}
            onOpenChange={setShowAddSignerDialog}
            entityId={activeEntity.id}
            onSuccess={handleSignerAdded}
          />
        </>
      )}
    </div>
  );
}
