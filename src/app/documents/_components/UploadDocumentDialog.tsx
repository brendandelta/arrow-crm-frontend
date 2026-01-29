"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, FileText, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadDocument,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  DOCUMENT_SENSITIVITIES,
  DOCUMENT_RELATIONSHIPS,
  LINKABLE_TYPES,
  formatFileSize,
} from "@/lib/documents-api";
import type { DocumentDetail } from "@/lib/documents-api";

interface PendingLink {
  id: string;
  linkableType: string;
  linkableId: number;
  linkableLabel: string;
  relationship: string;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (doc: DocumentDetail) => void;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [sensitivity, setSensitivity] = useState("internal");
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setStatus("draft");
    setSensitivity("internal");
    setPendingLinks([]);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleAddLink = (type: string) => {
    // For now, add a placeholder. In a real implementation, this would open a selector dialog
    const newLink: PendingLink = {
      id: `pending-${Date.now()}`,
      linkableType: type,
      linkableId: 0,
      linkableLabel: `Select ${type}...`,
      relationship: "general",
    };
    setPendingLinks([...pendingLinks, newLink]);
  };

  const handleRemoveLink = (linkId: string) => {
    setPendingLinks(pendingLinks.filter((l) => l.id !== linkId));
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const links = pendingLinks
        .filter((l) => l.linkableId > 0)
        .map((l) => ({
          linkableType: l.linkableType,
          linkableId: l.linkableId,
          relationship: l.relationship,
        }));

      const doc = await uploadDocument(file, {
        title: title || file.name,
        description,
        category: category || undefined,
        status,
        sensitivity,
        links: links.length > 0 ? links : undefined,
      });

      toast.success("Document uploaded successfully");
      onSuccess(doc);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
              dragActive
                ? "border-indigo-400 bg-indigo-50"
                : file
                ? "border-green-300 bg-green-50"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />

            {file ? (
              <div className="flex items-center gap-3">
                <FileText className="h-10 w-10 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-indigo-600">Click to upload</span> or drag and
                  drop
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOC, XLS, images up to 50MB</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Sensitivity</label>
              <Select value={sensitivity} onValueChange={setSensitivity}>
                <SelectTrigger className="h-9">
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
          </div>

          {/* Links Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Link to <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-1">
                {LINKABLE_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddLink(type.value)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {pendingLinks.length > 0 && (
              <div className="space-y-2 border border-slate-200 rounded-lg p-2">
                {pendingLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 bg-slate-50 rounded px-2 py-1.5"
                  >
                    <span className="text-xs text-slate-500">{link.linkableType}:</span>
                    <span className="flex-1 text-sm text-slate-700 truncate">
                      {link.linkableLabel}
                    </span>
                    <Select
                      value={link.relationship}
                      onValueChange={(value) =>
                        setPendingLinks(
                          pendingLinks.map((l) =>
                            l.id === link.id ? { ...l, relationship: value } : l
                          )
                        )
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_RELATIONSHIPS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => handleRemoveLink(link.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
