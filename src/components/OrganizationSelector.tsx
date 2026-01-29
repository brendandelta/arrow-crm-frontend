"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Search, Plus, X, Building2, ChevronDown, Loader2 } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  kind: string;
}

interface OrganizationSelectorProps {
  value: number | null;
  onChange: (id: number | null, org?: Organization) => void;
  organizations: Organization[];
  onOrganizationCreated?: (org: Organization) => void;
  placeholder?: string;
  className?: string;
}

const ORG_KINDS = [
  { value: "fund", label: "Fund" },
  { value: "company", label: "Company" },
  { value: "bank", label: "Bank" },
  { value: "broker", label: "Broker" },
  { value: "service_provider", label: "Service Provider" },
  { value: "other", label: "Other" },
];

export function OrganizationSelector({
  value,
  onChange,
  organizations,
  onOrganizationCreated,
  placeholder = "Search organizations...",
  className = "",
}: OrganizationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgKind, setNewOrgKind] = useState("fund");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected organization
  const selectedOrg = organizations.find((org) => org.id === value);

  // Filter organizations based on search
  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleSelect = (org: Organization) => {
    onChange(org.id, org);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newOrgName.trim(),
            kind: newOrgKind,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newOrg: Organization = {
          id: data.id,
          name: newOrgName.trim(),
          kind: newOrgKind,
        };

        // Notify parent to refresh org list
        if (onOrganizationCreated) {
          onOrganizationCreated(newOrg);
        }

        // Select the new org
        onChange(newOrg.id, newOrg);

        // Close modal and reset
        setShowCreateModal(false);
        setNewOrgName("");
        setNewOrgKind("fund");
        setSearchQuery("");
        setIsOpen(false);
        toast.success("Organization created successfully");
      } else {
        const error = await response.json();
        toast.error(error.errors?.join(", ") || "Failed to create organization");
      }
    } catch (err) {
      console.error("Failed to create organization:", err);
      toast.error("Failed to create organization. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setNewOrgName(searchQuery); // Pre-fill with search query
    setShowCreateModal(true);
  };

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        {/* Main button/display */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-card text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {selectedOrg ? (
              <span className="text-foreground truncate">
                {selectedOrg.name}
                <span className="text-muted-foreground text-sm ml-1">({selectedOrg.kind})</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedOrg && (
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
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSelect(org)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors ${
                      org.id === value ? "bg-blue-50" : ""
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{org.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{org.kind}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No organizations found
                </div>
              )}
            </div>

            {/* Create new option */}
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span>Create new organization</span>
                {searchQuery && (
                  <span className="text-muted-foreground truncate">"{searchQuery}"</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-card border border-border rounded-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Create Organization</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-muted-foreground hover:text-muted-foreground rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 auto-rows-[44px]">
                  {ORG_KINDS.map((kind) => (
                    <button
                      key={kind.value}
                      type="button"
                      onClick={() => setNewOrgKind(kind.value)}
                      className={`px-2 py-1 text-sm rounded-lg border transition-colors h-full flex items-center justify-center text-center leading-tight ${
                        newOrgKind === kind.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-border text-muted-foreground hover:border-border"
                      }`}
                    >
                      {kind.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateOrg}
                disabled={!newOrgName.trim() || creating}
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
