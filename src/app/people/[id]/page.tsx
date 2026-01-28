"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { PersonSelector } from "@/components/PersonSelector";
import { RelationshipTypeSelector } from "@/components/RelationshipTypeSelector";
import { EventModal } from "@/components/EventModal";
import { SourceSelector } from "@/components/SourceSelector";
import { SourceBadge } from "@/components/SourceBadge";
import {
  LinkedInIcon,
  TwitterIcon,
  InstagramIcon,
  WhatsAppIcon,
  TelegramIcon,
  SignalIcon,
} from "@/components/icons/SocialIcons";
import { StatusBadge } from "./_components/StatusBadge";
import { MissingDataDropdown, MissingField } from "./_components/MissingDataDropdown";
import { Badge } from "@/components/ui/badge";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  PhoneCall,
  MessageSquare,
  MapPin,
  X,
  Loader2,
  Plus,
  Calendar,
  Briefcase,
  Users,
  DollarSign,
  Camera,
  Trash2,
  Star,
  Shield,
  Lightbulb,
  Layers,
  Clock,
  Globe,
  ChevronDown,
  Save,
  Check,
} from "lucide-react";

// ====================
// INLINE EDITOR COMPONENTS
// ====================

// Configuration for warmth levels
const WARMTH_CONFIG = [
  { label: "Cold", color: "bg-slate-400", textColor: "text-slate-600" },
  { label: "Warm", color: "bg-yellow-500", textColor: "text-yellow-600" },
  { label: "Hot", color: "bg-orange-500", textColor: "text-orange-600" },
  { label: "Champion", color: "bg-red-500", textColor: "text-red-600" },
];

// Inline text editor - click to edit, blur to save
function InlineText({
  value,
  placeholder,
  onSave,
  className = "",
  inputClassName = "",
}: {
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  return editing ? (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      placeholder={placeholder}
      className={`bg-transparent border-b border-slate-300 outline-none py-0.5 ${inputClassName}`}
    />
  ) : (
    <button
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={`hover:text-indigo-600 transition-colors cursor-text text-left ${className}`}
    >
      {value || <span className="text-slate-300 italic">{placeholder}</span>}
    </button>
  );
}

// Inline warmth selector
function InlineWarmthSelector({
  warmth,
  onSave,
}: {
  warmth: number;
  onSave: (val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const config = WARMTH_CONFIG[warmth] || WARMTH_CONFIG[0];

  if (editing) {
    return (
      <div className="flex items-center gap-1" onMouseLeave={() => setEditing(false)}>
        {WARMTH_CONFIG.map((w, i) => (
          <button
            key={i}
            onClick={() => {
              onSave(i);
              setEditing(false);
            }}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
              i === warmth
                ? `${w.color} text-white border-transparent`
                : `bg-white border-slate-200 text-slate-600 hover:border-slate-300`
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-full text-white ${config.color} hover:opacity-90 transition-opacity`}
    >
      {config.label}
    </button>
  );
}

// Link chip for social links - click opens, right-click/hover edits
function LinkChip({
  label,
  icon: Icon,
  url,
  onSave,
  colors = "text-slate-600 bg-slate-100 hover:bg-slate-200",
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string | null;
  onSave: (val: string) => void;
  colors?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(url || "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== (url || "")) onSave(draft);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg">
        <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(url || "");
              setEditing(false);
            }
          }}
          placeholder={`${label} URL`}
          className="text-xs bg-transparent outline-none w-48"
        />
      </div>
    );
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          setDraft(url);
          setEditing(true);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${colors}`}
        title="Click to open, right-click to edit"
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </a>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft("");
        setEditing(true);
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-dashed border-slate-200"
    >
      <Icon className="h-3.5 w-3.5" />
      Add {label}
    </button>
  );
}

// Notes editor - expandable textarea
function NotesEditor({ value, onSave }: { value: string | null; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const commit = () => {
    setEditing(false);
    if (draft !== (value || "")) onSave(draft);
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add notes..."
          rows={4}
          className="w-full px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setDraft(value || "");
              setEditing(false);
            }}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={commit}
            className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value || "");
        setEditing(true);
      }}
      className="w-full text-left text-sm text-slate-700 hover:text-indigo-600 transition-colors cursor-text"
    >
      {value ? (
        <span className="whitespace-pre-wrap">{value}</span>
      ) : (
        <span className="text-slate-300 italic">Click to add notes...</span>
      )}
    </button>
  );
}

// Bio editor - expandable textarea (similar to notes but styled differently)
function BioEditor({ value, onSave }: { value: string | null; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const commit = () => {
    setEditing(false);
    if (draft !== (value || "")) onSave(draft);
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a bio..."
          rows={3}
          className="w-full px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setDraft(value || "");
              setEditing(false);
            }}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={commit}
            className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value || "");
        setEditing(true);
      }}
      className="w-full text-left text-sm text-slate-700 leading-relaxed hover:text-indigo-600 transition-colors cursor-text"
    >
      {value ? (
        <span>{value}</span>
      ) : (
        <span className="text-slate-300 italic">Click to add bio...</span>
      )}
    </button>
  );
}

// Tags editor - inline add/remove
function TagsEditor({ tags, onSave }: { tags: string[]; onSave: (val: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onSave([...tags, trimmed]);
    }
    setNewTag("");
    setAdding(false);
  };

  const removeTag = (tagToRemove: string) => {
    onSave(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full group"
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onBlur={() => {
              if (!newTag.trim()) setAdding(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTag();
              if (e.key === "Escape") {
                setNewTag("");
                setAdding(false);
              }
            }}
            placeholder="New tag"
            className="w-20 px-2 py-0.5 text-xs border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={addTag}
            className="p-0.5 text-indigo-600 hover:text-indigo-700"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-slate-400 hover:text-slate-600 border border-dashed border-slate-200 rounded-full hover:border-slate-300 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      )}
    </div>
  );
}

// ====================
// TYPES
// ====================

interface FormEmail {
  value: string;
  label: "work" | "personal";
  primary: boolean;
}

interface FormPhone {
  value: string;
  label: "work" | "personal";
  primary: boolean;
  whatsapp: boolean;
  telegram: boolean;
  text: boolean;
  call: boolean;
  signal: boolean;
}

interface FormEmployment {
  id: number | null;
  title: string;
  department: string;
  organizationId: number | null;
  organizationName: string;
  isCurrent: boolean;
  isPrimary: boolean;
}

interface Organization {
  id: number;
  name: string;
  kind: string;
}

interface RelatedDeal {
  id: number;
  name: string;
  company: string | null;
  companyId: number | null;
  status: string;
  role: string;
}

interface RelatedInterest {
  id: number;
  dealId: number;
  dealName: string | null;
  investor: string | null;
  investorId: number;
  status: string;
  role: string;
}

interface RelatedBlock {
  id: number;
  dealId: number;
  dealName: string | null;
  seller: string | null;
  sellerId: number | null;
  status: string;
  role: string;
}

interface RecentActivity {
  id: number;
  kind: string;
  subject: string | null;
  occurredAt: string;
  startsAt: string | null;
  dealId: number | null;
  outcome: string | null;
}

interface PersonRelationship {
  id: number;
  relationshipTypeId: number;
  relationshipTypeName: string;
  relationshipTypeSlug: string;
  relationshipTypeColor: string | null;
  bidirectional: boolean;
  otherEntityType: string;
  otherEntityId: number;
  otherEntityName: string | null;
  strength: number | null;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
}

interface PersonEdge {
  id: number;
  title: string;
  edgeType: "information" | "relationship" | "structural" | "timing";
  confidence: number;
  confidenceLabel: string;
  timeliness: number;
  timelinessLabel: string;
  notes: string | null;
  score: number;
  role: string | null;
  context: string | null;
  deal: { id: number; name: string } | null;
  relatedPerson: { id: number; firstName: string; lastName: string } | null;
  relatedOrg: { id: number; name: string } | null;
  otherPeople: Array<{
    id: number;
    firstName: string;
    lastName: string;
    title: string | null;
    organization: string | null;
    role: string | null;
  }>;
  createdBy: { id: number; firstName: string; lastName: string } | null;
  createdAt: string;
}

interface RelationshipType {
  id: number;
  name: string;
  slug: string;
  sourceType: string | null;
  targetType: string | null;
  category: string;
  bidirectional: boolean;
  inverseName: string | null;
  inverseSlug: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  isSystem: boolean;
}

interface FormRelationship {
  id: number | null;
  relationshipTypeId: number | null;
  otherEntityType: string;
  otherEntityId: number | null;
  otherEntityName: string;
  strength: number | null;
  notes: string;
}

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  prefix: string | null;
  suffix: string | null;
  emails: Array<{ value: string; label?: string; primary?: boolean }>;
  phones: Array<{ value: string; label?: string; primary?: boolean; whatsapp?: boolean; telegram?: boolean; text?: boolean; call?: boolean; signal?: boolean }>;
  preferredContact: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  title: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  bio: string | null;
  birthday: string | null;
  avatarUrl: string | null;
  warmth: number;
  tags: string[];
  notes: string | null;
  source: string | null;
  sourceDetail: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  contactCount: number;
  currentEmployment: {
    title: string | null;
    organization: {
      id: number;
      name: string;
      kind: string;
    };
  } | null;
  employments: Array<{
    id: number;
    title: string | null;
    department: string | null;
    isCurrent: boolean;
    isPrimary: boolean;
    startedAt: string | null;
    endedAt: string | null;
    organization: {
      id: number;
      name: string;
      kind: string;
    };
  }>;
  relatedDeals: RelatedDeal[];
  relatedInterests: RelatedInterest[];
  relatedBlocks: RelatedBlock[];
  recentActivities: RecentActivity[];
  relationships: PersonRelationship[];
  edges: PersonEdge[];
  createdAt: string;
  updatedAt: string;
}

// ====================
// HELPER FUNCTIONS
// ====================

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateShort(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatE164(phone: string): string {
  if (!phone) return "";
  const hasPlus = phone.startsWith("+");
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (hasPlus) return "+" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  return "+" + digits;
}

function getMissingFields(person: Person): MissingField[] {
  const missing: MissingField[] = [];
  if (!person.emails?.length) missing.push({ key: "email", label: "Email" });
  if (!person.phones?.length) missing.push({ key: "phone", label: "Phone" });
  if (!person.linkedinUrl) missing.push({ key: "linkedinUrl", label: "LinkedIn" });
  if (!person.instagramUrl) missing.push({ key: "instagramUrl", label: "Instagram" });
  if (!person.bio) missing.push({ key: "bio", label: "Bio" });
  if (!person.birthday) missing.push({ key: "birthday", label: "Birthday" });
  if (!person.source) missing.push({ key: "source", label: "Source" });
  if (!person.lastContactedAt) missing.push({ key: "lastContactedAt", label: "Last Contacted" });
  if (!person.tags?.length) missing.push({ key: "tags", label: "Tags" });
  if (!person.address?.city && !person.address?.country) missing.push({ key: "location", label: "Location" });
  if (!person.currentEmployment) missing.push({ key: "employment", label: "Current Role" });
  if (!person.relationships?.length) missing.push({ key: "relationships", label: "Relationships" });
  return missing;
}

// ====================
// MAIN COMPONENT
// ====================

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
  const [allPeople, setAllPeople] = useState<Array<{ id: number; firstName: string; lastName: string; title?: string | null; org?: string | null }>>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section editing states
  const [editingContacts, setEditingContacts] = useState(false);
  const [editingEmployments, setEditingEmployments] = useState(false);
  const [editingRelationships, setEditingRelationships] = useState(false);
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);

  // Form states for complex sections
  const [formEmails, setFormEmails] = useState<FormEmail[]>([]);
  const [formPhones, setFormPhones] = useState<FormPhone[]>([]);
  const [formEmployments, setFormEmployments] = useState<FormEmployment[]>([]);
  const [formRelationships, setFormRelationships] = useState<FormRelationship[]>([]);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Helper to convert backend email to form email
  const toFormEmail = (email: { value: string; label?: string; primary?: boolean }): FormEmail => ({
    value: email.value,
    label: (email.label === "personal" ? "personal" : "work") as "work" | "personal",
    primary: email.primary || false
  });

  // Helper to convert backend phone to form phone
  const toFormPhone = (phone: { value: string; label?: string; primary?: boolean; whatsapp?: boolean; telegram?: boolean; text?: boolean; call?: boolean; signal?: boolean }): FormPhone => ({
    value: formatE164(phone.value),
    label: (phone.label === "personal" ? "personal" : "work") as "work" | "personal",
    primary: phone.primary || false,
    whatsapp: phone.whatsapp || false,
    telegram: phone.telegram || false,
    text: phone.text !== false,
    call: phone.call !== false,
    signal: phone.signal || false
  });

  // Create empty helpers
  const createEmptyEmail = (primary: boolean = false): FormEmail => ({
    value: "",
    label: "work",
    primary
  });

  const createEmptyPhone = (primary: boolean = false): FormPhone => ({
    value: "",
    label: "work",
    primary,
    whatsapp: false,
    telegram: false,
    text: true,
    call: true,
    signal: false
  });

  const createEmptyEmployment = (isPrimary: boolean = false): FormEmployment => ({
    id: null,
    title: "",
    department: "",
    organizationId: null,
    organizationName: "",
    isCurrent: true,
    isPrimary
  });

  const createEmptyRelationship = (): FormRelationship => ({
    id: null,
    relationshipTypeId: null,
    otherEntityType: "Person",
    otherEntityId: null,
    otherEntityName: "",
    strength: null,
    notes: ""
  });

  const fetchPerson = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${params.id}`);
      const data = await res.json();
      setPerson(data);
      // Initialize form data from person
      setFormEmails(data.emails?.length > 0 ? data.emails.map(toFormEmail) : []);
      setFormPhones(data.phones?.length > 0 ? data.phones.map(toFormPhone) : []);
      setFormEmployments(data.employments?.length > 0
        ? data.employments.map((emp: { id: number; title: string | null; department: string | null; organization: { id: number; name: string }; isCurrent: boolean; isPrimary: boolean }) => ({
            id: emp.id,
            title: emp.title || "",
            department: emp.department || "",
            organizationId: emp.organization.id,
            organizationName: emp.organization.name,
            isCurrent: emp.isCurrent,
            isPrimary: emp.isPrimary
          }))
        : []);
      setFormRelationships(data.relationships?.length > 0
        ? data.relationships.map((rel: PersonRelationship) => ({
            id: rel.id,
            relationshipTypeId: rel.relationshipTypeId,
            otherEntityType: rel.otherEntityType,
            otherEntityId: rel.otherEntityId,
            otherEntityName: rel.otherEntityName || "",
            strength: rel.strength,
            notes: rel.notes || ""
          }))
        : []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch person:", err);
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPerson();
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`)
      .then((res) => res.json())
      .then((data) => setOrganizations(data))
      .catch((err) => console.error("Failed to fetch organizations:", err));
  }, [fetchPerson]);

  // Fetch relationship types and people when editing those sections
  useEffect(() => {
    if (editingRelationships || editingEmployments) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationship_types`)
        .then((res) => res.json())
        .then((data) => setRelationshipTypes(data))
        .catch((err) => console.error("Failed to fetch relationship types:", err));

      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`)
        .then((res) => res.json())
        .then((data) => setAllPeople(data.map((p: { id: number; firstName: string; lastName: string; title?: string; org?: string }) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          title: p.title || null,
          org: p.org || null
        }))))
        .catch((err) => console.error("Failed to fetch people:", err));
    }
  }, [editingRelationships, editingEmployments]);

  // ====================
  // SAVE FIELD FUNCTION (optimistic updates)
  // ====================
  const saveField = useCallback(async (field: string, value: unknown) => {
    if (!person) return;

    const oldPerson = person;
    // Optimistic update - update local state immediately
    setPerson((prev) => {
      if (!prev) return prev;
      // Handle nested address fields
      if (["city", "state", "country"].includes(field)) {
        return {
          ...prev,
          address: { ...prev.address, [field]: value }
        };
      }
      return { ...prev, [field]: value };
    });

    try {
      const payload: Record<string, unknown> = {};
      // Handle nested address fields
      if (["city", "state", "country"].includes(field)) {
        payload[field] = value;
      } else {
        payload[field] = value;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${person.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Saved");
    } catch {
      // Rollback on error
      setPerson(oldPerson);
      toast.error("Failed to save");
    }
  }, [person]);

  // ====================
  // SAVE CONTACTS SECTION
  // ====================
  const saveContacts = async () => {
    if (!person) return;
    setSavingSection("contacts");

    try {
      const payload = {
        emails: formEmails
          .filter(e => e.value.trim())
          .map(e => ({ value: e.value.trim(), label: e.label, primary: e.primary })),
        phones: formPhones
          .filter(p => p.value.trim())
          .map(p => ({
            value: formatE164(p.value),
            label: p.label,
            primary: p.primary,
            whatsapp: p.whatsapp,
            telegram: p.telegram,
            text: p.text,
            call: p.call,
            signal: p.signal
          }))
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${person.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to save");
      await fetchPerson();
      setEditingContacts(false);
      toast.success("Contact information saved");
    } catch {
      toast.error("Failed to save contact information");
    } finally {
      setSavingSection(null);
    }
  };

  // ====================
  // SAVE EMPLOYMENTS SECTION
  // ====================
  const saveEmployments = async () => {
    if (!person) return;
    setSavingSection("employments");

    try {
      const payload = {
        employments: formEmployments
          .filter(emp => emp.organizationId)
          .map(emp => ({
            id: emp.id,
            title: emp.title || null,
            department: emp.department || null,
            organizationId: emp.organizationId,
            isCurrent: emp.isCurrent,
            isPrimary: emp.isPrimary
          }))
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${person.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to save");
      await fetchPerson();
      setEditingEmployments(false);
      toast.success("Experience saved");
    } catch {
      toast.error("Failed to save experience");
    } finally {
      setSavingSection(null);
    }
  };

  // ====================
  // SAVE RELATIONSHIPS SECTION
  // ====================
  const saveRelationships = async () => {
    if (!person) return;
    setSavingSection("relationships");

    try {
      const existingRelIds = person.relationships?.map(r => r.id) || [];
      const formRelIds = formRelationships.filter(r => r.id).map(r => r.id as number);

      // Delete removed relationships
      const toDelete = existingRelIds.filter(id => !formRelIds.includes(id));
      for (const relId of toDelete) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationships/${relId}`, {
          method: "DELETE"
        });
      }

      // Create or update relationships
      for (const rel of formRelationships) {
        if (!rel.relationshipTypeId || !rel.otherEntityId) continue;

        const payload = {
          sourceType: "Person",
          sourceId: parseInt(params.id as string),
          targetType: rel.otherEntityType,
          targetId: rel.otherEntityId,
          relationshipTypeId: rel.relationshipTypeId,
          strength: rel.strength,
          notes: rel.notes || null,
          status: "active"
        };

        if (rel.id) {
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationships/${rel.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationships`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
      }

      await fetchPerson();
      setEditingRelationships(false);
      toast.success("Relationships saved");
    } catch {
      toast.error("Failed to save relationships");
    } finally {
      setSavingSection(null);
    }
  };

  // Avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${params.id}/upload_avatar`,
        { method: "POST", body: formData }
      );
      if (res.ok) {
        const data = await res.json();
        setPerson((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
        toast.success("Avatar uploaded");
      } else {
        const error = await res.json();
        toast.error(error.errors?.join(", ") || "Failed to upload avatar");
      }
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle add missing field
  const handleAddField = (fieldKey: string) => {
    if (fieldKey === "email" || fieldKey === "phone") {
      if (fieldKey === "email" && formEmails.length === 0) {
        setFormEmails([createEmptyEmail(true)]);
      }
      if (fieldKey === "phone" && formPhones.length === 0) {
        setFormPhones([createEmptyPhone(true)]);
      }
      setEditingContacts(true);
    } else if (fieldKey === "employment") {
      if (formEmployments.length === 0) {
        setFormEmployments([createEmptyEmployment(true)]);
      }
      setEditingEmployments(true);
    } else if (fieldKey === "relationships") {
      if (formRelationships.length === 0) {
        setFormRelationships([createEmptyRelationship()]);
      }
      setEditingRelationships(true);
    } else {
      setMoreDetailsOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-slate-400">Person not found</span>
      </div>
    );
  }

  const fullName = [person.prefix, person.firstName, person.lastName, person.suffix].filter(Boolean).join(" ");
  const location = [person.address?.city, person.address?.state, person.address?.country].filter(Boolean).join(", ");
  const primaryEmail = person.emails?.find((e) => e.primary)?.value || person.emails?.[0]?.value;
  const primaryPhone = person.phones?.find((p) => p.primary)?.value || person.phones?.[0]?.value;
  const whatsappPhone = person.phones?.find((p) => p.whatsapp)?.value;
  const whatsappNumber = whatsappPhone?.replace(/\D/g, "");
  const missingFields = getMissingFields(person);

  const relatedDealsCount = person.relatedDeals?.length || 0;
  const relatedInterestsCount = person.relatedInterests?.length || 0;
  const relatedBlocksCount = person.relatedBlocks?.length || 0;
  const activitiesCount = person.recentActivities?.length || 0;
  const hasRelatedItems = relatedDealsCount > 0 || relatedInterestsCount > 0 || relatedBlocksCount > 0 || activitiesCount > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Page Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl">
        {/* Actions Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <MissingDataDropdown missingFields={missingFields} onAddClick={handleAddField} />
        </div>

        {/* Profile Header */}
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative h-16 w-16 rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl font-semibold text-slate-500">
                    {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingAvatar ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                </div>
              </button>
            </div>

            {/* Name & Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Editable name */}
                  <div className="flex items-center gap-1 mb-1">
                    <InlineText
                      value={person.firstName}
                      placeholder="First name"
                      onSave={(val) => saveField("firstName", val)}
                      className="text-xl font-semibold text-slate-900"
                      inputClassName="text-xl font-semibold text-slate-900 w-32"
                    />
                    <InlineText
                      value={person.lastName}
                      placeholder="Last name"
                      onSave={(val) => saveField("lastName", val)}
                      className="text-xl font-semibold text-slate-900"
                      inputClassName="text-xl font-semibold text-slate-900 w-32"
                    />
                  </div>

                  {/* Current employment */}
                  {person.currentEmployment && (
                    <p className="text-sm text-slate-600">
                      {person.currentEmployment.title && <span>{person.currentEmployment.title} at </span>}
                      <Link
                        href={`/organizations/${person.currentEmployment.organization.id}`}
                        className="text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        {person.currentEmployment.organization.name}
                      </Link>
                    </p>
                  )}

                  {/* Editable location */}
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <InlineText
                      value={person.address?.city || ""}
                      placeholder="City"
                      onSave={(val) => saveField("city", val)}
                      className="text-slate-500"
                      inputClassName="text-sm w-20"
                    />
                    <span>,</span>
                    <InlineText
                      value={person.address?.country || ""}
                      placeholder="Country"
                      onSave={(val) => saveField("country", val)}
                      className="text-slate-500"
                      inputClassName="text-sm w-24"
                    />
                  </div>
                </div>

                {/* Warmth selector */}
                <InlineWarmthSelector
                  warmth={person.warmth}
                  onSave={(val) => saveField("warmth", val)}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {primaryEmail && (
                  <a
                    href={`mailto:${primaryEmail}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
                {primaryPhone && (
                  <a
                    href={`tel:${primaryPhone}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                )}
                {whatsappNumber && (
                  <a
                    href={`whatsapp://send?phone=${whatsappNumber}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#25D366] bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {/* Social links with inline edit */}
                <LinkChip
                  label="LinkedIn"
                  icon={LinkedInIcon}
                  url={person.linkedinUrl}
                  onSave={(val) => saveField("linkedinUrl", val || null)}
                  colors="text-[#0A66C2] bg-blue-50 hover:bg-blue-100"
                />
                <LinkChip
                  label="Twitter"
                  icon={TwitterIcon}
                  url={person.twitterUrl}
                  onSave={(val) => saveField("twitterUrl", val || null)}
                  colors="text-slate-900 bg-slate-100 hover:bg-slate-200"
                />
                <LinkChip
                  label="Instagram"
                  icon={InstagramIcon}
                  url={person.instagramUrl}
                  onSave={(val) => saveField("instagramUrl", val || null)}
                  colors="text-[#E4405F] bg-pink-50 hover:bg-pink-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {(person.contactCount > 0 || person.lastContactedAt || person.nextFollowUpAt) && (
        <div className="grid grid-cols-3 gap-3">
          {person.contactCount > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="text-lg font-semibold text-slate-900">{person.contactCount}</div>
              <div className="text-xs text-slate-500">Interactions</div>
            </div>
          )}
          {person.lastContactedAt && (
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="text-lg font-semibold text-slate-900">{formatDateShort(person.lastContactedAt)}</div>
              <div className="text-xs text-slate-500">Last Contact</div>
            </div>
          )}
          {person.nextFollowUpAt && (
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="text-lg font-semibold text-slate-900">{formatDateShort(person.nextFollowUpAt)}</div>
              <div className="text-xs text-slate-500">Follow Up</div>
            </div>
          )}
        </div>
      )}

      {/* About Card - Inline Editable */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">About</h2>
        </div>
        <div className="p-4">
          <BioEditor value={person.bio} onSave={(val) => saveField("bio", val || null)} />
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Contact Information</h2>
          {!editingContacts ? (
            <button
              onClick={() => setEditingContacts(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Manage
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFormEmails(person.emails?.length > 0 ? person.emails.map(toFormEmail) : []);
                  setFormPhones(person.phones?.length > 0 ? person.phones.map(toFormPhone) : []);
                  setEditingContacts(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveContacts}
                disabled={savingSection === "contacts"}
                className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-lg disabled:opacity-50"
              >
                {savingSection === "contacts" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save
              </button>
            </div>
          )}
        </div>
        <div className="p-4">
          {editingContacts ? (
            <div className="space-y-5">
              {/* Emails */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Emails</span>
                  <button
                    onClick={() => setFormEmails([...formEmails, createEmptyEmail(formEmails.length === 0)])}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                {formEmails.map((email, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="email"
                      value={email.value}
                      onChange={(e) => {
                        const newEmails = [...formEmails];
                        newEmails[i] = { ...newEmails[i], value: e.target.value };
                        setFormEmails(newEmails);
                      }}
                      placeholder="email@example.com"
                      className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                    />
                    <select
                      value={email.label}
                      onChange={(e) => {
                        const newEmails = [...formEmails];
                        newEmails[i] = { ...newEmails[i], label: e.target.value as "work" | "personal" };
                        setFormEmails(newEmails);
                      }}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                    </select>
                    <button
                      onClick={() => {
                        const newEmails = [...formEmails];
                        if (email.primary && newEmails.length > 1) {
                          newEmails[i === 0 ? 1 : 0] = { ...newEmails[i === 0 ? 1 : 0], primary: true };
                        }
                        newEmails[i] = { ...newEmails[i], primary: !email.primary };
                        if (newEmails[i].primary) {
                          newEmails.forEach((_, j) => {
                            if (j !== i) newEmails[j] = { ...newEmails[j], primary: false };
                          });
                        }
                        setFormEmails(newEmails);
                      }}
                      className={`p-1.5 rounded transition-colors ${email.primary ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"}`}
                      title={email.primary ? "Primary" : "Set as primary"}
                    >
                      <Star className="h-4 w-4" fill={email.primary ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => {
                        const newEmails = formEmails.filter((_, j) => j !== i);
                        if (email.primary && newEmails.length > 0) {
                          newEmails[0] = { ...newEmails[0], primary: true };
                        }
                        setFormEmails(newEmails);
                      }}
                      className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {formEmails.length === 0 && <p className="text-sm text-slate-400 italic">No emails</p>}
              </div>

              {/* Phones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Phones</span>
                  <button
                    onClick={() => setFormPhones([...formPhones, createEmptyPhone(formPhones.length === 0)])}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                {formPhones.map((phone, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <input
                        type="tel"
                        value={phone.value}
                        onChange={(e) => {
                          const newPhones = [...formPhones];
                          newPhones[i] = { ...newPhones[i], value: e.target.value };
                          setFormPhones(newPhones);
                        }}
                        onBlur={(e) => {
                          const newPhones = [...formPhones];
                          newPhones[i] = { ...newPhones[i], value: formatE164(e.target.value) };
                          setFormPhones(newPhones);
                        }}
                        placeholder="+15551234567"
                        className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                      />
                      <select
                        value={phone.label}
                        onChange={(e) => {
                          const newPhones = [...formPhones];
                          newPhones[i] = { ...newPhones[i], label: e.target.value as "work" | "personal" };
                          setFormPhones(newPhones);
                        }}
                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                      </select>
                      <button
                        onClick={() => {
                          const newPhones = [...formPhones];
                          if (phone.primary && newPhones.length > 1) {
                            newPhones[i === 0 ? 1 : 0] = { ...newPhones[i === 0 ? 1 : 0], primary: true };
                          }
                          newPhones[i] = { ...newPhones[i], primary: !phone.primary };
                          if (newPhones[i].primary) {
                            newPhones.forEach((_, j) => {
                              if (j !== i) newPhones[j] = { ...newPhones[j], primary: false };
                            });
                          }
                          setFormPhones(newPhones);
                        }}
                        className={`p-1.5 rounded transition-colors ${phone.primary ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"}`}
                      >
                        <Star className="h-4 w-4" fill={phone.primary ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => {
                          const newPhones = formPhones.filter((_, j) => j !== i);
                          if (phone.primary && newPhones.length > 0) {
                            newPhones[0] = { ...newPhones[0], primary: true };
                          }
                          setFormPhones(newPhones);
                        }}
                        className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 pl-6">
                      <span className="text-xs text-slate-400">Via:</span>
                      {[
                        { key: "call", icon: PhoneCall, label: "Call", active: "bg-green-100 text-green-700" },
                        { key: "text", icon: MessageSquare, label: "Text", active: "bg-blue-100 text-blue-700" },
                        { key: "whatsapp", icon: WhatsAppIcon, label: "WhatsApp", active: "bg-green-100 text-green-700" },
                        { key: "telegram", icon: TelegramIcon, label: "Telegram", active: "bg-sky-100 text-sky-700" },
                        { key: "signal", icon: SignalIcon, label: "Signal", active: "bg-blue-100 text-blue-700" },
                      ].map(({ key, icon: MethodIcon, label, active }) => (
                        <button
                          key={key}
                          onClick={() => {
                            const newPhones = [...formPhones];
                            newPhones[i] = { ...newPhones[i], [key]: !phone[key as keyof FormPhone] };
                            setFormPhones(newPhones);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                            phone[key as keyof FormPhone] ? active : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <MethodIcon className="h-3 w-3" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {formPhones.length === 0 && <p className="text-sm text-slate-400 italic">No phones</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {person.emails?.map((email, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${email.value}`} className="text-slate-700 hover:text-indigo-600">{email.value}</a>
                  {email.label && <span className="text-xs text-slate-400">{email.label}</span>}
                  {email.primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                </div>
              ))}
              {person.phones?.map((phone, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a href={`tel:${phone.value}`} className="text-slate-700 hover:text-indigo-600">{phone.value}</a>
                  {phone.label && <span className="text-xs text-slate-400">{phone.label}</span>}
                  {phone.primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                </div>
              ))}
              {(!person.emails?.length && !person.phones?.length) && (
                <p className="text-sm text-slate-400 italic">No contact information</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Experience Card */}
      {(editingEmployments || person.employments?.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Experience</h2>
            {!editingEmployments ? (
              <button
                onClick={() => setEditingEmployments(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Manage
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFormEmployments(person.employments?.length > 0
                      ? person.employments.map(emp => ({
                          id: emp.id,
                          title: emp.title || "",
                          department: emp.department || "",
                          organizationId: emp.organization.id,
                          organizationName: emp.organization.name,
                          isCurrent: emp.isCurrent,
                          isPrimary: emp.isPrimary
                        }))
                      : []);
                    setEditingEmployments(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEmployments}
                  disabled={savingSection === "employments"}
                  className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-lg disabled:opacity-50"
                >
                  {savingSection === "employments" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save
                </button>
              </div>
            )}
          </div>
          {editingEmployments ? (
            <div className="p-4 space-y-3">
              {formEmployments.map((emp, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1">
                      <OrganizationSelector
                        value={emp.organizationId}
                        onChange={(id, org) => {
                          const newEmps = [...formEmployments];
                          newEmps[i] = { ...newEmps[i], organizationId: id, organizationName: org?.name || "" };
                          setFormEmployments(newEmps);
                        }}
                        organizations={organizations}
                        onOrganizationCreated={(newOrg) => setOrganizations([...organizations, newOrg])}
                        placeholder="Select organization..."
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newEmps = [...formEmployments];
                        if (emp.isPrimary && newEmps.length > 1) {
                          newEmps[i === 0 ? 1 : 0] = { ...newEmps[i === 0 ? 1 : 0], isPrimary: true };
                        }
                        newEmps[i] = { ...newEmps[i], isPrimary: !emp.isPrimary };
                        if (newEmps[i].isPrimary) {
                          newEmps.forEach((_, j) => { if (j !== i) newEmps[j] = { ...newEmps[j], isPrimary: false }; });
                        }
                        setFormEmployments(newEmps);
                      }}
                      className={`p-1.5 rounded transition-colors ${emp.isPrimary ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"}`}
                    >
                      <Star className="h-4 w-4" fill={emp.isPrimary ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => {
                        const newEmps = formEmployments.filter((_, j) => j !== i);
                        if (emp.isPrimary && newEmps.length > 0) newEmps[0] = { ...newEmps[0], isPrimary: true };
                        setFormEmployments(newEmps);
                      }}
                      className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <input
                      type="text"
                      value={emp.title}
                      onChange={(e) => {
                        const newEmps = [...formEmployments];
                        newEmps[i] = { ...newEmps[i], title: e.target.value };
                        setFormEmployments(newEmps);
                      }}
                      placeholder="Job title"
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={emp.isCurrent}
                        onChange={(e) => {
                          const newEmps = [...formEmployments];
                          newEmps[i] = { ...newEmps[i], isCurrent: e.target.checked };
                          setFormEmployments(newEmps);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Current
                    </label>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setFormEmployments([...formEmployments, createEmptyEmployment(formEmployments.length === 0)])}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3 w-3" />
                Add Role
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {person.employments.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/organizations/${emp.organization.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{emp.organization.name}</span>
                      {emp.isCurrent && <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Current</span>}
                    </div>
                    {emp.title && <div className="text-xs text-slate-500">{emp.title}</div>}
                  </div>
                  {(emp.startedAt || emp.endedAt) && (
                    <div className="text-xs text-slate-400">
                      {formatDate(emp.startedAt)} — {emp.isCurrent ? "Present" : formatDate(emp.endedAt)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Card */}
      {hasRelatedItems && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
          </div>
          <div className="p-4 space-y-4">
            {activitiesCount > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Recent Activity ({activitiesCount})</span>
                </div>
                <div className="space-y-1">
                  {person.recentActivities.map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => setSelectedActivityId(activity.id)}
                      className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{activity.subject || activity.kind.replace(/_/g, " ")}</span>
                        <span className="text-xs text-slate-500 capitalize">{activity.kind.replace(/_/g, " ")}</span>
                      </div>
                      <span className="text-xs text-slate-500">{formatDateTime(activity.startsAt || activity.occurredAt)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {relatedDealsCount > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Deals ({relatedDealsCount})</span>
                </div>
                <div className="space-y-1">
                  {person.relatedDeals.map((deal) => (
                    <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{deal.name}</span>
                        {deal.company && <span className="text-xs text-slate-500">{deal.company}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{deal.role}</span>
                        <StatusBadge status={deal.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {relatedInterestsCount > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Interests ({relatedInterestsCount})</span>
                </div>
                <div className="space-y-1">
                  {person.relatedInterests.map((interest) => (
                    <Link key={interest.id} href={`/deals/${interest.dealId}`} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{interest.dealName}</span>
                        {interest.investor && <span className="text-xs text-slate-500">via {interest.investor}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{interest.role}</span>
                        <StatusBadge status={interest.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {relatedBlocksCount > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Blocks ({relatedBlocksCount})</span>
                </div>
                <div className="space-y-1">
                  {person.relatedBlocks.map((block) => (
                    <Link key={block.id} href={`/deals/${block.dealId}`} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{block.dealName}</span>
                        {block.seller && <span className="text-xs text-slate-500">from {block.seller}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{block.role}</span>
                        <StatusBadge status={block.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Relationships Card */}
      {(editingRelationships || (person.relationships && person.relationships.length > 0)) && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Relationships</h2>
            {!editingRelationships ? (
              <button
                onClick={() => setEditingRelationships(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Manage
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFormRelationships(person.relationships?.length > 0
                      ? person.relationships.map(rel => ({
                          id: rel.id,
                          relationshipTypeId: rel.relationshipTypeId,
                          otherEntityType: rel.otherEntityType,
                          otherEntityId: rel.otherEntityId,
                          otherEntityName: rel.otherEntityName || "",
                          strength: rel.strength,
                          notes: rel.notes || ""
                        }))
                      : []);
                    setEditingRelationships(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRelationships}
                  disabled={savingSection === "relationships"}
                  className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-lg disabled:opacity-50"
                >
                  {savingSection === "relationships" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save
                </button>
              </div>
            )}
          </div>
          {editingRelationships ? (
            <div className="p-4 space-y-4">
              {formRelationships.map((rel, i) => {
                const filteredTypes = relationshipTypes.filter(rt =>
                  (!rt.sourceType || rt.sourceType === "Person") &&
                  (!rt.targetType || rt.targetType === rel.otherEntityType)
                );
                return (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Relationship {i + 1}</span>
                      <button
                        onClick={() => setFormRelationships(formRelationships.filter((_, j) => j !== i))}
                        className="p-1 text-red-400 hover:text-white hover:bg-red-500 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">To</label>
                      <div className="flex items-center gap-2">
                        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                          <button
                            type="button"
                            onClick={() => {
                              const newRels = [...formRelationships];
                              newRels[i] = { ...newRels[i], otherEntityType: "Person", otherEntityId: null, otherEntityName: "", relationshipTypeId: null };
                              setFormRelationships(newRels);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${rel.otherEntityType === "Person" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
                          >
                            <Users className="h-4 w-4" />
                            Person
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newRels = [...formRelationships];
                              newRels[i] = { ...newRels[i], otherEntityType: "Organization", otherEntityId: null, otherEntityName: "", relationshipTypeId: null };
                              setFormRelationships(newRels);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${rel.otherEntityType === "Organization" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
                          >
                            <Building2 className="h-4 w-4" />
                            Organization
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        {rel.otherEntityType === "Person" ? (
                          <PersonSelector
                            value={rel.otherEntityId}
                            onChange={(id, selectedPerson) => {
                              const newRels = [...formRelationships];
                              newRels[i] = { ...newRels[i], otherEntityId: id, otherEntityName: selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : "" };
                              setFormRelationships(newRels);
                            }}
                            people={allPeople}
                            excludeId={person.id}
                            placeholder="Search people..."
                          />
                        ) : (
                          <OrganizationSelector
                            value={rel.otherEntityId}
                            onChange={(id, selectedOrg) => {
                              const newRels = [...formRelationships];
                              newRels[i] = { ...newRels[i], otherEntityId: id, otherEntityName: selectedOrg?.name || "" };
                              setFormRelationships(newRels);
                            }}
                            organizations={organizations}
                            onOrganizationCreated={(newOrg) => setOrganizations([...organizations, newOrg])}
                            placeholder="Search organizations..."
                          />
                        )}
                      </div>
                    </div>
                    {rel.otherEntityId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Type</label>
                        <RelationshipTypeSelector
                          value={rel.relationshipTypeId}
                          onChange={(id) => {
                            const newRels = [...formRelationships];
                            newRels[i] = { ...newRels[i], relationshipTypeId: id };
                            setFormRelationships(newRels);
                          }}
                          relationshipTypes={filteredTypes}
                          targetEntityType={rel.otherEntityType}
                          onTypeCreated={(newType) => setRelationshipTypes([...relationshipTypes, newType])}
                          placeholder="Select relationship type..."
                        />
                      </div>
                    )}
                    {rel.relationshipTypeId && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-slate-600">Strength:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => {
                                  const newRels = [...formRelationships];
                                  newRels[i] = { ...newRels[i], strength: rel.strength === level ? null : level };
                                  setFormRelationships(newRels);
                                }}
                                className={`w-5 h-5 rounded-full border-2 transition-all ${level <= (rel.strength || 0) ? "bg-indigo-500 border-indigo-500 scale-110" : "bg-white border-slate-300 hover:border-indigo-400 hover:scale-105"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={rel.notes}
                          onChange={(e) => {
                            const newRels = [...formRelationships];
                            newRels[i] = { ...newRels[i], notes: e.target.value };
                            setFormRelationships(newRels);
                          }}
                          placeholder="Add a note..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => setFormRelationships([...formRelationships, createEmptyRelationship()])}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3 w-3" />
                Add Relationship
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {person.relationships.map((rel) => {
                const linkHref = rel.otherEntityType === "Person"
                  ? `/people/${rel.otherEntityId}`
                  : rel.otherEntityType === "Organization"
                  ? `/organizations/${rel.otherEntityId}`
                  : `/deals/${rel.otherEntityId}`;
                const EntityIcon = rel.otherEntityType === "Person" ? Users : rel.otherEntityType === "Organization" ? Building2 : Briefcase;
                return (
                  <Link
                    key={rel.id}
                    href={linkHref}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: rel.relationshipTypeColor ? `${rel.relationshipTypeColor}20` : "#f1f5f9" }}
                    >
                      <EntityIcon className="h-4 w-4" style={{ color: rel.relationshipTypeColor || "#64748b" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{rel.otherEntityName || "Unknown"}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: rel.relationshipTypeColor ? `${rel.relationshipTypeColor}20` : "#f1f5f9", color: rel.relationshipTypeColor || "#64748b" }}
                        >
                          {rel.relationshipTypeName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{rel.otherEntityType}</div>
                    </div>
                    {rel.strength !== null && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div key={level} className={`w-1.5 h-1.5 rounded-full ${level <= (rel.strength || 0) ? "bg-indigo-500" : "bg-slate-200"}`} />
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edges Card */}
      {person.edges && person.edges.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Edges</h2>
            </div>
            <span className="text-xs text-slate-400">{person.edges.length} edge{person.edges.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {person.edges.map((edge) => {
              const edgeTypeConfig: Record<string, { color: string; icon: typeof Lightbulb }> = {
                information: { color: "text-blue-600 bg-blue-50", icon: Lightbulb },
                relationship: { color: "text-purple-600 bg-purple-50", icon: Users },
                structural: { color: "text-green-600 bg-green-50", icon: Layers },
                timing: { color: "text-amber-600 bg-amber-50", icon: Clock },
              };
              const typeConfig = edgeTypeConfig[edge.edgeType] || edgeTypeConfig.information;
              const TypeIcon = typeConfig.icon;
              return (
                <Link
                  key={edge.id}
                  href={edge.deal ? `/deals/${edge.deal.id}` : "#"}
                  className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.color.split(" ")[1]}`}>
                      <TypeIcon className={`h-4 w-4 ${typeConfig.color.split(" ")[0]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900">{edge.title}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeConfig.color}`}>
                          {edge.edgeType.charAt(0).toUpperCase() + edge.edgeType.slice(1)}
                        </span>
                        {edge.role && <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{edge.role}</span>}
                      </div>
                      {edge.deal && <div className="text-xs text-slate-500 mb-1">Deal: {edge.deal.name}</div>}
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Confidence</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= edge.confidence ? "bg-indigo-500" : "bg-slate-200"}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Fresh</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= edge.timeliness ? "bg-green-500" : "bg-slate-200"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {edge.otherPeople && edge.otherPeople.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Users className="h-3 w-3" />
                          <span>Also linked:</span>
                          {edge.otherPeople.map((p, idx) => (
                            <span key={p.id}>
                              {p.firstName} {p.lastName}{p.role && ` (${p.role})`}{idx < edge.otherPeople.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags & Notes Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Tags</h2>
          </div>
          <div className="p-4">
            <TagsEditor tags={person.tags || []} onSave={(val) => saveField("tags", val)} />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
          </div>
          <div className="p-4">
            <NotesEditor value={person.notes} onSave={(val) => saveField("notes", val || null)} />
          </div>
        </div>
      </div>

      {/* More Details - Collapsible */}
      <Collapsible.Root open={moreDetailsOpen} onOpenChange={setMoreDetailsOpen}>
        <div className="bg-white border border-slate-200 rounded-xl">
          <Collapsible.Trigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors">
              <span>More Details</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${moreDetailsOpen ? "rotate-180" : ""}`} />
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-4">
              {/* Source */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Source</span>
                <div className="flex items-center gap-2">
                  {person.source ? (
                    <SourceBadge source={person.source} />
                  ) : (
                    <span className="text-xs text-slate-300 italic">No source</span>
                  )}
                  <button
                    onClick={() => {
                      // For source, we need to use a selector modal or inline approach
                      // For now, simple text approach
                      const newSource = prompt("Enter source:", person.source || "");
                      if (newSource !== null) saveField("source", newSource || null);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
              {/* Source Detail */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Source Detail</span>
                <InlineText
                  value={person.sourceDetail || ""}
                  placeholder="Add detail"
                  onSave={(val) => saveField("sourceDetail", val || null)}
                  className="text-sm text-slate-700"
                  inputClassName="text-sm w-40"
                />
              </div>
              {/* Nickname */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Nickname</span>
                <InlineText
                  value={person.nickname || ""}
                  placeholder="Add nickname"
                  onSave={(val) => saveField("nickname", val || null)}
                  className="text-sm text-slate-700"
                  inputClassName="text-sm w-32"
                />
              </div>
              {/* Birthday */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Birthday</span>
                <span className="text-sm text-slate-700">{formatDate(person.birthday) || <span className="text-slate-300 italic">Not set</span>}</span>
              </div>
              {/* Created */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Created</span>
                <span className="text-sm text-slate-700">{formatDate(person.createdAt)}</span>
              </div>
              {/* Updated */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Updated</span>
                <span className="text-sm text-slate-700">{formatDate(person.updatedAt)}</span>
              </div>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>

      {/* Event Modal */}
      {selectedActivityId && (
        <EventModal
          activityId={selectedActivityId}
          onClose={() => setSelectedActivityId(null)}
        />
      )}
    </div>
  );
}
