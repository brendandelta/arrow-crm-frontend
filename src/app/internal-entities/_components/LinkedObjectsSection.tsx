"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Briefcase,
  Layers,
  Target,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
  ExternalLink,
  Link2,
} from "lucide-react";
import {
  fetchEntityLinks,
  deleteEntityLink,
  getRelationshipTypeColor,
  getEconomicRoleColor,
  type EntityLink,
  type LinkedObjectType,
} from "@/lib/internal-entities-api";

interface LinkedObjectsSectionProps {
  entityId: number;
  onRefresh?: () => void;
}

const OBJECT_TYPE_CONFIG: Record<
  LinkedObjectType,
  { icon: typeof Briefcase; label: string; color: string; href: (id: number) => string }
> = {
  Deal: {
    icon: Briefcase,
    label: "Deals",
    color: "text-blue-600",
    href: (id) => `/deals/${id}`,
  },
  Block: {
    icon: Layers,
    label: "Blocks",
    color: "text-purple-600",
    href: (id) => `/deals?blockId=${id}`,
  },
  Interest: {
    icon: Target,
    label: "Interests",
    color: "text-green-600",
    href: (id) => `/deals?interestId=${id}`,
  },
  Allocation: {
    icon: Layers,
    label: "Allocations",
    color: "text-indigo-600",
    href: (id) => `/allocations/${id}`,
  },
  Task: {
    icon: CheckSquare,
    label: "Tasks",
    color: "text-amber-600",
    href: (id) => `/tasks?id=${id}`,
  },
  Note: {
    icon: FileText,
    label: "Notes",
    color: "text-slate-600",
    href: () => "#",
  },
};

export function LinkedObjectsSection({ entityId, onRefresh }: LinkedObjectsSectionProps) {
  const [links, setLinks] = useState<EntityLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadLinks = async () => {
    try {
      const data = await fetchEntityLinks(entityId);
      setLinks(data);
    } catch (error) {
      console.error("Failed to load linked objects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [entityId]);

  const handleDelete = async (linkId: number) => {
    if (!confirm("Remove this link?")) return;

    setDeletingId(linkId);
    try {
      await deleteEntityLink(linkId);
      setLinks(links.filter((l) => l.id !== linkId));
      toast.success("Link removed");
      onRefresh?.();
    } catch (error) {
      toast.error("Failed to remove link");
    } finally {
      setDeletingId(null);
    }
  };

  // Group links by object type
  const groupedLinks = links.reduce(
    (acc, link) => {
      const key = link.linkedObjectType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(link);
      return acc;
    },
    {} as Record<LinkedObjectType, EntityLink[]>
  );

  const objectTypes = Object.keys(groupedLinks) as LinkedObjectType[];

  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-3 text-sm font-medium text-foreground text-left"
        >
          <Link2 className="h-4 w-4 text-muted-foreground" />
          Linked Objects
          {links.length > 0 && (
            <span className="text-xs text-muted-foreground">({links.length})</span>
          )}
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

      {expanded && (
        <div className="px-6 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-6">
              <div className="h-10 w-10 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
                <Link2 className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">No linked objects</p>
              <p className="text-xs text-muted-foreground mt-1">
                Link this entity to deals, blocks, or interests to track relationships
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {objectTypes.map((objectType) => {
                const config = OBJECT_TYPE_CONFIG[objectType];
                const typeLinks = groupedLinks[objectType];
                const Icon = config.icon;

                return (
                  <div key={objectType}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {config.label} ({typeLinks.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {typeLinks.map((link) => (
                        <div
                          key={link.id}
                          className="group flex items-center justify-between p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`h-8 w-8 rounded-lg bg-card flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={config.href(link.linkedObjectId)}
                                className="font-medium text-sm text-foreground hover:text-indigo-600 transition-colors truncate block"
                              >
                                {link.linkedObjectLabel ||
                                  `${objectType} #${link.linkedObjectId}`}
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
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={config.href(link.linkedObjectId)}
                              className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="View"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
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
                );
              })}
            </div>
          )}

          {/* Notes display */}
          {links.some((l) => l.notes) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Link Notes
              </div>
              {links
                .filter((l) => l.notes)
                .map((link) => (
                  <div key={`note-${link.id}`} className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">
                      {link.linkedObjectLabel || `${link.linkedObjectType} #${link.linkedObjectId}`}:
                    </span>{" "}
                    {link.notes}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
