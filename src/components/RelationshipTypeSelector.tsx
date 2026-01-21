"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Search, Plus, X, ChevronDown, Loader2, Link2 } from "lucide-react";

interface RelationshipType {
  id: number;
  name: string;
  slug: string;
  sourceType: string | null;
  targetType: string | null;
  category: string;
  bidirectional: boolean;
  inverseName: string | null;
  inverseSlug: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  isSystem: boolean;
}

interface RelationshipTypeSelectorProps {
  value: number | null;
  onChange: (id: number | null, type?: RelationshipType) => void;
  relationshipTypes: RelationshipType[];
  targetEntityType: string; // "Person" or "Organization"
  onTypeCreated?: (type: RelationshipType) => void;
  placeholder?: string;
  className?: string;
}

// Predefined colors for new relationship types
const TYPE_COLORS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#64748B", label: "Slate" },
];

export function RelationshipTypeSelector({
  value,
  onChange,
  relationshipTypes,
  targetEntityType,
  onTypeCreated,
  placeholder = "Select relationship type...",
  className = "",
}: RelationshipTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeInverseName, setNewTypeInverseName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#3B82F6");
  const [newTypeBidirectional, setNewTypeBidirectional] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected type
  const selectedType = relationshipTypes.find((t) => t.id === value);

  // Filter types based on search and target entity type
  const filteredTypes = relationshipTypes.filter((t) => {
    // Filter by target type (null means any target type is allowed)
    if (t.targetType && t.targetType !== targetEntityType) {
      return false;
    }
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(query) ||
        (t.inverseName && t.inverseName.toLowerCase().includes(query)) ||
        t.category.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group filtered types by category
  const groupedTypes = filteredTypes.reduce((acc, type) => {
    const category = type.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(type);
    return acc;
  }, {} as Record<string, RelationshipType[]>);

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

  const handleSelect = (type: RelationshipType) => {
    onChange(type.id, type);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;

    setCreating(true);
    try {
      // Generate slug from name
      const slug = newTypeName.trim().toLowerCase().replace(/\s+/g, "-");
      const inverseSlug = newTypeInverseName.trim()
        ? newTypeInverseName.trim().toLowerCase().replace(/\s+/g, "-")
        : null;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationship_types`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newTypeName.trim(),
            slug,
            sourceType: "Person",
            targetType: targetEntityType,
            category: targetEntityType === "Person" ? "personal" : "professional",
            bidirectional: newTypeBidirectional,
            inverseName: newTypeBidirectional ? null : newTypeInverseName.trim() || null,
            inverseSlug: newTypeBidirectional ? null : inverseSlug,
            color: newTypeColor,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newType: RelationshipType = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          sourceType: "Person",
          targetType: targetEntityType,
          category: targetEntityType === "Person" ? "personal" : "professional",
          bidirectional: newTypeBidirectional,
          inverseName: newTypeBidirectional ? null : newTypeInverseName.trim() || null,
          inverseSlug: newTypeBidirectional ? null : inverseSlug,
          description: null,
          color: newTypeColor,
          icon: null,
          isSystem: false,
        };

        // Notify parent to refresh type list
        if (onTypeCreated) {
          onTypeCreated(newType);
        }

        // Select the new type
        onChange(newType.id, newType);

        // Close modal and reset
        setShowCreateModal(false);
        setNewTypeName("");
        setNewTypeInverseName("");
        setNewTypeColor("#3B82F6");
        setNewTypeBidirectional(false);
        setSearchQuery("");
        setIsOpen(false);
        toast.success("Relationship type created successfully");
      } else {
        const error = await response.json();
        toast.error(error.errors?.join(", ") || "Failed to create relationship type");
      }
    } catch (err) {
      console.error("Failed to create relationship type:", err);
      toast.error("Failed to create relationship type. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setNewTypeName(searchQuery);
    setShowCreateModal(true);
  };

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        {/* Main button/display */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedType ? (
              <>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedType.color || "#64748B" }}
                />
                <span className="text-slate-900 truncate">
                  {selectedType.name}
                  {!selectedType.bidirectional && selectedType.inverseName && (
                    <span className="text-slate-400 text-sm ml-1">
                      / {selectedType.inverseName}
                    </span>
                  )}
                </span>
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400">{placeholder}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedType && (
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
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search relationship types..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-60 overflow-y-auto">
              {Object.keys(groupedTypes).length > 0 ? (
                Object.entries(groupedTypes).map(([category, types]) => (
                  <div key={category}>
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide bg-slate-50 sticky top-0">
                      {category}
                    </div>
                    {types.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelect(type)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                          type.id === value ? "bg-blue-50" : ""
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: type.color || "#64748B" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-900 truncate">
                            {type.name}
                            {!type.bidirectional && type.inverseName && (
                              <span className="text-slate-400 ml-1">/ {type.inverseName}</span>
                            )}
                          </div>
                          {type.description && (
                            <div className="text-xs text-slate-400 truncate">{type.description}</div>
                          )}
                        </div>
                        {type.bidirectional && (
                          <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                            mutual
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-slate-400">
                  No relationship types found for {targetEntityType}
                </div>
              )}
            </div>

            {/* Create new option */}
            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span>Create new relationship type</span>
                {searchQuery && (
                  <span className="text-slate-400 truncate">&quot;{searchQuery}&quot;</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Relationship Type Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white border border-slate-200 rounded-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Create Relationship Type</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Relationship name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Relationship Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder={targetEntityType === "Person" ? 'e.g. "friends with"' : 'e.g. "works at"'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">
                  How this person relates to the {targetEntityType.toLowerCase()}
                </p>
              </div>

              {/* Bidirectional toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTypeBidirectional}
                    onChange={(e) => setNewTypeBidirectional(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Mutual relationship</span>
                    <p className="text-xs text-slate-400">Both parties have the same relationship (e.g. &quot;friends with&quot;)</p>
                  </div>
                </label>
              </div>

              {/* Inverse name (only if not bidirectional) */}
              {!newTypeBidirectional && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Inverse Name
                  </label>
                  <input
                    type="text"
                    value={newTypeInverseName}
                    onChange={(e) => setNewTypeInverseName(e.target.value)}
                    placeholder={targetEntityType === "Person" ? 'e.g. "introduced by"' : 'e.g. "employs"'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    How the {targetEntityType.toLowerCase()} relates back to this person
                  </p>
                </div>
              )}

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewTypeColor(color.value)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        newTypeColor === color.value
                          ? "border-slate-900 scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateType}
                disabled={!newTypeName.trim() || creating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
