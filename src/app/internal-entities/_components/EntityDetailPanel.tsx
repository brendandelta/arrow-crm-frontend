"use client";

import { useState, useEffect, useRef } from "react";
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
  Search,
  Loader2,
  GitBranch,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { LinkedObjectsSection } from "./LinkedObjectsSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UniversalDocumentUploader } from "@/components/documents/UniversalDocumentUploader";
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
  const [showUploadDialog, setShowUploadDialog] = useState(false);

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
      <div className="w-[460px] bg-white border-l border-slate-200/80 flex flex-col shadow-xl shadow-slate-200/50">
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 bg-slate-100 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 bg-slate-100 rounded-lg" />
                <div className="h-4 w-32 bg-slate-50 rounded-lg" />
              </div>
            </div>
            <div className="h-40 bg-slate-50 rounded-2xl" />
            <div className="h-32 bg-slate-50 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="w-[460px] bg-white border-l border-slate-200/80 flex items-center justify-center shadow-xl shadow-slate-200/50">
        <div className="text-center p-12">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Landmark className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-slate-500">Select an entity to view details</p>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(entity.status);
  const typeColor = getEntityTypeColor(entity.entityType);

  return (
    <div className="w-[460px] bg-white border-l border-slate-200/80 flex flex-col overflow-hidden shadow-xl shadow-slate-200/50">
      {/* Premium Header */}
      <div className="px-8 py-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Landmark className="h-7 w-7 text-white" />
            </div>
            <div className="pt-1">
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{entity.displayName}</h2>
              {entity.nameShort && entity.nameShort !== entity.displayName && (
                <p className="text-sm text-slate-500 mt-0.5">{entity.nameLegal}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDeleteEntity}
              disabled={deleting}
              className="h-9 w-9 rounded-xl hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all duration-200 disabled:opacity-50"
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
              className="h-9 w-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status and Type Badges - Clickable to edit */}
        <div className="flex items-center gap-2">
          <EditableSelectBadge
            value={entity.status}
            label={entity.statusLabel}
            options={ENTITY_STATUSES}
            colorClass={statusColor}
            rounded="full"
            onSave={async (value) => {
              const updated = await updateInternalEntity(entity.id, { status: value });
              onUpdate(updated);
            }}
          />
          <EditableSelectBadge
            value={entity.entityType}
            label={entity.entityTypeLabel}
            options={ENTITY_TYPES}
            colorClass={typeColor}
            rounded="lg"
            onSave={async (value) => {
              const updated = await updateInternalEntity(entity.id, { entityType: value });
              onUpdate(updated);
            }}
          />
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
              <EditableSelectField
                label="Jurisdiction"
                icon={<Building2 className="h-3.5 w-3.5" />}
                value={entity.jurisdictionState || ""}
                options={US_STATES}
                placeholder="Select state"
                onSave={async (value) => {
                  const updated = await updateInternalEntity(entity.id, { jurisdictionState: value || undefined });
                  onUpdate(updated);
                }}
              />
              <EditableDateField
                label="Formation Date"
                icon={<Calendar className="h-3.5 w-3.5" />}
                value={entity.formationDate || ""}
                onSave={async (value) => {
                  const updated = await updateInternalEntity(entity.id, { formationDate: value || undefined });
                  onUpdate(updated);
                }}
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

        {/* Entity Hierarchy Section */}
        <CollapsibleSection
          title="Entity Hierarchy"
          icon={<GitBranch className="h-4 w-4" />}
          isExpanded={expandedSections.has("hierarchy")}
          onToggle={() => toggleSection("hierarchy")}
        >
          <div className="space-y-4">
            {/* Parent Entity */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Parent Entity
              </label>
              <ParentEntitySelector
                entityId={entity.id}
                currentParentId={entity.parentEntityId}
                currentParent={entity.parentEntity}
                onUpdate={onUpdate}
              />
            </div>

            {/* Series LLC Toggle */}
            {(entity.entityType === 'series_llc' || entity.entityType === 'llc') && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <label className="text-sm font-medium text-foreground">Series LLC</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This entity is a Series LLC structure
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const updated = await updateInternalEntity(entity.id, { isSeriesLlc: !entity.isSeriesLlc });
                      onUpdate(updated);
                      toast.success(updated.isSeriesLlc ? "Marked as Series LLC" : "Unmarked as Series LLC");
                    } catch {
                      toast.error("Failed to update");
                    }
                  }}
                  className={`p-1 rounded-lg transition-colors ${
                    entity.isSeriesLlc
                      ? "text-indigo-600 hover:bg-indigo-50"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {entity.isSeriesLlc ? (
                    <ToggleRight className="h-8 w-8" />
                  ) : (
                    <ToggleLeft className="h-8 w-8" />
                  )}
                </button>
              </div>
            )}

            {/* Default Fund Info */}
            {entity.defaultFundId && (
              <InfoField
                label="Default Fund"
                icon={<Building2 className="h-3.5 w-3.5" />}
                value={`Fund #${entity.defaultFundId}`}
              />
            )}
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
            {/* EIN Card - Editable */}
            <EditableEinField
              entityId={entity.id}
              einMasked={entity.einMasked}
              einPresent={entity.einPresent}
              revealedEin={revealedEin}
              revealingEin={revealingEin}
              onReveal={handleRevealEin}
              onCopy={handleCopyEin}
              onUpdate={onUpdate}
            />

            <div className="grid grid-cols-2 gap-4">
              <EditableSelectField
                label="Tax Classification"
                value={entity.taxClassification || ""}
                options={TAX_CLASSIFICATIONS}
                placeholder="Select classification"
                onSave={async (value) => {
                  const updated = await updateInternalEntity(entity.id, { taxClassification: value || undefined });
                  onUpdate(updated);
                }}
              />
              <EditableDateField
                label="S-Corp Effective"
                value={entity.sCorpEffectiveDate || ""}
                placeholder="Not applicable"
                onSave={async (value) => {
                  const updated = await updateInternalEntity(entity.id, { sCorpEffectiveDate: value || undefined });
                  onUpdate(updated);
                }}
              />
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
          {(entity.bankAccounts ?? []).length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-slate-50 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No bank accounts linked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(entity.bankAccounts ?? []).map((account) => (
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
          {(entity.signers ?? []).length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-slate-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No authorized signers</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(entity.signers ?? []).map((signer) => (
                <div
                  key={signer.id}
                  className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-colors"
                >
                  <div>
                    <Link
                      href={`/people?id=${signer.personId}`}
                      className="font-medium text-sm text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {signer.fullName}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">{signer.roleLabel}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSigner(signer.id, signer.fullName)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
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
          action={
            <button
              onClick={(e) => { e.stopPropagation(); setShowUploadDialog(true); }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Upload
            </button>
          }
        >
          {(entity.documents ?? []).length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-slate-50 flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No documents linked</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(entity.documents ?? []).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents?id=${doc.id}`}
                  className="group flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <FileText className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {doc.title || doc.name}
                    </p>
                    <p className="text-xs text-slate-500">{doc.category}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))}
              {entity.documentsCount > (entity.documents ?? []).length && (
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
        {(entity.linkedDeals ?? []).length > 0 && (
          <CollapsibleSection
            title="Linked Deals"
            icon={<Briefcase className="h-4 w-4" />}
            isExpanded={expandedSections.has("deals")}
            onToggle={() => toggleSection("deals")}
          >
            <div className="space-y-2">
              {(entity.linkedDeals ?? []).map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="group flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <Briefcase className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {deal.name}
                    </p>
                    {deal.company && (
                      <p className="text-xs text-slate-500">{deal.company}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 capitalize px-2 py-1 bg-slate-100 rounded-md">{deal.status}</span>
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Linked Objects Section */}
        <LinkedObjectsSection entityId={entity.id} entityName={entity.displayName} onRefresh={onRefresh} />

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
        <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Created {new Date(entity.createdAt).toLocaleDateString()}</span>
            <span>Updated {new Date(entity.updatedAt).toLocaleDateString()}</span>
          </div>
          {entity.createdBy && (
            <p className="mt-1 text-xs text-slate-400">By {entity.createdBy.name}</p>
          )}
        </div>
      </div>

      {/* Document Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document for {entity.displayName}</DialogTitle>
          </DialogHeader>
          <UniversalDocumentUploader
            defaultLinks={[
              {
                linkableType: "InternalEntity",
                linkableId: entity.id,
                linkableLabel: entity.displayName,
                relationship: "general",
              },
            ]}
            onSuccess={() => {
              setShowUploadDialog(false);
              onRefresh();
              toast.success("Document uploaded and linked");
            }}
            onCancel={() => setShowUploadDialog(false)}
            compact
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Info Field Component (read-only)
function InfoField({ label, icon, value }: { label: string; icon?: React.ReactNode; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-center gap-2 text-sm text-slate-700">
        {icon && <span className="text-slate-400">{icon}</span>}
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
    <div className="border-b border-slate-100">
      <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-sm font-medium text-slate-700 text-left"
        >
          <span className="text-slate-400">{icon}</span>
          {title}
        </button>
        <div className="flex items-center gap-2">
          {action}
          <button
            onClick={onToggle}
            className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
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
        {label && <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none transition-all duration-200"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all duration-200"
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
            className="h-9 w-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
      <button
        onClick={() => {
          setEditValue(value);
          setEditing(true);
        }}
        className="w-full flex items-center justify-between group text-left py-1.5 px-1 -mx-1 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <span className={`text-sm ${value ? "text-slate-700" : "text-slate-400"}`}>
          {value || placeholder || "Click to edit"}
        </span>
        <Edit2 className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
        : "bg-slate-50 border-slate-100"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            isActive ? "bg-gradient-to-br from-green-50 to-emerald-50" : "bg-slate-100"
          }`}>
            <Wallet className={`h-5 w-5 ${isActive ? "text-green-600" : "text-slate-400"}`} />
          </div>
          <div>
            <p className="font-medium text-sm text-slate-900">{account.bankName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500">{account.accountTypeLabel}</span>
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
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50"
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
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
            title="Remove account"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Routing</span>
          <p className="font-mono text-sm text-slate-700 mt-1">
            {revealed ? revealed.routing : account.routingMasked || "••••••••"}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Account</span>
          <p className="font-mono text-sm text-slate-700 mt-1">
            {revealed ? revealed.account : account.accountMasked || "••••••••"}
          </p>
        </div>
      </div>

      {account.nickname && (
        <p className="mt-3 text-xs text-slate-500 pt-3 border-t border-slate-100">{account.nickname}</p>
      )}
    </div>
  );
}

// Editable Select Badge Component (for status/type in header)
interface EditableSelectBadgeProps {
  value: string;
  label: string;
  options: { value: string; label: string }[];
  colorClass: string;
  rounded?: "full" | "lg";
  onSave: (value: string) => Promise<void>;
}

function EditableSelectBadge({
  value,
  label,
  options,
  colorClass,
  rounded = "lg",
  onSave,
}: EditableSelectBadgeProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = async (newValue: string) => {
    if (newValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(newValue);
      setEditing(false);
      toast.success("Updated successfully");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div ref={ref} className="relative">
        <div className={`px-3 py-1.5 text-xs font-medium rounded-${rounded} border ${colorClass} flex items-center gap-1`}>
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span>{label}</span>
          )}
          <ChevronDown className="h-3 w-3" />
        </div>
        <div className="absolute z-20 mt-1 min-w-[140px] bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              disabled={saving}
              className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 ${
                option.value === value ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`px-3 py-1.5 text-xs font-medium rounded-${rounded} border ${colorClass} hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1`}
      title="Click to edit"
    >
      <span>{label}</span>
      <Edit2 className="h-2.5 w-2.5 opacity-50" />
    </button>
  );
}

// Editable Select Field Component (for dropdowns)
interface EditableSelectFieldProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
}

function EditableSelectField({
  label,
  icon,
  value,
  options,
  placeholder,
  onSave,
}: EditableSelectFieldProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const displayValue = selectedOption?.label || placeholder || "—";

  const handleSelect = async (newValue: string) => {
    if (newValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(newValue);
      setEditing(false);
      toast.success("Updated successfully");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={ref}>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {editing ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => handleSelect(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 bg-white appearance-none cursor-pointer disabled:opacity-50"
            autoFocus
          >
            <option value="">{placeholder || "Select..."}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          {saving && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-600" />
          )}
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full flex items-center justify-between group text-left py-1.5 px-1 -mx-1 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-slate-700">
            {icon && <span className="text-slate-400">{icon}</span>}
            <span className={value ? "text-slate-700" : "text-slate-400"}>{displayValue}</span>
          </div>
          <Edit2 className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
    </div>
  );
}

// Editable Date Field Component
interface EditableDateFieldProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
}

function EditableDateField({
  label,
  icon,
  value,
  placeholder,
  onSave,
}: EditableDateFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ? value.split("T")[0] : "");
  const [saving, setSaving] = useState(false);

  const displayValue = value
    ? new Date(value).toLocaleDateString()
    : placeholder || "—";

  const handleSave = async () => {
    if (editValue === (value ? value.split("T")[0] : "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
      toast.success("Updated successfully");
    } catch {
      toast.error("Failed to update");
      setEditValue(value ? value.split("T")[0] : "");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 w-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              setEditValue(value ? value.split("T")[0] : "");
              setEditing(false);
            }}
            className="h-9 w-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <button
        onClick={() => {
          setEditValue(value ? value.split("T")[0] : "");
          setEditing(true);
        }}
        className="w-full flex items-center justify-between group text-left py-1.5 px-1 -mx-1 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className={value ? "text-slate-700" : "text-slate-400"}>{displayValue}</span>
        </div>
        <Edit2 className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

// Editable EIN Field Component
interface EditableEinFieldProps {
  entityId: number;
  einMasked: string | null;
  einPresent: boolean;
  revealedEin: string | null;
  revealingEin: boolean;
  onReveal: () => void;
  onCopy: () => void;
  onUpdate: (entity: InternalEntityDetail) => void;
}

function EditableEinField({
  entityId,
  einMasked,
  einPresent,
  revealedEin,
  revealingEin,
  onReveal,
  onCopy,
  onUpdate,
}: EditableEinFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Clean the EIN (remove dashes and spaces)
    const cleanedEin = editValue.replace(/[\s-]/g, "");

    // Validate: must be 9 digits or empty
    if (cleanedEin && (cleanedEin.length !== 9 || !/^\d+$/.test(cleanedEin))) {
      toast.error("EIN must be 9 digits");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateInternalEntity(entityId, { ein: cleanedEin || undefined });
      onUpdate(updated);
      setEditing(false);
      setEditValue("");
      toast.success(cleanedEin ? "EIN updated" : "EIN removed");
    } catch {
      toast.error("Failed to update EIN");
    } finally {
      setSaving(false);
    }
  };

  const formatInput = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "").slice(0, 9);
    // Format as XX-XXXXXXX
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    return digits;
  };

  if (editing) {
    return (
      <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          EIN
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(formatInput(e.target.value))}
            placeholder="XX-XXXXXXX"
            className="flex-1 px-3 py-2 font-mono text-lg border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 w-10 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              setEditValue("");
              setEditing(false);
            }}
            className="h-10 w-10 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Enter 9 digits, leave blank to remove</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">EIN</label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
          {einPresent && (
            <button
              onClick={onReveal}
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
      </div>
      {einPresent ? (
        <button
          onClick={onCopy}
          className="group flex items-center gap-2 text-left"
          title="Click to copy"
        >
          <span className="font-mono text-lg font-medium text-slate-900">
            {revealedEin ? formatEinWithDash(revealedEin) : formatEinWithDash(einMasked)}
          </span>
          <Copy className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="font-mono text-lg text-slate-400 hover:text-indigo-600 transition-colors"
        >
          Click to add EIN
        </button>
      )}
    </div>
  );
}

// Parent Entity Selector Component
interface ParentEntitySelectorProps {
  entityId: number;
  currentParentId: number | null;
  currentParent?: { id: number; displayName: string; entityType: string } | null;
  onUpdate: (entity: InternalEntityDetail) => void;
}

function ParentEntitySelector({
  entityId,
  currentParentId,
  currentParent,
  onUpdate,
}: ParentEntitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<{ id: number; displayName: string; entityType: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const session = localStorage.getItem("arrow_session");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/internal_entities?q=${encodeURIComponent(q)}&per_page=10`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          // Filter out current entity
          const entities = (data.internalEntities || []).filter(
            (e: { id: number }) => e.id !== entityId
          );
          setResults(entities);
          setOpen(true);
        }
      } catch {
        // Ignore
      }
      setSearching(false);
    }, 300);
  };

  const handleSelect = async (parent: { id: number; displayName: string } | null) => {
    setSaving(true);
    try {
      const updated = await updateInternalEntity(entityId, { parentEntityId: parent?.id || null });
      onUpdate(updated);
      toast.success(parent ? `Parent set to ${parent.displayName}` : "Parent removed");
      setSearchQuery("");
      setOpen(false);
    } catch {
      toast.error("Failed to update parent entity");
    }
    setSaving(false);
  };

  if (currentParentId && currentParent) {
    return (
      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg group">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Landmark className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <Link
              href={`/internal-entities?id=${currentParent.id}`}
              className="font-medium text-sm text-foreground hover:text-indigo-600 transition-colors"
            >
              {currentParent.displayName}
            </Link>
            <p className="text-xs text-muted-foreground">{currentParent.entityType}</p>
          </div>
        </div>
        <button
          onClick={() => handleSelect(null)}
          disabled={saving}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => search(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setOpen(true)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          placeholder="Search for parent entity..."
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((entity) => (
            <button
              key={entity.id}
              onClick={() => handleSelect(entity)}
              disabled={saving}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-3 disabled:opacity-50"
            >
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <span className="font-medium">{entity.displayName}</span>
                <span className="text-muted-foreground ml-2 text-xs">{entity.entityType}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
