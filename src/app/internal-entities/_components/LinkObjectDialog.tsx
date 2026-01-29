"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Layers,
  Target,
  CheckSquare,
  FileText,
  Search,
  Percent,
  Link2,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  Building2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEntityLink,
  RELATIONSHIP_TYPES,
  ECONOMIC_ROLES,
  type LinkedObjectType,
  type RelationshipType,
  type EconomicRole,
  type LinkPriority,
} from "@/lib/internal-entities-api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Object type configuration
const OBJECT_TYPES: {
  value: LinkedObjectType;
  label: string;
  plural: string;
  icon: typeof Briefcase;
  color: string;
  bgColor: string;
  description: string;
}[] = [
  {
    value: "Deal",
    label: "Deal",
    plural: "Deals",
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Link to investment deals",
  },
  {
    value: "Block",
    label: "Block",
    plural: "Blocks",
    icon: Layers,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "Link to deal blocks",
  },
  {
    value: "Interest",
    label: "Interest",
    plural: "Interests",
    icon: Target,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Link to investor interests",
  },
  {
    value: "Task",
    label: "Task",
    plural: "Tasks",
    icon: CheckSquare,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    description: "Link to tasks",
  },
  {
    value: "Note",
    label: "Note",
    plural: "Notes",
    icon: FileText,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    description: "Link to notes",
  },
];

interface SearchResult {
  id: number;
  label: string;
  sublabel?: string;
  type: LinkedObjectType;
}

interface LinkObjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: number;
  entityName: string;
  onSuccess: () => void;
}

type Step = "type" | "search" | "configure";

export function LinkObjectDialog({
  open,
  onOpenChange,
  entityId,
  entityName,
  onSuccess,
}: LinkObjectDialogProps) {
  const [step, setStep] = useState<Step>("type");
  const [objectType, setObjectType] = useState<LinkedObjectType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SearchResult | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("holder");
  const [economicRole, setEconomicRole] = useState<EconomicRole>(null);
  const [ownershipPct, setOwnershipPct] = useState("");
  const [priority, setPriority] = useState<LinkPriority>("primary");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Get auth headers
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window === "undefined") return headers;
    const session = localStorage.getItem("arrow_session");
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.backendUserId) {
          headers["X-User-Id"] = data.backendUserId.toString();
        }
      } catch {
        // Invalid session
      }
    }
    return headers;
  };

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Search for objects based on type
  useEffect(() => {
    if (!objectType || !searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const headers = getAuthHeaders();
        let results: SearchResult[] = [];

        if (objectType === "Deal") {
          const res = await fetch(`${API_BASE}/api/deals`, { headers });
          if (res.ok) {
            const deals = await res.json();
            const q = searchQuery.toLowerCase();
            results = (Array.isArray(deals) ? deals : [])
              .filter(
                (d: { name: string; company?: string }) =>
                  d.name.toLowerCase().includes(q) ||
                  d.company?.toLowerCase().includes(q)
              )
              .slice(0, 10)
              .map((d: { id: number; name: string; company?: string; status: string }) => ({
                id: d.id,
                label: d.name,
                sublabel: d.company || d.status,
                type: "Deal" as LinkedObjectType,
              }));
          }
        } else if (objectType === "Block") {
          // Search blocks via deals (blocks are nested)
          const res = await fetch(`${API_BASE}/api/deals`, { headers });
          if (res.ok) {
            const deals = await res.json();
            const q = searchQuery.toLowerCase();
            const blocks: SearchResult[] = [];
            for (const deal of Array.isArray(deals) ? deals : []) {
              // Fetch deal details to get blocks
              const dealRes = await fetch(`${API_BASE}/api/deals/${deal.id}`, { headers });
              if (dealRes.ok) {
                const dealData = await dealRes.json();
                if (dealData.blocks) {
                  for (const block of dealData.blocks) {
                    const sellerName = block.seller?.name || `Block ${block.id}`;
                    if (sellerName.toLowerCase().includes(q) || deal.name.toLowerCase().includes(q)) {
                      blocks.push({
                        id: block.id,
                        label: sellerName,
                        sublabel: deal.name,
                        type: "Block" as LinkedObjectType,
                      });
                    }
                  }
                }
              }
              if (blocks.length >= 10) break;
            }
            results = blocks.slice(0, 10);
          }
        } else if (objectType === "Interest") {
          // Search interests via deals
          const res = await fetch(`${API_BASE}/api/deals`, { headers });
          if (res.ok) {
            const deals = await res.json();
            const q = searchQuery.toLowerCase();
            const interests: SearchResult[] = [];
            for (const deal of (Array.isArray(deals) ? deals : []).slice(0, 5)) {
              const dealRes = await fetch(`${API_BASE}/api/deals/${deal.id}`, { headers });
              if (dealRes.ok) {
                const dealData = await dealRes.json();
                if (dealData.interests) {
                  for (const interest of dealData.interests) {
                    const investorName = interest.investor?.name || `Interest ${interest.id}`;
                    if (investorName.toLowerCase().includes(q) || deal.name.toLowerCase().includes(q)) {
                      interests.push({
                        id: interest.id,
                        label: investorName,
                        sublabel: deal.name,
                        type: "Interest" as LinkedObjectType,
                      });
                    }
                  }
                }
              }
              if (interests.length >= 10) break;
            }
            results = interests.slice(0, 10);
          }
        } else if (objectType === "Task") {
          const res = await fetch(`${API_BASE}/api/tasks`, { headers });
          if (res.ok) {
            const tasks = await res.json();
            const q = searchQuery.toLowerCase();
            results = (Array.isArray(tasks) ? tasks : tasks.tasks || [])
              .filter((t: { subject: string }) => t.subject?.toLowerCase().includes(q))
              .slice(0, 10)
              .map((t: { id: number; subject: string; status: string }) => ({
                id: t.id,
                label: t.subject,
                sublabel: t.status,
                type: "Task" as LinkedObjectType,
              }));
          }
        }

        setSearchResults(results);
      } catch (error) {
        console.error("Failed to search:", error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [objectType, searchQuery]);

  const resetForm = () => {
    setStep("type");
    setObjectType(null);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedObject(null);
    setRelationshipType("holder");
    setEconomicRole(null);
    setOwnershipPct("");
    setPriority("primary");
    setNotes("");
  };

  const handleSelectType = (type: LinkedObjectType) => {
    setObjectType(type);
    setStep("search");
  };

  const handleSelectObject = (obj: SearchResult) => {
    setSelectedObject(obj);
    setStep("configure");
  };

  const handleBack = () => {
    if (step === "configure") {
      setSelectedObject(null);
      setStep("search");
    } else if (step === "search") {
      setObjectType(null);
      setSearchQuery("");
      setSearchResults([]);
      setStep("type");
    }
  };

  const handleSubmit = async () => {
    if (!selectedObject || !objectType) {
      toast.error("Please select an object to link");
      return;
    }

    setSaving(true);
    try {
      await createEntityLink({
        internalEntityId: entityId,
        linkedObjectType: objectType,
        linkedObjectId: selectedObject.id,
        relationshipType,
        economicRole,
        ownershipPct: ownershipPct ? parseFloat(ownershipPct) : null,
        priority,
        notes: notes || null,
      });

      toast.success(`Linked ${selectedObject.label} to ${entityName}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create link");
    } finally {
      setSaving(false);
    }
  };

  const currentTypeConfig = objectType
    ? OBJECT_TYPES.find((t) => t.value === objectType)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 px-6 py-5 text-white">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-3 text-white text-lg">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <span>Link Object</span>
                <p className="text-sm font-normal text-indigo-100 mt-0.5">
                  Connect to {entityName}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {["type", "search", "configure"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full transition-all ${
                    step === s
                      ? "bg-white scale-125"
                      : i < ["type", "search", "configure"].indexOf(step)
                        ? "bg-white/60"
                        : "bg-white/30"
                  }`}
                />
                {i < 2 && <div className="w-8 h-px bg-white/30" />}
              </div>
            ))}
            <span className="ml-2 text-xs text-indigo-100">
              {step === "type" && "Select type"}
              {step === "search" && "Find object"}
              {step === "configure" && "Configure link"}
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Select Object Type */}
          {step === "type" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                What would you like to link to this entity?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {OBJECT_TYPES.slice(0, 4).map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleSelectType(type.value)}
                      className="group relative flex flex-col items-start p-4 rounded-xl border-2 border-transparent bg-muted/50 hover:bg-muted hover:border-indigo-200 transition-all text-left"
                    >
                      <div
                        className={`h-10 w-10 rounded-lg ${type.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className={`h-5 w-5 ${type.color}`} />
                      </div>
                      <span className="font-semibold text-sm text-foreground">
                        {type.label}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {type.description}
                      </span>
                      <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/0 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Search for Object */}
          {step === "search" && currentTypeConfig && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBack}
                  className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className={`h-8 w-8 rounded-lg ${currentTypeConfig.bgColor} flex items-center justify-center`}>
                  <currentTypeConfig.icon className={`h-4 w-4 ${currentTypeConfig.color}`} />
                </div>
                <span className="font-medium text-sm">
                  Search {currentTypeConfig.plural}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${currentTypeConfig.plural.toLowerCase()}...`}
                  className="pl-10 h-11"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Search Results */}
              <div className="border border-border rounded-xl overflow-hidden max-h-[280px] overflow-y-auto">
                {searching ? (
                  <div className="p-8 text-center">
                    <div className="h-8 w-8 mx-auto mb-2 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery.length < 2
                        ? "Type at least 2 characters to search"
                        : `No ${currentTypeConfig.plural.toLowerCase()} found`}
                    </p>
                  </div>
                ) : (
                  searchResults.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectObject(result)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-indigo-50 text-left transition-colors ${
                        idx !== searchResults.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-lg ${currentTypeConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <currentTypeConfig.icon className={`h-5 w-5 ${currentTypeConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {result.label}
                        </p>
                        {result.sublabel && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.sublabel}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 3: Configure Link */}
          {step === "configure" && selectedObject && currentTypeConfig && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBack}
                  className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="font-medium text-sm">Configure Link</span>
              </div>

              {/* Selected Object Display */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <div className={`h-12 w-12 rounded-xl ${currentTypeConfig.bgColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <currentTypeConfig.icon className={`h-6 w-6 ${currentTypeConfig.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{selectedObject.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentTypeConfig.label} {selectedObject.sublabel && `• ${selectedObject.sublabel}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-indigo-600">
                  <Link2 className="h-4 w-4" />
                  <ArrowRight className="h-4 w-4" />
                  <Building2 className="h-4 w-4" />
                </div>
              </div>

              {/* Link Configuration */}
              <div className="space-y-4">
                {/* Relationship Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Relationship Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={relationshipType}
                    onValueChange={(v) => setRelationshipType(v as RelationshipType)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{r.label}</span>
                            <span className="text-muted-foreground text-xs">
                              {r.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Economic Role */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Economic Role
                  </label>
                  <Select
                    value={economicRole || "none"}
                    onValueChange={(v) => setEconomicRole(v === "none" ? null : (v as EconomicRole))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select role (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ECONOMIC_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ownership & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Ownership %
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={ownershipPct}
                        onChange={(e) => setOwnershipPct(e.target.value)}
                        placeholder="0.00"
                        className="pr-10 h-11"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPriority("primary")}
                        className={`flex-1 h-11 text-sm font-medium rounded-lg border-2 transition-all ${
                          priority === "primary"
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                            : "bg-card border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground/20"
                        }`}
                      >
                        Primary
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriority("secondary")}
                        className={`flex-1 h-11 text-sm font-medium rounded-lg border-2 transition-all ${
                          priority === "secondary"
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                            : "bg-card border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground/20"
                        }`}
                      >
                        Secondary
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional context about this link..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-11 px-5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="h-11 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
