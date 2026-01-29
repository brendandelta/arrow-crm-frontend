"use client";

interface DatePreset {
  value: string;
  label: string;
}

interface DatePresetFilterProps {
  presets: DatePreset[];
  selected: Set<string>;
  counts: Map<string, number>;
  onChange: (selected: Set<string>) => void;
}

export function DatePresetFilter({ presets, selected, counts, onChange }: DatePresetFilterProps) {
  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => {
        const isActive = selected.has(preset.value);
        const count = counts.get(preset.value) ?? 0;
        return (
          <button
            key={preset.value}
            onClick={() => toggle(preset.value)}
            className={`text-[12px] px-2.5 py-1 rounded-full font-medium transition-colors ${
              isActive
                ? "bg-blue-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {preset.label}
            <span className={`ml-1 text-[10px] ${isActive ? "text-blue-200" : "text-muted-foreground"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
