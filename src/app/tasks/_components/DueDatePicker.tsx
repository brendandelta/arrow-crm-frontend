"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDueDate, getDueDateBadgeColor, type Task } from "@/lib/tasks-api";

interface DueDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  task?: Task; // For color coding based on overdue status
  placeholder?: string;
  disabled?: boolean;
  showClear?: boolean;
  size?: "sm" | "default";
  variant?: "default" | "ghost" | "minimal" | "badge";
}

export function DueDatePicker({
  value,
  onChange,
  task,
  placeholder = "Set due date",
  disabled = false,
  showClear = true,
  size = "default",
  variant = "default",
}: DueDatePickerProps) {
  const [open, setOpen] = useState(false);

  const displayDate = value ? formatDueDate(value) : null;

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue) {
      onChange(newValue);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleQuickDate = (daysFromNow: number | null) => {
    if (daysFromNow === null) {
      onChange(null);
    } else {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      onChange(date.toISOString().split("T")[0]);
    }
    setOpen(false);
  };

  // Get badge color if task is provided
  const badgeColor = task ? getDueDateBadgeColor(task) : "bg-slate-100 text-slate-600";

  const buttonClasses = cn(
    "justify-start font-normal",
    size === "sm" ? "h-8 text-sm" : "h-9",
    variant === "ghost" && "hover:bg-slate-100",
    variant === "minimal" && "border-0 shadow-none hover:bg-slate-50 px-2",
    variant === "badge" && cn("border-0 shadow-none rounded-full px-2.5 py-1 h-auto", badgeColor),
    !displayDate && "text-slate-500"
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant === "default" ? "outline" : "ghost"}
          disabled={disabled}
          className={buttonClasses}
        >
          <CalendarIcon className={cn("h-4 w-4 mr-2", displayDate ? "" : "text-slate-400")} />
          <span>{displayDate || placeholder}</span>
          {displayDate && showClear && variant !== "badge" ? (
            <X
              className="h-3.5 w-3.5 ml-auto text-slate-400 hover:text-slate-600"
              onClick={handleClear}
            />
          ) : variant !== "badge" ? (
            <ChevronDown className="h-3.5 w-3.5 ml-auto text-slate-400" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          {/* Quick date buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleQuickDate(0)}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleQuickDate(1)}
            >
              Tomorrow
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleQuickDate(7)}
            >
              Next Week
            </Button>
          </div>

          {/* Date input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Pick a date</label>
            <Input
              type="date"
              value={value || ""}
              onChange={handleDateInputChange}
              className="h-9"
            />
          </div>

          {/* Clear button */}
          {showClear && value && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleQuickDate(null)}
            >
              Clear date
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact badge version for display in rows
interface DueDateBadgeProps {
  dueAt: string | null;
  task?: Task;
  onClick?: () => void;
  size?: "sm" | "default";
}

export function DueDateBadge({ dueAt, task, onClick, size = "default" }: DueDateBadgeProps) {
  if (!dueAt) return null;

  const displayDate = formatDueDate(dueAt);
  const badgeColor = task ? getDueDateBadgeColor(task) : "bg-slate-100 text-slate-600";

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full transition-colors",
        badgeColor,
        onClick && "hover:opacity-80",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"
      )}
    >
      <CalendarIcon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span>{displayDate}</span>
    </button>
  );
}
