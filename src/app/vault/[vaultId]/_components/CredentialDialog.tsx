"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Plus, Trash2 } from "lucide-react";
import {
  createCredential,
  updateCredential,
  fetchCredential,
  CredentialSummary,
  CredentialDetail,
  CreateCredentialData,
  CREDENTIAL_TYPES,
  CREDENTIAL_SENSITIVITIES,
  FIELD_TYPES,
} from "@/lib/vault-api";
import { toast } from "sonner";

interface CredentialDialogProps {
  vaultId: number;
  credential: CredentialSummary | null;
  onClose: () => void;
  onSave: () => void;
}

interface FieldInput {
  id?: number;
  label: string;
  fieldType: string;
  value: string;
  isSecret: boolean;
}

export function CredentialDialog({
  vaultId,
  credential,
  onClose,
  onSave,
}: CredentialDialogProps) {
  const isNew = !credential;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [fullCredential, setFullCredential] = useState<CredentialDetail | null>(null);

  const [formData, setFormData] = useState({
    title: credential?.title || "",
    credentialType: credential?.credentialType || "login",
    url: credential?.url || "",
    username: "",
    email: "",
    secret: "",
    notes: "",
    sensitivity: credential?.sensitivity || "confidential",
    rotationIntervalDays: credential?.rotationIntervalDays?.toString() || "",
  });

  const [customFields, setCustomFields] = useState<FieldInput[]>([]);

  // Load full credential details for editing
  useEffect(() => {
    if (!isNew && credential) {
      fetchCredential(credential.id)
        .then((data) => {
          setFullCredential(data);
          // Note: We don't populate secret fields - user must re-enter them if updating
          setCustomFields(
            data.fields.map((f) => ({
              id: f.id,
              label: f.label,
              fieldType: f.fieldType,
              value: "", // Don't populate secret values
              isSecret: f.isSecret,
            }))
          );
        })
        .catch((err) => {
          console.error("Failed to load credential:", err);
          toast.error("Failed to load credential details");
        })
        .finally(() => setLoading(false));
    }
  }, [isNew, credential]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const data: CreateCredentialData = {
        title: formData.title,
        credentialType: formData.credentialType,
        url: formData.url || undefined,
        sensitivity: formData.sensitivity,
        rotationIntervalDays: formData.rotationIntervalDays
          ? parseInt(formData.rotationIntervalDays)
          : undefined,
      };

      // Only include fields that have values (for new) or are being updated
      if (formData.username) data.username = formData.username;
      if (formData.email) data.email = formData.email;
      if (formData.secret) data.secret = formData.secret;
      if (formData.notes) data.notes = formData.notes;

      // Include custom fields with values
      const fieldsToInclude = customFields.filter((f) => f.label.trim());
      if (fieldsToInclude.length > 0) {
        data.fields = fieldsToInclude.map((f) => ({
          label: f.label,
          fieldType: f.fieldType,
          value: f.value || undefined,
          isSecret: f.isSecret,
        }));
      }

      if (isNew) {
        await createCredential(vaultId, data);
        toast.success("Credential created");
      } else {
        await updateCredential(credential!.id, data);
        toast.success("Credential updated");
      }
      onSave();
    } catch (err) {
      console.error("Failed to save credential:", err);
      toast.error("Failed to save credential");
    }
    setSaving(false);
  };

  const addField = () => {
    setCustomFields([
      ...customFields,
      { label: "", fieldType: "text", value: "", isSecret: false },
    ]);
  };

  const removeField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FieldInput>) => {
    setCustomFields(
      customFields.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/20" onClick={onClose} />
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-lg p-6">
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {isNew ? "Add Credential" : "Edit Credential"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="e.g., Production Database"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Type
              </label>
              <select
                value={formData.credentialType}
                onChange={(e) =>
                  setFormData({ ...formData, credentialType: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {CREDENTIAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Sensitivity
              </label>
              <select
                value={formData.sensitivity}
                onChange={(e) =>
                  setFormData({ ...formData, sensitivity: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {CREDENTIAL_SENSITIVITIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="https://..."
            />
          </div>

          {/* Credentials Section */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-foreground mb-3">Credentials</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder={
                    !isNew && credential?.usernameMasked
                      ? `Current: ${credential.usernameMasked}`
                      : "Username"
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder={
                    !isNew && credential?.emailMasked
                      ? `Current: ${credential.emailMasked}`
                      : "Email"
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Password / Secret
                </label>
                <input
                  type="password"
                  value={formData.secret}
                  onChange={(e) =>
                    setFormData({ ...formData, secret: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder={!isNew ? "Leave blank to keep current" : "Secret value"}
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[60px]"
                  placeholder={!isNew ? "Leave blank to keep current" : "Additional notes..."}
                />
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Custom Fields</h3>
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Field
              </button>
            </div>

            {customFields.length > 0 && (
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateField(index, { label: e.target.value })
                        }
                        className="px-2 py-1.5 text-sm border rounded-md"
                        placeholder="Label"
                      />
                      <select
                        value={field.fieldType}
                        onChange={(e) =>
                          updateField(index, { fieldType: e.target.value })
                        }
                        className="px-2 py-1.5 text-sm border rounded-md"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type={field.isSecret ? "password" : "text"}
                      value={field.value}
                      onChange={(e) =>
                        updateField(index, { value: e.target.value })
                      }
                      className="flex-1 px-2 py-1.5 text-sm border rounded-md"
                      placeholder="Value"
                    />
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={field.isSecret}
                        onChange={(e) =>
                          updateField(index, { isSecret: e.target.checked })
                        }
                        className="rounded"
                      />
                      Secret
                    </label>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rotation Policy */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Rotation Policy
            </h3>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Rotation Interval (days)
              </label>
              <input
                type="number"
                value={formData.rotationIntervalDays}
                onChange={(e) =>
                  setFormData({ ...formData, rotationIntervalDays: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="e.g., 90 (leave blank for no policy)"
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to disable rotation reminders
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.title.trim()}
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
