"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
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
  createInternalEntity,
  ENTITY_TYPES,
  ENTITY_STATUSES,
  TAX_CLASSIFICATIONS,
  US_STATES,
  type InternalEntityDetail,
} from "@/lib/internal-entities-api";

interface NewEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (entity: InternalEntityDetail) => void;
}

export function NewEntityDialog({
  open,
  onOpenChange,
  onSuccess,
}: NewEntityDialogProps) {
  const [nameLegal, setNameLegal] = useState("");
  const [nameShort, setNameShort] = useState("");
  const [entityType, setEntityType] = useState("");
  const [jurisdictionState, setJurisdictionState] = useState("");
  const [formationDate, setFormationDate] = useState("");
  const [status, setStatus] = useState("active");
  const [taxClassification, setTaxClassification] = useState("");
  const [ein, setEin] = useState("");
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setNameLegal("");
    setNameShort("");
    setEntityType("");
    setJurisdictionState("");
    setFormationDate("");
    setStatus("active");
    setTaxClassification("");
    setEin("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameLegal.trim()) {
      toast.error("Legal name is required");
      return;
    }

    if (!entityType) {
      toast.error("Entity type is required");
      return;
    }

    setCreating(true);
    try {
      const entity = await createInternalEntity({
        nameLegal: nameLegal.trim(),
        nameShort: nameShort.trim() || undefined,
        entityType,
        jurisdictionCountry: "US",
        jurisdictionState: jurisdictionState || undefined,
        formationDate: formationDate || undefined,
        status,
        taxClassification: taxClassification || undefined,
        ein: ein.replace(/\D/g, "") || undefined,
      });

      toast.success("Entity created successfully");
      resetForm();
      onSuccess(entity);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create entity");
    } finally {
      setCreating(false);
    }
  };

  const formatEin = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Landmark className="h-4 w-4 text-indigo-600" />
            </div>
            New Internal Entity
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Legal Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Legal Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={nameLegal}
              onChange={(e) => setNameLegal(e.target.value)}
              placeholder="e.g., Arrow Investments LLC"
              className="w-full"
            />
          </div>

          {/* Short Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Short Name
            </label>
            <Input
              value={nameShort}
              onChange={(e) => setNameShort(e.target.value)}
              placeholder="Optional display name"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used for display if set, otherwise uses legal name
            </p>
          </div>

          {/* Entity Type and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Entity Type <span className="text-red-500">*</span>
              </label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Jurisdiction and Formation Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Jurisdiction State
              </label>
              <Select value={jurisdictionState} onValueChange={setJurisdictionState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Formation Date
              </label>
              <Input
                type="date"
                value={formationDate}
                onChange={(e) => setFormationDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Tax Classification */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Tax Classification
            </label>
            <Select value={taxClassification} onValueChange={setTaxClassification}>
              <SelectTrigger>
                <SelectValue placeholder="Select classification" />
              </SelectTrigger>
              <SelectContent>
                {TAX_CLASSIFICATIONS.map((tc) => (
                  <SelectItem key={tc.value} value={tc.value}>
                    {tc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* EIN */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              EIN (Employer ID Number)
            </label>
            <Input
              value={ein}
              onChange={(e) => setEin(formatEin(e.target.value))}
              placeholder="XX-XXXXXXX"
              className="w-full font-mono"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Stored encrypted with access logging
            </p>
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
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Entity"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
