"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, Search, User } from "lucide-react";
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
  createEntitySigner,
  SIGNER_ROLES,
} from "@/lib/internal-entities-api";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  title: string | null;
  orgName: string | null;
}

interface AddSignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: number;
  onSuccess: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export function AddSignerDialog({
  open,
  onOpenChange,
  entityId,
  onSuccess,
}: AddSignerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [role, setRole] = useState("manager");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [creating, setCreating] = useState(false);

  // Search for people
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setPeople([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Get auth headers
        const session = localStorage.getItem('arrow_session');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session) {
          try {
            const data = JSON.parse(session);
            if (data.backendUserId) {
              headers['X-User-Id'] = data.backendUserId.toString();
            }
          } catch {
            // Invalid session
          }
        }

        const res = await fetch(
          `${API_BASE}/api/people?q=${encodeURIComponent(searchQuery)}&per_page=10`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setPeople(data.people || []);
        }
      } catch (error) {
        console.error("Failed to search people:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const resetForm = () => {
    setSearchQuery("");
    setPeople([]);
    setSelectedPerson(null);
    setRole("manager");
    setEffectiveFrom("");
    setEffectiveTo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPerson) {
      toast.error("Please select a person");
      return;
    }

    setCreating(true);
    try {
      await createEntitySigner(entityId, {
        personId: selectedPerson.id,
        role,
        effectiveFrom: effectiveFrom || undefined,
        effectiveTo: effectiveTo || undefined,
      });

      toast.success(`${selectedPerson.fullName} added as ${SIGNER_ROLES.find(r => r.value === role)?.label || role}`);
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add signer");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            Add Authorized Signer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Person Search */}
          {!selectedPerson ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Search for Person <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="pl-9"
                />
              </div>

              {/* Search Results */}
              {(people.length > 0 || searching) && (
                <div className="mt-2 border border-border rounded-lg max-h-48 overflow-y-auto">
                  {searching ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : people.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  ) : (
                    people.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          setSelectedPerson(person);
                          setSearchQuery("");
                          setPeople([]);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left border-b border-border last:border-b-0"
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {person.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {person.title && `${person.title} · `}
                            {person.orgName || person.email || ""}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Selected Person
              </label>
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {selectedPerson.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPerson.title && `${selectedPerson.title} · `}
                      {selectedPerson.orgName || selectedPerson.email || ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {SIGNER_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Effective Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Effective From
              </label>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Effective To
              </label>
              <Input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank if current
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !selectedPerson}>
              {creating ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Signer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
