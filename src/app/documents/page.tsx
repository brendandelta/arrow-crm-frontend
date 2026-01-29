"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DocumentsHeader } from "./_components/DocumentsHeader";
import { DocumentsFiltersRail } from "./_components/DocumentsFiltersRail";
import { DocumentsList } from "./_components/DocumentsList";
import { DocumentPreviewPanel } from "./_components/DocumentPreviewPanel";
import { UploadDocumentDialog } from "./_components/UploadDocumentDialog";
import { LinkDocumentDialog } from "./_components/LinkDocumentDialog";
import {
  fetchDocuments,
  fetchDocument,
  type DocumentSummary,
  type DocumentDetail,
  type DocumentFilters,
  type DocumentFacets,
  type DocumentLink,
} from "@/lib/documents-api";

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
  const [showLinkDialog, setShowLinkDialog] = useState(false);

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

  const handleLinkSuccess = useCallback(
    (link: DocumentLink) => {
      if (activeDocument) {
        const updatedDoc = {
          ...activeDocument,
          links: [...activeDocument.links, link],
        };
        handleDocumentUpdate(updatedDoc);
      }
    },
    [activeDocument, handleDocumentUpdate]
  );

  const handleNavigateToLink = useCallback(
    (link: DocumentLink) => {
      let path = "";
      switch (link.linkableType) {
        case "Deal":
          path = `/deals/${link.linkableId}`;
          break;
        case "Organization":
          path = `/organizations/${link.linkableId}`;
          break;
        case "Person":
          path = `/people/${link.linkableId}`;
          break;
        case "InternalEntity":
          path = `/internal-entities/${link.linkableId}`;
          break;
      }
      if (path) {
        router.push(path);
      }
    },
    [router]
  );

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
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Page Header with Identity */}
      <PageHeader
        subtitle={
          <span className="flex items-center gap-2">
            <span>{totalCount} documents</span>
            {filteredCount !== totalCount && (
              <>
                <span className="text-muted-foreground/60">·</span>
                <span className="text-sky-600">{filteredCount} showing</span>
              </>
            )}
          </span>
        }
        primaryActionLabel="Upload"
        onPrimaryAction={() => setShowUploadDialog(true)}
      />

      {/* Search Bar */}
      <div className="px-6 pb-4 border-b border-border/60">
        <DocumentsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUploadClick={() => setShowUploadDialog(true)}
          savedViews={savedViews}
          onSelectSavedView={handleSelectSavedView}
          onSaveCurrentView={handleSaveCurrentView}
          totalCount={totalCount}
          filteredCount={filteredCount}
        />
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
        <div className="flex-1 flex flex-col min-w-0 border-r border-border/60">
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
            onAddLinkClick={() => setShowLinkDialog(true)}
            onNavigateToLink={handleNavigateToLink}
          />
        )}
      </div>

      {/* Dialogs */}
      <UploadDocumentDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={handleUploadSuccess}
      />

      {activeDocumentId && (
        <LinkDocumentDialog
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          documentId={activeDocumentId}
          onSuccess={handleLinkSuccess}
        />
      )}
    </div>
  );
}
