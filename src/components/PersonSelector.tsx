"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Users, ChevronDown } from "lucide-react";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title?: string | null;
  org?: string | null;
}

interface PersonSelectorProps {
  value: number | null;
  onChange: (id: number | null, person?: Person) => void;
  people: Person[];
  excludeId?: number; // ID to exclude from the list (e.g., current person)
  placeholder?: string;
  className?: string;
}

export function PersonSelector({
  value,
  onChange,
  people,
  excludeId,
  placeholder = "Search people...",
  className = "",
}: PersonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected person
  const selectedPerson = people.find((p) => p.id === value);

  // Filter people based on search and exclude
  const filteredPeople = people
    .filter((p) => p.id !== excludeId)
    .filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      return (
        fullName.includes(query) ||
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.org && p.org.toLowerCase().includes(query))
      );
    });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (person: Person) => {
    onChange(person.id, person);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main button/display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-card text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {selectedPerson ? (
            <span className="text-foreground truncate">
              {selectedPerson.firstName} {selectedPerson.lastName}
              {selectedPerson.org && (
                <span className="text-muted-foreground text-sm ml-1">({selectedPerson.org})</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectedPerson && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  handleClear();
                }
              }}
              className="p-1 text-muted-foreground hover:text-muted-foreground rounded cursor-pointer"
            >
              <X className="h-4 w-4" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {filteredPeople.length > 0 ? (
              filteredPeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleSelect(person)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors ${
                    person.id === value ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                    {person.firstName?.charAt(0)}{person.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">
                      {person.firstName} {person.lastName}
                    </div>
                    {(person.title || person.org) && (
                      <div className="text-xs text-muted-foreground truncate">
                        {person.title}{person.title && person.org && " at "}{person.org}
                      </div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No people found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
