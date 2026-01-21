import { WARMTH_CONFIG } from "@/components/WarmthBadge";

interface WarmthSelectorProps {
  warmth: number;
  onChange: (value: number) => void;
  editing: boolean;
}

export function WarmthSelector({ warmth, onChange, editing }: WarmthSelectorProps) {
  const config = WARMTH_CONFIG[warmth] || WARMTH_CONFIG[0];

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <span className="text-sm text-slate-600">{config.label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {WARMTH_CONFIG.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            warmth === item.value
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
          {item.label}
        </button>
      ))}
    </div>
  );
}
