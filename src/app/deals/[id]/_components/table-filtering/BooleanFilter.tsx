"use client";

interface BooleanFilterProps {
  value: "has" | "lacks" | null;
  hasLabel?: string;
  lacksLabel?: string;
  onChange: (value: "has" | "lacks" | null) => void;
}

export function BooleanFilter({
  value,
  hasLabel = "Has",
  lacksLabel = "Doesn't have",
  onChange,
}: BooleanFilterProps) {
  return (
    <div className="flex rounded-md overflow-hidden border border-border">
      <button
        onClick={() => onChange(value === "has" ? null : "has")}
        className={`flex-1 text-[12px] px-3 py-1.5 font-medium transition-colors ${
          value === "has"
            ? "bg-blue-500 text-white"
            : "bg-card text-muted-foreground hover:bg-muted"
        }`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {hasLabel}
      </button>
      <button
        onClick={() => onChange(value === "lacks" ? null : "lacks")}
        className={`flex-1 text-[12px] px-3 py-1.5 font-medium transition-colors border-l border-border ${
          value === "lacks"
            ? "bg-blue-500 text-white"
            : "bg-card text-muted-foreground hover:bg-muted"
        }`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {lacksLabel}
      </button>
    </div>
  );
}
