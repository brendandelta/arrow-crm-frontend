import { getPriorityConfig } from "./priority";

interface PriorityBadgeProps {
  priority: number;
  compact?: boolean;
}

export function PriorityBadge({ priority, compact }: PriorityBadgeProps) {
  const config = getPriorityConfig(priority);

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-medium whitespace-nowrap ${config.color} ${
        compact
          ? "text-[10px] px-1.5 py-[1px]"
          : "text-[12px] px-2 py-[2px]"
      }`}
    >
      <span className={`rounded-full shrink-0 ${config.dot} ${compact ? "h-1.5 w-1.5" : "h-2 w-2"}`} />
      {config.label}
    </span>
  );
}
