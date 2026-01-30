"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Download,
  Link2,
  Upload,
  Pencil,
  X,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Trash2,
  ExternalLink,
  Briefcase,
  Building2,
  User,
  Shield,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentDetail, DocumentLink } from "@/lib/documents-api";
import {
  updateDocument,
  formatFileSize,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  DOCUMENT_SENSITIVITIES,
} from "@/lib/documents-api";
import { DocumentLinksEditor } from "@/components/documents/DocumentLinksEditor";
import { toastApiError } from "@/lib/api-error";

interface DocumentPreviewPanelProps {
  document: DocumentDetail | null;
  loading: boolean;
  onClose: () => void;
  onUpdate: (doc: DocumentDetail) => void;
  onNewVersionClick: () => void;
}

export function DocumentPreviewPanel({
  document,
  loading,
  onClose,
  onUpdate,
  onNewVersionClick,
}: DocumentPreviewPanelProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleInlineEdit = useCallback(
    async (field: string, value: string) => {
      if (!document) return;

      // Optimistic update
      const updatedDoc = { ...document, [field]: value };
      onUpdate(updatedDoc);

      try {
        await updateDocument(document.id, { [field]: value });
        toast.success("Document updated");
      } catch (err) {
        // Revert on error
        onUpdate(document);
        toastApiError(err, { entity: "document", action: "update" });
      }
      setEditingField(null);
    },
    [document, onUpdate]
  );

  const handleSelectChange = useCallback(
    async (field: string, value: string) => {
      if (!document) return;

      const updatedDoc = { ...document, [field]: value };
      onUpdate(updatedDoc);

      try {
        await updateDocument(document.id, { [field]: value });
        toast.success("Document updated");
      } catch (err) {
        onUpdate(document);
        toastApiError(err, { entity: "document", action: "update" });
      }
    },
    [document, onUpdate]
  );

  const handleDownload = useCallback(() => {
    if (!document?.fileUrl) {
      toast.error("No file available for download");
      return;
    }
    window.open(document.fileUrl, "_blank");
  }, [document]);

  const handleCopyLink = useCallback(() => {
    if (!document) return;
    const url = `${window.location.origin}/documents?id=${document.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }, [document]);

  if (!document && !loading) {
    return (
      <div className="w-[420px] border-l border-slate-200/60 bg-slate-50/30 flex flex-col items-center justify-center p-8">
        <FileText className="h-16 w-16 text-slate-200 mb-4" />
        <h3 className="text-sm font-medium text-slate-600 mb-2">No document selected</h3>
        <p className="text-sm text-slate-500 text-center">
          Select a document from the list to preview it here.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-[420px] border-l border-slate-200/60 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200/60">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!document) return null;

  const fileIcon = (() => {
    if (document.isPdf) return <FileText className="h-6 w-6 text-red-500" />;
    if (document.isImage) return <FileImage className="h-6 w-6 text-blue-500" />;
    if (document.isSpreadsheet) return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    return <File className="h-6 w-6 text-slate-400" />;
  })();

  return (
    <div className="w-[420px] border-l border-slate-200/60 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-200/60">
        <div className="flex items-start gap-3 min-w-0">
          {fileIcon}
          <div className="min-w-0">
            {editingField === "title" ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleInlineEdit("title", editValue)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInlineEdit("title", editValue);
                  if (e.key === "Escape") setEditingField(null);
                }}
                autoFocus
                className="w-full font-semibold text-slate-900 border-b border-indigo-400 focus:outline-none bg-transparent"
              />
            ) : (
              <h2
                onClick={() => {
                  setEditingField("title");
                  setEditValue(document.title);
                }}
                className="font-semibold text-slate-900 truncate cursor-pointer hover:text-indigo-700 transition-colors"
                title="Click to edit"
              >
                {document.title}
              </h2>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {formatFileSize(document.fileSizeBytes)} · v{document.version || 1}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200/60 bg-slate-50/50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-1.5 text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="gap-1.5 text-xs"
        >
          <Link2 className="h-3.5 w-3.5" />
          Copy link
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNewVersionClick}
          className="gap-1.5 text-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          New version
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Preview Area */}
        <div className="p-4">
          {document.previewUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {document.isPdf ? (
                <iframe
                  src={`${document.previewUrl}#toolbar=0`}
                  className="w-full h-[300px]"
                  title="Document preview"
                />
              ) : document.isImage ? (
                <img
                  src={document.previewUrl}
                  alt={document.title}
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center">
              {fileIcon}
              <p className="text-sm text-slate-500 mt-2">{document.name}</p>
              <p className="text-xs text-slate-400 mt-1">
                Preview not available for this file type
              </p>
            </div>
          )}
        </div>

        {/* Metadata Card */}
        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Details
            </h3>

            {/* Description */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Description</label>
              {editingField === "description" ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleInlineEdit("description", editValue)}
                  autoFocus
                  rows={3}
                  className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              ) : (
                <p
                  onClick={() => {
                    setEditingField("description");
                    setEditValue(document.description || "");
                  }}
                  className="text-sm text-slate-700 cursor-pointer hover:bg-slate-50 rounded p-1 -m-1 transition-colors"
                >
                  {document.description || (
                    <span className="text-slate-400 italic">Add description...</span>
                  )}
                </p>
              )}
            </div>

            {/* Selects Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Category</label>
                <Select
                  value={document.category || ""}
                  onValueChange={(v) => handleSelectChange("category", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Status</label>
                <Select
                  value={document.status || ""}
                  onValueChange={(v) => handleSelectChange("status", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Sensitivity</label>
                <Select
                  value={document.sensitivity || ""}
                  onValueChange={(v) => handleSelectChange("sensitivity", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_SENSITIVITIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Doc Type</label>
                <p className="text-sm text-slate-700 px-2 py-1">
                  {document.docType?.replace(/_/g, " ") || "—"}
                </p>
              </div>
            </div>

            {/* File info */}
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Uploaded {new Date(document.createdAt).toLocaleDateString()}</span>
              {document.uploadedBy && <span>by {document.uploadedBy.name}</span>}
            </div>
          </div>
        </div>

        {/* Links Card */}
        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <DocumentLinksEditor
              documentId={document.id}
              links={document.links}
              onLinksChange={(updatedLinks) => {
                onUpdate({ ...document, links: updatedLinks });
              }}
            />
          </div>
        </div>

        {/* Versions Card */}
        {document.versions.length > 1 && (
          <div className="px-4 pb-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Version History
              </h3>
              <div className="space-y-2">
                {document.versions.map((v) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      v.id === document.id ? "bg-indigo-50" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">v{v.version}</span>
                      {v.status === "executed" && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          Executed
                        </span>
                      )}
                      {v.id === document.id && (
                        <span className="text-xs text-indigo-600">(current)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {new Date(v.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkItem({
  link,
  onNavigate,
  onRemove,
}: {
  link: DocumentLink;
  onNavigate: () => void;
  onRemove: () => void;
}) {
  const icon = (() => {
    switch (link.linkableType) {
      case "Deal":
        return <Briefcase className="h-4 w-4 text-purple-600" />;
      case "Organization":
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case "Person":
        return <User className="h-4 w-4 text-emerald-600" />;
      case "InternalEntity":
        return <Shield className="h-4 w-4 text-amber-600" />;
      default:
        return <Link2 className="h-4 w-4 text-slate-400" />;
    }
  })();

  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={onNavigate}
        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{link.label}</p>
          <p className="text-xs text-slate-500">{link.linkableType}</p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
        title="Remove link"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
