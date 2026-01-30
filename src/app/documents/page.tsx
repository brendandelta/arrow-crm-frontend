"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { DocumentsHeader } from "./_components/DocumentsHeader";
import { DocumentsFiltersRail } from "./_components/DocumentsFiltersRail";
import { DocumentsList } from "./_components/DocumentsList";
import { DocumentPreviewPanel } from "./_components/DocumentPreviewPanel";
import { UploadDocumentDialog } from "./_components/UploadDocumentDialog";
import {
  fetchDocuments,
  fetchDocument,
  type DocumentSummary,
  type DocumentDetail,
  type DocumentFilters,
  type DocumentFacets,
} from "@/lib/documents-api";
import { getPageIdentity } from "@/lib/page-registry";
import { cn } from "@/lib/utils";

// Get page identity for theming
const pageIdentity = getPageIdentity("documents");
const theme = pageIdentity?.theme;
const PageIcon = pageIdentity?.icon || FileText;

// localStorage keys
const STORAGE_KEYS = {
  filters: "arrow-crm-documents-filters",
  filtersCollapsed: "arrow-crm-documents-filters-collapsed",
  savedViews: "arrow-crm-documents-saved-views",
};

interface SavedView {
  id: string;
  name: string;
  filters: DocumentFilters;
}

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

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facets, setFacets] = useState<DocumentFacets>({
    category: [],
    docType: [],
    status: [],
    sensitivity: [],
    linkableType: [],
  });
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Filters
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // UI state
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<number | null>(null);
  const [activeDocument, setActiveDocument] = useState<DocumentDetail | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  // Dialogs
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Saved views
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  // Initialize from localStorage and URL params
  useEffect(() => {
    const storedFilters = getStoredValue<DocumentFilters>(STORAGE_KEYS.filters, {});
    const storedCollapsed = getStoredValue<boolean>(STORAGE_KEYS.filtersCollapsed, false);
    const storedViews = getStoredValue<SavedView[]>(STORAGE_KEYS.savedViews, []);

    setFilters(storedFilters);
    setFiltersCollapsed(storedCollapsed);
    setSavedViews(storedViews);

    // Check URL for document ID
    const docId = searchParams.get("id");
    if (docId) {
      setActiveDocumentId(parseInt(docId, 10));
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

  // Persist saved views
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.savedViews, JSON.stringify(savedViews));
    }
  }, [savedViews, isInitialized]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch documents
  useEffect(() => {
    if (!isInitialized) return;

    const loadDocuments = async () => {
      setLoading(true);
      try {
        const response = await fetchDocuments({
          ...filters,
          q: debouncedQuery || undefined,
        });
        setDocuments(response.documents);
        setTotalCount(response.pageInfo.total);
        setFacets(response.facets);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [isInitialized, filters, debouncedQuery]);

  // Fetch active document details
  useEffect(() => {
    if (!activeDocumentId) {
      setActiveDocument(null);
      return;
    }

    const loadDocument = async () => {
      setLoadingDocument(true);
      try {
        const doc = await fetchDocument(activeDocumentId);
        setActiveDocument(doc);
      } catch (error) {
        console.error("Failed to fetch document:", error);
        toast.error("Failed to load document details");
        setActiveDocument(null);
      } finally {
        setLoadingDocument(false);
      }
    };

    loadDocument();
  }, [activeDocumentId]);

  // Update URL when active document changes
  useEffect(() => {
    if (!isInitialized) return;

    const url = new URL(window.location.href);
    if (activeDocumentId) {
      url.searchParams.set("id", activeDocumentId.toString());
    } else {
      url.searchParams.delete("id");
    }
    window.history.replaceState({}, "", url.toString());
  }, [activeDocumentId, isInitialized]);

  // Handlers
  const handleFiltersChange = useCallback((newFilters: DocumentFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSelectDocument = useCallback((id: number) => {
    setActiveDocumentId(id);
  }, []);

  const handleClosePreview = useCallback(() => {
    setActiveDocumentId(null);
    setActiveDocument(null);
  }, []);

  const handleDocumentUpdate = useCallback((doc: DocumentDetail) => {
    setActiveDocument(doc);
    // Also update in list
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? {
              ...d,
              title: doc.title,
              status: doc.status,
              statusLabel: doc.statusLabel,
              category: doc.category,
              categoryLabel: doc.categoryLabel,
              sensitivity: doc.sensitivity,
              sensitivityLabel: doc.sensitivityLabel,
              links: doc.links,
            }
          : d
      )
    );
  }, []);

  const handleUploadSuccess = useCallback((doc: DocumentDetail) => {
    // Add to beginning of list
    setDocuments((prev) => [
      {
        id: doc.id,
        name: doc.name,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        categoryLabel: doc.categoryLabel,
        docType: doc.docType,
        status: doc.status,
        statusLabel: doc.statusLabel,
        source: doc.source,
        sourceLabel: doc.sourceLabel,
        sensitivity: doc.sensitivity,
        sensitivityLabel: doc.sensitivityLabel,
        isImage: doc.isImage,
        isPdf: doc.isPdf,
        version: doc.version,
        file: {
          filename: doc.name,
          contentType: doc.fileType,
          byteSize: doc.fileSizeBytes,
        },
        links: doc.links,
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      ...prev,
    ]);
    setTotalCount((prev) => prev + 1);
    setActiveDocumentId(doc.id);
    setActiveDocument(doc);
  }, []);

  const handleSelectSavedView = useCallback((view: SavedView) => {
    setFilters(view.filters);
    toast.success(`Loaded view: ${view.name}`);
  }, []);

  const handleSaveCurrentView = useCallback(() => {
    const name = prompt("Name this view:");
    if (!name) return;

    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name,
      filters: { ...filters },
    };
    setSavedViews((prev) => [...prev, newView]);
    toast.success("View saved");
  }, [filters]);

  const filteredCount = documents.length;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#FAFBFC]">
      {/* Premium Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="relative px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )} />
                <div className={cn(
                  "relative h-11 w-11 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-[1.02]",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )}>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
                  <PageIcon className="relative h-5 w-5 text-white drop-shadow-sm" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Documents
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {loading ? (
                    <span className="inline-block w-32 h-4 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{totalCount} total documents</span>
                      {filteredCount !== totalCount && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-pink-600">{filteredCount} filtered</span>
                        </>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <DocumentsHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onUploadClick={() => setShowUploadDialog(true)}
              savedViews={savedViews}
              onSelectSavedView={handleSelectSavedView}
              onSaveCurrentView={handleSaveCurrentView}
              totalCount={totalCount}
              filteredCount={filteredCount}
              theme={theme}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filters Rail */}
        <DocumentsFiltersRail
          filters={filters}
          onFiltersChange={handleFiltersChange}
          facets={facets}
          isCollapsed={filtersCollapsed}
          onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
        />

        {/* Documents List */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200/60">
          <DocumentsList
            documents={documents}
            loading={loading}
            activeDocumentId={activeDocumentId}
            onSelectDocument={handleSelectDocument}
          />
        </div>

        {/* Preview Panel */}
        {activeDocumentId !== null && (
          <DocumentPreviewPanel
            document={activeDocument}
            loading={loadingDocument}
            onClose={handleClosePreview}
            onUpdate={handleDocumentUpdate}
            onNewVersionClick={() => {
              // For new version, we'd show a file picker dialog
              toast.info("New version upload coming soon");
            }}
          />
        )}
      </div>

      {/* Dialogs */}
      <UploadDocumentDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
