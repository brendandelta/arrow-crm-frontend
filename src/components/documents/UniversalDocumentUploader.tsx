"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Upload,
  X,
  FileText,
  Plus,
  Trash2,
  Briefcase,
  Package,
  TrendingUp,
  Building2,
  User,
  Shield,
  Search,
  Loader2,
} from "lucide-react";
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
  searchEntities,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  DOCUMENT_SENSITIVITIES,
  DOCUMENT_RELATIONSHIPS,
  LINKABLE_TYPES,
  formatFileSize,
} from "@/lib/documents-api";
import type { DocumentDetail, SearchResult } from "@/lib/documents-api";
import { toastApiError } from "@/lib/api-error";

// ============ Types ============

interface PendingLink {
  id: string;
  linkableType: string;
  linkableId: number;
  linkableLabel: string;
  relationship: string;
}

interface DefaultLink {
  linkableType: string;
  linkableId: number;
  linkableLabel: string;
  relationship?: string;
}

interface UniversalDocumentUploaderProps {
  // Parent context - used for primary parent_type/parent_id
  parentType?: string;
  parentId?: number;
  // Default links to pre-populate (including parent if desired)
  defaultLinks?: DefaultLink[];
  // Deal context for filtering blocks/interests
  dealId?: number;
  // Whether to require at least one link
  requireLink?: boolean;
  // Callbacks
  onSuccess?: (doc: DocumentDetail) => void;
  onCancel?: () => void;
  // UI customization
  compact?: boolean;
  showCancel?: boolean;
  uploadButtonText?: string;
  className?: string;
}

// ============ Icon Map ============

const ICON_MAP: Record<string, React.ElementType> = {
  Deal: Briefcase,
  Block: Package,
  Interest: TrendingUp,
  Organization: Building2,
  Person: User,
  InternalEntity: Shield,
};

// ============ Entity Selector Component ============

interface EntitySelectorProps {
  linkableType: string;
  value: number;
  label: string;
  dealId?: number;
  onChange: (id: number, label: string) => void;
}

function EntitySelector({ linkableType, value, label, dealId, onChange }: EntitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const search = async () => {
      setLoading(true);
      try {
        const res = await searchEntities(linkableType, query, { dealId });
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 200);
    return () => clearTimeout(timer);
  }, [query, linkableType, dealId, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const Icon = ICON_MAP[linkableType] || Briefcase;

  if (!open && value > 0) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2 py-1 text-sm text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors truncate max-w-[200px]"
      >
        <Icon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1 border border-slate-200 rounded-md px-2 py-1 bg-white">
        <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={`Search ${linkableType}...`}
          className="flex-1 text-sm outline-none bg-transparent min-w-[120px]"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {results.length === 0 && !loading && (
            <div className="p-3 text-sm text-slate-500 text-center">
              {query ? "No results found" : `Type to search ${linkableType}s`}
            </div>
          )}
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => {
                onChange(result.id, result.label);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 last:border-0"
            >
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {result.label}
                </div>
                {result.subtitle && (
                  <div className="text-xs text-slate-500 truncate">{result.subtitle}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Main Component ============

export function UniversalDocumentUploader({
  parentType,
  parentId,
  defaultLinks = [],
  dealId,
  requireLink = false,
  onSuccess,
  onCancel,
  compact = false,
  showCancel = true,
  uploadButtonText = "Upload Document",
  className = "",
}: UniversalDocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [sensitivity, setSensitivity] = useState("internal");
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [addLinkType, setAddLinkType] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with default links
  useEffect(() => {
    if (defaultLinks.length > 0 && pendingLinks.length === 0) {
      setPendingLinks(
        defaultLinks.map((link, i) => ({
          id: `default-${i}`,
          linkableType: link.linkableType,
          linkableId: link.linkableId,
          linkableLabel: link.linkableLabel,
          relationship: link.relationship || "general",
        }))
      );
    }
  }, [defaultLinks, pendingLinks.length]);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setStatus("draft");
    setSensitivity("internal");
    setPendingLinks([]);
    setAddLinkType(null);
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
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
    },
    [title]
  );

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
    const newLink: PendingLink = {
      id: `pending-${Date.now()}`,
      linkableType: type,
      linkableId: 0,
      linkableLabel: "",
      relationship: "general",
    };
    setPendingLinks([...pendingLinks, newLink]);
    setAddLinkType(null);
  };

  const handleUpdateLink = (
    linkId: string,
    updates: Partial<Pick<PendingLink, "linkableId" | "linkableLabel" | "relationship">>
  ) => {
    setPendingLinks(
      pendingLinks.map((l) => (l.id === linkId ? { ...l, ...updates } : l))
    );
  };

  const handleRemoveLink = (linkId: string) => {
    setPendingLinks(pendingLinks.filter((l) => l.id !== linkId));
  };

  const canSubmit = () => {
    if (!file) return false;
    if (requireLink) {
      const validLinks = pendingLinks.filter((l) => l.linkableId > 0);
      if (validLinks.length === 0) return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const validLinks = pendingLinks.filter((l) => l.linkableId > 0);

    if (requireLink && validLinks.length === 0) {
      toast.error("Please link this document to at least one entity");
      return;
    }

    setUploading(true);
    try {
      const links = validLinks.map((l) => ({
        linkableType: l.linkableType,
        linkableId: l.linkableId,
        relationship: l.relationship,
      }));

      // Determine parent - use provided parent or first link
      let finalParentType = parentType;
      let finalParentId = parentId;
      if (!finalParentType && links.length > 0) {
        finalParentType = links[0].linkableType;
        finalParentId = links[0].linkableId;
      }

      const doc = await uploadDocument(file, {
        title: title || file.name,
        description,
        category: category || undefined,
        status,
        sensitivity,
        links: links.length > 0 ? links : undefined,
      });

      toast.success("Document uploaded successfully");
      onSuccess?.(doc);
      resetForm();
    } catch (err) {
      toastApiError(err, { entity: "document", action: "create" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
          compact ? "p-4" : "p-8"
        } ${
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
            <FileText className={`text-green-600 ${compact ? "h-8 w-8" : "h-10 w-10"}`} />
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
            <Upload className={`text-slate-400 mx-auto mb-2 ${compact ? "h-8 w-8" : "h-10 w-10 mb-3"}`} />
            <p className="text-sm text-slate-600">
              <span className="font-medium text-indigo-600">Click to upload</span> or drag
              and drop
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

      {/* Description - hide in compact mode */}
      {!compact && (
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
      )}

      {/* Metadata Grid */}
      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-3"}`}>
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

        {!compact && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sensitivity
            </label>
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
        )}
      </div>

      {/* Links Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">
            Link to{" "}
            {requireLink ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="text-slate-400 font-normal">(optional)</span>
            )}
          </label>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddLinkType(addLinkType ? null : "menu")}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Link
            </Button>

            {addLinkType === "menu" && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                {LINKABLE_TYPES.map((type) => {
                  const Icon = ICON_MAP[type.value] || Briefcase;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleAddLink(type.value)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {pendingLinks.length > 0 && (
          <div className="space-y-2 border border-slate-200 rounded-lg p-2">
            {pendingLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 bg-slate-50 rounded px-2 py-1.5"
              >
                <span className="text-xs text-slate-500 shrink-0">{link.linkableType}:</span>
                <div className="flex-1 min-w-0">
                  <EntitySelector
                    linkableType={link.linkableType}
                    value={link.linkableId}
                    label={link.linkableLabel}
                    dealId={dealId}
                    onChange={(id, label) =>
                      handleUpdateLink(link.id, { linkableId: id, linkableLabel: label })
                    }
                  />
                </div>
                <Select
                  value={link.relationship}
                  onValueChange={(value) =>
                    handleUpdateLink(link.id, { relationship: value })
                  }
                >
                  <SelectTrigger className="h-7 w-24 text-xs">
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

        {requireLink && pendingLinks.filter((l) => l.linkableId > 0).length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            At least one valid link is required
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {showCancel && onCancel && (
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onCancel();
            }}
          >
            Cancel
          </Button>
        )}
        <Button onClick={handleUpload} disabled={!canSubmit() || uploading}>
          {uploading ? "Uploading..." : uploadButtonText}
        </Button>
      </div>
    </div>
  );
}
