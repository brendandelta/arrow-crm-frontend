"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  KeyRound,
  Plus,
  Search,
  Shield,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  fetchVault,
  fetchCredentials,
  fetchVaultMemberships,
  deleteCredential,
  VaultDetail,
  CredentialSummary,
  VaultMembership,
  CREDENTIAL_TYPES,
  CREDENTIAL_SENSITIVITIES,
  getRotationStatusColor,
  getRotationStatusLabel,
} from "@/lib/vault-api";
import { toast } from "sonner";
import { CredentialDialog } from "./_components/CredentialDialog";
import { RevealDialog } from "./_components/RevealDialog";
import { MembersDialog } from "./_components/MembersDialog";

type FilterTab = "all" | "overdue" | "due_soon";

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = Number(params.vaultId);

  const [vault, setVault] = useState<VaultDetail | null>(null);
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);
  const [members, setMembers] = useState<VaultMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [sensitivityFilter, setSensitivityFilter] = useState<string>("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  // Modal states
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<CredentialSummary | null>(null);
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [revealCredential, setRevealCredential] = useState<CredentialSummary | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [vaultData, credentialsData, membersData] = await Promise.all([
        fetchVault(vaultId),
        fetchCredentials(vaultId),
        fetchVaultMemberships(vaultId).catch(() => []),
      ]);
      setVault(vaultData);
      setCredentials(credentialsData);
      setMembers(membersData);
    } catch (err) {
      console.error("Failed to load vault:", err);
      toast.error("Failed to load vault");
    }
    setLoading(false);
  }, [vaultId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (credential: CredentialSummary) => {
    if (!confirm(`Delete "${credential.title}"? This cannot be undone.`)) return;
    try {
      await deleteCredential(credential.id);
      toast.success("Credential deleted");
      loadData();
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Failed to delete credential");
    }
  };

  const handleReveal = (credential: CredentialSummary) => {
    setRevealCredential(credential);
    setRevealDialogOpen(true);
  };

  const handleEdit = (credential: CredentialSummary) => {
    setEditingCredential(credential);
    setCredentialModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCredential(null);
    setCredentialModalOpen(true);
  };

  // Filter credentials
  const filteredCredentials = credentials.filter((cred) => {
    // Tab filter
    if (filterTab === "overdue" && cred.rotationStatus !== "overdue") return false;
    if (filterTab === "due_soon" && cred.rotationStatus !== "due_soon") return false;

    // Type filter
    if (typeFilter && cred.credentialType !== typeFilter) return false;

    // Sensitivity filter
    if (sensitivityFilter && cred.sensitivity !== sensitivityFilter) return false;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = cred.title.toLowerCase().includes(q);
      const matchesUrl = cred.url?.toLowerCase().includes(q);
      const matchesLinks = cred.links.some((l) => l.label.toLowerCase().includes(q));
      if (!matchesTitle && !matchesUrl && !matchesLinks) return false;
    }

    return true;
  });

  // Stats
  const overdueCount = credentials.filter((c) => c.rotationStatus === "overdue").length;
  const dueSoonCount = credentials.filter((c) => c.rotationStatus === "due_soon").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Vault not found</p>
        <button
          onClick={() => router.push("/vault")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Back to vaults
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/vault")}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{vault.name}</h1>
            {vault.role && (
              <Badge className="text-xs">
                {vault.roleLabel || vault.role}
              </Badge>
            )}
          </div>
          {vault.description && (
            <p className="text-sm text-muted-foreground mt-1">{vault.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {vault.canManageMemberships && (
            <button
              onClick={() => setMembersDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-muted"
            >
              <Users className="h-4 w-4" />
              Members ({members.length})
            </button>
          )}
          {vault.canEdit && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" />
              Add Credential
            </button>
          )}
        </div>
      </div>

      {/* Rotation Status Tabs */}
      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filterTab === "all"
                ? "bg-card shadow-sm"
                : "hover:bg-muted"
            }`}
          >
            All ({credentials.length})
          </button>
          {overdueCount > 0 && (
            <button
              onClick={() => setFilterTab("overdue")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterTab === "overdue"
                  ? "bg-card shadow-sm text-red-600"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Overdue ({overdueCount})
            </button>
          )}
          {dueSoonCount > 0 && (
            <button
              onClick={() => setFilterTab("due_soon")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterTab === "due_soon"
                  ? "bg-card shadow-sm text-amber-600"
                  : "text-amber-600 hover:bg-amber-50"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Due Soon ({dueSoonCount})
            </button>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search credentials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md"
        >
          <option value="">All types</option>
          {CREDENTIAL_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={sensitivityFilter}
          onChange={(e) => setSensitivityFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md"
        >
          <option value="">All sensitivity</option>
          {CREDENTIAL_SENSITIVITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Credentials List */}
      {filteredCredentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border rounded-lg">
          <KeyRound className="h-12 w-12 mb-4 opacity-50" />
          <p>No credentials found</p>
          {credentials.length === 0 && vault.canEdit && (
            <button
              onClick={handleCreate}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
            >
              Add your first credential
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCredentials.map((credential) => (
            <CredentialRow
              key={credential.id}
              credential={credential}
              canReveal={vault.canReveal}
              canEdit={vault.canEdit}
              onReveal={() => handleReveal(credential)}
              onEdit={() => handleEdit(credential)}
              onDelete={() => handleDelete(credential)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {credentialModalOpen && (
        <CredentialDialog
          vaultId={vaultId}
          credential={editingCredential}
          onClose={() => {
            setCredentialModalOpen(false);
            setEditingCredential(null);
          }}
          onSave={() => {
            setCredentialModalOpen(false);
            setEditingCredential(null);
            loadData();
          }}
        />
      )}

      {revealDialogOpen && revealCredential && (
        <RevealDialog
          credential={revealCredential}
          onClose={() => {
            setRevealDialogOpen(false);
            setRevealCredential(null);
          }}
        />
      )}

      {membersDialogOpen && (
        <MembersDialog
          vaultId={vaultId}
          members={members}
          onClose={() => setMembersDialogOpen(false)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

function CredentialRow({
  credential,
  canReveal,
  canEdit,
  onReveal,
  onEdit,
  onDelete,
}: {
  credential: CredentialSummary;
  canReveal: boolean;
  canEdit: boolean;
  onReveal: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const typeConfig = CREDENTIAL_TYPES.find((t) => t.value === credential.credentialType);

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors">
      {/* Icon */}
      <div className="p-2 bg-muted rounded-lg shrink-0">
        <KeyRound className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{credential.title}</h3>
          <Badge variant="outline" className="text-xs shrink-0">
            {typeConfig?.label || credential.credentialType}
          </Badge>
          {credential.rotationStatus !== "no_policy" && credential.rotationStatus !== "ok" && (
            <Badge
              className={`text-xs shrink-0 ${getRotationStatusColor(credential.rotationStatus)}`}
            >
              {getRotationStatusLabel(credential.rotationStatus)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          {credential.usernameMasked && (
            <span className="truncate">{credential.usernameMasked}</span>
          )}
          {credential.url && (
            <a
              href={credential.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{new URL(credential.url).hostname}</span>
            </a>
          )}
        </div>
        {credential.links.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {credential.links.slice(0, 3).map((link) => (
                <Badge key={link.id} variant="outline" className="text-xs">
                  {link.label}
                </Badge>
              ))}
              {credential.links.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{credential.links.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {canReveal && (
          <button
            onClick={onReveal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground border rounded-md hover:bg-muted"
          >
            <Eye className="h-4 w-4" />
            Reveal
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-muted rounded-md"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-card border rounded-md shadow-lg py-1 z-20 w-36">
                {canEdit && (
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
