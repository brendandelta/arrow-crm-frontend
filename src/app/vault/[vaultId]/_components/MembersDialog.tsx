"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Loader2,
  Users,
  Trash2,
  ChevronDown,
  Shield,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  createVaultMembership,
  updateVaultMembership,
  deleteVaultMembership,
  VaultMembership,
  VAULT_ROLES,
} from "@/lib/vault-api";
import { toast } from "sonner";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

interface MembersDialogProps {
  vaultId: number;
  members: VaultMembership[];
  onClose: () => void;
  onUpdate: () => void;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="h-3.5 w-3.5" />,
  editor: <Pencil className="h-3.5 w-3.5" />,
  revealer: <Eye className="h-3.5 w-3.5" />,
  viewer: <EyeOff className="h-3.5 w-3.5" />,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  editor: "bg-blue-100 text-blue-700",
  revealer: "bg-amber-100 text-amber-700",
  viewer: "bg-slate-100 text-slate-600",
};

export function MembersDialog({
  vaultId,
  members,
  onClose,
  onUpdate,
}: MembersDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add member state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("viewer");

  // Edit role state
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  // Load users
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load users:", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Filter out users who are already members
  const availableUsers = users.filter(
    (u) => !members.some((m) => m.userId === u.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setSaving(true);
    try {
      await createVaultMembership(vaultId, {
        userId: parseInt(selectedUserId),
        role: selectedRole,
      });
      toast.success("Member added");
      setShowAddForm(false);
      setSelectedUserId("");
      setSelectedRole("viewer");
      onUpdate();
    } catch (err) {
      console.error("Failed to add member:", err);
      toast.error("Failed to add member");
    }
    setSaving(false);
  };

  const handleUpdateRole = async (membershipId: number, newRole: string) => {
    setSaving(true);
    try {
      await updateVaultMembership(membershipId, newRole);
      toast.success("Role updated");
      setEditingMemberId(null);
      onUpdate();
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error("Failed to update role");
    }
    setSaving(false);
  };

  const handleRemoveMember = async (membership: VaultMembership) => {
    if (
      !confirm(
        `Remove ${membership.user.name} from this vault? They will lose all access.`
      )
    )
      return;

    setSaving(true);
    try {
      await deleteVaultMembership(membership.id);
      toast.success("Member removed");
      onUpdate();
    } catch (err) {
      console.error("Failed to remove member:", err);
      toast.error("Failed to remove member");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold">Vault Members</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Member Form */}
          {showAddForm ? (
            <div className="p-4 border rounded-lg bg-slate-50 mb-4">
              <h3 className="text-sm font-medium mb-3">Add Member</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">User</label>
                  {loadingUsers ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </div>
                  ) : (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Select a user...</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {VAULT_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMember}
                    disabled={saving || !selectedUserId}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Add Member
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium border border-dashed rounded-lg hover:bg-slate-50 text-slate-600 mb-4"
            >
              <Plus className="h-4 w-4" />
              Add Member
            </button>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No members yet</p>
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {member.user.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {member.user.email}
                    </div>
                  </div>

                  {/* Role Badge/Dropdown */}
                  {editingMemberId === member.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member.id, e.target.value)
                        }
                        className="px-2 py-1 text-sm border rounded"
                        disabled={saving}
                      >
                        {VAULT_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditingMemberId(null)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingMemberId(member.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded hover:opacity-80 ${
                        ROLE_COLORS[member.role] || ROLE_COLORS.viewer
                      }`}
                    >
                      {ROLE_ICONS[member.role]}
                      {member.roleLabel}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </button>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveMember(member)}
                    disabled={saving}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    title="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Role Legend */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Role Permissions
            </h3>
            <div className="space-y-2 text-sm">
              {VAULT_ROLES.map((role) => (
                <div key={role.value} className="flex items-start gap-2">
                  <Badge
                    className={`text-xs shrink-0 ${
                      ROLE_COLORS[role.value] || ROLE_COLORS.viewer
                    }`}
                  >
                    {role.label}
                  </Badge>
                  <span className="text-muted-foreground">{role.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
