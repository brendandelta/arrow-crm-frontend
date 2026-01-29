"use client";

import { useMemo } from "react";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Briefcase,
  Building2,
  User,
  Shield,
  Lock,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentSummary, DocumentLink } from "@/lib/documents-api";
import { formatFileSize } from "@/lib/documents-api";

interface DocumentsListProps {
  documents: DocumentSummary[];
  loading: boolean;
  activeDocumentId: number | null;
  onSelectDocument: (id: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function DocumentsList({
  documents,
  loading,
  activeDocumentId,
  onSelectDocument,
}: DocumentsListProps) {
  if (loading && documents.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[...Array(8)].map((_, i) => (
          <DocumentRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No documents found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or upload a new document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-slate-100">
        {documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            isActive={doc.id === activeDocumentId}
            onClick={() => onSelectDocument(doc.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface DocumentRowProps {
  document: DocumentSummary;
  isActive: boolean;
  onClick: () => void;
}

function DocumentRow({ document, isActive, onClick }: DocumentRowProps) {
  const fileIcon = useMemo(() => {
    if (document.isPdf) return <FileText className="h-5 w-5 text-red-500" />;
    if (document.isImage) return <FileImage className="h-5 w-5 text-blue-500" />;
    const ext = document.name?.split('.').pop()?.toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  }, [document]);

  const statusColor = useMemo(() => {
    switch (document.status) {
      case 'draft':
        return 'bg-amber-100 text-amber-700';
      case 'final':
        return 'bg-green-100 text-green-700';
      case 'executed':
        return 'bg-indigo-100 text-indigo-700';
      case 'superseded':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }, [document.status]);

  const sensitivityIndicator = useMemo(() => {
    if (document.sensitivity === 'confidential' || document.sensitivity === 'highly_confidential') {
      return (
        <span className="flex items-center gap-0.5 text-amber-600" title={document.sensitivityLabel || 'Confidential'}>
          <Lock className="h-3 w-3" />
        </span>
      );
    }
    return null;
  }, [document.sensitivity, document.sensitivityLabel]);

  const formattedDate = useMemo(() => {
    const date = new Date(document.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [document.updatedAt]);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-colors ${
        isActive
          ? 'bg-indigo-50 border-l-2 border-indigo-500'
          : 'hover:bg-muted border-l-2 border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className="flex-shrink-0 mt-0.5">{fileIcon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">{document.title}</span>
            {sensitivityIndicator}
          </div>

          {/* Info row */}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {document.docType && (
              <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                {document.docType.replace(/_/g, ' ')}
              </span>
            )}
            {document.status && (
              <span className={`px-1.5 py-0.5 rounded ${statusColor}`}>
                {document.statusLabel || document.status}
              </span>
            )}
            <span className="text-muted-foreground">{formatFileSize(document.file.byteSize)}</span>
          </div>

          {/* Links row */}
          {document.links.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {document.links.slice(0, 3).map((link) => (
                <LinkPill key={link.id} link={link} />
              ))}
              {document.links.length > 3 && (
                <span className="text-xs text-muted-foreground">+{document.links.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </button>
  );
}

function LinkPill({ link }: { link: DocumentLink }) {
  const icon = useMemo(() => {
    switch (link.linkableType) {
      case 'Deal':
        return <Briefcase className="h-3 w-3" />;
      case 'Organization':
        return <Building2 className="h-3 w-3" />;
      case 'Person':
        return <User className="h-3 w-3" />;
      case 'InternalEntity':
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  }, [link.linkableType]);

  const colorClass = useMemo(() => {
    switch (link.linkableType) {
      case 'Deal':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Organization':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Person':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'InternalEntity':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  }, [link.linkableType]);

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border ${colorClass}`}
      title={`${link.linkableType}: ${link.label}`}
    >
      {icon}
      <span className="truncate max-w-[80px]">{link.label}</span>
    </span>
  );
}

function DocumentRowSkeleton() {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}
