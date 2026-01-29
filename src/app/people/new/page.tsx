"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  PhoneCall,
  MessageSquare,
  MapPin,
  Save,
  Plus,
  Trash2,
  Star
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

export default function NewContactPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emails, setEmails] = useState<FormEmail[]>([]);
  const [phones, setPhones] = useState<FormPhone[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [warmth, setWarmth] = useState(0);
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

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

  useEffect(() => {
    // Fetch organizations for the dropdown
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`)
      .then((res) => res.json())
      .then((data) => setOrganizations(data))
      .catch((err) => console.error("Failed to fetch organizations:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        country: country || null,
        linkedinUrl: linkedinUrl || null,
        jobTitle: jobTitle || null,
        organizationId: organizationId || null,
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
        router.push(`/people/${data.id}`);
      } else {
        const error = await response.json();
        toast.error(error.errors?.join(", ") || "Failed to create contact");
        setSaving(false);
      }
    } catch (err) {
      console.error("Failed to create contact:", err);
      toast.error("Failed to create contact. Please try again.");
      setSaving(false);
    }
  };

  const warmthOptions = [
    { value: 0, label: "Cold", color: "bg-slate-500" },
    { value: 1, label: "Warm", color: "bg-yellow-500" },
    { value: 2, label: "Hot", color: "bg-orange-500" },
    { value: 3, label: "Champion", color: "bg-green-500" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">New Contact</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doe"
                required
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
            Contact Information
          </h2>
          <div className="space-y-6">
            {/* Emails Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Emails</span>
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
                <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="email"
                    value={email.value}
                    onChange={(e) => {
                      const newEmails = [...emails];
                      newEmails[index] = { ...newEmails[index], value: e.target.value };
                      setEmails(newEmails);
                    }}
                    placeholder="email@example.com"
                    className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  />
                  <select
                    value={email.label}
                    onChange={(e) => {
                      const newEmails = [...emails];
                      newEmails[index] = { ...newEmails[index], label: e.target.value as "work" | "personal" };
                      setEmails(newEmails);
                    }}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      const newEmails = emails.filter((_, i) => i !== index);
                      if (email.primary && newEmails.length > 0) {
                        newEmails[0] = { ...newEmails[0], primary: true };
                      }
                      setEmails(newEmails);
                    }}
                    className="p-1.5 text-red-400 hover:text-white bg-red-100 hover:bg-red-500 rounded transition-colors"
                    title="Remove email"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {emails.length === 0 && (
                <p className="text-sm text-slate-400 italic">No emails added yet</p>
              )}
            </div>

            {/* Phones Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Phone Numbers</span>
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
                <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
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
                      className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    />
                    <select
                      value={phone.label}
                      onChange={(e) => {
                        const newPhones = [...phones];
                        newPhones[index] = { ...newPhones[index], label: e.target.value as "work" | "personal" };
                        setPhones(newPhones);
                      }}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        const newPhones = phones.filter((_, i) => i !== index);
                        if (phone.primary && newPhones.length > 0) {
                          newPhones[0] = { ...newPhones[0], primary: true };
                        }
                        setPhones(newPhones);
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
                        const newPhones = [...phones];
                        newPhones[index] = { ...newPhones[index], call: !phone.call };
                        setPhones(newPhones);
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
                        const newPhones = [...phones];
                        newPhones[index] = { ...newPhones[index], text: !phone.text };
                        setPhones(newPhones);
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
                        const newPhones = [...phones];
                        newPhones[index] = { ...newPhones[index], whatsapp: !phone.whatsapp };
                        setPhones(newPhones);
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
                        const newPhones = [...phones];
                        newPhones[index] = { ...newPhones[index], telegram: !phone.telegram };
                        setPhones(newPhones);
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
                        const newPhones = [...phones];
                        newPhones[index] = { ...newPhones[index], signal: !phone.signal };
                        setPhones(newPhones);
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
              {phones.length === 0 && (
                <p className="text-sm text-slate-400 italic">No phone numbers added yet</p>
              )}
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <LinkedInIcon className="h-4 w-4 inline mr-2 text-slate-400" />
                LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
          </div>
        </div>

        {/* Work Info */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
            Work
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Partner, Managing Director, etc."
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
            Location
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <MapPin className="h-4 w-4 inline mr-2 text-slate-400" />
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="San Francisco"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="United States"
              />
            </div>
          </div>
        </div>

        {/* Relationship */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
            Relationship
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Warmth
              </label>
              <div className="flex gap-2">
                {warmthOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setWarmth(option.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      warmth === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Source
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Referral, Conference, LinkedIn, etc."
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
            Notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Any notes about this contact..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Contact
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
