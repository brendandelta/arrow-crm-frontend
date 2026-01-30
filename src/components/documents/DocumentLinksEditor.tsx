"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  Briefcase,
  Package,
  TrendingUp,
  Building2,
  User,
  Shield,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDocumentLink,
  deleteDocumentLink,
  searchEntities,
  DOCUMENT_RELATIONSHIPS,
  LINKABLE_TYPES,
} from "@/lib/documents-api";
import type { DocumentLink, SearchResult } from "@/lib/documents-api";

// ============ Types ============

interface DocumentLinksEditorProps {
  documentId: number;
  links: DocumentLink[];
  dealId?: number;
  onLinksChange?: (links: DocumentLink[]) => void;
  compact?: boolean;
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

// ============ Link Path Map ============

const LINK_PATH_MAP: Record<string, (id: number) => string> = {
  Deal: (id) => `/deals/${id}`,
  Block: (id) => `/blocks/${id}`,
  Interest: (id) => `/interests/${id}`,
  Organization: (id) => `/organizations/${id}`,
  Person: (id) => `/people/${id}`,
  InternalEntity: (id) => `/entities/${id}`,
};

// ============ Entity Selector ============

interface AddLinkSelectorProps {
  dealId?: number;
  onAdd: (type: string, id: number, label: string, relationship: string) => void;
  onCancel: () => void;
}

function AddLinkSelector({ dealId, onAdd, onCancel }: AddLinkSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [relationship, setRelationship] = useState("general");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedType && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedType]);

  useEffect(() => {
    if (!selectedType) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const res = await searchEntities(selectedType, query, { dealId });
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 200);
    return () => clearTimeout(timer);
  }, [query, selectedType, dealId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  if (!selectedType) {
    return (
      <div
        ref={containerRef}
        className="border border-slate-200 rounded-lg p-2 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600">Select type:</span>
          <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {LINKABLE_TYPES.map((type) => {
            const Icon = ICON_MAP[type.value] || Briefcase;
            return (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className="flex flex-col items-center gap-1 p-2 rounded hover:bg-slate-50 text-xs text-slate-600"
              >
                <Icon className="h-4 w-4" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const Icon = ICON_MAP[selectedType] || Briefcase;

  return (
    <div
      ref={containerRef}
      className="border border-slate-200 rounded-lg p-2 bg-white shadow-sm space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            &larr; Back
          </button>
          <span className="text-xs font-medium text-slate-600">
            Add {selectedType}
          </span>
        </div>
        <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50">
        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${selectedType}s...`}
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      <div className="max-h-[150px] overflow-y-auto">
        {results.length === 0 && !loading && (
          <div className="p-2 text-xs text-slate-500 text-center">
            {query ? "No results" : "Type to search"}
          </div>
        )}
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => onAdd(selectedType, result.id, result.label, relationship)}
            className="w-full text-left px-2 py-1.5 hover:bg-slate-50 flex items-center gap-2 rounded text-sm"
          >
            <Icon className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-800 truncate">{result.label}</div>
              {result.subtitle && (
                <div className="text-xs text-slate-500 truncate">{result.subtitle}</div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <span className="text-xs text-slate-500">Relationship:</span>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger className="h-7 flex-1 text-xs">
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
      </div>
    </div>
  );
}

// ============ Main Component ============

export function DocumentLinksEditor({
  documentId,
  links,
  dealId,
  onLinksChange,
  compact = false,
  className = "",
}: DocumentLinksEditorProps) {
  const [currentLinks, setCurrentLinks] = useState<DocumentLink[]>(links);
  const [showAddLink, setShowAddLink] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    setCurrentLinks(links);
  }, [links]);

  const handleAddLink = async (
    type: string,
    id: number,
    label: string,
    relationship: string
  ) => {
    // Check for duplicates
    const existing = currentLinks.find(
      (l) => l.linkableType === type && l.linkableId === id
    );
    if (existing) {
      toast.error("This entity is already linked");
      return;
    }

    try {
      const newLink = await createDocumentLink(documentId, type, id, relationship);
      const updatedLinks = [...currentLinks, { ...newLink, label, linkableLabel: label }];
      setCurrentLinks(updatedLinks);
      onLinksChange?.(updatedLinks);
      setShowAddLink(false);
      toast.success("Link added");
    } catch (error) {
      toast.error("Failed to add link");
      console.error(error);
    }
  };

  const handleRemoveLink = async (linkId: number) => {
    setRemovingId(linkId);
    try {
      await deleteDocumentLink(linkId);
      const updatedLinks = currentLinks.filter((l) => l.id !== linkId);
      setCurrentLinks(updatedLinks);
      onLinksChange?.(updatedLinks);
      toast.success("Link removed");
    } catch (error) {
      toast.error("Failed to remove link");
      console.error(error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700">
          Linked To
          {currentLinks.length > 0 && (
            <span className="ml-1 text-slate-400">({currentLinks.length})</span>
          )}
        </h4>
        {!showAddLink && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddLink(true)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Current Links */}
      {currentLinks.length > 0 ? (
        <div className="space-y-1">
          {currentLinks.map((link) => {
            const Icon = ICON_MAP[link.linkableType] || Briefcase;
            const path = LINK_PATH_MAP[link.linkableType]?.(link.linkableId);
            const label = link.linkableLabel || link.label || `${link.linkableType} #${link.linkableId}`;

            return (
              <div
                key={link.id}
                className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded group"
              >
                <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  {path ? (
                    <a
                      href={path}
                      className="text-sm text-slate-700 hover:text-indigo-600 hover:underline truncate block"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-700 truncate block">
                      {label}
                    </span>
                  )}
                  {!compact && link.relationshipLabel && link.relationshipLabel !== "General" && (
                    <span className="text-xs text-slate-500">{link.relationshipLabel}</span>
                  )}
                </div>
                {path && (
                  <a
                    href={path}
                    className="p-1 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Open"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleRemoveLink(link.id)}
                  disabled={removingId === link.id}
                  className="p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Remove link"
                >
                  {removingId === link.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        !showAddLink && (
          <p className="text-xs text-slate-500 py-2">No links yet</p>
        )
      )}

      {/* Add Link Selector */}
      {showAddLink && (
        <AddLinkSelector
          dealId={dealId}
          onAdd={handleAddLink}
          onCancel={() => setShowAddLink(false)}
        />
      )}
    </div>
  );
}
