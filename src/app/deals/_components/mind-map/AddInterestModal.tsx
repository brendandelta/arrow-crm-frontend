"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Search, Plus, UserPlus } from "lucide-react";

interface Organization {
  id: number;
  name: string;
}

interface PersonResult {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  organization?: string;
}

interface SelectedContact {
  id: number;
  firstName: string;
  lastName: string;
  role: "contact" | "decision_maker" | "introduced_by";
}

interface AddInterestModalProps {
  dealId: number;
  onClose: () => void;
  onSave: (data: {
    deal_id: number;
    investor_id: number;
    committed_cents: number | null;
    status: string;
    contact_id?: number;
    decision_maker_id?: number;
    introduced_by_id?: number;
  }) => Promise<void>;
}

const CONTACT_ROLES = [
  { value: "contact" as const, label: "Primary Contact" },
  { value: "decision_maker" as const, label: "Decision Maker" },
  { value: "introduced_by" as const, label: "Introduced By" },
];

// ---- Organization Search ----
function OrgSearchInput({
  value,
  onSelect,
  onClear,
  label,
  required,
}: {
  value: Organization | null;
  onSelect: (org: Organization) => void;
  onClear: () => void;
  label: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const data = await res.json();
          const orgs: Organization[] = Array.isArray(data) ? data : data.organizations || [];
          setResults(orgs.slice(0, 8));
          setOpen(true);
        }
      } catch {}
      setLoading(false);
    }, 250);
  };

  if (value) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-100">
          <span className="font-medium">{value.name}</span>
          <button type="button" onClick={onClear} className="text-indigo-400 hover:text-indigo-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          placeholder="Search organizations..."
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-400" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-[calc(100%-2rem)] bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => { onSelect(org); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              {org.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Person Search ----
function PersonSearchInput({
  onSelect,
  excludeIds,
  placeholder,
}: {
  onSelect: (person: PersonResult) => void;
  excludeIds: number[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPerson, setNewPerson] = useState({ firstName: "", lastName: "", email: "" });
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    setCreating(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: PersonResult[] = data.map((p: Record<string, unknown>) => ({
            id: p.id as number,
            firstName: p.firstName as string,
            lastName: p.lastName as string,
            title: p.title as string | undefined,
            email: p.email as string | undefined,
            organization: p.org as string | undefined,
          }));
          setResults(mapped.filter((p) => !excludeIds.includes(p.id)).slice(0, 8));
          setOpen(true);
        }
      } catch {}
      setLoading(false);
    }, 250);
  };

  const handleCreate = async () => {
    if (!newPerson.firstName.trim() || !newPerson.lastName.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: newPerson.firstName.trim(),
        lastName: newPerson.lastName.trim(),
      };
      if (newPerson.email.trim()) {
        payload.emails = [{ address: newPerson.email.trim(), label: "work" }];
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        onSelect({
          id: data.id,
          firstName: newPerson.firstName.trim(),
          lastName: newPerson.lastName.trim(),
          email: newPerson.email.trim() || undefined,
        });
        setQuery("");
        setOpen(false);
        setCreating(false);
        setNewPerson({ firstName: "", lastName: "", email: "" });
      }
    } catch {}
    setSaving(false);
  };

  const parseQueryName = () => {
    const parts = query.trim().split(/\s+/);
    return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          placeholder={placeholder || "Search people..."}
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-slate-400" />}
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {results.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => { onSelect(person); setQuery(""); setOpen(false); setResults([]); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
            >
              <div>
                <span className="font-medium">{person.firstName} {person.lastName}</span>
                {person.title && <span className="text-slate-400 ml-1.5">· {person.title}</span>}
              </div>
              {person.organization && <span className="text-xs text-slate-400">{person.organization}</span>}
            </button>
          ))}
          {!creating && (
            <button
              type="button"
              onClick={() => { const parsed = parseQueryName(); setCreating(true); setNewPerson({ firstName: parsed.firstName, lastName: parsed.lastName, email: "" }); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-indigo-600 border-t"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create new contact{query.length >= 2 ? `: "${query}"` : ""}</span>
            </button>
          )}
          {creating && (
            <div className="p-3 border-t space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPerson.firstName}
                  onChange={(e) => setNewPerson({ ...newPerson, firstName: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 text-sm rounded border border-slate-200 focus:border-indigo-300 focus:outline-none"
                  placeholder="First name"
                  autoFocus
                />
                <input
                  type="text"
                  value={newPerson.lastName}
                  onChange={(e) => setNewPerson({ ...newPerson, lastName: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 text-sm rounded border border-slate-200 focus:border-indigo-300 focus:outline-none"
                  placeholder="Last name"
                />
              </div>
              <input
                type="email"
                value={newPerson.email}
                onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm rounded border border-slate-200 focus:border-indigo-300 focus:outline-none"
                placeholder="Email (optional)"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving || !newPerson.firstName.trim() || !newPerson.lastName.trim()}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Main Modal ----
export function AddInterestModal({ dealId, onClose, onSave }: AddInterestModalProps) {
  const [investorOrg, setInvestorOrg] = useState<Organization | null>(null);
  const [sellerOrg, setSellerOrg] = useState<Organization | null>(null);
  const [committedAmount, setCommittedAmount] = useState("");
  const [contacts, setContacts] = useState<SelectedContact[]>([]);
  const [addingContact, setAddingContact] = useState(false);
  const [nextRole, setNextRole] = useState<"contact" | "decision_maker" | "introduced_by">("contact");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const availableRoles = CONTACT_ROLES.filter(
    (r) => !contacts.some((c) => c.role === r.value)
  );

  const addContact = (person: PersonResult, role: "contact" | "decision_maker" | "introduced_by") => {
    setContacts([...contacts, { id: person.id, firstName: person.firstName, lastName: person.lastName, role }]);
    setAddingContact(false);
    // Pre-select next available role
    const remaining = CONTACT_ROLES.filter(
      (r) => r.value !== role && !contacts.some((c) => c.role === r.value)
    );
    if (remaining.length > 0) setNextRole(remaining[0].value);
  };

  const removeContact = (role: string) => {
    setContacts(contacts.filter((c) => c.role !== role));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!investorOrg) return;
    setSaving(true);
    try {
      const committedCents = committedAmount
        ? Math.round(parseFloat(committedAmount) * 100)
        : null;

      const data: Record<string, unknown> = {
        deal_id: dealId,
        investor_id: investorOrg.id,
        committed_cents: committedCents,
        status: "prospecting",
      };

      // Add contact IDs
      const contact = contacts.find((c) => c.role === "contact");
      const decisionMaker = contacts.find((c) => c.role === "decision_maker");
      const introducedBy = contacts.find((c) => c.role === "introduced_by");
      if (contact) data.contact_id = contact.id;
      if (decisionMaker) data.decision_maker_id = decisionMaker.id;
      if (introducedBy) data.introduced_by_id = introducedBy.id;

      await onSave(data as Parameters<typeof onSave>[0]);
      onClose();
    } catch (err) {
      console.error("Failed to add interest:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Add Interest</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Investor Organization */}
            <OrgSearchInput
              value={investorOrg}
              onSelect={setInvestorOrg}
              onClear={() => setInvestorOrg(null)}
              label="Investor Organization"
              required
            />

            {/* Seller Organization */}
            <OrgSearchInput
              value={sellerOrg}
              onSelect={setSellerOrg}
              onClear={() => setSellerOrg(null)}
              label="Seller Organization"
            />

            {/* Committed Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Committed Amount <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={committedAmount}
                  onChange={(e) => setCommittedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              </div>
            </div>

            {/* Contacts Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contacts</label>

              {/* Existing contacts */}
              {contacts.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {contacts.map((c) => (
                    <div
                      key={c.role}
                      className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">
                          {c.firstName[0]}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-700">
                            {c.firstName} {c.lastName}
                          </span>
                          <span className="text-xs text-slate-400 ml-1.5">
                            · {CONTACT_ROLES.find((r) => r.value === c.role)?.label}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeContact(c.role)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add contact flow */}
              {addingContact && availableRoles.length > 0 ? (
                <div className="space-y-2 p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                  <div className="flex gap-1.5">
                    {availableRoles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setNextRole(r.value)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          nextRole === r.value
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <PersonSearchInput
                    onSelect={(person) => addContact(person, nextRole)}
                    excludeIds={contacts.map((c) => c.id)}
                    placeholder={`Search for ${CONTACT_ROLES.find((r) => r.value === nextRole)?.label?.toLowerCase()}...`}
                  />
                  <button
                    type="button"
                    onClick={() => setAddingContact(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : availableRoles.length > 0 ? (
                <button
                  type="button"
                  onClick={() => { setAddingContact(true); setNextRole(availableRoles[0].value); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors w-full"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add contact
                </button>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !investorOrg}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Interest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
