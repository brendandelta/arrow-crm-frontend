"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Landmark,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  fetchLinksForObject,
  deleteEntityLink,
  getRelationshipTypeColor,
  getEconomicRoleColor,
  getRelationshipTypeLabel,
  getEconomicRoleLabel,
  type LinkedObjectType,
  type EntityLink,
} from "@/lib/internal-entities-api";
import { LinkEntityDialog } from "./LinkEntityDialog";

interface EntityLinksSectionProps {
  linkedObjectType: LinkedObjectType;
  linkedObjectId: number;
  linkedObjectLabel?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  compact?: boolean;
}

export function EntityLinksSection({
  linkedObjectType,
  linkedObjectId,
  linkedObjectLabel,
  collapsible = false,
  defaultExpanded = true,
  compact = false,
}: EntityLinksSectionProps) {
  const [links, setLinks] = useState<EntityLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<EntityLink | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadLinks = async () => {
    try {
      const data = await fetchLinksForObject(linkedObjectType, linkedObjectId);
      setLinks(data);
    } catch (error) {
      console.error("Failed to load entity links:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [linkedObjectType, linkedObjectId]);

  const handleDelete = async (linkId: number) => {
    if (!confirm("Remove this entity link?")) return;

    setDeletingId(linkId);
    try {
      await deleteEntityLink(linkId);
      setLinks(links.filter((l) => l.id !== linkId));
      toast.success("Link removed");
    } catch (error) {
      toast.error("Failed to remove link");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDialogSuccess = () => {
    loadLinks();
    setEditingLink(null);
  };

  // Group links by relationship type
  const groupedLinks = links.reduce(
    (acc, link) => {
      const key = link.relationshipType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(link);
      return acc;
    },
    {} as Record<string, EntityLink[]>
  );

  const sectionContent = (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <div className={`text-center ${compact ? "py-4" : "py-8"}`}>
          <div
            className={`mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center ${compact ? "h-8 w-8" : "h-10 w-10"}`}
          >
            <Landmark
              className={`text-muted-foreground/60 ${compact ? "h-4 w-4" : "h-5 w-5"}`}
            />
          </div>
          <p className="text-sm text-muted-foreground">No linked entities</p>
          <button
            onClick={() => setShowDialog(true)}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Link an entity
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedLinks).map(([relationshipType, typeLinks]) => (
            <div key={relationshipType}>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {getRelationshipTypeLabel(relationshipType)}
                {typeLinks.length > 1 && ` (${typeLinks.length})`}
              </div>
              <div className="space-y-2">
                {typeLinks.map((link) => (
                  <div
                    key={link.id}
                    className="group flex items-center justify-between p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Landmark className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/internal-entities?id=${link.internalEntityId}`}
                          className="font-medium text-sm text-foreground hover:text-indigo-600 transition-colors truncate block"
                        >
                          {link.internalEntity?.displayName ||
                            `Entity #${link.internalEntityId}`}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getRelationshipTypeColor(link.relationshipType)}`}
                          >
                            {link.relationshipTypeLabel}
                          </span>
                          {link.economicRole && (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getEconomicRoleColor(link.economicRole)}`}
                            >
                              {link.economicRoleLabel}
                            </span>
                          )}
                          {link.ownershipPct !== null && (
                            <span className="text-[10px] text-muted-foreground">
                              {link.ownershipPct}%
                            </span>
                          )}
                          {link.priority === "secondary" && (
                            <span className="text-[10px] text-muted-foreground italic">
                              secondary
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingLink(link);
                          setShowDialog(true);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit link"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deletingId === link.id}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Remove link"
                      >
                        {deletingId === link.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (collapsible) {
    return (
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 flex items-center gap-2 text-sm font-medium text-foreground text-left"
          >
            <Landmark className="h-4 w-4 text-muted-foreground" />
            Linked Entities
            {links.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({links.length})
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDialog(true);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
        {expanded && <div className="px-4 pb-4">{sectionContent}</div>}

        <LinkEntityDialog
          open={showDialog}
          onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) setEditingLink(null);
          }}
          linkedObjectType={linkedObjectType}
          linkedObjectId={linkedObjectId}
          linkedObjectLabel={linkedObjectLabel}
          existingLink={editingLink}
          onSuccess={handleDialogSuccess}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          Linked Entities
          {links.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({links.length})
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
        >
          <Plus className="h-3 w-3" />
          Link Entity
        </button>
      </div>

      {sectionContent}

      <LinkEntityDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditingLink(null);
        }}
        linkedObjectType={linkedObjectType}
        linkedObjectId={linkedObjectId}
        linkedObjectLabel={linkedObjectLabel}
        existingLink={editingLink}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
