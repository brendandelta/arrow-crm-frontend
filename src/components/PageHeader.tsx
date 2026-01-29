"use client";

import * as React from "react";
import { type ReactNode } from "react";
import { Search, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PageIdentity, getPageIdentityByPath } from "@/lib/page-registry";
import { usePathname } from "next/navigation";

interface PageHeaderProps {
  // Optional override for page identity (auto-detected from pathname if not provided)
  pageId?: string;
  pageIdentity?: PageIdentity;

  // Title and subtitle
  title?: string;
  subtitle?: ReactNode;

  // Count badge (e.g., "127 contacts")
  count?: number;
  countLabel?: string;

  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Primary action button
  primaryActionLabel?: string;
  primaryActionIcon?: ReactNode;
  onPrimaryAction?: () => void;

  // Component slots for custom content
  search?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;

  // Additional content below the header
  children?: ReactNode;

  // Custom className
  className?: string;
}

/**
 * Premium page header with glass morphism and beautiful rounded edges
 *
 * Features:
 * - Frosted glass background with backdrop blur
 * - Gradient icon with inner glow
 * - Clean typography with tight tracking
 * - Themed search with soft focus glow
 * - Premium gradient button with shine effect
 */
export function PageHeader({
  pageId,
  pageIdentity: propIdentity,
  title,
  subtitle,
  count,
  countLabel,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  primaryActionLabel,
  primaryActionIcon,
  onPrimaryAction,
  search: customSearch,
  primaryAction: customPrimaryAction,
  secondaryActions,
  children,
  className,
}: PageHeaderProps) {
  const pathname = usePathname();

  // Get page identity from props or auto-detect from pathname
  const identity = propIdentity || (pageId ? undefined : getPageIdentityByPath(pathname));

  // Use provided values or fall back to identity
  const displayTitle = title || identity?.label || "Page";
  const Icon = identity?.icon;
  const theme = identity?.theme;

  return (
    <div
      className={cn(
        // Glass morphism background
        "relative bg-white/70 backdrop-blur-xl",
        // Bottom border with gradient fade
        "border-b border-slate-200/50",
        // Subtle shadow for depth
        "shadow-sm shadow-slate-100/50",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50 pointer-events-none" />

      <div className="relative px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Left side: Icon, Title, Count */}
          <div className="flex items-center gap-4">
            {/* Page icon with gradient and glow */}
            {Icon && theme && (
              <div className="relative group">
                {/* Outer glow */}
                <div
                  className={cn(
                    "absolute -inset-1 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity",
                    `bg-gradient-to-br ${theme.gradient}`
                  )}
                />
                {/* Icon container */}
                <div
                  className={cn(
                    "relative h-11 w-11 rounded-xl flex items-center justify-center",
                    "shadow-lg transition-transform group-hover:scale-[1.02]",
                    `bg-gradient-to-br ${theme.gradient}`
                  )}
                >
                  {/* Inner shine */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
                  <Icon className="relative h-5 w-5 text-white drop-shadow-sm" />
                </div>
              </div>
            )}

            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                {displayTitle}
              </h1>

              {/* Subtitle or count */}
              {(subtitle || count !== undefined) && (
                <div className="text-[13px] text-slate-500 flex items-center gap-2">
                  {subtitle || (
                    count !== undefined && (
                      <span className="tabular-nums">
                        {count.toLocaleString()} {countLabel || "items"}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side: Search and Actions */}
          <div className="flex items-center gap-3">
            {/* Search - custom or built-in */}
            {customSearch || (onSearchChange && (
              <PageSearch
                value={searchValue || ""}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                theme={theme}
              />
            ))}

            {/* Secondary actions */}
            {secondaryActions}

            {/* Primary action - custom or built-in */}
            {customPrimaryAction || (onPrimaryAction && primaryActionLabel && (
              <PagePrimaryAction
                onClick={onPrimaryAction}
                label={primaryActionLabel}
                icon={primaryActionIcon}
                theme={theme}
              />
            ))}
          </div>
        </div>

        {/* Additional content (filters, tabs, etc.) */}
        {children}
      </div>
    </div>
  );
}

/**
 * Premium search input with soft glow effect
 */
interface PageSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  theme?: PageIdentity["theme"];
  className?: string;
}

export function PageSearch({
  value,
  onChange,
  placeholder = "Search...",
  theme,
  className,
}: PageSearchProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className={cn("relative group", className)}>
      {/* Soft glow effect on focus */}
      {theme && (
        <div
          className={cn(
            "absolute -inset-0.5 rounded-xl blur-md transition-opacity duration-300",
            `bg-gradient-to-r ${theme.gradient}`,
            isFocused ? "opacity-30" : "opacity-0"
          )}
        />
      )}

      {/* Input container with glass effect */}
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
            isFocused ? "text-slate-600" : "text-slate-400"
          )}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-64 h-10 pl-10 pr-9 text-sm rounded-xl transition-all duration-200",
            // Background and border
            "bg-slate-50/80 border border-slate-200/60",
            "placeholder:text-slate-400",
            // Focus state
            "focus:outline-none focus:bg-white/90 focus:border-slate-300",
            "focus:shadow-sm focus:shadow-slate-200/50"
          )}
        />
        {/* Clear button */}
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Premium gradient button with shine effect
 */
interface PagePrimaryActionProps {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  theme?: PageIdentity["theme"];
  className?: string;
  disabled?: boolean;
}

export function PagePrimaryAction({
  onClick,
  label,
  icon,
  theme,
  className,
  disabled,
}: PagePrimaryActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center gap-2 h-10 px-4",
        "text-white text-sm font-medium rounded-xl",
        "shadow-md hover:shadow-lg active:scale-[0.98]",
        "transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        theme
          ? cn(`bg-gradient-to-b ${theme.gradient}`, theme.shadow)
          : "bg-gradient-to-b from-slate-700 to-slate-800 shadow-slate-500/25",
        className
      )}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-white/5 to-white/15 pointer-events-none" />
      {/* Content */}
      {icon || <Plus className="relative h-4 w-4" />}
      <span className="relative">{label}</span>
    </button>
  );
}

/**
 * Secondary action button (outline style)
 */
interface PageSecondaryActionProps {
  onClick: () => void;
  label?: string;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PageSecondaryAction({
  onClick,
  label,
  icon,
  className,
  disabled,
}: PageSecondaryActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 h-10 px-3.5",
        "text-slate-600 text-sm font-medium rounded-xl",
        "bg-white/80 border border-slate-200/60",
        "hover:bg-slate-50 hover:border-slate-300/60",
        "active:scale-[0.98] transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

/**
 * Stat display for subtitles
 */
export function HeaderStat({
  value,
  label,
  variant = "default",
}: {
  value: number | string;
  label: string;
  variant?: "default" | "highlight" | "warning" | "danger";
}) {
  const styles = {
    default: "text-slate-600",
    highlight: "text-indigo-600 font-medium",
    warning: "text-amber-600 font-medium",
    danger: "text-red-600 font-medium",
  };

  return (
    <span className={cn("tabular-nums", styles[variant])}>
      {typeof value === "number" ? value.toLocaleString() : value} {label}
    </span>
  );
}

/**
 * Divider between stats
 */
export function HeaderDivider() {
  return <span className="text-slate-300">·</span>;
}

/**
 * Page container with consistent background
 */
interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("h-[calc(100vh-64px)] flex flex-col bg-[#FAFBFC]", className)}>
      {children}
    </div>
  );
}

/**
 * Page content area with consistent padding
 */
interface PageContentProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageContent({ children, className, noPadding }: PageContentProps) {
  return (
    <div className={cn("flex-1 overflow-auto", !noPadding && "p-6", className)}>
      {children}
    </div>
  );
}

export default PageHeader;
