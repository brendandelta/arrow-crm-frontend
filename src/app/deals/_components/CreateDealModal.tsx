"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Search, ChevronDown, ChevronRight, Plus } from "lucide-react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
}

interface Company {
  id: number;
  name: string;
}

interface CreateDealModalProps {
  onClose: () => void;
}

const STAGES = ["sourcing", "due_diligence", "negotiation", "documentation", "closing"];
const STATUSES = ["live", "sourcing", "closing", "closed", "dead"];
const KINDS = ["secondary", "direct", "co_invest", "primary", "fund_interest", "other"];
const SOURCES = ["inbound", "outbound", "referral", "broker", "network", "conference"];

function formatLabel(val: string) {
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseCurrencyToCents(value: string): number | null {
  if (!value) return null;
  let clean = value.replace(/[$,]/g, "").trim();
  let multiplier = 1;
  if (clean.toLowerCase().endsWith("b")) { multiplier = 1_000_000_000; clean = clean.slice(0, -1); }
  else if (clean.toLowerCase().endsWith("m")) { multiplier = 1_000_000; clean = clean.slice(0, -1); }
  else if (clean.toLowerCase().endsWith("k")) { multiplier = 1_000; clean = clean.slice(0, -1); }
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return Math.round(num * multiplier * 100);
}

export function CreateDealModal({ onClose }: CreateDealModalProps) {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const [stage, setStage] = useState("sourcing");
  const [status, setStatus] = useState("live");
  const [kind, setKind] = useState("secondary");
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [priority, setPriority] = useState(3);
  const [confidence, setConfidence] = useState("");
  const [expectedClose, setExpectedClose] = useState("");
  const [deadline, setDeadline] = useState("");
  const [valuation, setValuation] = useState("");
  const [sharePrice, setSharePrice] = useState("");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [dataRoomUrl, setDataRoomUrl] = useState("");
  const [deckUrl, setDeckUrl] = useState("");
  const [notionUrl, setNotionUrl] = useState("");

  // UI state
  const [moreOpen, setMoreOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Company search state
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<Company[]>([]);
  const [companySearching, setCompanySearching] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load users on mount
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Escape key handler
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Click outside company dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(e.target as Node) &&
        companyInputRef.current &&
        !companyInputRef.current.contains(e.target as Node)
      ) {
        setShowCompanyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced company search
  const searchCompanies = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setCompanyResults([]);
      setShowCompanyDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setCompanySearching(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        const orgs: Company[] = Array.isArray(data) ? data : data.organizations || [];
        setCompanyResults(orgs.slice(0, 8));
        setShowCompanyDropdown(true);
      } catch {
        setCompanyResults([]);
      }
      setCompanySearching(false);
    }, 250);
  }, []);

  const handleCompanyQueryChange = (val: string) => {
    setCompanyQuery(val);
    if (company) setCompany(null);
    searchCompanies(val);
  };

  const selectCompany = (c: Company) => {
    setCompany(c);
    setCompanyQuery(c.name);
    setShowCompanyDropdown(false);
  };

  const createNewCompany = async () => {
    if (!companyQuery.trim()) return;
    setCreatingCompany(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyQuery.trim(), kind: "company" }),
      });
      const data = await res.json();
      const newCompany: Company = { id: data.id, name: data.name || companyQuery.trim() };
      selectCompany(newCompany);
    } catch (err) {
      console.error("Failed to create company:", err);
    }
    setCreatingCompany(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        stage,
        status,
        kind,
        priority,
      };

      if (company) payload.company_id = company.id;
      if (ownerId) payload.owner_id = ownerId;
      if (confidence) payload.confidence = parseInt(confidence, 10);
      if (expectedClose) payload.expected_close = expectedClose;
      if (deadline) payload.deadline = deadline;
      if (valuation) payload.target_valuation_cents = parseCurrencyToCents(valuation);
      if (sharePrice) payload.share_price_cents = parseCurrencyToCents(sharePrice);
      if (source) payload.source = source;
      if (tags.length > 0) payload.tags = tags;
      if (notes.trim()) payload.notes = notes.trim();
      if (driveUrl.trim()) payload.drive_url = driveUrl.trim();
      if (dataRoomUrl.trim()) payload.data_room_url = dataRoomUrl.trim();
      if (deckUrl.trim()) payload.deck_url = deckUrl.trim();
      if (notionUrl.trim()) payload.notion_url = notionUrl.trim();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal: payload }),
      });

      if (!res.ok) throw new Error("Failed to create deal");
      const data = await res.json();
      router.push(`/deals/${data.id}`);
    } catch (err) {
      console.error("Failed to create deal:", err);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Create New Deal</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto p-4 space-y-5 flex-1">
            {/* Section 1: Name + Company */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Series B — Acme Corp"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  autoFocus
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    ref={companyInputRef}
                    type="text"
                    value={companyQuery}
                    onChange={(e) => handleCompanyQueryChange(e.target.value)}
                    onFocus={() => { if (companyResults.length > 0) setShowCompanyDropdown(true); }}
                    placeholder="Search companies..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  />
                  {companySearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 animate-spin" />
                  )}
                </div>
                {showCompanyDropdown && (
                  <div
                    ref={companyDropdownRef}
                    className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
                  >
                    {companyResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCompany(c)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        {c.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={createNewCompany}
                      disabled={creatingCompany}
                      className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 font-medium"
                    >
                      {creatingCompany ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Create &ldquo;{companyQuery.trim()}&rdquo;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Stage, Status, Kind */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{formatLabel(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{formatLabel(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kind</label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>{formatLabel(k)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 3: Owner, Priority, Confidence */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
                <select
                  value={ownerId ?? ""}
                  onChange={(e) => setOwnerId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        priority === p
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confidence</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value)}
                    placeholder="0–100"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Section 4: Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Close</label>
                <input
                  type="date"
                  value={expectedClose}
                  onChange={(e) => setExpectedClose(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              </div>
            </div>

            {/* Section 5: Terms (optional) */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                Terms (optional)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valuation</label>
                  <input
                    type="text"
                    value={valuation}
                    onChange={(e) => setValuation(e.target.value)}
                    placeholder="e.g. 10B, 500M"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Share Price</label>
                  <input
                    type="text"
                    value={sharePrice}
                    onChange={(e) => setSharePrice(e.target.value)}
                    placeholder="e.g. $45.50"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white"
                  >
                    <option value="">Select...</option>
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{formatLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 6: Collapsible More */}
            <div className="border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {moreOpen ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
                More
              </button>
              {moreOpen && (
                <div className="px-3 pb-3 space-y-4 border-t border-slate-100 pt-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-300 min-h-[38px]">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => setTags(tags.filter((t) => t !== tag))}
                            className="text-indigo-400 hover:text-indigo-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                            e.preventDefault();
                            const val = tagInput.trim().replace(/,$/,"");
                            if (val && !tags.includes(val)) setTags([...tags, val]);
                            setTagInput("");
                          }
                          if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                            setTags(tags.slice(0, -1));
                          }
                        }}
                        placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
                        className="flex-1 min-w-[100px] text-sm outline-none bg-transparent placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Internal notes..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Drive URL</label>
                      <input
                        type="url"
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Data Room URL</label>
                      <input
                        type="url"
                        value={dataRoomUrl}
                        onChange={(e) => setDataRoomUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Deck URL</label>
                      <input
                        type="url"
                        value={deckUrl}
                        onChange={(e) => setDeckUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Notion URL</label>
                      <input
                        type="url"
                        value={notionUrl}
                        onChange={(e) => setNotionUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer */}
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
              disabled={saving || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
