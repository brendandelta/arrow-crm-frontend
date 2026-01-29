import { Badge } from "@/components/ui/badge";

// Warmth configuration used across the app
export const WARMTH_CONFIG = [
  { label: "Cold", value: 0, color: "bg-slate-500", badgeStyle: "bg-slate-100 text-slate-600 hover:bg-slate-100" },
  { label: "Warm", value: 1, color: "bg-yellow-500", badgeStyle: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  { label: "Hot", value: 2, color: "bg-orange-500", badgeStyle: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  { label: "Champion", value: 3, color: "bg-green-500", badgeStyle: "bg-green-100 text-green-800 hover:bg-green-100" },
];

interface WarmthBadgeProps {
  warmth: number;
}

export function WarmthBadge({ warmth }: WarmthBadgeProps) {
  const config = WARMTH_CONFIG[warmth] || WARMTH_CONFIG[0];
  return (
    <Badge className={config.badgeStyle}>
      {config.label}
    </Badge>
  );
}
