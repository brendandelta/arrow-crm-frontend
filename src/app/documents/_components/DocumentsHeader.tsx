"use client";

import { useState } from "react";
import { Search, BookmarkPlus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { type DocumentFilters } from "@/lib/documents-api";

interface SavedView {
  id: string;
  name: string;
  filters: DocumentFilters;
}

interface DocumentsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
  savedViews: SavedView[];
  onSelectSavedView: (view: SavedView) => void;
  onSaveCurrentView: () => void;
  totalCount: number;
  filteredCount: number;
}

export function DocumentsHeader({
  searchQuery,
  onSearchChange,
  onUploadClick,
  savedViews,
  onSelectSavedView,
  onSaveCurrentView,
  totalCount,
  filteredCount,
}: DocumentsHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);

  const isFiltered = filteredCount !== totalCount;

  return (
    <div className="flex items-center gap-4">
      {/* Search Input - cmdk style */}
      <div className="flex-1 max-w-xl">
        <div
          className={`relative flex items-center rounded-xl border bg-card transition-all duration-200 ${
            isFocused
              ? "border-indigo-300 ring-2 ring-indigo-100 shadow-sm"
              : "border-border hover:border-border"
          }`}
        >
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder='Search documents... try "SpaceX term sheet" or "tax forms"'
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-transparent rounded-xl focus:outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {!searchQuery && (
            <div className="absolute right-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>AI-powered</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Saved Views */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg border-border text-foreground hover:bg-muted"
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
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No saved views yet
              </div>
            )}
            <DropdownMenuItem onClick={onSaveCurrentView} className="text-sm">
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Save current view
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}
