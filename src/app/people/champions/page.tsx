"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Globe, Building2, ArrowLeft, Copy, Check, X, Users } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  org: string | null;
  orgKind: string | null;
  email: string | null;
  phone: string | null;
  warmth: number;
  city: string | null;
  country: string | null;
  linkedin: string | null;
  lastContactedAt: string | null;
  tags: string[];
}

function OrgKindBadge({ kind }: { kind: string | null }) {
  if (!kind) return null;
  const styles: Record<string, string> = {
    fund: "bg-blue-50 text-blue-700",
    company: "bg-purple-50 text-purple-700",
    spv: "bg-amber-50 text-amber-700",
    broker: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${styles[kind] || styles.broker}`}>
      {kind}
    </span>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatPhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function PhoneCell({ phone }: { phone: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!phone) {
    return <span className="text-muted-foreground">—</span>;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const whatsappUrl = `https://wa.me/${formatPhoneForWhatsApp(phone)}`;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-sm text-foreground hover:text-foreground transition-colors group"
        title="Click to copy"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-muted-foreground" />
        )}
        <span className={copied ? "text-green-600" : ""}>{phone}</span>
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-green-600 hover:text-green-700 transition-colors"
        title="Open in WhatsApp"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}

function BulkActionBar({
  selectedPeople,
  onClear
}: {
  selectedPeople: Person[];
  onClear: () => void;
}) {
  const [copiedPhones, setCopiedPhones] = useState(false);
  const { addToast } = useToast();

  const emails = selectedPeople.filter(p => p.email).map(p => p.email!);
  const phones = selectedPeople.filter(p => p.phone).map(p => p.phone!);

  const handleEmailAll = () => {
    if (emails.length > 0) {
      window.location.href = `mailto:${emails.join(",")}`;
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
      const phoneList = phones.join("\n");
      await navigator.clipboard.writeText(phoneList);

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 z-50">
      <div className="flex items-center gap-2 pr-4 border-r border-muted-foreground">
        <Users className="h-4 w-4" />
        <span className="font-medium">{selectedPeople.length} selected</span>
      </div>

      <div className="flex items-center gap-2">
        {emails.length > 0 && (
          <button
            onClick={handleEmailAll}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email All ({emails.length})
          </button>
        )}

        {phones.length > 0 && (
          <>
            <button
              onClick={handleCopyPhones}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted-foreground hover:bg-muted-foreground/80 rounded-lg text-sm font-medium transition-colors"
            >
              {copiedPhones ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy Phones ({phones.length})
            </button>

            <button
              onClick={handleWhatsAppGroup}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Group
            </button>
          </>
        )}
      </div>

      <button
        onClick={onClear}
        className="ml-2 p-1.5 hover:bg-foreground/80 rounded-lg transition-colors"
        title="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ChampionsPage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`)
      .then((res) => res.json())
      .then((data) => {
        const allPeople = Array.isArray(data) ? data : [];
        setPeople(allPeople.filter((p: Person) => p.warmth === 3));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch people:", err);
        setLoading(false);
      });
  }, []);

  const selectedPeople = people.filter(p => selectedIds.has(p.id));
  const allSelected = people.length > 0 && selectedIds.size === people.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < people.length;

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(people.map(p => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/people")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-semibold">Champions</h1>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            {people.length} champions
          </Badge>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[220px]">Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Links</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : people.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No champions found
                </TableCell>
              </TableRow>
            ) : (
              people.map((person) => (
                <TableRow
                  key={person.id}
                  className={`cursor-pointer ${selectedIds.has(person.id) ? "bg-blue-50" : ""}`}
                  onClick={() => router.push(`/people/${person.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(person.id)}
                      onCheckedChange={() => toggleSelect(person.id)}
                      aria-label={`Select ${person.firstName} ${person.lastName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-700">
                        {getInitials(person.firstName, person.lastName)}
                      </div>
                      <div>
                        <div className="font-medium">{person.firstName} {person.lastName}</div>
                        <div className="text-xs text-muted-foreground">{person.title || "—"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {person.org ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{person.org}</span>
                        <OrgKindBadge kind={person.orgKind} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {person.email ? (
                      <a
                        href={`mailto:${person.email}`}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {person.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <PhoneCell phone={person.phone} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.city && person.country
                      ? `${person.city}, ${person.country}`
                      : person.city || person.country || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(person.lastContactedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {person.linkedin && (
                        <a
                          href={person.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      {!person.linkedin && <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedPeople.length > 0 && (
        <BulkActionBar selectedPeople={selectedPeople} onClear={clearSelection} />
      )}
    </div>
  );
}
