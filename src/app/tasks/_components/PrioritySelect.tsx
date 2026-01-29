"use client";

import { useState } from "react";
import { Flag, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TASK_PRIORITIES, getPriorityColor, getPriorityLabel } from "@/lib/tasks-api";

interface PrioritySelectProps {
  value: number;
  onChange: (priority: number) => void;
  disabled?: boolean;
  size?: "sm" | "default";
  variant?: "default" | "ghost" | "minimal" | "badge";
}

export function PrioritySelect({
  value,
  onChange,
  disabled = false,
  size = "default",
  variant = "default",
}: PrioritySelectProps) {
  const [open, setOpen] = useState(false);

  const selectedPriority = TASK_PRIORITIES.find((p) => p.value === value);
  const priorityColor = getPriorityColor(value);
  const priorityLabel = getPriorityLabel(value);

  const handleSelect = (priority: number) => {
    onChange(priority);
    setOpen(false);
  };

  const buttonClasses = cn(
    "justify-start font-normal",
    size === "sm" ? "h-8 text-sm" : "h-9",
    variant === "ghost" && "hover:bg-slate-100",
    variant === "minimal" && "border-0 shadow-none hover:bg-slate-50 px-2",
    variant === "badge" && cn("border-0 shadow-none rounded-full px-2.5 py-1 h-auto", priorityColor)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant === "default" ? "outline" : "ghost"}
          disabled={disabled}
          className={buttonClasses}
        >
          <Flag className={cn("h-4 w-4 mr-2", value === 3 ? "text-red-500" : value === 2 ? "text-amber-500" : "text-slate-400")} />
          <span>{priorityLabel}</span>
          {variant !== "badge" && (
            <ChevronDown className="h-3.5 w-3.5 ml-auto text-slate-400" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[160px] p-1" align="start">
        {TASK_PRIORITIES.map((priority) => (
          <button
            key={priority.value}
            onClick={() => handleSelect(priority.value)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-slate-100 transition-colors",
              value === priority.value && "bg-slate-50"
            )}
          >
            <Flag
              className={cn(
                "h-4 w-4",
                priority.value === 3 ? "text-red-500" : priority.value === 2 ? "text-amber-500" : "text-slate-400"
              )}
            />
            <span className="flex-1 text-left">{priority.label}</span>
            {value === priority.value && (
              <Check className="h-4 w-4 text-cyan-600" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Compact badge version for display in rows
interface PriorityBadgeProps {
  priority: number;
  onClick?: () => void;
  size?: "sm" | "default";
  showLabel?: boolean;
}

export function PriorityBadge({
  priority,
  onClick,
  size = "default",
  showLabel = true,
}: PriorityBadgeProps) {
  // Only show badge for high priority by default
  if (priority < 3 && !showLabel) return null;

  const color = getPriorityColor(priority);
  const label = getPriorityLabel(priority);

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full transition-colors",
        color,
        onClick && "hover:opacity-80",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"
      )}
    >
      <Flag className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
