"use client";

import { useState } from "react";
import { Circle, ChevronDown, Check, Play, Pause, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TASK_STATUSES, getStatusColor, getStatusLabel, type TaskStatus } from "@/lib/tasks-api";

const STATUS_ICONS: Record<TaskStatus, React.ElementType> = {
  open: Circle,
  in_progress: Play,
  blocked: AlertTriangle,
  waiting: Pause,
};

interface StatusSelectProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  size?: "sm" | "default";
  variant?: "default" | "ghost" | "minimal" | "badge";
}

export function StatusSelect({
  value,
  onChange,
  disabled = false,
  size = "default",
  variant = "default",
}: StatusSelectProps) {
  const [open, setOpen] = useState(false);

  const statusColor = getStatusColor(value);
  const statusLabel = getStatusLabel(value);
  const StatusIcon = STATUS_ICONS[value] || Circle;

  const handleSelect = (status: TaskStatus) => {
    onChange(status);
    setOpen(false);
  };

  const buttonClasses = cn(
    "justify-start font-normal",
    size === "sm" ? "h-8 text-sm" : "h-9",
    variant === "ghost" && "hover:bg-slate-100",
    variant === "minimal" && "border-0 shadow-none hover:bg-slate-50 px-2",
    variant === "badge" && cn("border-0 shadow-none rounded-full px-2.5 py-1 h-auto", statusColor)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant === "default" ? "outline" : "ghost"}
          disabled={disabled}
          className={buttonClasses}
        >
          <StatusIcon className="h-4 w-4 mr-2" />
          <span>{statusLabel}</span>
          {variant !== "badge" && (
            <ChevronDown className="h-3.5 w-3.5 ml-auto text-slate-400" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-1" align="start">
        {TASK_STATUSES.map((status) => {
          const Icon = STATUS_ICONS[status.value] || Circle;
          return (
            <button
              key={status.value}
              onClick={() => handleSelect(status.value)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-slate-100 transition-colors",
                value === status.value && "bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{status.label}</span>
              {value === status.value && (
                <Check className="h-4 w-4 text-cyan-600" />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// Compact badge version for display in rows
interface StatusBadgeProps {
  status: TaskStatus;
  onClick?: () => void;
  size?: "sm" | "default";
}

export function StatusBadge({ status, onClick, size = "default" }: StatusBadgeProps) {
  // Only show badge for non-open status
  if (status === "open") return null;

  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  const Icon = STATUS_ICONS[status] || Circle;

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
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span>{label}</span>
    </button>
  );
}
