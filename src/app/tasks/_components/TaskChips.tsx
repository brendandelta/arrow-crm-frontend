"use client";

import Link from "next/link";
import {
  Building2,
  FolderKanban,
  User,
  Landmark,
  Target,
  Layers,
  HandCoins,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Deal Chip - Clickable link to deal page
// ============================================================================

interface DealChipProps {
  deal: { id: number; name: string };
  size?: "sm" | "default";
}

export function DealChip({ deal, size = "sm" }: DealChipProps) {
  return (
    <Link
      href={`/deals/${deal.id}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1 rounded-full transition-colors",
        "bg-blue-50 hover:bg-blue-100 text-blue-700",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"
      )}
    >
      <Building2 className={cn("text-blue-500", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span className="truncate max-w-[100px]">{deal.name}</span>
    </Link>
  );
}

// ============================================================================
// Association Chip - For Person, Block, Interest, Org associations
// ============================================================================

export type AssociationType = "person" | "organization" | "block" | "interest" | "deal" | "project";

const ASSOCIATION_ICONS: Record<AssociationType, React.ElementType> = {
  person: User,
  organization: Landmark,
  block: Layers,
  interest: HandCoins,
  deal: Building2,
  project: FolderKanban,
};

const ASSOCIATION_COLORS: Record<AssociationType, { bg: string; text: string; icon: string }> = {
  person: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500" },
  organization: { bg: "bg-slate-100", text: "text-slate-600", icon: "text-slate-400" },
  block: { bg: "bg-violet-50", text: "text-violet-700", icon: "text-violet-500" },
  interest: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500" },
  deal: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
  project: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-500" },
};

const ASSOCIATION_LABELS: Record<AssociationType, string> = {
  person: "Outreach",
  organization: "Organization",
  block: "Block",
  interest: "Interest",
  deal: "Deal",
  project: "Project",
};

interface AssociationChipProps {
  type: AssociationType;
  label?: string;
  href?: string;
  size?: "sm" | "default";
  showTypeLabel?: boolean; // Show "Outreach: John" vs just "John"
}

export function AssociationChip({
  type,
  label,
  href,
  size = "sm",
  showTypeLabel = false,
}: AssociationChipProps) {
  const Icon = ASSOCIATION_ICONS[type];
  const colors = ASSOCIATION_COLORS[type];
  const typeLabel = ASSOCIATION_LABELS[type];

  const displayLabel = showTypeLabel && label
    ? `${typeLabel}: ${label}`
    : label || typeLabel;

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full transition-colors",
        colors.bg,
        href && "hover:opacity-80",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"
      )}
    >
      <Icon className={cn(colors.icon, size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span className={cn(colors.text, "truncate max-w-[100px]")}>{displayLabel}</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} onClick={(e) => e.stopPropagation()}>
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================================================
// Helper to determine the most specific association type from a task
// Priority: Block > Interest > DealTarget (Person/Org) > Person > Organization
// ============================================================================

interface TaskAssociation {
  type: AssociationType;
  id?: number;
  label?: string;
  href?: string;
}

type TaskableType = "DealTarget" | "Block" | "Interest" | "Deal" | "Project";

interface TaskWithAssociations {
  dealId?: number | null;
  deal?: { id: number; name: string } | null;
  projectId?: number | null;
  project?: { id: number; name: string } | null;
  personId?: number | null;
  person?: { id: number; firstName: string; lastName: string } | null;
  organizationId?: number | null;
  organization?: { id: number; name: string } | null;
  // Polymorphic taskable association
  taskableType?: TaskableType | string | null;
  taskableId?: number | null;
  // Resolved taskable object from backend
  taskable?: {
    id: number;
    type: TaskableType | string;
    label: string;
    targetType?: "Person" | "Organization";
    targetId?: number;
    targetName?: string;
  } | null;
  // Direct association object from backend
  association?: {
    type: AssociationType | string;
    id: number;
    label: string;
  } | null;
}

export function getTaskAssociation(task: TaskWithAssociations): TaskAssociation | null {
  // Priority 1: If backend provides a direct association object, use it
  if (task.association) {
    return {
      type: task.association.type as AssociationType,
      id: task.association.id,
      label: task.association.label,
      href: getAssociationHref(task.association.type as AssociationType, task.association.id),
    };
  }

  // Priority 2: If backend provides resolved taskable object
  if (task.taskable) {
    const taskable = task.taskable;

    // For DealTarget, use the underlying target (person/org)
    if (taskable.type === "DealTarget" && taskable.targetType) {
      if (taskable.targetType === "Person") {
        return {
          type: "person",
          id: taskable.targetId,
          label: taskable.targetName || taskable.label,
          href: taskable.targetId ? `/people/${taskable.targetId}` : undefined,
        };
      }
      if (taskable.targetType === "Organization") {
        return {
          type: "organization",
          id: taskable.targetId,
          label: taskable.targetName || taskable.label,
          href: taskable.targetId ? `/organizations/${taskable.targetId}` : undefined,
        };
      }
    }

    // For Block tasks
    if (taskable.type === "Block") {
      return {
        type: "block",
        id: taskable.id,
        label: taskable.label || "Block",
        href: undefined, // Blocks don't have standalone pages
      };
    }

    // For Interest tasks
    if (taskable.type === "Interest") {
      return {
        type: "interest",
        id: taskable.id,
        label: taskable.label || "Interest",
        href: undefined, // Interests don't have standalone pages
      };
    }
  }

  // Priority 3: Infer from taskableType without resolved data
  if (task.taskableType && task.taskableId) {
    switch (task.taskableType) {
      case "DealTarget":
        // We know it's outreach but don't have the person name
        return {
          type: "person",
          id: task.taskableId,
          label: undefined, // Will show "Outreach" as fallback
          href: undefined,
        };
      case "Block":
        return {
          type: "block",
          id: task.taskableId,
          label: undefined,
          href: undefined,
        };
      case "Interest":
        return {
          type: "interest",
          id: task.taskableId,
          label: undefined,
          href: undefined,
        };
    }
  }

  // Priority 4: Infer from direct person/organization fields
  if (task.person) {
    const fullName = `${task.person.firstName} ${task.person.lastName}`.trim();
    return {
      type: "person",
      id: task.person.id,
      label: fullName,
      href: `/people/${task.person.id}`,
    };
  }

  if (task.personId) {
    return {
      type: "person",
      id: task.personId,
      label: undefined,
      href: `/people/${task.personId}`,
    };
  }

  if (task.organization) {
    return {
      type: "organization",
      id: task.organization.id,
      label: task.organization.name,
      href: `/organizations/${task.organization.id}`,
    };
  }

  if (task.organizationId) {
    return {
      type: "organization",
      id: task.organizationId,
      label: undefined,
      href: `/organizations/${task.organizationId}`,
    };
  }

  // No specific association - this is a deal-level or general task
  return null;
}

function getAssociationHref(type: AssociationType, id: number): string | undefined {
  switch (type) {
    case "person":
      return `/people/${id}`;
    case "organization":
      return `/organizations/${id}`;
    case "deal":
      return `/deals/${id}`;
    case "project":
      return `/projects/${id}`;
    case "block":
    case "interest":
      // These don't have their own pages typically
      return undefined;
    default:
      return undefined;
  }
}
