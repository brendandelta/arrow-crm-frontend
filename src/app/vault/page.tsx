"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Plus,
  Search,
  Shield,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Pencil,
  X,
  Save,
  Loader2,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  fetchVaults,
  createVault,
  updateVault,
  VaultSummary,
} from "@/lib/vault-api";
import { toast } from "sonner";
import { getPageIdentity } from "@/lib/page-registry";
import { cn } from "@/lib/utils";

// Get page identity for theming
const pageIdentity = getPageIdentity("vault");
const theme = pageIdentity?.theme;
const PageIcon = pageIdentity?.icon || KeyRound;

function VaultCard({
  vault,
  onEdit,
  onClick,
}: {
  vault: VaultSummary;
  onEdit: (vault: VaultSummary) => void;
  onClick: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    editor: "bg-blue-100 text-blue-700",
    revealer: "bg-amber-100 text-amber-700",
    viewer: "bg-slate-100 text-slate-600",
  };

  const hasRotationIssues =
    vault.overdueRotationsCount > 0 || vault.dueSoonRotationsCount > 0;

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <KeyRound className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-medium">{vault.name}</h3>
            {vault.role && (
              <Badge className={`text-xs mt-1 ${roleColors[vault.role] || roleColors.viewer}`}>
                {vault.roleLabel || vault.role}
              </Badge>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <MoreHorizontal className="h-4 w-4 text-slate-400" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg py-1 z-20 w-32">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(vault);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {vault.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {vault.description}
        </p>
      )}

      {/* Credential Stats */}
      <div className="flex items-center gap-4 text-sm mb-3">
        <div className="flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-slate-400" />
          <span>{vault.credentialsCount} credential{vault.credentialsCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Rotation Status */}
      {hasRotationIssues && (
        <div className="flex items-center gap-3 text-sm">
          {vault.overdueRotationsCount > 0 && (
            <div className="flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{vault.overdueRotationsCount} overdue</span>
            </div>
          )}
          {vault.dueSoonRotationsCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600">
              <Clock className="h-4 w-4" />
              <span>{vault.dueSoonRotationsCount} due soon</span>
            </div>
          )}
        </div>
      )}

      {!hasRotationIssues && vault.credentialsCount > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-green-600">
          <Shield className="h-4 w-4" />
          <span>All rotations current</span>
        </div>
      )}
    </div>
  );
}

function VaultModal({
  vault,
  onClose,
  onSave,
}: {
  vault: VaultSummary | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isNew = !vault;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: vault?.name || "",
    description: vault?.description || "",
  });

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (isNew) {
        await createVault({
          name: formData.name,
          description: formData.description || undefined,
        });
        toast.success("Vault created");
      } else {
        await updateVault(vault.id, {
          name: formData.name,
          description: formData.description || undefined,
        });
        toast.success("Vault updated");
      }
      onSave();
    } catch (err) {
      console.error("Failed to save vault:", err);
      toast.error("Failed to save vault");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isNew ? "Create Vault" : "Edit Vault"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="e.g., Production Credentials"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[80px]"
              placeholder="What credentials will be stored here?"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const router = useRouter();
  const [vaults, setVaults] = useState<VaultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVault, setEditingVault] = useState<VaultSummary | null>(null);

  const loadVaults = async () => {
    try {
      const data = await fetchVaults();
      setVaults(data);
    } catch (err) {
      console.error("Failed to fetch vaults:", err);
      toast.error("Failed to load vaults");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVaults();
  }, []);

  const handleEdit = (vault: VaultSummary) => {
    setEditingVault(vault);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingVault(null);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    setModalOpen(false);
    setEditingVault(null);
    loadVaults();
  };

  const filteredVaults = vaults.filter((vault) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      vault.name.toLowerCase().includes(q) ||
      vault.description?.toLowerCase().includes(q)
    );
  });

  // Summary stats
  const totalCredentials = vaults.reduce((sum, v) => sum + v.credentialsCount, 0);
  const totalOverdue = vaults.reduce((sum, v) => sum + v.overdueRotationsCount, 0);
  const totalDueSoon = vaults.reduce((sum, v) => sum + v.dueSoonRotationsCount, 0);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#FAFBFC]">
      {/* Premium Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="relative px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )} />
                <div className={cn(
                  "relative h-11 w-11 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-[1.02]",
                  theme && `bg-gradient-to-br ${theme.gradient}`
                )}>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
                  <PageIcon className="relative h-5 w-5 text-white drop-shadow-sm" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Credential Vault
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {loading ? (
                    <span className="inline-block w-32 h-4 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{vaults.length} vault{vaults.length !== 1 ? "s" : ""}</span>
                      <span className="text-slate-300">·</span>
                      <span>{totalCredentials} credential{totalCredentials !== 1 ? "s" : ""}</span>
                      {totalOverdue > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-red-600">{totalOverdue} overdue</span>
                        </>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity",
                  theme && `bg-gradient-to-r ${theme.gradient}`
                )} style={{ opacity: 0.15 }} />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search vaults..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "w-72 h-11 pl-11 pr-4 text-sm rounded-xl transition-all duration-200",
                      "bg-slate-50 border border-slate-200/80",
                      "placeholder:text-slate-400",
                      "focus:outline-none focus:bg-white focus:border-teal-300 focus:ring-4 focus:ring-teal-500/10"
                    )}
                  />
                </div>
              </div>

              {/* New Vault Button */}
              <button
                onClick={handleCreate}
                className={cn(
                  "group relative flex items-center gap-2.5 h-11 px-5",
                  "text-white text-sm font-medium rounded-xl",
                  "shadow-lg active:scale-[0.98] transition-all duration-200",
                  theme && `bg-gradient-to-b ${theme.gradient} ${theme.shadow}`,
                  theme && "hover:shadow-xl"
                )}
              >
                <Plus className="h-4 w-4" />
                <span>New Vault</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        {(totalOverdue > 0 || totalDueSoon > 0) && (
          <div className="px-8 pb-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Shield className="h-5 w-5 text-slate-500" />
              <div className="flex items-center gap-6 text-sm">
                {totalOverdue > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">{totalOverdue} overdue rotation{totalOverdue !== 1 ? "s" : ""}</span>
                  </div>
                )}
                {totalDueSoon > 0 && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{totalDueSoon} due soon</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              Loading vaults...
            </div>
          </div>
        ) : filteredVaults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <KeyRound className="h-12 w-12 mb-4 opacity-50" />
            <p>No vaults found</p>
            {vaults.length === 0 && (
              <button
                onClick={handleCreate}
                className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Create your first vault
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVaults.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onEdit={handleEdit}
                onClick={() => router.push(`/vault/${vault.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Vault Modal */}
      {modalOpen && (
        <VaultModal
          vault={editingVault}
          onClose={() => {
            setModalOpen(false);
            setEditingVault(null);
          }}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
