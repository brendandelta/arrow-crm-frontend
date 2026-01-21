"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, Plus } from "lucide-react";

export interface MissingField {
  key: string;
  label: string;
}

interface MissingDataDropdownProps {
  missingFields: MissingField[];
  onAddClick?: (fieldKey: string) => void;
}

export function MissingDataDropdown({ missingFields, onAddClick }: MissingDataDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (missingFields.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {missingFields.length} missing
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-2">
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
              Missing Data
            </div>
            {missingFields.map((field) => (
              <button
                key={field.key}
                onClick={() => {
                  if (onAddClick) {
                    onAddClick(field.key);
                  }
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span>{field.label}</span>
                {onAddClick && (
                  <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                    <Plus className="h-3 w-3" />
                    Add
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
