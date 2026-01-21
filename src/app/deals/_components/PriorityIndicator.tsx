import { Circle } from "lucide-react";

export function PriorityIndicator({ priority }: { priority: number }) {
  const colors = ["text-slate-300", "text-yellow-500", "text-orange-500", "text-red-500"];
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <Circle
          key={i}
          className={`h-2 w-2 ${i <= priority ? colors[priority] : "text-slate-200"}`}
          fill={i <= priority ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}
