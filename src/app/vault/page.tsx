"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Shield,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Users,
  Lock,
} from "lucide-react";
import { PageHeader, PageSearch } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  fetchVaults,
  createVault,
  updateVault,
  VaultSummary,
} from "@/lib/vault-api";
import { toast } from "sonner";

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
    viewer: "bg-muted text-muted-foreground",
  };

  const hasRotationIssues =
    vault.overdueRotationsCount > 0 || vault.dueSoonRotationsCount > 0;

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
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
            className="p-1 hover:bg-muted rounded"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
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
              <div className="absolute right-0 top-full mt-1 bg-card border rounded-md shadow-lg py-1 z-20 w-32">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(vault);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
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
          <Lock className="h-4 w-4 text-muted-foreground" />
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
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isNew ? "Create Vault" : "Edit Vault"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
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
            <label className="block text-sm font-medium text-foreground mb-1">
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
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-md disabled:opacity-50"
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
    <div className="flex flex-col">
      <PageHeader
        title="Vault"
        subtitle={
          <span className="flex items-center gap-2">
            <span>{vaults.length} vault{vaults.length !== 1 ? "s" : ""}</span>
            <span className="text-muted-foreground/60">·</span>
            <span>{totalCredentials} credential{totalCredentials !== 1 ? "s" : ""}</span>
          </span>
        }
        primaryActionLabel="New Vault"
        onPrimaryAction={handleCreate}
        search={
          <PageSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search vaults..."
          />
        }
      />

      <div className="px-8 py-6 space-y-6">
        {/* Summary Strip */}
        {(totalOverdue > 0 || totalDueSoon > 0) && (
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border">
            <Shield className="h-5 w-5 text-muted-foreground" />
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
        )}

      {/* Vaults Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      ) : filteredVaults.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <KeyRound className="h-12 w-12 mb-4 opacity-50" />
          <p>No vaults found</p>
          {vaults.length === 0 && (
            <button
              onClick={handleCreate}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
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
    </div>
  );
}
