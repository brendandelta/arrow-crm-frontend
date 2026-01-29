"use client";

import { useState } from "react";
import { Search, Upload, BookmarkPlus, X, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PageColorTheme } from "@/lib/page-registry";

// Generic SavedView type to match consumer's type
interface SavedView<T = unknown> {
  id: string;
  name: string;
  filters: T;
}

interface DocumentsHeaderProps<T = unknown> {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
  savedViews: SavedView<T>[];
  onSelectSavedView: (view: SavedView<T>) => void;
  onSaveCurrentView: () => void;
  totalCount: number;
  filteredCount: number;
  theme?: PageColorTheme;
}

export function DocumentsHeader<T = unknown>({
  searchQuery,
  onSearchChange,
  onUploadClick,
  savedViews,
  onSelectSavedView,
  onSaveCurrentView,
  totalCount,
  filteredCount,
  theme,
}: DocumentsHeaderProps<T>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {/* Search Input */}
      <div className="relative group">
        <div className={cn(
          "absolute inset-0 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity",
          theme && `bg-gradient-to-r ${theme.gradient}`
        )} style={{ opacity: 0.15 }} />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search documents..."
            className={cn(
              "w-72 h-11 pl-11 pr-10 text-sm rounded-xl transition-all duration-200",
              "bg-slate-50 border border-slate-200/80",
              "placeholder:text-slate-400",
              "focus:outline-none focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-500/10"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {!searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-400">
              <Sparkles className="h-3 w-3" />
              <span>AI</span>
            </div>
          )}
        </div>
      </div>

      {/* Saved Views */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <BookmarkPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Views</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {savedViews.length > 0 ? (
            <>
              {savedViews.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => onSelectSavedView(view)}
                  className="text-sm"
                >
                  {view.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <div className="px-2 py-1.5 text-xs text-slate-500">
              No saved views yet
            </div>
          )}
          <DropdownMenuItem onClick={onSaveCurrentView} className="text-sm">
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Save current view
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upload Button */}
      <button
        onClick={onUploadClick}
        className={cn(
          "group relative flex items-center gap-2.5 h-11 px-5",
          "text-white text-sm font-medium rounded-xl",
          "shadow-lg active:scale-[0.98] transition-all duration-200",
          theme && `bg-gradient-to-b ${theme.gradient} ${theme.shadow}`,
          theme && "hover:shadow-xl"
        )}
      >
        <Plus className="h-4 w-4" />
        <span>Upload</span>
      </button>
    </div>
  );
}
