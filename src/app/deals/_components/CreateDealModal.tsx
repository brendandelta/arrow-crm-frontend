"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Search, ChevronDown, ChevronRight, Plus, Target, Briefcase } from "lucide-react";
import { DEAL_PRIORITIES } from "./priority";
import { apiFetch, toastApiError } from "@/lib/api-error";

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

const STATUSES = ["sourcing", "live", "closing", "closed", "dead"];
const KINDS = ["secondary", "primary"];
const SOURCES = ["inbound", "outbound", "referral", "broker", "network", "conference"];
const ROUND_TYPES = ["Seed", "Series A", "Series B", "Series C", "Series D", "Series E+", "Bridge", "Extension"];
const SECURITY_TYPES = ["SAFE", "Equity", "Convertible Note", "Preferred Stock", "Common Stock"];

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

  // Form state - Shared
  const [name, setName] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const [status, setStatus] = useState("sourcing");
  const [kind, setKind] = useState("secondary");
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [priority, setPriority] = useState(2);
  const [confidence, setConfidence] = useState("");
  const [expectedClose, setExpectedClose] = useState("");
  const [deadline, setDeadline] = useState("");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [dataRoomUrl, setDataRoomUrl] = useState("");
  const [deckUrl, setDeckUrl] = useState("");
  const [notionUrl, setNotionUrl] = useState("");

  // Primary-specific state
  const [target, setTarget] = useState("");
  const [minRaise, setMinRaise] = useState("");
  const [maxRaise, setMaxRaise] = useState("");
  const [valuation, setValuation] = useState("");
  const [sharePrice, setSharePrice] = useState("");
  const [shareClass, setShareClass] = useState("");
  const [roundType, setRoundType] = useState("");
  const [securityType, setSecurityType] = useState("");
  const [leadInvestor, setLeadInvestor] = useState("");

  // Secondary-specific state
  const [preferredCloseWindow, setPreferredCloseWindow] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");

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

  // Reset kind-specific fields when kind changes
  useEffect(() => {
    if (kind === "primary") {
      // Reset secondary fields
      setPreferredCloseWindow("");
      setSettlementNotes("");
    } else {
      // Reset primary fields
      setTarget("");
      setMinRaise("");
      setMaxRaise("");
      setValuation("");
      setSharePrice("");
      setShareClass("");
      setRoundType("");
      setSecurityType("");
      setLeadInvestor("");
    }
  }, [kind]);

  // Load users on mount
  useEffect(() => {
    apiFetch<User[]>("/api/users")
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {
        // Silent fail for user list - not critical
      });
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
    if (!name.trim() || !company) return;

    // Primary deals require target
    if (kind === "primary" && !target) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        company_id: company.id,
        status,
        kind,
        priority,
      };

      // Shared optional fields
      if (ownerId) payload.owner_id = ownerId;
      if (confidence) payload.confidence = parseInt(confidence, 10);
      if (expectedClose) payload.expected_close = expectedClose;
      if (deadline) payload.deadline = deadline;
      if (source) payload.source = source;
      if (tags.length > 0) payload.tags = tags;
      if (notes.trim()) payload.internal_notes = notes.trim();
      if (driveUrl.trim()) payload.drive_url = driveUrl.trim();
      if (dataRoomUrl.trim()) payload.data_room_url = dataRoomUrl.trim();
      if (deckUrl.trim()) payload.deck_url = deckUrl.trim();
      if (notionUrl.trim()) payload.notion_url = notionUrl.trim();

      // Kind-specific fields
      if (kind === "primary") {
        if (target) payload.target_cents = parseCurrencyToCents(target);
        if (minRaise) payload.min_raise_cents = parseCurrencyToCents(minRaise);
        if (maxRaise) payload.max_raise_cents = parseCurrencyToCents(maxRaise);
        if (valuation) payload.valuation_cents = parseCurrencyToCents(valuation);
        if (sharePrice) payload.share_price_cents = parseCurrencyToCents(sharePrice);
        if (shareClass) payload.share_class = shareClass;

        // Primary custom fields
        const primaryCustomFields: Record<string, unknown> = {};
        if (roundType) primaryCustomFields.round_type = roundType;
        if (securityType) primaryCustomFields.security_type = securityType;
        if (leadInvestor) primaryCustomFields.lead_investor = leadInvestor;
        if (Object.keys(primaryCustomFields).length > 0) {
          payload.custom_fields = { primary: primaryCustomFields };
        }
      } else {
        // Secondary custom fields
        const secondaryCustomFields: Record<string, unknown> = {};
        if (preferredCloseWindow) secondaryCustomFields.preferred_close_window = preferredCloseWindow;
        if (settlementNotes) secondaryCustomFields.settlement_notes = settlementNotes;
        if (Object.keys(secondaryCustomFields).length > 0) {
          payload.custom_fields = { secondary: secondaryCustomFields };
        }
      }

      const data = await apiFetch<{ id: number }>("/api/deals", {
        method: "POST",
        body: payload,
      });
      router.push(`/deals/${data.id}`);
    } catch (err) {
      toastApiError(err, { entity: "deal", action: "create" });
      setSaving(false);
    }
  }

  const isPrimary = kind === "primary";

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
                <label className="block text-sm font-medium text-slate-700 mb-1">Company <span className="text-red-500">*</span></label>
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

            {/* Section 2: Kind Selection (prominent) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Deal Type <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKind("primary")}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    isPrimary
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    isPrimary ? "bg-indigo-100" : "bg-slate-100"
                  }`}>
                    <Target className={`h-5 w-5 ${isPrimary ? "text-indigo-600" : "text-slate-400"}`} />
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${isPrimary ? "text-indigo-900" : "text-slate-700"}`}>Primary</div>
                    <div className="text-xs text-slate-500">Series rounds, fundraises</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setKind("secondary")}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    !isPrimary
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    !isPrimary ? "bg-amber-100" : "bg-slate-100"
                  }`}>
                    <Briefcase className={`h-5 w-5 ${!isPrimary ? "text-amber-600" : "text-slate-400"}`} />
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${!isPrimary ? "text-amber-900" : "text-slate-700"}`}>Secondary</div>
                    <div className="text-xs text-slate-500">Block sales, secondaries</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 3: Stage, Owner, Priority, Confidence */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
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
                  {DEAL_PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        priority === p.value
                          ? p.color
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {p.label}
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

            {/* ═══════════ PRIMARY-SPECIFIC FIELDS ═══════════ */}
            {isPrimary && (
              <div className="space-y-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                  Primary Round Terms
                </div>

                {/* Target + Round Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Raise Target <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="e.g. 50M, 100M"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Round Type</label>
                    <select
                      value={roundType}
                      onChange={(e) => setRoundType(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white"
                    >
                      <option value="">Select...</option>
                      {ROUND_TYPES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Min/Max Raise */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Min Raise</label>
                    <input
                      type="text"
                      value={minRaise}
                      onChange={(e) => setMinRaise(e.target.value)}
                      placeholder="e.g. 30M"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Raise</label>
                    <input
                      type="text"
                      value={maxRaise}
                      onChange={(e) => setMaxRaise(e.target.value)}
                      placeholder="e.g. 75M"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    />
                  </div>
                </div>

                {/* Valuation + Security Type */}
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Security Type</label>
                    <select
                      value={securityType}
                      onChange={(e) => setSecurityType(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white"
                    >
                      <option value="">Select...</option>
                      {SECURITY_TYPES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Share Price + Share Class */}
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Share Class</label>
                    <input
                      type="text"
                      value={shareClass}
                      onChange={(e) => setShareClass(e.target.value)}
                      placeholder="e.g. Series B Preferred"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    />
                  </div>
                </div>

                {/* Lead Investor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lead Investor</label>
                  <input
                    type="text"
                    value={leadInvestor}
                    onChange={(e) => setLeadInvestor(e.target.value)}
                    placeholder="e.g. Sequoia Capital"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  />
                </div>
              </div>
            )}

            {/* ═══════════ SECONDARY-SPECIFIC FIELDS ═══════════ */}
            {!isPrimary && (
              <div className="space-y-4 p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                <div className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                  Secondary Overview
                </div>
                <p className="text-xs text-slate-500 -mt-2">
                  Block-specific pricing and terms will be added after the deal is created.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Close Window</label>
                    <input
                      type="text"
                      value={preferredCloseWindow}
                      onChange={(e) => setPreferredCloseWindow(e.target.value)}
                      placeholder="e.g. Q1 2025, March 15-30"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 bg-white"
                    >
                      <option value="">Select...</option>
                      {SOURCES.map((s) => (
                        <option key={s} value={s}>{formatLabel(s)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Settlement Notes</label>
                  <textarea
                    value={settlementNotes}
                    onChange={(e) => setSettlementNotes(e.target.value)}
                    rows={2}
                    placeholder="Settlement requirements, escrow details..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Section: Collapsible More */}
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
                More Options
              </button>
              {moreOpen && (
                <div className="px-3 pb-3 space-y-4 border-t border-slate-100 pt-3">
                  {/* Source (for primary) */}
                  {isPrimary && (
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
                  )}

                  {/* Tags */}
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

                  {/* Notes */}
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

                  {/* URLs */}
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
              disabled={saving || !name.trim() || !company || (isPrimary && !target)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create {isPrimary ? "Primary" : "Secondary"} Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
