"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Briefcase, Building2, User, Shield, Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DOCUMENT_RELATIONSHIPS,
  LINKABLE_TYPES,
} from "@/lib/documents-api";
import type { DocumentLink } from "@/lib/documents-api";

interface EntityOption {
  id: number;
  name: string;
  subtitle?: string;
}

interface LinkDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: number;
  onSuccess: (link: DocumentLink) => void;
}

export function LinkDocumentDialog({
  open,
  onOpenChange,
  documentId,
  onSuccess,
}: LinkDocumentDialogProps) {
  const [linkableType, setLinkableType] = useState<string>("Deal");
  const [selectedEntity, setSelectedEntity] = useState<EntityOption | null>(null);
  const [relationship, setRelationship] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch entities based on type and search query
  useEffect(() => {
    if (!open) return;

    const fetchEntities = async () => {
      setLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
        let endpoint = "";
        let mapFn: (item: Record<string, unknown>) => EntityOption;

        switch (linkableType) {
          case "Deal":
            endpoint = `${apiBase}/api/deals?q=${encodeURIComponent(searchQuery)}`;
            mapFn = (d) => ({
              id: d.id as number,
              name: d.name as string,
              subtitle: d.status as string | undefined,
            });
            break;
          case "Organization":
            endpoint = `${apiBase}/api/organizations?q=${encodeURIComponent(searchQuery)}`;
            mapFn = (o) => ({
              id: o.id as number,
              name: o.name as string,
              subtitle: o.kind as string | undefined,
            });
            break;
          case "Person":
            endpoint = `${apiBase}/api/people?q=${encodeURIComponent(searchQuery)}`;
            mapFn = (p) => ({
              id: p.id as number,
              name: `${p.firstName} ${p.lastName}`,
              subtitle: p.org as string | undefined,
            });
            break;
          case "InternalEntity":
            endpoint = `${apiBase}/api/internal_entities?q=${encodeURIComponent(searchQuery)}`;
            mapFn = (e) => ({
              id: e.id as number,
              name: e.legalName as string || e.name as string,
              subtitle: e.entityType as string | undefined,
            });
            break;
          default:
            return;
        }

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Failed to fetch");

        let data = await res.json();

        // Handle different response shapes
        if (linkableType === "Deal" && data.deals) {
          data = data.deals;
        } else if (Array.isArray(data)) {
          // Already an array
        } else if (data.documents) {
          data = data.documents;
        } else if (data.internalEntities) {
          data = data.internalEntities;
        }

        const results = Array.isArray(data)
          ? data.slice(0, 10).map(mapFn)
          : [];
        setSearchResults(results);
      } catch (error) {
        console.error("Failed to fetch entities:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchEntities, 300);
    return () => clearTimeout(debounce);
  }, [open, linkableType, searchQuery]);

  // Reset when type changes
  useEffect(() => {
    setSelectedEntity(null);
    setSearchQuery("");
    setSearchResults([]);
  }, [linkableType]);

  const handleSave = async () => {
    if (!selectedEntity) {
      toast.error("Please select an entity to link");
      return;
    }

    setSaving(true);
    try {
      const link = await createDocumentLink(
        documentId,
        linkableType,
        selectedEntity.id,
        relationship
      );
      toast.success("Link created");
      onSuccess({
        ...link,
        label: selectedEntity.name,
        linkableLabel: selectedEntity.name,
      } as DocumentLink);
      onOpenChange(false);
      setSelectedEntity(null);
      setSearchQuery("");
    } catch (error) {
      toast.error("Failed to create link");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Deal":
        return <Briefcase className="h-4 w-4" />;
      case "Organization":
        return <Building2 className="h-4 w-4" />;
      case "Person":
        return <User className="h-4 w-4" />;
      case "InternalEntity":
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entity Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Link to</label>
            <div className="grid grid-cols-4 gap-2">
              {LINKABLE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setLinkableType(type.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                    linkableType === type.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  {getIcon(type.value)}
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Entity Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select {linkableType.replace(/([A-Z])/g, " $1").trim()}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${linkableType.toLowerCase()}s...`}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              />
            </div>

            {/* Results List */}
            <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  {searchQuery ? "No results found" : `Search for a ${linkableType.toLowerCase()}`}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => setSelectedEntity(entity)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        selectedEntity?.id === entity.id
                          ? "bg-indigo-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-lg ${
                          selectedEntity?.id === entity.id
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {getIcon(linkableType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {entity.name}
                        </p>
                        {entity.subtitle && (
                          <p className="text-xs text-slate-500 truncate">{entity.subtitle}</p>
                        )}
                      </div>
                      {selectedEntity?.id === entity.id && (
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Relationship</label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger>
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!selectedEntity || saving}>
              {saving ? "Linking..." : "Link Document"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
