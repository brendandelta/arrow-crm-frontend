"use client";

import { type ReactNode } from "react";
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

  // Search component slot
  search?: ReactNode;

  // Primary action button slot
  primaryAction?: ReactNode;

  // Secondary actions slot
  secondaryActions?: ReactNode;

  // Additional content below the header
  children?: ReactNode;

  // Custom className
  className?: string;
}

/**
 * Unified premium page header component
 *
 * Provides consistent styling across all pages with:
 * - Gradient icon derived from page identity
 * - Clean title and count display
 * - Premium search bar with glow effect
 * - Themed primary action button
 *
 * Based on the Internal Entities page design (gold standard)
 */
export function PageHeader({
  pageId,
  pageIdentity: propIdentity,
  title,
  subtitle,
  count,
  countLabel,
  search,
  primaryAction,
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
    <div className={cn("bg-white border-b border-slate-200/80", className)}>
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left side: Icon, Title, Count */}
          <div className="flex items-center gap-4">
            {/* Page icon with gradient */}
            {Icon && theme && (
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                  `bg-gradient-to-br ${theme.gradient}`,
                  theme.shadow
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {displayTitle}
              </h1>

              {/* Subtitle or count */}
              <div className="text-sm text-slate-500 mt-0.5">
                {subtitle || (
                  count !== undefined && (
                    <>
                      {count.toLocaleString()} {countLabel || "items"}
                    </>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right side: Search and Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            {search}

            {/* Secondary actions */}
            {secondaryActions}

            {/* Primary action */}
            {primaryAction}
          </div>
        </div>

        {/* Additional content (filters, tabs, etc.) */}
        {children}
      </div>
    </div>
  );
}

/**
 * Themed search input for page headers
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
  const SearchIcon = require("lucide-react").Search;

  return (
    <div className={cn("relative group", className)}>
      {/* Glow effect on focus */}
      {theme && (
        <div
          className={cn(
            "absolute inset-0 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity",
            `bg-gradient-to-r ${theme.gradient}`
          )}
          style={{ opacity: 0.15 }}
        />
      )}

      <div className="relative">
        <SearchIcon
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
            "text-slate-400 group-focus-within:text-slate-600",
            theme && `group-focus-within:${theme.text}`
          )}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-72 h-11 pl-11 pr-4 text-sm rounded-xl transition-all duration-200",
            "bg-slate-50 border border-slate-200/80",
            "placeholder:text-slate-400",
            "focus:outline-none focus:bg-white focus:border-slate-300",
            theme && `focus:ring-4 ${theme.ring}`
          )}
        />
      </div>
    </div>
  );
}

/**
 * Themed primary action button for page headers
 */
interface PagePrimaryActionProps {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
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
  const PlusIcon = require("lucide-react").Plus;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center gap-2.5 h-11 px-5",
        "text-white text-sm font-medium rounded-xl",
        "shadow-lg active:scale-[0.98] transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        theme
          ? cn(
              `bg-gradient-to-b ${theme.gradient}`,
              theme.shadow,
              `hover:${theme.hoverGradient}`,
              "hover:shadow-xl"
            )
          : "bg-gradient-to-b from-slate-700 to-slate-800 shadow-slate-500/25 hover:from-slate-800 hover:to-slate-900",
        className
      )}
    >
      {icon || <PlusIcon className="h-4 w-4" />}
      <span>{label}</span>
    </button>
  );
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
