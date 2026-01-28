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
import { WarmthSelector } from "./_components/WarmthSelector";
import { StatusBadge } from "./_components/StatusBadge";
import { MissingDataDropdown, MissingField } from "./_components/MissingDataDropdown";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  PhoneCall,
  MessageSquare,
  MapPin,
  Pencil,
  X,
  Save,
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
  Clock
} from "lucide-react";

// Types for form emails and phones with extended properties
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
  id: number | null; // null for new employments
  title: string;
  department: string;
  organizationId: number | null;
  organizationName: string; // for display purposes
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

// Formats a phone number to E.164 format (+1XXXXXXXXXX)
// E.164 is the international standard: + followed by country code and number, no spaces/dashes
// This assumes US numbers (+1) if no country code is provided
function formatE164(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith("+");
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  // If already has country code (11+ digits starting with 1, or 10+ with +)
  if (hasPlus) {
    return "+" + digits;
  }

  // If 11 digits starting with 1, it's likely a US number with country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return "+" + digits;
  }

  // If 10 digits, assume US number and add +1
  if (digits.length === 10) {
    return "+1" + digits;
  }

  // For other lengths, just prefix with + (international number)
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

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
  const [allPeople, setAllPeople] = useState<Array<{ id: number; firstName: string; lastName: string; title?: string | null; org?: string | null }>>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    emails: [] as FormEmail[],
    phones: [] as FormPhone[],
    employments: [] as FormEmployment[],
    relationships: [] as FormRelationship[],
    linkedinUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    bio: "",
    city: "",
    state: "",
    country: "",
    warmth: 0,
    notes: "",
    source: "",
    sourceDetail: "",
    tags: [] as string[],
    newTag: ""
  });

  // Helper to create a new empty email
  const createEmptyEmail = (primary: boolean = false): FormEmail => ({
    value: "",
    label: "work",
    primary
  });

  // Helper to create a new empty phone
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

  // Helper to create a new empty employment
  const createEmptyEmployment = (isPrimary: boolean = false): FormEmployment => ({
    id: null,
    title: "",
    department: "",
    organizationId: null,
    organizationName: "",
    isCurrent: true,
    isPrimary
  });

  // Helper to create a new empty relationship
  const createEmptyRelationship = (): FormRelationship => ({
    id: null,
    relationshipTypeId: null,
    otherEntityType: "Person",
    otherEntityId: null,
    otherEntityName: "",
    strength: null,
    notes: ""
  });

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

  const fetchPerson = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${params.id}`);
      const data = await res.json();
      setPerson(data);
      // Initialize form data from person
      const emails = data.emails?.length > 0
        ? data.emails.map(toFormEmail)
        : [];
      const phones = data.phones?.length > 0
        ? data.phones.map(toFormPhone)
        : [];
      // Convert employments to form format
      const employments: FormEmployment[] = data.employments?.length > 0
        ? data.employments.map((emp: { id: number; title: string | null; department: string | null; organization: { id: number; name: string }; isCurrent: boolean; isPrimary: boolean }) => ({
            id: emp.id,
            title: emp.title || "",
            department: emp.department || "",
            organizationId: emp.organization.id,
            organizationName: emp.organization.name,
            isCurrent: emp.isCurrent,
            isPrimary: emp.isPrimary
          }))
        : [];

      // Convert relationships to form format
      const relationships: FormRelationship[] = data.relationships?.length > 0
        ? data.relationships.map((rel: PersonRelationship) => ({
            id: rel.id,
            relationshipTypeId: rel.relationshipTypeId,
            otherEntityType: rel.otherEntityType,
            otherEntityId: rel.otherEntityId,
            otherEntityName: rel.otherEntityName || "",
            strength: rel.strength,
            notes: rel.notes || ""
          }))
        : [];

      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        nickname: data.nickname || "",
        emails,
        phones,
        employments,
        relationships,
        linkedinUrl: data.linkedinUrl || "",
        twitterUrl: data.twitterUrl || "",
        instagramUrl: data.instagramUrl || "",
        bio: data.bio || "",
        city: data.address?.city || "",
        state: data.address?.state || "",
        country: data.address?.country || "",
        warmth: data.warmth || 0,
        notes: data.notes || "",
        source: data.source || "",
        sourceDetail: data.sourceDetail || "",
        tags: data.tags || [],
        newTag: ""
      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch person:", err);
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPerson();
    // Fetch organizations for the dropdown
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`)
      .then((res) => res.json())
      .then((data) => setOrganizations(data))
      .catch((err) => console.error("Failed to fetch organizations:", err));
  }, [fetchPerson]);

  // Fetch relationship types and all people when editing starts
  useEffect(() => {
    if (editing) {
      // Fetch all relationship types (filter by source_type=Person in component)
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationship_types`)
        .then((res) => res.json())
        .then((data) => setRelationshipTypes(data))
        .catch((err) => console.error("Failed to fetch relationship types:", err));

      // Fetch all people for the relationship target selector (with title and org)
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
  }, [editing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        nickname: formData.nickname || null,
        linkedinUrl: formData.linkedinUrl || null,
        twitterUrl: formData.twitterUrl || null,
        instagramUrl: formData.instagramUrl || null,
        bio: formData.bio || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        warmth: formData.warmth,
        notes: formData.notes || null,
        source: formData.source || null,
        sourceDetail: formData.sourceDetail || null,
        tags: formData.tags
      };

      // Handle employments - filter out ones without organization
      payload.employments = formData.employments
        .filter(emp => emp.organizationId)
        .map(emp => ({
          id: emp.id,
          title: emp.title || null,
          department: emp.department || null,
          organizationId: emp.organizationId,
          isCurrent: emp.isCurrent,
          isPrimary: emp.isPrimary
        }));

      // Handle emails - filter out empty values and format for backend
      payload.emails = formData.emails
        .filter(e => e.value.trim())
        .map(e => ({
          value: e.value.trim(),
          label: e.label,
          primary: e.primary
        }));

      // Handle phones - filter out empty values, format to E.164, and include contact methods
      payload.phones = formData.phones
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
        }));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${params.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        // Handle relationships - save them via the relationships API
        const existingRelIds = person?.relationships?.map(r => r.id) || [];
        const formRelIds = formData.relationships.filter(r => r.id).map(r => r.id as number);

        // Delete relationships that were removed
        const toDelete = existingRelIds.filter(id => !formRelIds.includes(id));
        for (const relId of toDelete) {
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationships/${relId}`, {
            method: "DELETE"
          });
        }

        // Create or update relationships
        for (const rel of formData.relationships) {
          if (!rel.relationshipTypeId || !rel.otherEntityId) continue;

          const relationshipPayload = {
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
            // Update existing relationship
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationships/${rel.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(relationshipPayload)
            });
          } else {
            // Create new relationship
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationships`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(relationshipPayload)
            });
          }
        }

        setEditing(false);
        toast.success("Contact saved successfully");
        // Refetch to get updated data
        await fetchPerson();
      } else {
        const error = await res.json();
        toast.error(error.errors?.join(", ") || "Failed to update contact");
      }
    } catch (err) {
      console.error("Failed to update contact:", err);
      toast.error("Failed to update contact. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data from person
    if (person) {
      const emails = person.emails?.length > 0
        ? person.emails.map(toFormEmail)
        : [];
      const phones = person.phones?.length > 0
        ? person.phones.map(toFormPhone)
        : [];
      const employments: FormEmployment[] = person.employments?.length > 0
        ? person.employments.map(emp => ({
            id: emp.id,
            title: emp.title || "",
            department: emp.department || "",
            organizationId: emp.organization.id,
            organizationName: emp.organization.name,
            isCurrent: emp.isCurrent,
            isPrimary: emp.isPrimary
          }))
        : [];
      const relationships: FormRelationship[] = person.relationships?.length > 0
        ? person.relationships.map(rel => ({
            id: rel.id,
            relationshipTypeId: rel.relationshipTypeId,
            otherEntityType: rel.otherEntityType,
            otherEntityId: rel.otherEntityId,
            otherEntityName: rel.otherEntityName || "",
            strength: rel.strength,
            notes: rel.notes || ""
          }))
        : [];

      setFormData({
        firstName: person.firstName || "",
        lastName: person.lastName || "",
        nickname: person.nickname || "",
        emails,
        phones,
        employments,
        relationships,
        linkedinUrl: person.linkedinUrl || "",
        twitterUrl: person.twitterUrl || "",
        instagramUrl: person.instagramUrl || "",
        bio: person.bio || "",
        city: person.address?.city || "",
        state: person.address?.state || "",
        country: person.address?.country || "",
        warmth: person.warmth || 0,
        notes: person.notes || "",
        source: person.source || "",
        sourceDetail: person.sourceDetail || "",
        tags: person.tags || [],
        newTag: ""
      });
    }
    setEditing(false);
  };

  const handleAddField = (fieldKey: string) => {
    setEditing(true);

    // For emails and phones, add an entry if none exist
    if (fieldKey === "email" && formData.emails.length === 0) {
      setFormData({
        ...formData,
        emails: [createEmptyEmail(true)]
      });
    } else if (fieldKey === "phone" && formData.phones.length === 0) {
      setFormData({
        ...formData,
        phones: [createEmptyPhone(true)]
      });
    } else if (fieldKey === "relationships" && formData.relationships.length === 0) {
      setFormData({
        ...formData,
        relationships: [createEmptyRelationship()]
      });
    }

    // Focus on the relevant field after a brief delay
    setTimeout(() => {
      const fieldMap: Record<string, string> = {
        email: "email-input",
        phone: "phone-input",
        linkedinUrl: "linkedin-input",
        instagramUrl: "instagram-input",
        bio: "bio-input",
        source: "source-input",
        location: "city-input",
        employment: "org-select",
        tags: "tag-input",
        relationships: "relationship-type-select"
      };
      const elementId = fieldMap[fieldKey];
      if (elementId) {
        document.getElementById(elementId)?.focus();
      }
    }, 100);
  };

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag.trim()],
        newTag: ""
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove)
    });
  };

  // Handle avatar upload
  // This sends the image file to our Rails backend, which uploads it to S3
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      // Create FormData - this is how we send files to the server
      // It's different from JSON because files are binary data
      const formData = new FormData();
      formData.append("avatar", file);

      // Send to our upload endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${params.id}/upload_avatar`,
        {
          method: "POST",
          body: formData  // Note: Don't set Content-Type header - browser does it automatically for FormData
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Update the person's avatar URL in our local state
        setPerson((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
        toast.success("Avatar uploaded successfully");
      } else {
        const error = await res.json();
        toast.error(error.errors?.join(", ") || "Failed to upload avatar");
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const fullName = editing
    ? `${formData.firstName} ${formData.lastName}`.trim()
    : [person.prefix, person.firstName, person.lastName, person.suffix].filter(Boolean).join(" ");

  const location = editing
    ? [formData.city, formData.state, formData.country].filter(Boolean).join(", ")
    : [person.address?.city, person.address?.state, person.address?.country].filter(Boolean).join(", ");

  const primaryEmail = person.emails?.find((e) => e.primary)?.value || person.emails?.[0]?.value;
  const primaryPhone = person.phones?.find((p) => p.primary)?.value || person.phones?.[0]?.value;
  // Find a phone with WhatsApp enabled and format for WhatsApp URL (remove non-digits)
  const whatsappPhone = person.phones?.find((p) => p.whatsapp)?.value;
  const whatsappNumber = whatsappPhone?.replace(/\D/g, "");
  const missingFields = getMissingFields(person);

  // Count related items
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
          <div className="flex items-center gap-2">
            {!editing && <MissingDataDropdown missingFields={missingFields} onAddClick={handleAddField} />}
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
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
                className="relative h-16 w-16 rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt={`${person.firstName} ${person.lastName}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl font-semibold text-slate-500">
                    {(formData.firstName || person.firstName || "").charAt(0)}{(formData.lastName || person.lastName || "").charAt(0)}
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
                  {editing ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="First name"
                        className="text-xl font-semibold text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none px-0 py-0 w-32"
                      />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Last name"
                        className="text-xl font-semibold text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none px-0 py-0 w-32"
                      />
                    </div>
                  ) : (
                    <h1 className="text-xl font-semibold text-slate-900">{fullName}</h1>
                  )}

                  {(() => {
                    // Get the primary current employment to display
                    const primaryEmployment = editing
                      ? formData.employments.find(e => e.isPrimary && e.isCurrent)
                      : person.currentEmployment;

                    if (primaryEmployment) {
                      const title = editing
                        ? (primaryEmployment as FormEmployment).title
                        : (primaryEmployment as typeof person.currentEmployment)?.title;
                      const orgName = editing
                        ? (primaryEmployment as FormEmployment).organizationName
                        : (primaryEmployment as typeof person.currentEmployment)?.organization?.name;
                      const orgId = editing
                        ? (primaryEmployment as FormEmployment).organizationId
                        : (primaryEmployment as typeof person.currentEmployment)?.organization?.id;

                      return (
                        <p className="text-sm text-slate-600">
                          {title && <span>{title} at </span>}
                          {orgId ? (
                            <Link href={`/organizations/${orgId}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                              {orgName}
                            </Link>
                          ) : (
                            <span>{orgName}</span>
                          )}
                        </p>
                      );
                    }
                    return null;
                  })()}

                  {editing ? (
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <input
                        id="city-input"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="bg-transparent border-b border-slate-200 focus:border-blue-500 focus:outline-none px-0 py-0 text-sm w-20"
                  />
                  <span>,</span>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Country"
                    className="bg-transparent border-b border-slate-200 focus:border-blue-500 focus:outline-none px-0 py-0.5 text-sm w-24"
                  />
                </div>
              ) : (
                location && (
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {location}
                  </p>
                )
              )}
            </div>
            <WarmthSelector
              warmth={editing ? formData.warmth : person.warmth}
              onChange={(value) => setFormData({ ...formData, warmth: value })}
              editing={editing}
            />
          </div>

          {/* Quick Actions */}
          {!editing && (
            <div className="flex items-center gap-3 mt-4">
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
              {person.linkedinUrl && (
                <a
                  href={person.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#0A66C2] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <LinkedInIcon className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {person.twitterUrl && (
                <a
                  href={person.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <TwitterIcon className="h-4 w-4" />
                  Twitter
                </a>
              )}
              {person.instagramUrl && (
                <a
                  href={person.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#E4405F] bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                >
                  <InstagramIcon className="h-4 w-4" />
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

      {/* Stats Row */}
      {!editing && (person.contactCount > 0 || person.lastContactedAt || person.nextFollowUpAt) && (
        <div className="grid grid-cols-3 gap-3">
          {person.contactCount > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 ">
              <div className="text-lg font-semibold text-slate-900">{person.contactCount}</div>
              <div className="text-xs text-slate-500">Interactions</div>
            </div>
          )}
          {person.lastContactedAt && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 ">
              <div className="text-lg font-semibold text-slate-900">{formatDateShort(person.lastContactedAt)}</div>
              <div className="text-xs text-slate-500">Last Contact</div>
            </div>
          )}
          {person.nextFollowUpAt && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 ">
              <div className="text-lg font-semibold text-slate-900">{formatDateShort(person.nextFollowUpAt)}</div>
              <div className="text-xs text-slate-500">Follow Up</div>
            </div>
          )}
        </div>
      )}

      {/* About Card */}
      {(editing || person.bio) && (
        <div className="bg-white border border-slate-200 rounded-xl ">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">About</h2>
          </div>
          <div className="p-4">
            {editing ? (
              <textarea
                id="bio-input"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Write a bio..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 leading-relaxed resize-none text-sm"
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">{person.bio}</p>
            )}
          </div>
        </div>
      )}

      {/* Roles & Organizations Card - shown when editing */}
      {editing && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Roles & Organizations</h2>
              <button
                type="button"
                onClick={() => {
                  const isFirst = formData.employments.length === 0;
                  setFormData({
                    ...formData,
                    employments: [...formData.employments, createEmptyEmployment(isFirst)]
                  });
                }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3 w-3" />
                Add Role
              </button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {formData.employments.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No roles added. Click &quot;Add Role&quot; to add a company association.</p>
            ) : (
              formData.employments.map((emp, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1">
                      <OrganizationSelector
                        value={emp.organizationId}
                        onChange={(id, org) => {
                          const newEmployments = [...formData.employments];
                          newEmployments[index] = {
                            ...newEmployments[index],
                            organizationId: id,
                            organizationName: org?.name || ""
                          };
                          setFormData({ ...formData, employments: newEmployments });
                        }}
                        organizations={organizations}
                        onOrganizationCreated={(newOrg) => setOrganizations([...organizations, newOrg])}
                        placeholder="Select organization..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newEmployments = [...formData.employments];
                        // If this was primary, make another one primary
                        if (emp.isPrimary && newEmployments.length > 1) {
                          const otherIndex = index === 0 ? 1 : 0;
                          newEmployments[otherIndex] = { ...newEmployments[otherIndex], isPrimary: true };
                        }
                        newEmployments[index] = { ...newEmployments[index], isPrimary: !emp.isPrimary };
                        // Ensure only one is primary
                        if (newEmployments[index].isPrimary) {
                          newEmployments.forEach((_, i) => {
                            if (i !== index) newEmployments[i] = { ...newEmployments[i], isPrimary: false };
                          });
                        }
                        setFormData({ ...formData, employments: newEmployments });
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        emp.isPrimary
                          ? "text-amber-500 bg-amber-50"
                          : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"
                      }`}
                      title={emp.isPrimary ? "Primary role" : "Set as primary"}
                    >
                      <Star className="h-4 w-4" fill={emp.isPrimary ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newEmployments = formData.employments.filter((_, i) => i !== index);
                        // If we deleted the primary, make the first one primary
                        if (emp.isPrimary && newEmployments.length > 0) {
                          newEmployments[0] = { ...newEmployments[0], isPrimary: true };
                        }
                        setFormData({ ...formData, employments: newEmployments });
                      }}
                      className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                      title="Remove role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <input
                      type="text"
                      value={emp.title}
                      onChange={(e) => {
                        const newEmployments = [...formData.employments];
                        newEmployments[index] = { ...newEmployments[index], title: e.target.value };
                        setFormData({ ...formData, employments: newEmployments });
                      }}
                      placeholder="Job title (e.g. Partner, CEO)"
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={emp.isCurrent}
                        onChange={(e) => {
                          const newEmployments = [...formData.employments];
                          newEmployments[index] = { ...newEmployments[index], isCurrent: e.target.checked };
                          setFormData({ ...formData, employments: newEmployments });
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Current
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Relationships Card - Edit Mode */}
      {editing && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Relationships</h2>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    relationships: [...formData.relationships, createEmptyRelationship()]
                  });
                }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3 w-3" />
                Add Relationship
              </button>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {formData.relationships.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No relationships added. Click &quot;Add Relationship&quot; to connect this person to others.</p>
            ) : (
              formData.relationships.map((rel, index) => {
                // Filter relationship types for Person as source and matching target type
                const filteredTypes = relationshipTypes.filter(rt =>
                  (!rt.sourceType || rt.sourceType === "Person") &&
                  (!rt.targetType || rt.targetType === rel.otherEntityType)
                );

                return (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl space-y-4">
                    {/* Header with delete button */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Relationship {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newRelationships = formData.relationships.filter((_, i) => i !== index);
                          setFormData({ ...formData, relationships: newRelationships });
                        }}
                        className="p-1 text-red-400 hover:text-white hover:bg-red-500 rounded transition-colors"
                        title="Remove relationship"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Step 1: Select who to relate to */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Relationship to</label>
                      <div className="flex items-center gap-2">
                        {/* Entity type toggle */}
                        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                          <button
                            type="button"
                            onClick={() => {
                              const newRelationships = [...formData.relationships];
                              newRelationships[index] = {
                                ...newRelationships[index],
                                otherEntityType: "Person",
                                otherEntityId: null,
                                otherEntityName: "",
                                relationshipTypeId: null
                              };
                              setFormData({ ...formData, relationships: newRelationships });
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                              rel.otherEntityType === "Person"
                                ? "bg-slate-900 text-white"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Users className="h-4 w-4" />
                            Person
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newRelationships = [...formData.relationships];
                              newRelationships[index] = {
                                ...newRelationships[index],
                                otherEntityType: "Organization",
                                otherEntityId: null,
                                otherEntityName: "",
                                relationshipTypeId: null
                              };
                              setFormData({ ...formData, relationships: newRelationships });
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                              rel.otherEntityType === "Organization"
                                ? "bg-slate-900 text-white"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Building2 className="h-4 w-4" />
                            Organization
                          </button>
                        </div>
                      </div>
                      {/* Entity selector */}
                      <div className="mt-2">
                        {rel.otherEntityType === "Person" ? (
                          <PersonSelector
                            value={rel.otherEntityId}
                            onChange={(id, selectedPerson) => {
                              const newRelationships = [...formData.relationships];
                              newRelationships[index] = {
                                ...newRelationships[index],
                                otherEntityId: id,
                                otherEntityName: selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : ""
                              };
                              setFormData({ ...formData, relationships: newRelationships });
                            }}
                            people={allPeople}
                            excludeId={person.id}
                            placeholder="Search people..."
                          />
                        ) : (
                          <OrganizationSelector
                            value={rel.otherEntityId}
                            onChange={(id, selectedOrg) => {
                              const newRelationships = [...formData.relationships];
                              newRelationships[index] = {
                                ...newRelationships[index],
                                otherEntityId: id,
                                otherEntityName: selectedOrg?.name || ""
                              };
                              setFormData({ ...formData, relationships: newRelationships });
                            }}
                            organizations={organizations}
                            onOrganizationCreated={(newOrg) => setOrganizations([...organizations, newOrg])}
                            placeholder="Search organizations..."
                          />
                        )}
                      </div>
                    </div>

                    {/* Step 2: Select relationship type (only show if entity is selected) */}
                    {rel.otherEntityId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          How are they related?
                        </label>
                        <RelationshipTypeSelector
                          value={rel.relationshipTypeId}
                          onChange={(id) => {
                            const newRelationships = [...formData.relationships];
                            newRelationships[index] = {
                              ...newRelationships[index],
                              relationshipTypeId: id
                            };
                            setFormData({ ...formData, relationships: newRelationships });
                          }}
                          relationshipTypes={filteredTypes}
                          targetEntityType={rel.otherEntityType}
                          onTypeCreated={(newType) => setRelationshipTypes([...relationshipTypes, newType])}
                          placeholder={
                            rel.otherEntityType === "Person"
                              ? "e.g. friends with, introduced by..."
                              : "e.g. works at, invested in..."
                          }
                        />
                      </div>
                    )}

                    {/* Step 3: Strength and notes (only show if relationship type is selected) */}
                    {rel.relationshipTypeId && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Strength:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => {
                                    const newRelationships = [...formData.relationships];
                                    newRelationships[index] = {
                                      ...newRelationships[index],
                                      strength: rel.strength === level ? null : level
                                    };
                                    setFormData({ ...formData, relationships: newRelationships });
                                  }}
                                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                                    level <= (rel.strength || 0)
                                      ? "bg-blue-500 border-blue-500 scale-110"
                                      : "bg-white border-slate-300 hover:border-blue-400 hover:scale-105"
                                  }`}
                                  title={`Strength ${level}`}
                                />
                              ))}
                            </div>
                            {rel.strength && (
                              <span className="text-xs text-slate-400 ml-1">
                                {rel.strength === 1 ? "Weak" : rel.strength === 2 ? "Light" : rel.strength === 3 ? "Moderate" : rel.strength === 4 ? "Strong" : "Very Strong"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={rel.notes}
                            onChange={(e) => {
                              const newRelationships = [...formData.relationships];
                              newRelationships[index] = { ...newRelationships[index], notes: e.target.value };
                              setFormData({ ...formData, relationships: newRelationships });
                            }}
                            placeholder="Add a note about this relationship..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Contact Card */}
      <div className="bg-white border border-slate-200 rounded-xl ">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Contact Information</h2>
        </div>
        <div className="p-4">
        {editing ? (
          <div className="space-y-5">
            {/* Emails Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Emails</span>
                <button
                  type="button"
                  onClick={() => {
                    const isFirst = formData.emails.length === 0;
                    setFormData({
                      ...formData,
                      emails: [...formData.emails, createEmptyEmail(isFirst)]
                    });
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  Add Email
                </button>
              </div>
              {formData.emails.map((email, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <input
                    id={index === 0 ? "email-input" : undefined}
                    type="email"
                    value={email.value}
                    onChange={(e) => {
                      const newEmails = [...formData.emails];
                      newEmails[index] = { ...newEmails[index], value: e.target.value };
                      setFormData({ ...formData, emails: newEmails });
                    }}
                    placeholder="email@example.com"
                    className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  />
                  <select
                    value={email.label}
                    onChange={(e) => {
                      const newEmails = [...formData.emails];
                      newEmails[index] = { ...newEmails[index], label: e.target.value as "work" | "personal" };
                      setFormData({ ...formData, emails: newEmails });
                    }}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const newEmails = [...formData.emails];
                      // If this was primary, make another one primary
                      if (email.primary && newEmails.length > 1) {
                        const otherIndex = index === 0 ? 1 : 0;
                        newEmails[otherIndex] = { ...newEmails[otherIndex], primary: true };
                      }
                      newEmails[index] = { ...newEmails[index], primary: !email.primary };
                      // Ensure only one is primary
                      if (newEmails[index].primary) {
                        newEmails.forEach((_, i) => {
                          if (i !== index) newEmails[i] = { ...newEmails[i], primary: false };
                        });
                      }
                      setFormData({ ...formData, emails: newEmails });
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      email.primary
                        ? "text-amber-500 bg-amber-50"
                        : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"
                    }`}
                    title={email.primary ? "Primary email" : "Set as primary"}
                  >
                    <Star className="h-4 w-4" fill={email.primary ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newEmails = formData.emails.filter((_, i) => i !== index);
                      // If we deleted the primary, make the first one primary
                      if (email.primary && newEmails.length > 0) {
                        newEmails[0] = { ...newEmails[0], primary: true };
                      }
                      setFormData({ ...formData, emails: newEmails });
                    }}
                    className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                    title="Remove email"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {formData.emails.length === 0 && (
                <p className="text-sm text-slate-400 italic">No emails added</p>
              )}
            </div>

            {/* Phones Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Phone Numbers</span>
                <button
                  type="button"
                  onClick={() => {
                    const isFirst = formData.phones.length === 0;
                    setFormData({
                      ...formData,
                      phones: [...formData.phones, createEmptyPhone(isFirst)]
                    });
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  Add Phone
                </button>
              </div>
              {formData.phones.map((phone, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <input
                      id={index === 0 ? "phone-input" : undefined}
                      type="tel"
                      value={phone.value}
                      onChange={(e) => {
                        const newPhones = [...formData.phones];
                        newPhones[index] = { ...newPhones[index], value: e.target.value };
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      onBlur={(e) => {
                        const newPhones = [...formData.phones];
                        newPhones[index] = { ...newPhones[index], value: formatE164(e.target.value) };
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      placeholder="+15551234567"
                      className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    />
                    <select
                      value={phone.label}
                      onChange={(e) => {
                        const newPhones = [...formData.phones];
                        newPhones[index] = { ...newPhones[index], label: e.target.value as "work" | "personal" };
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const newPhones = [...formData.phones];
                        if (phone.primary && newPhones.length > 1) {
                          const otherIndex = index === 0 ? 1 : 0;
                          newPhones[otherIndex] = { ...newPhones[otherIndex], primary: true };
                        }
                        newPhones[index] = { ...newPhones[index], primary: !phone.primary };
                        if (newPhones[index].primary) {
                          newPhones.forEach((_, i) => {
                            if (i !== index) newPhones[i] = { ...newPhones[i], primary: false };
                          });
                        }
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        phone.primary
                          ? "text-amber-500 bg-amber-50"
                          : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"
                      }`}
                      title={phone.primary ? "Primary phone" : "Set as primary"}
                    >
                      <Star className="h-4 w-4" fill={phone.primary ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newPhones = formData.phones.filter((_, i) => i !== index);
                        if (phone.primary && newPhones.length > 0) {
                          newPhones[0] = { ...newPhones[0], primary: true };
                        }
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                      title="Remove phone"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Contact Methods */}
                  <div className="flex items-center gap-3 pl-6">
                    <span className="text-xs text-slate-400">Contact via:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newPhones = [...formData.phones];
                        newPhones[index] = { ...newPhones[index], call: !phone.call };
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        phone.call
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                      title="Phone calls"
                    >
                      <PhoneCall className="h-3 w-3" />
                      Call
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newPhones = [...formData.phones];
                        newPhones[index] = { ...newPhones[index], text: !phone.text };
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        phone.text
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                      title="Text/SMS"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Text
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newPhones = [...formData.phones];
                        newPhones[index] = { ...newPhones[index], whatsapp: !phone.whatsapp };
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        phone.whatsapp
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                      title="WhatsApp"
                    >
                      <WhatsAppIcon className="h-3 w-3" />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newPhones = [...formData.phones];
                        newPhones[index] = { ...newPhones[index], telegram: !phone.telegram };
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        phone.telegram
                          ? "bg-sky-100 text-sky-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                      title="Telegram"
                    >
                      <TelegramIcon className="h-3 w-3" />
                      Telegram
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newPhones = [...formData.phones];
                        newPhones[index] = { ...newPhones[index], signal: !phone.signal };
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        phone.signal
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                      title="Signal"
                    >
                      <SignalIcon className="h-3 w-3" />
                      Signal
                    </button>
                  </div>
                </div>
              ))}
              {formData.phones.length === 0 && (
                <p className="text-sm text-slate-400 italic">No phone numbers added</p>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <LinkedInIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                id="linkedin-input"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="LinkedIn URL"
                className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="w-8 flex-shrink-0">
                {formData.linkedinUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, linkedinUrl: "" })}
                    className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                    title="Clear LinkedIn"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TwitterIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                type="url"
                value={formData.twitterUrl}
                onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                placeholder="Twitter URL"
                className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="w-8 flex-shrink-0">
                {formData.twitterUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, twitterUrl: "" })}
                    className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                    title="Clear Twitter"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <InstagramIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                id="instagram-input"
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="Instagram URL"
                className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="w-8 flex-shrink-0">
                {formData.instagramUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, instagramUrl: "" })}
                    className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                    title="Clear Instagram"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (primaryEmail || primaryPhone || person.emails?.length > 1 || person.phones?.length > 1) ? (
          <div className="space-y-2">
            {person.emails?.map((email, i) => (
              <div key={i} className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${email.value}`} className="text-slate-700 hover:text-blue-600">
                  {email.value}
                </a>
                {email.label && <span className="text-xs text-slate-400">{email.label}</span>}
                {email.primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
              </div>
            ))}
            {person.phones?.map((phone, i) => (
              <div key={i} className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <a href={`tel:${phone.value}`} className="text-slate-700 hover:text-blue-600">
                  {phone.value}
                </a>
                {phone.label && <span className="text-xs text-slate-400">{phone.label}</span>}
                {phone.primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
              </div>
            ))}
          </div>
        ) : null}
        </div>
      </div>

      {/* Experience Card */}
      {!editing && person.employments?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl ">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Experience</h2>
          </div>
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
                    {emp.isCurrent && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Current</span>
                    )}
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
        </div>
      )}

      {/* Activity Card */}
      {!editing && hasRelatedItems && (
        <div className="bg-white border border-slate-200 rounded-xl ">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Recent Activities */}
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

            {/* Deals */}
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

            {/* Interests */}
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

            {/* Blocks */}
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

      {/* Relationships Card - View Mode */}
      {!editing && person.relationships && person.relationships.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Relationships</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {person.relationships.map((rel) => {
              const linkHref = rel.otherEntityType === "Person"
                ? `/people/${rel.otherEntityId}`
                : rel.otherEntityType === "Organization"
                ? `/organizations/${rel.otherEntityId}`
                : rel.otherEntityType === "Deal"
                ? `/deals/${rel.otherEntityId}`
                : "#";

              const EntityIcon = rel.otherEntityType === "Person"
                ? Users
                : rel.otherEntityType === "Organization"
                ? Building2
                : Briefcase;

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
                    <EntityIcon
                      className="h-4 w-4"
                      style={{ color: rel.relationshipTypeColor || "#64748b" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {rel.otherEntityName || "Unknown"}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: rel.relationshipTypeColor ? `${rel.relationshipTypeColor}20` : "#f1f5f9",
                          color: rel.relationshipTypeColor || "#64748b"
                        }}
                      >
                        {rel.relationshipTypeName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{rel.otherEntityType}</div>
                  </div>
                  {rel.strength !== null && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-1.5 h-1.5 rounded-full ${
                            level <= (rel.strength || 0) ? "bg-blue-500" : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Edges Card - View Mode */}
      {!editing && person.edges && person.edges.length > 0 && (
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
                        {edge.role && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {edge.role}
                          </span>
                        )}
                      </div>
                      {edge.deal && (
                        <div className="text-xs text-slate-500 mb-1">
                          Deal: {edge.deal.name}
                        </div>
                      )}
                      {/* Scores */}
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Confidence</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= edge.confidence ? "bg-blue-500" : "bg-slate-200"}`} />
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
                      {/* Other People */}
                      {edge.otherPeople && edge.otherPeople.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Users className="h-3 w-3" />
                          <span>Also linked:</span>
                          {edge.otherPeople.map((p, idx) => (
                            <span key={p.id}>
                              {p.firstName} {p.lastName}
                              {p.role && ` (${p.role})`}
                              {idx < edge.otherPeople.length - 1 && ", "}
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
        {/* Tags Card */}
        <div className="bg-white border border-slate-200 rounded-xl ">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Tags</h2>
          </div>
          <div className="p-4">
            {editing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="tag-input"
                    type="text"
                    value={formData.newTag}
                    onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Add a tag..."
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                  />
                  <button type="button" onClick={addTag} className="px-2 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    Add
                  </button>
                </div>
              </div>
            ) : person.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {person.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No tags</p>
            )}
          </div>
        </div>

        {/* Notes Card */}
        <div className="bg-white border border-slate-200 rounded-xl ">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
          </div>
          <div className="p-4">
            {editing ? (
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-700 resize-none"
              />
            ) : person.notes ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{person.notes}</p>
            ) : (
              <p className="text-xs text-slate-400">No notes</p>
            )}
          </div>
        </div>
      </div>

      {/* Details Card */}
      {(editing || person.source || person.birthday || person.nickname) && (
        <div className="bg-white border border-slate-200 rounded-xl ">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
          </div>
          <div className="p-4">
            {editing ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Source</label>
                  <SourceSelector
                    value={formData.source || null}
                    onChange={(source) => setFormData({ ...formData, source: source || "" })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Source Detail</label>
                  <input
                    type="text"
                    value={formData.sourceDetail}
                    onChange={(e) => setFormData({ ...formData, sourceDetail: e.target.value })}
                    placeholder="Additional details..."
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Nickname</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Nickname"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {person.source && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Source</div>
                    <div className="text-sm text-slate-900">
                      <SourceBadge source={person.source} />
                    </div>
                  </div>
                )}
                {person.sourceDetail && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Source Detail</div>
                    <div className="text-sm text-slate-900">{person.sourceDetail}</div>
                  </div>
                )}
                {person.birthday && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Birthday</div>
                    <div className="text-sm text-slate-900">{formatDate(person.birthday)}</div>
                  </div>
                )}
                {person.nickname && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Nickname</div>
                    <div className="text-sm text-slate-900">{person.nickname}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-3">
        <span className="text-xs text-slate-400">Added {formatDate(person.createdAt)}</span>
      </div>

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
