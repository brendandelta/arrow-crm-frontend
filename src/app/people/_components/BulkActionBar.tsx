"use client";

import { useState } from "react";
import { Mail, Copy, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export interface BulkActionPerson {
  id: number;
  email: string | null;
  phone: string | null;
}

interface BulkActionBarProps {
  selectedPeople: BulkActionPerson[];
  onClear: () => void;
}

export function BulkActionBar({ selectedPeople, onClear }: BulkActionBarProps) {
  const [copiedPhones, setCopiedPhones] = useState(false);
  const { addToast } = useToast();

  const emails = selectedPeople.filter(p => p.email).map(p => p.email!);
  const phones = selectedPeople.filter(p => p.phone).map(p => p.phone!);

  const handleEmailAll = () => {
    if (emails.length > 0) {
      window.location.href = `mailto:${emails.join(",")}`;
      addToast({
        title: "Opening email client",
        description: `Composing email to ${emails.length} recipient${emails.length > 1 ? "s" : ""}`,
        type: "success",
        duration: 3000,
      });
    }
  };

  const handleCopyPhones = async () => {
    if (phones.length > 0) {
      try {
        await navigator.clipboard.writeText(phones.join("\n"));
        setCopiedPhones(true);
        setTimeout(() => setCopiedPhones(false), 2000);
        addToast({
          title: "Phone numbers copied",
          description: `${phones.length} phone numbers copied to clipboard`,
          type: "success",
          duration: 3000,
        });
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleWhatsAppGroup = async () => {
    if (phones.length > 0) {
      // Format phone numbers for easy pasting
      const phoneList = phones.join("\n");
      await navigator.clipboard.writeText(phoneList);

      addToast({
        title: "Phone numbers copied",
        description: `${phones.length} numbers ready to paste in WhatsApp`,
        type: "success",
        duration: 3000,
      });

      const proceed = window.confirm(
        `✓ ${phones.length} phone numbers copied to clipboard\n\n` +
        `Click OK to open WhatsApp.\n\n` +
        `To create a group:\n` +
        `1. Click the "+" icon → "New Group"\n` +
        `2. Paste the copied numbers into the search field one at a time\n` +
        `3. Select each contact and create your group`
      );

      if (proceed) {
        window.location.href = "whatsapp://";
      }
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground px-3 py-2.5 rounded-lg shadow-xl flex items-center gap-3 z-50">
      <span className="text-sm text-muted-foreground/60 pr-3 border-r border-muted-foreground">
        {selectedPeople.length} selected
      </span>

      <div className="flex items-center gap-2">
        {emails.length > 0 && (
          <button
            onClick={handleEmailAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-blue-300 hover:text-blue-200 hover:bg-foreground/80 rounded-md transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email</span>
          </button>
        )}

        {phones.length > 0 && (
          <>
            <button
              onClick={handleCopyPhones}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground/60 hover:text-background hover:bg-foreground/80 rounded-md transition-colors"
            >
              {copiedPhones ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>Copy Phone{phones.length > 1 ? "s" : ""}</span>
            </button>

            <button
              onClick={handleWhatsAppGroup}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-green-400 hover:text-green-300 hover:bg-foreground/80 rounded-md transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp</span>
            </button>
          </>
        )}
      </div>

      <button
        onClick={onClear}
        className="p-1 text-muted-foreground hover:text-background hover:bg-foreground/80 rounded transition-colors"
        title="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
