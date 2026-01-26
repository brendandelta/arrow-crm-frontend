export interface PriorityConfig {
  value: number;
  label: string;
  shortLabel: string;
  color: string;
  dot: string;
  row: string;
}

export const DEAL_PRIORITIES: PriorityConfig[] = [
  {
    value: 0,
    label: "Now",
    shortLabel: "Now",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    row: "bg-red-50/30",
  },
  {
    value: 1,
    label: "High",
    shortLabel: "High",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    row: "bg-orange-50/20",
  },
  {
    value: 2,
    label: "Med",
    shortLabel: "Med",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-amber-500",
    row: "bg-yellow-50/20",
  },
  {
    value: 3,
    label: "Low",
    shortLabel: "Low",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    row: "",
  },
];

export function getPriorityConfig(priority: number): PriorityConfig {
  return DEAL_PRIORITIES.find((p) => p.value === priority) || DEAL_PRIORITIES[2];
}

export function getPriorityLabel(priority: number): string {
  return getPriorityConfig(priority).label;
}
