"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Save,
  Loader2,
  Trash2,
  Shield,
  Lightbulb,
  Users,
  Clock,
  Layers,
  FileText,
  Search,
  Plus,
  ChevronDown,
} from "lucide-react";

interface EdgePerson {
  id: number;
  firstName: string;
  lastName: string;
  title?: string | null;
  organization?: string | null;
  role?: string | null;
  context?: string | null;
}

interface Edge {
  id: number;
  title: string;
  edgeType: "information" | "relationship" | "structural" | "timing";
  confidence: number;
  timeliness: number;
  notes?: string | null;
  relatedPersonId?: number | null;
  relatedOrgId?: number | null;
  people?: EdgePerson[];
  createdBy?: { id: number; firstName: string; lastName: string } | null;
  createdAt: string;
}

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title?: string | null;
  org?: string | null;
}

const PERSON_ROLES = [
  { value: "connector", label: "Connector" },
  { value: "target", label: "Target" },
  { value: "source", label: "Source" },
  { value: "insider", label: "Insider" },
  { value: "stakeholder", label: "Stakeholder" },
] as const;

interface EdgeSlideOutProps {
  edge: Edge | null;
  dealId: number;
  onClose: () => void;
  onSave: (edge: Edge) => void;
  onDelete?: (edgeId: number) => void;
}

const EDGE_TYPES = [
  { value: "information", label: "Information", icon: Lightbulb, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "relationship", label: "Relationship", icon: Users, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: "structural", label: "Structural", icon: Layers, color: "text-green-600 bg-green-50 border-green-200" },
  { value: "timing", label: "Timing", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
] as const;

// Notion-style input classes
const inputClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text";
const textareaClass = "w-full px-3 py-2 text-sm rounded-md border border-transparent bg-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all cursor-text resize-none min-h-[100px]";

function ScoreSelector({
  label,
  value,
  onChange,
  color,
  labels,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
  labels: string[];
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2 px-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="text-xs text-slate-500">{labels[value - 1]}</span>
      </div>
      <div className="flex items-center gap-2 px-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-lg border-2 text-sm font-semibold transition-all ${
              n <= value
                ? `${color} border-current`
                : "text-slate-300 border-slate-200 hover:border-slate-300"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EdgeSlideOut({
  edge,
  dealId,
  onClose,
  onSave,
  onDelete,
}: EdgeSlideOutProps) {
  const isNew = !edge;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // People selector state
  const [linkedPeople, setLinkedPeople] = useState<Array<{
    personId: number;
    firstName: string;
    lastName: string;
    title?: string | null;
    organization?: string | null;
    role: string | null;
    context: string | null;
  }>>([]);
  const [personSearch, setPersonSearch] = useState("");
  const [personResults, setPersonResults] = useState<Person[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [showPersonSearch, setShowPersonSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: edge?.title || "",
    edgeType: edge?.edgeType || "information" as Edge["edgeType"],
    confidence: edge?.confidence || 3,
    timeliness: edge?.timeliness || 3,
    notes: edge?.notes || "",
  });

  useEffect(() => {
    setFormData({
      title: edge?.title || "",
      edgeType: edge?.edgeType || "information",
      confidence: edge?.confidence || 3,
      timeliness: edge?.timeliness || 3,
      notes: edge?.notes || "",
    });
    // Initialize linked people from edge
    if (edge?.people) {
      setLinkedPeople(
        edge.people.map((p) => ({
          personId: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          title: p.title,
          organization: p.organization,
          role: p.role || null,
          context: p.context || null,
        }))
      );
    } else {
      setLinkedPeople([]);
    }
    setShowDeleteConfirm(false);
    setShowPersonSearch(false);
    setPersonSearch("");
  }, [edge]);

  // Search people
  useEffect(() => {
    const searchPeople = async () => {
      if (personSearch.length < 2) {
        setPersonResults([]);
        return;
      }
      setSearchingPeople(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people?q=${encodeURIComponent(personSearch)}`
        );
        if (res.ok) {
          const data = await res.json();
          // Filter out already linked people
          const linkedIds = new Set(linkedPeople.map((p) => p.personId));
          setPersonResults(data.filter((p: Person) => !linkedIds.has(p.id)).slice(0, 8));
        }
      } catch (err) {
        console.error("Failed to search people:", err);
      }
      setSearchingPeople(false);
    };

    const debounce = setTimeout(searchPeople, 300);
    return () => clearTimeout(debounce);
  }, [personSearch, linkedPeople]);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowPersonSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addPerson = (person: Person) => {
    setLinkedPeople((prev) => [
      ...prev,
      {
        personId: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        title: person.title,
        organization: person.org,
        role: null,
        context: null,
      },
    ]);
    setPersonSearch("");
    setPersonResults([]);
    setShowPersonSearch(false);
  };

  const removePerson = (personId: number) => {
    setLinkedPeople((prev) => prev.filter((p) => p.personId !== personId));
  };

  const updatePersonRole = (personId: number, role: string | null) => {
    setLinkedPeople((prev) =>
      prev.map((p) => (p.personId === personId ? { ...p, role } : p))
    );
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        deal_id: dealId,
        title: formData.title,
        edge_type: formData.edgeType,
        confidence: formData.confidence,
        timeliness: formData.timeliness,
        notes: formData.notes || null,
        people: linkedPeople.map((p) => ({
          person_id: p.personId,
          role: p.role,
          context: p.context,
        })),
      };

      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edges`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edges/${edge.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        onSave(saved);
      } else {
        console.error("Failed to save edge:", await res.text());
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!edge || !onDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edges/${edge.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onDelete(edge.id);
        onClose();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeleting(false);
  };

  const selectedType = EDGE_TYPES.find((t) => t.value === formData.edgeType) || EDGE_TYPES[0];
  const TypeIcon = selectedType.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedType.color.split(" ").slice(1).join(" ")}`}>
              <Shield className={`h-5 w-5 ${selectedType.color.split(" ")[0]}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {isNew ? "New Edge" : "Edit Edge"}
              </h2>
              <p className="text-xs text-slate-500">Unique insight or advantage</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="space-y-1">
            {/* Edge Type */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-2 px-3">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Edge Type</span>
              </div>
              <div className="grid grid-cols-2 gap-2 px-3">
                {EDGE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.edgeType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, edgeType: type.value as Edge["edgeType"] })}
                      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                        isSelected
                          ? `${type.color} border-current`
                          : "text-slate-600 border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <TypeIcon className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Title</span>
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`${inputClass} font-medium`}
                placeholder="What's the edge?"
                autoFocus={isNew}
              />
            </div>

            {/* Confidence */}
            <ScoreSelector
              label="Confidence"
              value={formData.confidence}
              onChange={(v) => setFormData({ ...formData, confidence: v })}
              color="text-blue-600"
              labels={["Very Low", "Low", "Medium", "High", "Very High"]}
            />

            {/* Timeliness / Freshness */}
            <ScoreSelector
              label="Freshness"
              value={formData.timeliness}
              onChange={(v) => setFormData({ ...formData, timeliness: v })}
              color="text-green-600"
              labels={["Stale", "Aging", "Current", "Fresh", "Very Fresh"]}
            />

            {/* Notes */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1 px-3">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Notes</span>
              </div>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={textareaClass}
                placeholder="Details, source, how to leverage this edge..."
              />
            </div>

            {/* Linked People */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-2 px-3">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Linked People</span>
              </div>

              {/* Person Search */}
              <div ref={searchRef} className="relative px-3 mb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={personSearch}
                    onChange={(e) => {
                      setPersonSearch(e.target.value);
                      setShowPersonSearch(true);
                    }}
                    onFocus={() => setShowPersonSearch(true)}
                    placeholder="Search people to link..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                  />
                  {searchingPeople && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {showPersonSearch && personResults.length > 0 && (
                  <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                    {personResults.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => addPerson(person)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {person.firstName[0]}{person.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {person.firstName} {person.lastName}
                          </p>
                          {(person.title || person.org) && (
                            <p className="text-xs text-slate-500 truncate">
                              {person.title}{person.title && person.org && " at "}{person.org}
                            </p>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked People List */}
              {linkedPeople.length > 0 && (
                <div className="space-y-2 px-3">
                  {linkedPeople.map((person) => (
                    <div
                      key={person.personId}
                      className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
                        {person.firstName[0]}{person.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {person.firstName} {person.lastName}
                        </p>
                        {(person.title || person.organization) && (
                          <p className="text-xs text-slate-500 truncate">
                            {person.title}{person.title && person.organization && " at "}{person.organization}
                          </p>
                        )}
                      </div>
                      {/* Role Selector */}
                      <div className="relative">
                        <select
                          value={person.role || ""}
                          onChange={(e) => updatePersonRole(person.personId, e.target.value || null)}
                          className="appearance-none text-xs px-2 py-1 pr-6 bg-white border border-slate-200 rounded text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
                        >
                          <option value="">Role...</option>
                          {PERSON_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                      </div>
                      {/* Remove */}
                      <button
                        onClick={() => removePerson(person.personId)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {linkedPeople.length === 0 && (
                <p className="text-xs text-slate-400 px-3">
                  Link people to track who knows what in this deal
                </p>
              )}
            </div>

            {/* Score Preview */}
            <div className="py-4 px-3">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Edge Score</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {formData.confidence * formData.timeliness}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Confidence ({formData.confidence}) × Freshness ({formData.timeliness})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          {!isNew && onDelete && (
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                  >
                    No
                  </button>
                </div>
              )}
            </>
          )}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={handleSave}
                disabled={saving || !formData.title.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isNew ? "Create Edge" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
