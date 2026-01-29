// Organization kind badge for displaying organization types

const ORG_KIND_STYLES: Record<string, string> = {
  fund: "bg-blue-50 text-blue-700",
  company: "bg-purple-50 text-purple-700",
  spv: "bg-amber-50 text-amber-700",
  broker: "bg-muted text-muted-foreground",
  bank: "bg-emerald-50 text-emerald-700",
  service_provider: "bg-cyan-50 text-cyan-700",
  other: "bg-muted text-muted-foreground",
};

interface OrgKindBadgeProps {
  kind: string | null;
  className?: string;
}

export function OrgKindBadge({ kind, className = "" }: OrgKindBadgeProps) {
  if (!kind) return null;

  const style = ORG_KIND_STYLES[kind] || ORG_KIND_STYLES.other;

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${style} ${className}`}>
      {kind}
    </span>
  );
}
