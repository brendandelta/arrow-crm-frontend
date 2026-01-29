"use client";

import { useState, useCallback } from "react";
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
  MapPin,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  type InternalEntityDetail,
  type BankAccountMasked,
  updateInternalEntity,
  revealEin,
  revealBankNumbers,
  deleteBankAccount,
  deleteEntitySigner,
  getStatusColor,
  getEntityTypeColor,
  ENTITY_TYPES,
  ENTITY_STATUSES,
  TAX_CLASSIFICATIONS,
  US_STATES,
} from "@/lib/internal-entities-api";

interface EntityDetailPanelProps {
  entity: InternalEntityDetail | null;
  loading: boolean;
  onClose: () => void;
  onUpdate: (entity: InternalEntityDetail) => void;
  onAddBankAccount: () => void;
  onAddSigner: () => void;
  onRefresh: () => void;
}

export function EntityDetailPanel({
  entity,
  loading,
  onClose,
  onUpdate,
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

  if (loading) {
    return (
      <div className="w-[420px] bg-white border-l border-slate-200/60 flex flex-col">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-slate-100 rounded" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-32 bg-slate-50 rounded-xl" />
            <div className="h-32 bg-slate-50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="w-[420px] bg-white border-l border-slate-200/60 flex items-center justify-center">
        <p className="text-slate-500">Select an entity to view details</p>
      </div>
    );
  }

  const statusColor = getStatusColor(entity.status);
  const typeColor = getEntityTypeColor(entity.entityType);

  return (
    <div className="w-[420px] bg-white border-l border-slate-200/60 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{entity.displayName}</h2>
              {entity.nameShort && entity.nameShort !== entity.displayName && (
                <p className="text-sm text-slate-500">{entity.nameLegal}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status and Type Badges */}
        <div className="flex items-center gap-2 mt-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusColor}`}>
            {entity.statusLabel}
          </span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${typeColor}`}>
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
          <div className="space-y-3">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Jurisdiction</label>
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{entity.fullJurisdiction || "—"}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Formation Date</label>
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{entity.formationDate ? new Date(entity.formationDate).toLocaleDateString() : "—"}</span>
                </div>
              </div>
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
          icon={<FileText className="h-4 w-4" />}
          isExpanded={expandedSections.has("tax")}
          onToggle={() => toggleSection("tax")}
        >
          <div className="space-y-3">
            {/* EIN with Reveal */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">EIN (Employer ID Number)</label>
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono text-sm text-slate-700">
                  {revealedEin ? revealedEin : entity.einMasked || "Not set"}
                </span>
                {entity.einPresent && (
                  <button
                    onClick={handleRevealEin}
                    disabled={revealingEin}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                  >
                    {revealingEin ? (
                      <span className="h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : revealedEin ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {revealedEin ? "Hide" : "Reveal"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tax Classification</label>
                <p className="text-sm text-slate-700">
                  {entity.taxClassificationLabel || "—"}
                </p>
              </div>
              {entity.sCorpEffectiveDate && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">S-Corp Effective</label>
                  <p className="text-sm text-slate-700">
                    {new Date(entity.sCorpEffectiveDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Registered Agent */}
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
              onClick={onAddBankAccount}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          }
        >
          {entity.bankAccounts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No bank accounts linked
            </p>
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
              onClick={onAddSigner}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          }
        >
          {entity.signers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No authorized signers
            </p>
          ) : (
            <div className="space-y-2">
              {entity.signers.map((signer) => (
                <div
                  key={signer.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <Link
                      href={`/people?id=${signer.personId}`}
                      className="font-medium text-sm text-slate-900 hover:text-indigo-600"
                    >
                      {signer.fullName}
                    </Link>
                    <p className="text-xs text-slate-500">{signer.roleLabel}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSigner(signer.id, signer.fullName)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
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
            <p className="text-sm text-slate-500 text-center py-4">
              No documents linked
            </p>
          ) : (
            <div className="space-y-2">
              {entity.documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents?id=${doc.id}`}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {doc.title || doc.name}
                    </p>
                    <p className="text-xs text-slate-500">{doc.category}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </Link>
              ))}
              {entity.documentsCount > entity.documents.length && (
                <Link
                  href={`/documents?linkableType=InternalEntity&linkableId=${entity.id}`}
                  className="block text-center text-xs text-indigo-600 hover:text-indigo-700 py-2"
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
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {deal.name}
                    </p>
                    {deal.company && (
                      <p className="text-xs text-slate-500">{deal.company}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 capitalize">{deal.status}</span>
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
        <div className="px-5 py-4 text-xs text-slate-400 border-t border-slate-100">
          <div className="flex justify-between">
            <span>Created {new Date(entity.createdAt).toLocaleDateString()}</span>
            <span>Updated {new Date(entity.updatedAt).toLocaleDateString()}</span>
          </div>
          {entity.createdBy && (
            <p className="mt-1">By {entity.createdBy.name}</p>
          )}
        </div>
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
    <div className="border-b border-slate-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {icon}
          {title}
        </div>
        <div className="flex items-center gap-2">
          {action && (
            <div onClick={(e) => e.stopPropagation()}>
              {action}
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-5 pb-4">
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
        {label && <label className="block text-xs text-slate-500 mb-1">{label}</label>}
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
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
            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && <label className="block text-xs text-slate-500 mb-1">{label}</label>}
      <button
        onClick={() => {
          setEditValue(value);
          setEditing(true);
        }}
        className="w-full flex items-center justify-between group text-left"
      >
        <span className={`text-sm ${value ? "text-slate-700" : "text-slate-400"}`}>
          {value || placeholder || "Click to edit"}
        </span>
        <Edit2 className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
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
    <div className={`p-3 rounded-lg border ${isActive ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100"}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isActive ? "bg-green-50" : "bg-slate-100"}`}>
            <Wallet className={`h-4 w-4 ${isActive ? "text-green-600" : "text-slate-400"}`} />
          </div>
          <div>
            <p className="font-medium text-sm text-slate-900">{account.bankName}</p>
            <p className="text-xs text-slate-500">
              {account.accountTypeLabel}
              {account.isPrimary && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-medium">
                  PRIMARY
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onReveal}
            disabled={revealing}
            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
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
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            title="Remove account"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Routing</span>
          <p className="font-mono text-slate-700">
            {revealed ? revealed.routing : account.routingMasked || "••••••••"}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Account</span>
          <p className="font-mono text-slate-700">
            {revealed ? revealed.account : account.accountMasked || "••••••••"}
          </p>
        </div>
      </div>

      {account.nickname && (
        <p className="mt-2 text-xs text-slate-500">{account.nickname}</p>
      )}
    </div>
  );
}
