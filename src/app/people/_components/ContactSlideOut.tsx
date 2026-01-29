"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  X,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  PhoneCall,
  MessageSquare,
  MapPin,
  Plus,
  Trash2,
  Star,
  Building2,
  Briefcase,
  Tag,
} from "lucide-react";
import { OrganizationSelector } from "@/components/OrganizationSelector";

// Social/messaging icons as SVG components
const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const SignalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c4.636 0 8.4 3.764 8.4 8.4s-3.764 8.4-8.4 8.4S3.6 16.636 3.6 12 7.364 3.6 12 3.6zm0 2.4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 2.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2z"/>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
  </svg>
);

interface Organization {
  id: number;
  name: string;
  kind: string;
}

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

interface ContactSlideOutProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: { id: number; firstName: string; lastName: string }) => void;
}

// Formats a phone number to E.164 format (+1XXXXXXXXXX)
function formatE164(phone: string): string {
  if (!phone) return "";

  const hasPlus = phone.startsWith("+");
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  if (hasPlus) {
    return "+" + digits;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return "+" + digits;
  }

  if (digits.length === 10) {
    return "+1" + digits;
  }

  return "+" + digits;
}

const WARMTH_OPTIONS = [
  { value: 0, label: "Cold", color: "bg-muted0" },
  { value: 1, label: "Warm", color: "bg-yellow-500" },
  { value: 2, label: "Hot", color: "bg-orange-500" },
  { value: 3, label: "Champion", color: "bg-green-500" },
];

export function ContactSlideOut({ isOpen, onClose, onSave }: ContactSlideOutProps) {
  const [saving, setSaving] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emails, setEmails] = useState<FormEmail[]>([]);
  const [phones, setPhones] = useState<FormPhone[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [warmth, setWarmth] = useState(0);
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

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

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      setFirstName("");
      setLastName("");
      setEmails([]);
      setPhones([]);
      setLinkedinUrl("");
      setTwitterUrl("");
      setInstagramUrl("");
      setJobTitle("");
      setOrganizationId(null);
      setCity("");
      setState("");
      setCountry("");
      setWarmth(0);
      setSource("");
      setNotes("");
      setTags([]);
      setNewTag("");
    }
  }, [isOpen]);

  // Fetch organizations
  useEffect(() => {
    if (isOpen) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`)
        .then((res) => res.json())
        .then((data) => setOrganizations(data))
        .catch((err) => console.error("Failed to fetch organizations:", err));
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        warmth,
        source: source || null,
        notes: notes || null,
        city: city || null,
        state: state || null,
        country: country || null,
        linkedinUrl: linkedinUrl || null,
        twitterUrl: twitterUrl || null,
        instagramUrl: instagramUrl || null,
        jobTitle: jobTitle || null,
        organizationId: organizationId || null,
        tags: tags.length > 0 ? tags : [],
      };

      // Add emails - filter out empty values
      payload.emails = emails
        .filter(e => e.value.trim())
        .map(e => ({
          value: e.value.trim(),
          label: e.label,
          primary: e.primary
        }));

      // Add phones - filter out empty values, format to E.164
      payload.phones = phones
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success("Contact created successfully");
        onSave(data);
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.errors?.join(", ") || "Failed to create contact");
      }
    } catch (err) {
      console.error("Failed to create contact:", err);
      toast.error("Failed to create contact. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-card shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">New Contact</h2>
              <p className="text-xs text-muted-foreground">Add a new person to your CRM</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Contact Information
              </h3>

              {/* Emails */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Emails</span>
                  <button
                    type="button"
                    onClick={() => {
                      const isFirst = emails.length === 0;
                      setEmails([...emails, createEmptyEmail(isFirst)]);
                    }}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3 w-3" />
                    Add Email
                  </button>
                </div>
                {emails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="email"
                      value={email.value}
                      onChange={(e) => {
                        const newEmails = [...emails];
                        newEmails[index] = { ...newEmails[index], value: e.target.value };
                        setEmails(newEmails);
                      }}
                      placeholder="email@example.com"
                      className="flex-1 min-w-0 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-card"
                    />
                    <select
                      value={email.label}
                      onChange={(e) => {
                        const newEmails = [...emails];
                        newEmails[index] = { ...newEmails[index], label: e.target.value as "work" | "personal" };
                        setEmails(newEmails);
                      }}
                      className="px-2 py-1 text-xs border border-border rounded bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const newEmails = [...emails];
                        if (email.primary && newEmails.length > 1) {
                          const otherIndex = index === 0 ? 1 : 0;
                          newEmails[otherIndex] = { ...newEmails[otherIndex], primary: true };
                        }
                        newEmails[index] = { ...newEmails[index], primary: !email.primary };
                        if (newEmails[index].primary) {
                          newEmails.forEach((_, i) => {
                            if (i !== index) newEmails[i] = { ...newEmails[i], primary: false };
                          });
                        }
                        setEmails(newEmails);
                      }}
                      className={`p-1 rounded transition-colors ${
                        email.primary
                          ? "text-amber-500 bg-amber-50"
                          : "text-muted-foreground/60 hover:text-amber-500 hover:bg-amber-50"
                      }`}
                      title={email.primary ? "Primary email" : "Set as primary"}
                    >
                      <Star className="h-3.5 w-3.5" fill={email.primary ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newEmails = emails.filter((_, i) => i !== index);
                        if (email.primary && newEmails.length > 0) {
                          newEmails[0] = { ...newEmails[0], primary: true };
                        }
                        setEmails(newEmails);
                      }}
                      className="p-1 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {emails.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No emails added yet</p>
                )}
              </div>

              {/* Phones */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Phone Numbers</span>
                  <button
                    type="button"
                    onClick={() => {
                      const isFirst = phones.length === 0;
                      setPhones([...phones, createEmptyPhone(isFirst)]);
                    }}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3 w-3" />
                    Add Phone
                  </button>
                </div>
                {phones.map((phone, index) => (
                  <div key={index} className="p-2 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <input
                        type="tel"
                        value={phone.value}
                        onChange={(e) => {
                          const newPhones = [...phones];
                          newPhones[index] = { ...newPhones[index], value: e.target.value };
                          setPhones(newPhones);
                        }}
                        onBlur={(e) => {
                          const newPhones = [...phones];
                          newPhones[index] = { ...newPhones[index], value: formatE164(e.target.value) };
                          setPhones(newPhones);
                        }}
                        placeholder="+15551234567"
                        className="flex-1 min-w-0 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-card"
                      />
                      <select
                        value={phone.label}
                        onChange={(e) => {
                          const newPhones = [...phones];
                          newPhones[index] = { ...newPhones[index], label: e.target.value as "work" | "personal" };
                          setPhones(newPhones);
                        }}
                        className="px-2 py-1 text-xs border border-border rounded bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const newPhones = [...phones];
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
                          setPhones(newPhones);
                        }}
                        className={`p-1 rounded transition-colors ${
                          phone.primary
                            ? "text-amber-500 bg-amber-50"
                            : "text-muted-foreground/60 hover:text-amber-500 hover:bg-amber-50"
                        }`}
                        title={phone.primary ? "Primary phone" : "Set as primary"}
                      >
                        <Star className="h-3.5 w-3.5" fill={phone.primary ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPhones = phones.filter((_, i) => i !== index);
                          if (phone.primary && newPhones.length > 0) {
                            newPhones[0] = { ...newPhones[0], primary: true };
                          }
                          setPhones(newPhones);
                        }}
                        className="p-1 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Contact Methods */}
                    <div className="flex items-center gap-2 pl-6 flex-wrap">
                      <span className="text-xs text-muted-foreground">Via:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newPhones = [...phones];
                          newPhones[index] = { ...newPhones[index], call: !phone.call };
                          setPhones(newPhones);
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
                          phone.call
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                        title="Phone calls"
                      >
                        <PhoneCall className="h-2.5 w-2.5" />
                        Call
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPhones = [...phones];
                          newPhones[index] = { ...newPhones[index], text: !phone.text };
                          setPhones(newPhones);
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
                          phone.text
                            ? "bg-blue-100 text-blue-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                        title="Text/SMS"
                      >
                        <MessageSquare className="h-2.5 w-2.5" />
                        Text
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPhones = [...phones];
                          newPhones[index] = { ...newPhones[index], whatsapp: !phone.whatsapp };
                          setPhones(newPhones);
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
                          phone.whatsapp
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                        title="WhatsApp"
                      >
                        <WhatsAppIcon className="h-2.5 w-2.5" />
                        WA
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPhones = [...phones];
                          newPhones[index] = { ...newPhones[index], telegram: !phone.telegram };
                          setPhones(newPhones);
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
                          phone.telegram
                            ? "bg-sky-100 text-sky-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                        title="Telegram"
                      >
                        <TelegramIcon className="h-2.5 w-2.5" />
                        TG
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPhones = [...phones];
                          newPhones[index] = { ...newPhones[index], signal: !phone.signal };
                          setPhones(newPhones);
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
                          phone.signal
                            ? "bg-blue-100 text-blue-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                        title="Signal"
                      >
                        <SignalIcon className="h-2.5 w-2.5" />
                        Sig
                      </button>
                    </div>
                  </div>
                ))}
                {phones.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No phone numbers added yet</p>
                )}
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <LinkedInIcon className="h-3.5 w-3.5 inline mr-1.5 text-[#0A66C2]" />
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <TwitterIcon className="h-3.5 w-3.5 inline mr-1.5 text-foreground" />
                    X (Twitter) URL
                  </label>
                  <input
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://x.com/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <InstagramIcon className="h-3.5 w-3.5 inline mr-1.5 text-[#E4405F]" />
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://instagram.com/johndoe"
                  />
                </div>
              </div>
            </div>

            {/* Work Info */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Work
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <Building2 className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                    Organization
                  </label>
                  <OrganizationSelector
                    value={organizationId}
                    onChange={(id) => setOrganizationId(id)}
                    organizations={organizations}
                    onOrganizationCreated={(newOrg) => {
                      setOrganizations([...organizations, newOrg]);
                    }}
                    placeholder="Search or create organization..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <Briefcase className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Partner, Managing Director, etc."
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Location
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <MapPin className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="CA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>

            {/* Relationship */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Relationship
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Warmth
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {WARMTH_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setWarmth(option.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          warmth === option.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-border hover:border-border text-muted-foreground"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${option.color}`} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Referral, Conference, LinkedIn, etc."
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Tags
              </h3>
              <div className="space-y-2">
                {/* Existing tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-foreground text-sm rounded-md"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((t) => t !== tag))}
                          className="ml-1 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Add new tag */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTag.trim()) {
                        e.preventDefault();
                        if (!tags.includes(newTag.trim())) {
                          setTags([...tags, newTag.trim()]);
                        }
                        setNewTag("");
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a tag and press Enter..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTag.trim() && !tags.includes(newTag.trim())) {
                        setTags([...tags, newTag.trim()]);
                        setNewTag("");
                      }
                    }}
                    disabled={!newTag.trim()}
                    className="px-3 py-2 text-sm font-medium text-white bg-muted-foreground hover:bg-muted-foreground/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Any notes about this contact..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !firstName.trim() || !lastName.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Contact
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
