"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBankAccount,
  BANK_ACCOUNT_TYPES,
} from "@/lib/internal-entities-api";

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: number;
  onSuccess: () => void;
}

export function AddBankAccountDialog({
  open,
  onOpenChange,
  entityId,
  onSuccess,
}: AddBankAccountDialogProps) {
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setBankName("");
    setAccountName("");
    setAccountType("checking");
    setRoutingNumber("");
    setAccountNumber("");
    setNickname("");
    setIsPrimary(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName.trim()) {
      toast.error("Bank name is required");
      return;
    }

    if (!accountName.trim()) {
      toast.error("Account name is required");
      return;
    }

    if (!routingNumber.trim() || routingNumber.length !== 9) {
      toast.error("Valid 9-digit routing number is required");
      return;
    }

    if (!accountNumber.trim()) {
      toast.error("Account number is required");
      return;
    }

    setCreating(true);
    try {
      await createBankAccount(entityId, {
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountType,
        routingNumber: routingNumber.trim(),
        accountNumber: accountNumber.trim(),
        nickname: nickname.trim() || undefined,
        isPrimary,
      });

      toast.success("Bank account added successfully");
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add bank account");
    } finally {
      setCreating(false);
    }
  };

  const formatRouting = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 9);
  };

  const formatAccount = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 17);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-green-600" />
            </div>
            Add Bank Account
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g., Chase, Bank of America"
              className="w-full"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Account Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Name on the account"
              className="w-full"
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Account Type
            </label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {BANK_ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Routing and Account Numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Routing Number <span className="text-red-500">*</span>
              </label>
              <Input
                value={routingNumber}
                onChange={(e) => setRoutingNumber(formatRouting(e.target.value))}
                placeholder="9 digits"
                className="w-full font-mono"
                maxLength={9}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Account Number <span className="text-red-500">*</span>
              </label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(formatAccount(e.target.value))}
                placeholder="Account number"
                className="w-full font-mono"
                maxLength={17}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground -mt-2">
            Account numbers are stored encrypted with access logging
          </p>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nickname
            </label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Optional internal reference name"
              className="w-full"
            />
          </div>

          {/* Primary Account */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isPrimary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <label htmlFor="isPrimary" className="text-sm text-foreground cursor-pointer">
              Set as primary account
            </label>
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
                  Adding...
                </>
              ) : (
                "Add Account"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
