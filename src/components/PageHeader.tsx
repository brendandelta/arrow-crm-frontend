"use client";

import { usePathname } from "next/navigation";
import { Plus, type LucideIcon } from "lucide-react";
import {
  getNavigationItemByPath,
  type ObjectColorPalette,
} from "@/lib/navigation-registry";

// ============================================================================
// TYPES
// ============================================================================

interface PageHeaderProps {
  /** Page title - uses registry title if not provided */
  title?: string;
  /** Subtitle/description */
  subtitle?: string | React.ReactNode;
  /** Override the icon */
  icon?: LucideIcon;
  /** Override the color palette */
  color?: ObjectColorPalette;
  /** Primary action button label */
  primaryActionLabel?: string;
  /** Primary action click handler */
  onPrimaryAction?: () => void;
  /** Whether primary action is loading */
  primaryActionLoading?: boolean;
  /** Additional actions to render */
  actions?: React.ReactNode;
  /** Search component */
  search?: React.ReactNode;
  /** Whether to show the page identity (icon + title) */
  showIdentity?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PageHeader({
  title: titleProp,
  subtitle,
  icon: iconProp,
  color: colorProp,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionLoading,
  actions,
  search,
  showIdentity = true,
}: PageHeaderProps) {
  const pathname = usePathname();
  const navItem = getNavigationItemByPath(pathname);

  // Use props or fall back to registry values
  const title = titleProp || navItem?.title || "Page";
  const Icon = iconProp || navItem?.icon;
  const color = colorProp || navItem?.color;

  return (
    <div className="bg-background border-b border-border">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          {showIdentity && (
            <div className="flex items-center gap-4">
              {Icon && color && (
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: color.gradient,
                    boxShadow: `0 10px 25px -5px ${color.shadow}`,
                  }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>
                )}
              </div>
            </div>
          )}

          {/* Actions Section */}
          <div className="flex items-center gap-4">
            {/* Search */}
            {search}

            {/* Additional Actions */}
            {actions}

            {/* Primary Action Button */}
            {primaryActionLabel && onPrimaryAction && color && (
              <button
                onClick={onPrimaryAction}
                disabled={primaryActionLoading}
                className="group relative flex items-center gap-2.5 h-11 px-5
                         text-white text-sm font-medium rounded-xl
                         shadow-lg
                         active:scale-[0.98]
                         transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: color.gradient,
                  boxShadow: `0 10px 25px -5px ${color.shadow}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 15px 30px -5px ${color.shadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 10px 25px -5px ${color.shadow}`;
                }}
              >
                {primaryActionLoading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>{primaryActionLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SEARCH INPUT COMPONENT
// ============================================================================

interface PageSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Optional color override */
  color?: ObjectColorPalette;
}

export function PageSearch({
  value,
  onChange,
  placeholder = "Search...",
  color,
}: PageSearchProps) {
  const pathname = usePathname();
  const navItem = getNavigationItemByPath(pathname);
  const activeColor = color || navItem?.color;

  return (
    <div className="relative group">
      <div
        className="absolute inset-0 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"
        style={{
          background: activeColor
            ? `linear-gradient(to right, ${activeColor.primary}20, ${activeColor.primary}10)`
            : undefined,
        }}
      />
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-current transition-colors"
          style={{
            color: activeColor?.primary,
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-72 h-11 pl-11 pr-4 text-sm bg-muted border border-border rounded-xl
                   placeholder:text-muted-foreground text-foreground
                   focus:outline-none focus:bg-background focus:ring-4 transition-all duration-200"
          style={{
            borderColor: undefined,
          }}
          onFocus={(e) => {
            if (activeColor) {
              e.currentTarget.style.borderColor = activeColor.border;
              e.currentTarget.style.boxShadow = `0 0 0 4px ${activeColor.primary}10`;
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.boxShadow = "";
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY: Get page color from path
// ============================================================================

export function usePageColor(): ObjectColorPalette | undefined {
  const pathname = usePathname();
  const navItem = getNavigationItemByPath(pathname);
  return navItem?.color;
}

export function usePageIdentity() {
  const pathname = usePathname();
  return getNavigationItemByPath(pathname);
}
