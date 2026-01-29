"use client";

import { useState } from "react";
import {
  X,
  Landmark,
  Building2,
  Calendar,
  Edit2,
  Check,
  Eye,
  EyeOff,
  Wallet,
  Users,
  FileText,
  Briefcase,
  Plus,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  type InternalEntityDetail,
  type BankAccountMasked,
  updateInternalEntity,
  deleteInternalEntity,
  revealEin,
  revealBankNumbers,
  deleteBankAccount,
  deleteEntitySigner,
  getStatusColor,
  getEntityTypeColor,
  formatEinWithDash,
} from "@/lib/internal-entities-api";

interface EntityDetailPanelProps {
  entity: InternalEntityDetail | null;
  loading: boolean;
  onClose: () => void;
  onUpdate: (entity: InternalEntityDetail) => void;
  onDelete: () => void;
  onAddBankAccount: () => void;
  onAddSigner: () => void;
  onRefresh: () => void;
}

export function EntityDetailPanel({
  entity,
  loading,
  onClose,
  onUpdate,
  onDelete,
  onAddBankAccount,
  onAddSigner,
  onRefresh,
}: EntityDetailPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["summary", "tax", "banking", "signers"])
  );
  const [revealedEin, setRevealedEin] = useState<string | null>(null);
  const [revealingEin, setRevealingEin] = useState(false);
  const [revealedBankAccounts, setRevealedBankAccounts] = useState<Map<number, { routing: string; account: string }>>(new Map());
  const [revealingBankId, setRevealingBankId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleRevealEin = async () => {
    if (!entity) return;

    if (revealedEin) {
      setRevealedEin(null);
      return;
    }

    setRevealingEin(true);
    try {
      const result = await revealEin(entity.id);
      if (result.ein) {
        setRevealedEin(result.ein);
        toast.success("EIN revealed - this action has been logged");
      } else {
        toast.info("No EIN on file for this entity");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reveal EIN");
    } finally {
      setRevealingEin(false);
    }
  };

  const handleRevealBankNumbers = async (bankId: number) => {
    if (revealedBankAccounts.has(bankId)) {
      const newMap = new Map(revealedBankAccounts);
      newMap.delete(bankId);
      setRevealedBankAccounts(newMap);
      return;
    }

    setRevealingBankId(bankId);
    try {
      const result = await revealBankNumbers(bankId);
      if (result.routingNumber && result.accountNumber) {
        setRevealedBankAccounts(new Map(revealedBankAccounts).set(bankId, {
          routing: result.routingNumber,
          account: result.accountNumber,
        }));
        toast.success("Bank numbers revealed - this action has been logged");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reveal bank numbers");
    } finally {
      setRevealingBankId(null);
    }
  };

  const handleDeleteBankAccount = async (bankId: number, bankName: string) => {
    if (!confirm(`Are you sure you want to remove the ${bankName} account?`)) return;

    try {
      await deleteBankAccount(bankId);
      toast.success("Bank account removed");
      onRefresh();
    } catch (error) {
      toast.error("Failed to remove bank account");
    }
  };

  const handleDeleteSigner = async (signerId: number, signerName: string) => {
    if (!confirm(`Are you sure you want to remove ${signerName} as a signer?`)) return;

    try {
      await deleteEntitySigner(signerId);
      toast.success("Signer removed");
      onRefresh();
    } catch (error) {
      toast.error("Failed to remove signer");
    }
  };

  const handleDeleteEntity = async () => {
    if (!entity) return;
    if (!confirm(`Are you sure you want to delete "${entity.displayName}"? This will mark it as dissolved.`)) return;

    setDeleting(true);
    try {
      await deleteInternalEntity(entity.id);
      toast.success("Entity deleted");
      onDelete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete entity");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyEin = async () => {
    if (!entity) return;

    const einToCopy = revealedEin || entity.einLast4;
    if (!einToCopy) {
      toast.error("No EIN to copy");
      return;
    }

    const textToCopy = revealedEin ? formatEinWithDash(revealedEin) : entity.einLast4;

    try {
      await navigator.clipboard.writeText(textToCopy || "");
      toast.success(revealedEin ? "EIN copied to clipboard" : "Last 4 digits copied");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="w-[460px] bg-card border-l border-border/80 flex flex-col shadow-xl shadow-slate-200/50">
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 bg-muted rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 bg-muted rounded-lg" />
                <div className="h-4 w-32 bg-muted rounded-lg" />
              </div>
            </div>
            <div className="h-40 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="w-[460px] bg-card border-l border-border/80 flex items-center justify-center shadow-xl shadow-slate-200/50">
        <div className="text-center p-12">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <Landmark className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <p className="text-muted-foreground">Select an entity to view details</p>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(entity.status);
  const typeColor = getEntityTypeColor(entity.entityType);

  return (
    <div className="w-[460px] bg-card border-l border-border/80 flex flex-col overflow-hidden shadow-xl shadow-slate-200/50">
      {/* Premium Header */}
      <div className="px-8 py-6 bg-gradient-to-b from-slate-50 to-white border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Landmark className="h-7 w-7 text-white" />
            </div>
            <div className="pt-1">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">{entity.displayName}</h2>
              {entity.nameShort && entity.nameShort !== entity.displayName && (
                <p className="text-sm text-muted-foreground mt-0.5">{entity.nameLegal}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDeleteEntity}
              disabled={deleting}
              className="h-9 w-9 rounded-xl hover:bg-red-50 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-all duration-200 disabled:opacity-50"
              title="Delete entity"
            >
              {deleting ? (
                <span className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-muted-foreground transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status and Type Badges */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${statusColor}`}>
            {entity.statusLabel}
          </span>
          <span className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${typeColor}`}>
            {entity.entityTypeLabel}
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Summary Section */}
        <CollapsibleSection
          title="Summary"
          icon={<Landmark className="h-4 w-4" />}
          isExpanded={expandedSections.has("summary")}
          onToggle={() => toggleSection("summary")}
        >
          <div className="space-y-4">
            <EditableField
              label="Legal Name"
              value={entity.nameLegal}
              onSave={async (value) => {
                const updated = await updateInternalEntity(entity.id, { nameLegal: value });
                onUpdate(updated);
              }}
            />
            <EditableField
              label="Short Name"
              value={entity.nameShort || ""}
              placeholder="Optional display name"
              onSave={async (value) => {
                const updated = await updateInternalEntity(entity.id, { nameShort: value || undefined });
                onUpdate(updated);
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <InfoField
                label="Jurisdiction"
                icon={<Building2 className="h-3.5 w-3.5" />}
                value={entity.fullJurisdiction || "—"}
              />
              <InfoField
                label="Formation Date"
                icon={<Calendar className="h-3.5 w-3.5" />}
                value={entity.formationDate ? new Date(entity.formationDate).toLocaleDateString() : "—"}
              />
            </div>
            <EditableField
              label="Primary Address"
              value={entity.primaryAddress || ""}
              placeholder="Enter address"
              multiline
              onSave={async (value) => {
                const updated = await updateInternalEntity(entity.id, { primaryAddress: value || undefined });
                onUpdate(updated);
              }}
            />
            <EditableField
              label="Mailing Address"
              value={entity.mailingAddress || ""}
              placeholder="Same as primary if blank"
              multiline
              onSave={async (value) => {
                const updated = await updateInternalEntity(entity.id, { mailingAddress: value || undefined });
                onUpdate(updated);
              }}
            />
          </div>
        </CollapsibleSection>

        {/* Tax & Compliance Section */}
        <CollapsibleSection
          title="Tax & Compliance"
          icon={<Shield className="h-4 w-4" />}
          isExpanded={expandedSections.has("tax")}
          onToggle={() => toggleSection("tax")}
        >
          <div className="space-y-4">
            {/* EIN Card */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">EIN</label>
                {entity.einPresent && (
                  <button
                    onClick={handleRevealEin}
                    disabled={revealingEin}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {revealingEin ? (
                      <span className="h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : revealedEin ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {revealedEin ? "Hide" : "Reveal"}
                  </button>
                )}
              </div>
              {entity.einPresent ? (
                <button
                  onClick={handleCopyEin}
                  className="group flex items-center gap-2 text-left"
                  title="Click to copy"
                >
                  <span className="font-mono text-lg font-medium text-foreground">
                    {revealedEin ? formatEinWithDash(revealedEin) : formatEinWithDash(entity.einMasked)}
                  </span>
                  <Copy className="h-4 w-4 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <span className="font-mono text-lg text-muted-foreground">Not set</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoField
                label="Tax Classification"
                value={entity.taxClassificationLabel || "—"}
              />
              {entity.sCorpEffectiveDate && (
                <InfoField
                  label="S-Corp Effective"
                  value={new Date(entity.sCorpEffectiveDate).toLocaleDateString()}
                />
              )}
            </div>

            <EditableField
              label="Registered Agent"
              value={entity.registeredAgentName || ""}
              placeholder="Agent name"
              onSave={async (value) => {
                const updated = await updateInternalEntity(entity.id, { registeredAgentName: value || undefined });
                onUpdate(updated);
              }}
            />
            {entity.registeredAgentName && (
              <EditableField
                label="Agent Address"
                value={entity.registeredAgentAddress || ""}
                placeholder="Agent address"
                multiline
                onSave={async (value) => {
                  const updated = await updateInternalEntity(entity.id, { registeredAgentAddress: value || undefined });
                  onUpdate(updated);
                }}
              />
            )}
          </div>
        </CollapsibleSection>

        {/* Banking Section */}
        <CollapsibleSection
          title="Bank Accounts"
          icon={<Wallet className="h-4 w-4" />}
          isExpanded={expandedSections.has("banking")}
          onToggle={() => toggleSection("banking")}
          action={
            <button
              onClick={(e) => { e.stopPropagation(); onAddBankAccount(); }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          }
        >
          {entity.bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                <Wallet className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">No bank accounts linked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entity.bankAccounts.map((account) => (
                <BankAccountCard
                  key={account.id}
                  account={account}
                  revealed={revealedBankAccounts.get(account.id)}
                  revealing={revealingBankId === account.id}
                  onReveal={() => handleRevealBankNumbers(account.id)}
                  onDelete={() => handleDeleteBankAccount(account.id, account.bankName)}
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Signers Section */}
        <CollapsibleSection
          title="Authorized Signers"
          icon={<Users className="h-4 w-4" />}
          isExpanded={expandedSections.has("signers")}
          onToggle={() => toggleSection("signers")}
          action={
            <button
              onClick={(e) => { e.stopPropagation(); onAddSigner(); }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          }
        >
          {entity.signers.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">No authorized signers</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entity.signers.map((signer) => (
                <div
                  key={signer.id}
                  className="group flex items-center justify-between p-4 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                >
                  <div>
                    <Link
                      href={`/people?id=${signer.personId}`}
                      className="font-medium text-sm text-foreground hover:text-indigo-600 transition-colors"
                    >
                      {signer.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{signer.roleLabel}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSigner(signer.id, signer.fullName)}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Remove signer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Documents Section */}
        <CollapsibleSection
          title={`Documents (${entity.documentsCount})`}
          icon={<FileText className="h-4 w-4" />}
          isExpanded={expandedSections.has("documents")}
          onToggle={() => toggleSection("documents")}
        >
          {entity.documents.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">No documents linked</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entity.documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents?id=${doc.id}`}
                  className="group flex items-center gap-3 p-3 hover:bg-muted rounded-xl transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <FileText className="h-5 w-5 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {doc.title || doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{doc.category}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground/60 group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))}
              {entity.documentsCount > entity.documents.length && (
                <Link
                  href={`/documents?linkableType=InternalEntity&linkableId=${entity.id}`}
                  className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-3 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  View all {entity.documentsCount} documents
                </Link>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* Linked Deals Section */}
        {entity.linkedDeals.length > 0 && (
          <CollapsibleSection
            title="Linked Deals"
            icon={<Briefcase className="h-4 w-4" />}
            isExpanded={expandedSections.has("deals")}
            onToggle={() => toggleSection("deals")}
          >
            <div className="space-y-2">
              {entity.linkedDeals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="group flex items-center gap-3 p-3 hover:bg-muted rounded-xl transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {deal.name}
                    </p>
                    {deal.company && (
                      <p className="text-xs text-muted-foreground">{deal.company}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-muted rounded-md">{deal.status}</span>
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Notes Section */}
        <CollapsibleSection
          title="Notes"
          icon={<Edit2 className="h-4 w-4" />}
          isExpanded={expandedSections.has("notes")}
          onToggle={() => toggleSection("notes")}
        >
          <EditableField
            value={entity.notes || ""}
            placeholder="Add notes about this entity..."
            multiline
            onSave={async (value) => {
              const updated = await updateInternalEntity(entity.id, { notes: value || undefined });
              onUpdate(updated);
            }}
          />
        </CollapsibleSection>

        {/* Footer Meta */}
        <div className="px-6 py-5 bg-muted/50 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Created {new Date(entity.createdAt).toLocaleDateString()}</span>
            <span>Updated {new Date(entity.updatedAt).toLocaleDateString()}</span>
          </div>
          {entity.createdBy && (
            <p className="mt-1 text-xs text-muted-foreground">By {entity.createdBy.name}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Info Field Component (read-only)
function InfoField({ label, icon, value }: { label: string; icon?: React.ReactNode; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-center gap-2 text-sm text-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span>{value}</span>
      </div>
    </div>
  );
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  action,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-sm font-medium text-foreground text-left"
        >
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </button>
        <div className="flex items-center gap-2">
          {action}
          <button
            onClick={onToggle}
            className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-6 pb-5">
          {children}
        </div>
      )}
    </div>
  );
}

// Editable Field Component
interface EditableFieldProps {
  label?: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  onSave: (value: string) => Promise<void>;
}

function EditableField({
  label,
  value,
  placeholder,
  multiline,
  onSave,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
      toast.success("Updated successfully");
    } catch (error) {
      toast.error("Failed to update");
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div>
        {label && <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>}
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none transition-all duration-200"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all duration-200"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 w-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            className="h-9 w-9 rounded-lg bg-muted text-muted-foreground hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>}
      <button
        onClick={() => {
          setEditValue(value);
          setEditing(true);
        }}
        className="w-full flex items-center justify-between group text-left py-1.5 px-1 -mx-1 rounded-lg hover:bg-muted transition-colors"
      >
        <span className={`text-sm ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value || placeholder || "Click to edit"}
        </span>
        <Edit2 className="h-3.5 w-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

// Bank Account Card Component
interface BankAccountCardProps {
  account: BankAccountMasked;
  revealed?: { routing: string; account: string };
  revealing: boolean;
  onReveal: () => void;
  onDelete: () => void;
}

function BankAccountCard({
  account,
  revealed,
  revealing,
  onReveal,
  onDelete,
}: BankAccountCardProps) {
  const isActive = account.status === "active";

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${
      isActive
        ? "bg-card border-border hover:border-border hover:shadow-sm"
        : "bg-muted border-border"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            isActive ? "bg-gradient-to-br from-green-50 to-emerald-50" : "bg-muted"
          }`}>
            <Wallet className={`h-5 w-5 ${isActive ? "text-green-600" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{account.bankName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">{account.accountTypeLabel}</span>
              {account.isPrimary && (
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-semibold uppercase tracking-wide">
                  Primary
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onReveal}
            disabled={revealing}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50"
            title={revealed ? "Hide numbers" : "Reveal numbers"}
          >
            {revealing ? (
              <span className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin block" />
            ) : revealed ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all duration-200"
            title="Remove account"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Routing</span>
          <p className="font-mono text-sm text-foreground mt-1">
            {revealed ? revealed.routing : account.routingMasked || "••••••••"}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</span>
          <p className="font-mono text-sm text-foreground mt-1">
            {revealed ? revealed.account : account.accountMasked || "••••••••"}
          </p>
        </div>
      </div>

      {account.nickname && (
        <p className="mt-3 text-xs text-muted-foreground pt-3 border-t border-border">{account.nickname}</p>
      )}
    </div>
  );
}
