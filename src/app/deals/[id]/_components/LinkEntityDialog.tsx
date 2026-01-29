"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Landmark, Search, X, Percent } from "lucide-react";
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
  createEntityLink,
  updateEntityLink,
  RELATIONSHIP_TYPES,
  ECONOMIC_ROLES,
  type LinkedObjectType,
  type RelationshipType,
  type EconomicRole,
  type LinkPriority,
  type EntityLink,
} from "@/lib/internal-entities-api";

interface InternalEntitySearchResult {
  id: number;
  displayName: string;
  entityType: string;
  entityTypeLabel: string;
  status: string;
}

interface LinkEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkedObjectType: LinkedObjectType;
  linkedObjectId: number;
  linkedObjectLabel?: string;
  existingLink?: EntityLink | null;
  onSuccess: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export function LinkEntityDialog({
  open,
  onOpenChange,
  linkedObjectType,
  linkedObjectId,
  linkedObjectLabel,
  existingLink,
  onSuccess,
}: LinkEntityDialogProps) {
  const isEditing = !!existingLink;
  const [searchQuery, setSearchQuery] = useState("");
  const [entities, setEntities] = useState<InternalEntitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<InternalEntitySearchResult | null>(
    existingLink?.internalEntity
      ? {
          id: existingLink.internalEntity.id,
          displayName: existingLink.internalEntity.displayName,
          entityType: existingLink.internalEntity.entityType,
          entityTypeLabel: existingLink.internalEntity.entityType,
          status: "active",
        }
      : null
  );
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    existingLink?.relationshipType || "holder"
  );
  const [economicRole, setEconomicRole] = useState<EconomicRole>(
    existingLink?.economicRole || null
  );
  const [ownershipPct, setOwnershipPct] = useState(
    existingLink?.ownershipPct?.toString() || ""
  );
  const [priority, setPriority] = useState<LinkPriority>(
    existingLink?.priority || "primary"
  );
  const [notes, setNotes] = useState(existingLink?.notes || "");
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens/closes or existing link changes
  useEffect(() => {
    if (open) {
      if (existingLink) {
        setSelectedEntity(
          existingLink.internalEntity
            ? {
                id: existingLink.internalEntity.id,
                displayName: existingLink.internalEntity.displayName,
                entityType: existingLink.internalEntity.entityType,
                entityTypeLabel: existingLink.internalEntity.entityType,
                status: "active",
              }
            : null
        );
        setRelationshipType(existingLink.relationshipType);
        setEconomicRole(existingLink.economicRole);
        setOwnershipPct(existingLink.ownershipPct?.toString() || "");
        setPriority(existingLink.priority);
        setNotes(existingLink.notes || "");
      } else {
        resetForm();
      }
    }
  }, [open, existingLink]);

  // Search for entities
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setEntities([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const session = localStorage.getItem("arrow_session");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session) {
          try {
            const data = JSON.parse(session);
            if (data.backendUserId) {
              headers["X-User-Id"] = data.backendUserId.toString();
            }
          } catch {
            // Invalid session
          }
        }

        const res = await fetch(
          `${API_BASE}/api/internal_entities?q=${encodeURIComponent(searchQuery)}&per_page=10`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setEntities(data.internalEntities || []);
        }
      } catch (error) {
        console.error("Failed to search entities:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const resetForm = () => {
    setSearchQuery("");
    setEntities([]);
    setSelectedEntity(null);
    setRelationshipType("holder");
    setEconomicRole(null);
    setOwnershipPct("");
    setPriority("primary");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntity) {
      toast.error("Please select an entity");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && existingLink) {
        await updateEntityLink(existingLink.id, {
          relationshipType,
          economicRole,
          ownershipPct: ownershipPct ? parseFloat(ownershipPct) : null,
          priority,
          notes: notes || null,
        });
        toast.success("Link updated");
      } else {
        await createEntityLink({
          internalEntityId: selectedEntity.id,
          linkedObjectType,
          linkedObjectId,
          relationshipType,
          economicRole,
          ownershipPct: ownershipPct ? parseFloat(ownershipPct) : null,
          priority,
          notes: notes || null,
        });
        toast.success(
          `${selectedEntity.displayName} linked as ${RELATIONSHIP_TYPES.find((r) => r.value === relationshipType)?.label || relationshipType}`
        );
      }
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Landmark className="h-4 w-4 text-indigo-600" />
            </div>
            {isEditing ? "Edit Entity Link" : "Link Internal Entity"}
          </DialogTitle>
          {linkedObjectLabel && (
            <p className="text-sm text-muted-foreground mt-1">
              {linkedObjectType}: {linkedObjectLabel}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Entity Search */}
          {!selectedEntity ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Search for Entity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="pl-9"
                />
              </div>

              {/* Search Results */}
              {(entities.length > 0 || searching) && (
                <div className="mt-2 border border-border rounded-lg max-h-48 overflow-y-auto">
                  {searching ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : entities.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  ) : (
                    entities.map((entity) => (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => {
                          setSelectedEntity(entity);
                          setSearchQuery("");
                          setEntities([]);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left border-b border-border last:border-b-0"
                      >
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {entity.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {entity.entityTypeLabel}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Selected Entity
              </label>
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Landmark className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {selectedEntity.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedEntity.entityTypeLabel}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setSelectedEntity(null)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Relationship Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={relationshipType}
              onValueChange={(v) => setRelationshipType(v as RelationshipType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div>
                      <span>{r.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {r.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Economic Role (optional) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Economic Role
            </label>
            <Select
              value={economicRole || "none"}
              onValueChange={(v) => setEconomicRole(v === "none" ? null : (v as EconomicRole))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {ECONOMIC_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ownership % and Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ownership %
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={ownershipPct}
                  onChange={(e) => setOwnershipPct(e.target.value)}
                  placeholder="0.00"
                  className="pr-8"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Priority
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriority("primary")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    priority === "primary"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Primary
                </button>
                <button
                  type="button"
                  onClick={() => setPriority("secondary")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    priority === "secondary"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Secondary
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context about this link..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !selectedEntity}>
              {saving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isEditing ? "Updating..." : "Linking..."}
                </>
              ) : isEditing ? (
                "Update Link"
              ) : (
                "Create Link"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
