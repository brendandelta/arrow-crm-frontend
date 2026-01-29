"use client";

import { useState, useEffect, useRef } from "react";
import { User, X, Check, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { type UserOption, fetchUsers } from "@/lib/tasks-api";

interface AssigneeSelectProps {
  value: number | null;
  onChange: (userId: number | null) => void;
  users?: UserOption[];
  placeholder?: string;
  disabled?: boolean;
  showClear?: boolean;
  size?: "sm" | "default";
  variant?: "default" | "ghost" | "minimal";
}

export function AssigneeSelect({
  value,
  onChange,
  users: providedUsers,
  placeholder = "Assign to...",
  disabled = false,
  showClear = true,
  size = "default",
  variant = "default",
}: AssigneeSelectProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>(providedUsers || []);
  const [loading, setLoading] = useState(!providedUsers);

  useEffect(() => {
    if (providedUsers) {
      setUsers(providedUsers);
      setLoading(false);
      return;
    }

    fetchUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [providedUsers]);

  const selectedUser = users.find((u) => u.id === value);

  const getUserName = (user: UserOption) => {
    if (user.fullName) return user.fullName;
    return `${user.firstName} ${user.lastName}`.trim();
  };

  const getUserInitials = (user: UserOption) => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const handleSelect = (userId: number) => {
    onChange(userId);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const buttonClasses = cn(
    "justify-start font-normal",
    size === "sm" ? "h-8 text-sm" : "h-9",
    variant === "ghost" && "hover:bg-slate-100",
    variant === "minimal" && "border-0 shadow-none hover:bg-slate-50 px-2",
    !selectedUser && "text-slate-500"
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant === "default" ? "outline" : "ghost"}
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={buttonClasses}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400 mr-2" />
          ) : selectedUser ? (
            <>
              <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-600 mr-2">
                {getUserInitials(selectedUser)}
              </div>
              <span className="truncate">{getUserName(selectedUser)}</span>
              {showClear && (
                <X
                  className="h-3.5 w-3.5 ml-auto text-slate-400 hover:text-slate-600"
                  onClick={handleClear}
                />
              )}
            </>
          ) : (
            <>
              <User className="h-4 w-4 text-slate-400 mr-2" />
              <span>{placeholder}</span>
              <ChevronDown className="h-3.5 w-3.5 ml-auto text-slate-400" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search team..." className="h-9" />
          <CommandList>
            <CommandEmpty>No team member found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={getUserName(user)}
                  onSelect={() => handleSelect(user.id)}
                  className="flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-600">
                    {getUserInitials(user)}
                  </div>
                  <span className="flex-1 truncate">{getUserName(user)}</span>
                  {value === user.id && (
                    <Check className="h-4 w-4 text-cyan-600" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Compact pill version for inline display
interface AssigneePillProps {
  user: UserOption | null;
  onClick?: () => void;
  size?: "sm" | "default";
}

export function AssigneePill({ user, onClick, size = "default" }: AssigneePillProps) {
  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  const name = user.fullName || `${user.firstName} ${user.lastName}`.trim();

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors",
        size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1"
      )}
    >
      <div
        className={cn(
          "rounded-full bg-slate-300 flex items-center justify-center font-medium text-slate-700",
          size === "sm" ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[10px]"
        )}
      >
        {initials}
      </div>
      <span className={cn("text-slate-600", size === "sm" ? "text-xs" : "text-sm")}>
        {name}
      </span>
    </button>
  );
}
