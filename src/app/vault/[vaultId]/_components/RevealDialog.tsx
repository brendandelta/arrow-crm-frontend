"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Shield,
  Clock,
} from "lucide-react";
import {
  revealCredential,
  logCredentialCopy,
  CredentialSummary,
  RevealedCredential,
} from "@/lib/vault-api";
import { toast } from "sonner";

interface RevealDialogProps {
  credential: CredentialSummary;
  onClose: () => void;
}

// Auto-hide timeout in seconds
const AUTO_HIDE_SECONDS = 60;

export function RevealDialog({ credential, onClose }: RevealDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<RevealedCredential | null>(null);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(AUTO_HIDE_SECONDS);

  // Load revealed data
  useEffect(() => {
    const loadRevealed = async () => {
      try {
        const data = await revealCredential(credential.id, "Manual reveal via UI");
        setRevealed(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to reveal credential";
        setError(errorMessage);
        console.error("Failed to reveal:", err);
      }
      setLoading(false);
    };

    loadRevealed();
  }, [credential.id]);

  // Auto-close countdown
  useEffect(() => {
    if (loading || error) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, onClose]);

  const toggleVisibility = (field: string) => {
    setVisibleFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const copyToClipboard = useCallback(
    async (field: string, value: string | null) => {
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
        // Log the copy action server-side
        await logCredentialCopy(credential.id, field, "Copy via UI");
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast.success(`${field} copied to clipboard`);
      } catch (err) {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy to clipboard");
      }
    },
    [credential.id]
  );

  const maskValue = (value: string | null) => {
    if (!value) return "—";
    return "•".repeat(Math.min(value.length, 20));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading secrets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        {/* Security Warning Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-3">
          <div className="flex items-center gap-2 text-amber-700">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">
              Sensitive Information - This action is logged
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{credential.title}</h2>
            <p className="text-sm text-muted-foreground">{credential.credentialTypeLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Auto-hide in {countdown}s</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Standard Fields */}
          {revealed?.username && (
            <SecretField
              label="Username"
              value={revealed.username}
              isVisible={visibleFields.has("username")}
              isCopied={copiedField === "username"}
              onToggle={() => toggleVisibility("username")}
              onCopy={() => copyToClipboard("username", revealed.username)}
              maskValue={maskValue}
            />
          )}

          {revealed?.email && (
            <SecretField
              label="Email"
              value={revealed.email}
              isVisible={visibleFields.has("email")}
              isCopied={copiedField === "email"}
              onToggle={() => toggleVisibility("email")}
              onCopy={() => copyToClipboard("email", revealed.email)}
              maskValue={maskValue}
            />
          )}

          {revealed?.secret && (
            <SecretField
              label="Password / Secret"
              value={revealed.secret}
              isVisible={visibleFields.has("secret")}
              isCopied={copiedField === "secret"}
              onToggle={() => toggleVisibility("secret")}
              onCopy={() => copyToClipboard("secret", revealed.secret)}
              maskValue={maskValue}
              isHighSecurity
            />
          )}

          {revealed?.notes && (
            <SecretField
              label="Notes"
              value={revealed.notes}
              isVisible={visibleFields.has("notes")}
              isCopied={copiedField === "notes"}
              onToggle={() => toggleVisibility("notes")}
              onCopy={() => copyToClipboard("notes", revealed.notes)}
              maskValue={maskValue}
              isMultiline
            />
          )}

          {/* Custom Fields */}
          {revealed?.fields && revealed.fields.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Custom Fields
              </h3>
              <div className="space-y-3">
                {revealed.fields.map((field) => (
                  <SecretField
                    key={field.id}
                    label={field.label}
                    value={field.value}
                    isVisible={visibleFields.has(`field_${field.id}`)}
                    isCopied={copiedField === `field_${field.id}`}
                    onToggle={() => toggleVisibility(`field_${field.id}`)}
                    onCopy={() =>
                      copyToClipboard(`field_${field.id}`, field.value)
                    }
                    maskValue={maskValue}
                    isHighSecurity={field.isSecret}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SecretField({
  label,
  value,
  isVisible,
  isCopied,
  onToggle,
  onCopy,
  maskValue,
  isHighSecurity = false,
  isMultiline = false,
}: {
  label: string;
  value: string | null;
  isVisible: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onCopy: () => void;
  maskValue: (v: string | null) => string;
  isHighSecurity?: boolean;
  isMultiline?: boolean;
}) {
  if (!value) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {isHighSecurity && (
          <span className="text-xs text-amber-600 font-medium">SENSITIVE</span>
        )}
      </div>
      <div
        className={`flex items-start gap-2 p-3 rounded-lg border ${
          isHighSecurity ? "bg-amber-50 border-amber-200" : "bg-muted"
        }`}
      >
        <div className="flex-1 min-w-0">
          {isMultiline ? (
            <pre
              className={`text-sm font-mono whitespace-pre-wrap break-all ${
                !isVisible ? "text-muted-foreground" : ""
              }`}
            >
              {isVisible ? value : maskValue(value)}
            </pre>
          ) : (
            <code
              className={`text-sm font-mono block truncate ${
                !isVisible ? "text-muted-foreground" : ""
              }`}
            >
              {isVisible ? value : maskValue(value)}
            </code>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-card rounded-md"
            title={isVisible ? "Hide" : "Show"}
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={onCopy}
            className="p-1.5 hover:bg-card rounded-md"
            title="Copy to clipboard"
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
