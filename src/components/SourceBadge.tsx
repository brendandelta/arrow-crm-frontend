import { resolveSource, getCategoryConfig } from "@/lib/sources";

interface SourceBadgeProps {
  source: string | null;
  className?: string;
}

export function SourceBadge({ source, className = "" }: SourceBadgeProps) {
  if (!source) return null;

  const resolved = resolveSource(source);
  if (!resolved) return null;

  const config = getCategoryConfig(resolved.category);

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-medium ${config.badgeStyle} ${className}`}
    >
      <span
        className={`h-1 w-1 rounded-full ${config.color}`}
      />
      {resolved.name}
    </span>
  );
}
