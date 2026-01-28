"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { PersonSelector } from "@/components/PersonSelector";
import { RelationshipTypeSelector } from "@/components/RelationshipTypeSelector";
import { EventModal } from "@/components/EventModal";
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
  ChevronDown,
  Save,
  Check,
  Video,
  StickyNote,
  Linkedin,
  ArrowUpRight,
  ArrowDownLeft,
  Heart,
  Zap,
  Sparkles,
  ExternalLink,
  MoreHorizontal,
  Edit3,
  CheckCircle2,
  Circle,
  Send,
} from "lucide-react";

// ====================
// ACTIVITY LOGGER COMPONENTS
// ====================

const ACTIVITY_TYPES = [
  { value: "call", label: "Call", icon: Phone, color: "text-blue-600", bgColor: "bg-blue-50", hoverBg: "hover:bg-blue-100", borderColor: "border-blue-200" },
  { value: "email", label: "Email", icon: Mail, color: "text-purple-600", bgColor: "bg-purple-50", hoverBg: "hover:bg-purple-100", borderColor: "border-purple-200" },
  { value: "meeting", label: "Meeting", icon: Calendar, color: "text-emerald-600", bgColor: "bg-emerald-50", hoverBg: "hover:bg-emerald-100", borderColor: "border-emerald-200" },
  { value: "video_call", label: "Video", icon: Video, color: "text-indigo-600", bgColor: "bg-indigo-50", hoverBg: "hover:bg-indigo-100", borderColor: "border-indigo-200" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-green-600", bgColor: "bg-green-50", hoverBg: "hover:bg-green-100", borderColor: "border-green-200" },
  { value: "linkedin_message", label: "LinkedIn", icon: Linkedin, color: "text-sky-700", bgColor: "bg-sky-50", hoverBg: "hover:bg-sky-100", borderColor: "border-sky-200" },
  { value: "note", label: "Note", icon: StickyNote, color: "text-amber-600", bgColor: "bg-amber-50", hoverBg: "hover:bg-amber-100", borderColor: "border-amber-200" },
];

const OUTCOMES = [
  { value: "completed", label: "Completed", color: "text-emerald-600 bg-emerald-50" },
  { value: "no_answer", label: "No Answer", color: "text-slate-600 bg-slate-100" },
  { value: "left_voicemail", label: "Left Voicemail", color: "text-blue-600 bg-blue-50" },
  { value: "scheduled_followup", label: "Scheduled Follow-up", color: "text-purple-600 bg-purple-50" },
  { value: "interested", label: "Interested", color: "text-emerald-600 bg-emerald-50" },
  { value: "not_interested", label: "Not Interested", color: "text-red-600 bg-red-50" },
];

interface QuickActivityLoggerProps {
  personId: number;
  onActivityLogged: () => void;
}

function QuickActivityLogger({ personId, onActivityLogged }: QuickActivityLoggerProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [direction, setDirection] = useState<"outbound" | "inbound">("outbound");
  const [outcome, setOutcome] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  const handleQuickLog = async (type: string) => {
    setSelectedType(type);
    setExpanded(true);
  };

  const handleSave = async () => {
    if (!selectedType) return;
    setSaving(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: selectedType,
          subject: subject || `${ACTIVITY_TYPES.find(t => t.value === selectedType)?.label} with contact`,
          body: notes || null,
          direction: ["call", "email", "sms", "whatsapp", "linkedin_message"].includes(selectedType) ? direction : null,
          outcome: outcome || null,
          regarding_type: "Person",
          regarding_id: personId,
          occurred_at: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Activity logged");
        setExpanded(false);
        setSelectedType(null);
        setSubject("");
        setNotes("");
        setDirection("outbound");
        setOutcome("");
        onActivityLogged();
      } else {
        toast.error("Failed to log activity");
      }
    } catch {
      toast.error("Failed to log activity");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setExpanded(false);
    setSelectedType(null);
    setSubject("");
    setNotes("");
  };

  const typeConfig = ACTIVITY_TYPES.find(t => t.value === selectedType);
  const showDirection = selectedType && ["call", "email", "sms", "whatsapp", "linkedin_message"].includes(selectedType);
  const showOutcome = selectedType && ["call", "meeting", "video_call"].includes(selectedType);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {!expanded ? (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900">Quick Log</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => handleQuickLog(type.value)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${type.bgColor} ${type.borderColor} ${type.hoverBg} hover:shadow-md hover:scale-[1.02]`}
                >
                  <Icon className={`h-4 w-4 ${type.color}`} />
                  <span className={`text-sm font-medium ${type.color}`}>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {typeConfig && (
                <div className={`p-2 rounded-xl ${typeConfig.bgColor}`}>
                  <typeConfig.icon className={`h-5 w-5 ${typeConfig.color}`} />
                </div>
              )}
              <span className="font-semibold text-slate-900">Log {typeConfig?.label}</span>
            </div>
            <button onClick={handleCancel} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Subject */}
          <input
            ref={inputRef}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description..."
            className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />

          {/* Direction */}
          {showDirection && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Direction</span>
              <div className="flex gap-1">
                {(["outbound", "inbound"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      direction === d
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {d === "outbound" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Outcome */}
          {showOutcome && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Outcome</span>
              <div className="flex flex-wrap gap-1">
                {OUTCOMES.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setOutcome(outcome === o.value ? "" : o.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                      outcome === o.value
                        ? `${o.color} ring-2 ring-offset-1 ring-current`
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes (optional)..."
            rows={2}
            className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Log Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================
// ACTIVITY TIMELINE COMPONENT
// ====================

interface Activity {
  id: number;
  kind: string;
  subject: string | null;
  body?: string | null;
  occurredAt: string;
  startsAt?: string | null;
  endsAt?: string | null;
  outcome?: string | null;
  direction?: string | null;
  performedBy?: { id: number; firstName: string; lastName: string } | null;
  dealName?: string | null;
  dealId?: number | null;
}

function ActivityTimeline({
  activities,
  onActivityClick,
  loading,
}: {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Clock className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">No activities yet</p>
        <p className="text-xs text-slate-400 mt-1">Log your first interaction above</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />

      <div className="space-y-1">
        {activities.map((activity, index) => {
          const typeConfig = ACTIVITY_TYPES.find(t => t.value === activity.kind) || ACTIVITY_TYPES[6];
          const Icon = typeConfig.icon;
          const isFirst = index === 0;

          return (
            <button
              key={activity.id}
              onClick={() => onActivityClick(activity)}
              className={`group relative w-full flex items-start gap-4 px-3 py-3 rounded-xl text-left transition-all hover:bg-slate-50 ${isFirst ? "bg-slate-50/50" : ""}`}
            >
              {/* Timeline dot */}
              <div className={`relative z-10 flex-shrink-0 h-10 w-10 rounded-xl ${typeConfig.bgColor} flex items-center justify-center shadow-sm ring-4 ring-white group-hover:scale-110 transition-transform`}>
                <Icon className={`h-4 w-4 ${typeConfig.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {activity.subject || typeConfig.label}
                  </span>
                  {activity.direction && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
                      {activity.direction === "outbound" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                    </span>
                  )}
                  {activity.outcome && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${OUTCOMES.find(o => o.value === activity.outcome)?.color || "bg-slate-100 text-slate-600"}`}>
                      {OUTCOMES.find(o => o.value === activity.outcome)?.label || activity.outcome}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{formatRelativeTime(activity.occurredAt)}</span>
                  {activity.dealName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {activity.dealName}
                      </span>
                    </>
                  )}
                  {activity.performedBy && (
                    <>
                      <span>•</span>
                      <span>{activity.performedBy.firstName}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Hover indicator */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ====================
// RELATIONSHIP CARD COMPONENT
// ====================

interface Relationship {
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

function RelationshipCard({
  relationship,
  onEdit,
  onDelete,
}: {
  relationship: Relationship;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const linkHref = relationship.otherEntityType === "Person"
    ? `/people/${relationship.otherEntityId}`
    : relationship.otherEntityType === "Organization"
    ? `/organizations/${relationship.otherEntityId}`
    : `/deals/${relationship.otherEntityId}`;

  const EntityIcon = relationship.otherEntityType === "Person" ? Users : relationship.otherEntityType === "Organization" ? Building2 : Briefcase;
  const color = relationship.relationshipTypeColor || "#6366f1";

  return (
    <div
      className="group relative bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Colored accent */}
      <div
        className="absolute top-0 left-4 right-4 h-1 rounded-b-full opacity-60"
        style={{ backgroundColor: color }}
      />

      {/* Actions */}
      <div className={`absolute top-3 right-3 flex items-center gap-1 transition-opacity ${showActions ? "opacity-100" : "opacity-0"}`}>
        <button
          onClick={(e) => { e.preventDefault(); onEdit(); }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(); }}
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <Link href={linkHref} className="block">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: `${color}15` }}
          >
            <EntityIcon className="h-5 w-5" style={{ color }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 truncate mb-0.5">
              {relationship.otherEntityName || "Unknown"}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}15`, color }}
              >
                {relationship.relationshipTypeName}
              </span>
              <span className="text-xs text-slate-400">{relationship.otherEntityType}</span>
            </div>
          </div>
        </div>

        {/* Strength indicator */}
        {relationship.strength !== null && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Strength</span>
              <span className="text-xs font-semibold" style={{ color }}>
                {relationship.strength}/5
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className="flex-1 h-1.5 rounded-full transition-all"
                  style={{
                    backgroundColor: level <= (relationship.strength || 0) ? color : `${color}20`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Notes preview */}
        {relationship.notes && (
          <p className="mt-3 text-xs text-slate-500 line-clamp-2 italic">
            "{relationship.notes}"
          </p>
        )}
      </Link>
    </div>
  );
}

// ====================
// INLINE EDITOR COMPONENTS
// ====================

const WARMTH_CONFIG = [
  { label: "Cold", color: "bg-slate-400", gradient: "from-slate-400 to-slate-500" },
  { label: "Warm", color: "bg-yellow-500", gradient: "from-yellow-400 to-orange-500" },
  { label: "Hot", color: "bg-orange-500", gradient: "from-orange-500 to-red-500" },
  { label: "Champion", color: "bg-red-500", gradient: "from-red-500 to-pink-500" },
];

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
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      placeholder={placeholder}
      className={`bg-transparent border-b border-slate-300 outline-none py-0.5 ${inputClassName}`}
    />
  ) : (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`hover:text-indigo-600 transition-colors cursor-text text-left ${className}`}
    >
      {value || <span className="text-slate-300 italic">{placeholder}</span>}
    </button>
  );
}

function InlineWarmthSelector({ warmth, onSave }: { warmth: number; onSave: (val: number) => void }) {
  const [editing, setEditing] = useState(false);
  const config = WARMTH_CONFIG[warmth] || WARMTH_CONFIG[0];

  if (editing) {
    return (
      <div className="flex items-center gap-1" onMouseLeave={() => setEditing(false)}>
        {WARMTH_CONFIG.map((w, i) => (
          <button
            key={i}
            onClick={() => { onSave(i); setEditing(false); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-all ${
              i === warmth
                ? `bg-gradient-to-r ${w.gradient} text-white border-transparent shadow-lg`
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
      className={`px-3 py-1.5 text-xs font-semibold rounded-full text-white bg-gradient-to-r ${config.gradient} hover:shadow-lg hover:scale-105 transition-all`}
    >
      {config.label}
    </button>
  );
}

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
    if (editing && ref.current) { ref.current.focus(); ref.current.select(); }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== (url || "")) onSave(draft);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(url || ""); setEditing(false); }
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
        onContextMenu={(e) => { e.preventDefault(); setDraft(url); setEditing(true); }}
        className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-md ${colors}`}
        title="Click to open, right-click to edit"
      >
        <Icon className="h-4 w-4" />
        {label}
      </a>
    );
  }

  return (
    <button
      onClick={() => { setDraft(""); setEditing(true); }}
      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-dashed border-slate-200"
    >
      <Icon className="h-4 w-4" />
      Add {label}
    </button>
  );
}

function NotesEditor({ value, onSave }: { value: string | null; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const commit = () => { setEditing(false); if (draft !== (value || "")) onSave(draft); };

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add notes..."
          rows={4}
          className="w-full px-4 py-3 text-sm text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => { setDraft(value || ""); setEditing(false); }} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
          <button onClick={commit} className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">Save</button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => { setDraft(value || ""); setEditing(true); }} className="w-full text-left text-sm text-slate-700 hover:text-indigo-600 transition-colors cursor-text">
      {value ? <span className="whitespace-pre-wrap">{value}</span> : <span className="text-slate-300 italic">Click to add notes...</span>}
    </button>
  );
}

function BioEditor({ value, onSave }: { value: string | null; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const commit = () => { setEditing(false); if (draft !== (value || "")) onSave(draft); };

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a bio..."
          rows={3}
          className="w-full px-4 py-3 text-sm text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => { setDraft(value || ""); setEditing(false); }} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
          <button onClick={commit} className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">Save</button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => { setDraft(value || ""); setEditing(true); }} className="w-full text-left text-sm text-slate-700 leading-relaxed hover:text-indigo-600 transition-colors cursor-text">
      {value ? <span>{value}</span> : <span className="text-slate-300 italic">Click to add bio...</span>}
    </button>
  );
}

function TagsEditor({ tags, onSave }: { tags: string[]; onSave: (val: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding && inputRef.current) inputRef.current.focus(); }, [adding]);

  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) onSave([...tags, trimmed]);
    setNewTag("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span key={tag} className="group inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 text-xs font-medium rounded-full border border-slate-200">
          {tag}
          <button onClick={() => onSave(tags.filter((t) => t !== tag))} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
            onBlur={() => { if (!newTag.trim()) setAdding(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") addTag(); if (e.key === "Escape") { setNewTag(""); setAdding(false); } }}
            placeholder="New tag"
            className="w-24 px-3 py-1 text-xs border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <button onClick={addTag} className="p-1 text-indigo-600 hover:text-indigo-700">
            <Check className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 px-3 py-1 text-xs text-slate-400 hover:text-slate-600 border border-dashed border-slate-200 rounded-full hover:border-slate-300 transition-colors">
          <Plus className="h-3 w-3" />
          Add
        </button>
      )}
    </div>
  );
}

// ====================
// HELPER FUNCTIONS
// ====================

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  if (!person.bio) missing.push({ key: "bio", label: "Bio" });
  if (!person.tags?.length) missing.push({ key: "tags", label: "Tags" });
  if (!person.relationships?.length) missing.push({ key: "relationships", label: "Relationships" });
  return missing;
}

// ====================
// TYPES
// ====================

interface FormEmail { value: string; label: "work" | "personal"; primary: boolean; }
interface FormPhone { value: string; label: "work" | "personal"; primary: boolean; whatsapp: boolean; telegram: boolean; text: boolean; call: boolean; signal: boolean; }
interface FormEmployment { id: number | null; title: string; department: string; organizationId: number | null; organizationName: string; isCurrent: boolean; isPrimary: boolean; }
interface Organization { id: number; name: string; kind: string; }
interface RelatedDeal { id: number; name: string; company: string | null; status: string; role: string; }
interface RelatedInterest { id: number; dealId: number; dealName: string | null; investor: string | null; status: string; role: string; }
interface RelatedBlock { id: number; dealId: number; dealName: string | null; seller: string | null; status: string; role: string; }
interface RecentActivity { id: number; kind: string; subject: string | null; occurredAt: string; startsAt: string | null; dealId: number | null; outcome: string | null; }

interface PersonEdge {
  id: number;
  title: string;
  edgeType: "information" | "relationship" | "structural" | "timing";
  confidence: number;
  timeliness: number;
  notes: string | null;
  role: string | null;
  deal: { id: number; name: string } | null;
  otherPeople: Array<{ id: number; firstName: string; lastName: string; role: string | null }>;
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
  address: { city: string | null; state: string | null; country: string | null };
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  bio: string | null;
  avatarUrl: string | null;
  warmth: number;
  tags: string[];
  notes: string | null;
  source: string | null;
  sourceDetail: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  contactCount: number;
  currentEmployment: { title: string | null; organization: { id: number; name: string } } | null;
  employments: Array<{ id: number; title: string | null; department: string | null; isCurrent: boolean; isPrimary: boolean; startedAt: string | null; endedAt: string | null; organization: { id: number; name: string } }>;
  relatedDeals: RelatedDeal[];
  relatedInterests: RelatedInterest[];
  relatedBlocks: RelatedBlock[];
  recentActivities: RecentActivity[];
  relationships: Relationship[];
  edges: PersonEdge[];
  createdAt: string;
  updatedAt: string;
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

  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Section editing states
  const [editingContacts, setEditingContacts] = useState(false);
  const [editingEmployments, setEditingEmployments] = useState(false);
  const [addingRelationship, setAddingRelationship] = useState(false);
  const [editingRelationshipId, setEditingRelationshipId] = useState<number | null>(null);
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);

  // Form states
  const [formEmails, setFormEmails] = useState<FormEmail[]>([]);
  const [formPhones, setFormPhones] = useState<FormPhone[]>([]);
  const [formEmployments, setFormEmployments] = useState<FormEmployment[]>([]);
  const [newRelationship, setNewRelationship] = useState<FormRelationship | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const toFormEmail = (email: { value: string; label?: string; primary?: boolean }): FormEmail => ({
    value: email.value,
    label: (email.label === "personal" ? "personal" : "work") as "work" | "personal",
    primary: email.primary || false
  });

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

  const createEmptyEmail = (primary: boolean = false): FormEmail => ({ value: "", label: "work", primary });
  const createEmptyPhone = (primary: boolean = false): FormPhone => ({ value: "", label: "work", primary, whatsapp: false, telegram: false, text: true, call: true, signal: false });
  const createEmptyEmployment = (isPrimary: boolean = false): FormEmployment => ({ id: null, title: "", department: "", organizationId: null, organizationName: "", isCurrent: true, isPrimary });
  const createEmptyRelationship = (): FormRelationship => ({ id: null, relationshipTypeId: null, otherEntityType: "Person", otherEntityId: null, otherEntityName: "", strength: null, notes: "" });

  const fetchPerson = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${params.id}`);
      const data = await res.json();
      setPerson(data);
      setFormEmails(data.emails?.length > 0 ? data.emails.map(toFormEmail) : []);
      setFormPhones(data.phones?.length > 0 ? data.phones.map(toFormPhone) : []);
      setFormEmployments(data.employments?.length > 0
        ? data.employments.map((emp: { id: number; title: string | null; department: string | null; organization: { id: number; name: string }; isCurrent: boolean; isPrimary: boolean }) => ({
            id: emp.id, title: emp.title || "", department: emp.department || "", organizationId: emp.organization.id, organizationName: emp.organization.name, isCurrent: emp.isCurrent, isPrimary: emp.isPrimary
          }))
        : []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch person:", err);
      setLoading(false);
    }
  }, [params.id]);

  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities?regarding_type=Person&regarding_id=${params.id}&per_page=20`);
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
    setLoadingActivities(false);
  }, [params.id]);

  useEffect(() => {
    fetchPerson();
    fetchActivities();
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations`).then(res => res.json()).then(setOrganizations).catch(console.error);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationship_types`).then(res => res.json()).then(setRelationshipTypes).catch(console.error);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`).then(res => res.json()).then(data => setAllPeople(data.map((p: { id: number; firstName: string; lastName: string; title?: string; org?: string }) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, title: p.title || null, org: p.org || null })))).catch(console.error);
  }, [fetchPerson, fetchActivities]);

  const saveField = useCallback(async (field: string, value: unknown) => {
    if (!person) return;
    const oldPerson = person;
    setPerson((prev) => {
      if (!prev) return prev;
      if (["city", "state", "country"].includes(field)) {
        return { ...prev, address: { ...prev.address, [field]: value } };
      }
      return { ...prev, [field]: value };
    });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Saved");
    } catch {
      setPerson(oldPerson);
      toast.error("Failed to save");
    }
  }, [person]);

  const saveContacts = async () => {
    if (!person) return;
    setSavingSection("contacts");
    try {
      const payload = {
        emails: formEmails.filter(e => e.value.trim()).map(e => ({ value: e.value.trim(), label: e.label, primary: e.primary })),
        phones: formPhones.filter(p => p.value.trim()).map(p => ({ value: formatE164(p.value), label: p.label, primary: p.primary, whatsapp: p.whatsapp, telegram: p.telegram, text: p.text, call: p.call, signal: p.signal }))
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${person.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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

  const saveEmployments = async () => {
    if (!person) return;
    setSavingSection("employments");
    try {
      const payload = {
        employments: formEmployments.filter(emp => emp.organizationId).map(emp => ({ id: emp.id, title: emp.title || null, department: emp.department || null, organizationId: emp.organizationId, isCurrent: emp.isCurrent, isPrimary: emp.isPrimary }))
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${person.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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

  const saveRelationship = async (rel: FormRelationship) => {
    if (!person || !rel.relationshipTypeId || !rel.otherEntityId) return;
    setSavingSection("relationship");
    try {
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
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationships/${rel.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationships`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }

      await fetchPerson();
      setAddingRelationship(false);
      setEditingRelationshipId(null);
      setNewRelationship(null);
      toast.success("Relationship saved");
    } catch {
      toast.error("Failed to save relationship");
    } finally {
      setSavingSection(null);
    }
  };

  const deleteRelationship = async (relId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/relationships/${relId}`, { method: "DELETE" });
      await fetchPerson();
      toast.success("Relationship removed");
    } catch {
      toast.error("Failed to remove relationship");
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/${params.id}/upload_avatar`, { method: "POST", body: formData });
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

  const handleAddField = (fieldKey: string) => {
    if (fieldKey === "email" || fieldKey === "phone") {
      if (fieldKey === "email" && formEmails.length === 0) setFormEmails([createEmptyEmail(true)]);
      if (fieldKey === "phone" && formPhones.length === 0) setFormPhones([createEmptyPhone(true)]);
      setEditingContacts(true);
    } else if (fieldKey === "relationships") {
      setNewRelationship(createEmptyRelationship());
      setAddingRelationship(true);
    } else {
      setMoreDetailsOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
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
  const primaryEmail = person.emails?.find((e) => e.primary)?.value || person.emails?.[0]?.value;
  const primaryPhone = person.phones?.find((p) => p.primary)?.value || person.phones?.[0]?.value;
  const whatsappPhone = person.phones?.find((p) => p.whatsapp)?.value;
  const whatsappNumber = whatsappPhone?.replace(/\D/g, "");
  const missingFields = getMissingFields(person);

  const relatedDealsCount = person.relatedDeals?.length || 0;
  const relatedInterestsCount = person.relatedInterests?.length || 0;
  const relatedBlocksCount = person.relatedBlocks?.length || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white/50">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <MissingDataDropdown missingFields={missingFields} onAddClick={handleAddField} />
        </div>

        <div className="p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="relative h-20 w-20 rounded-2xl overflow-hidden group focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg">
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingAvatar ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                </div>
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <InlineText value={person.firstName} placeholder="First name" onSave={(val) => saveField("firstName", val)} className="text-2xl font-bold text-slate-900" inputClassName="text-2xl font-bold text-slate-900 w-40" />
                    <InlineText value={person.lastName} placeholder="Last name" onSave={(val) => saveField("lastName", val)} className="text-2xl font-bold text-slate-900" inputClassName="text-2xl font-bold text-slate-900 w-40" />
                  </div>

                  {person.currentEmployment && (
                    <p className="text-sm text-slate-600 mb-2">
                      {person.currentEmployment.title && <span className="font-medium">{person.currentEmployment.title}</span>}
                      {person.currentEmployment.title && " at "}
                      <Link href={`/organizations/${person.currentEmployment.organization.id}`} className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                        {person.currentEmployment.organization.name}
                      </Link>
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <InlineText value={person.address?.city || ""} placeholder="City" onSave={(val) => saveField("city", val)} className="text-slate-500" inputClassName="text-sm w-24" />
                    <span>,</span>
                    <InlineText value={person.address?.country || ""} placeholder="Country" onSave={(val) => saveField("country", val)} className="text-slate-500" inputClassName="text-sm w-28" />
                  </div>
                </div>

                <InlineWarmthSelector warmth={person.warmth} onSave={(val) => saveField("warmth", val)} />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {primaryEmail && (
                  <a href={`mailto:${primaryEmail}`} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
                {primaryPhone && (
                  <a href={`tel:${primaryPhone}`} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                )}
                {whatsappNumber && (
                  <a href={`whatsapp://send?phone=${whatsappNumber}`} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-all hover:shadow-md">
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                <LinkChip label="LinkedIn" icon={LinkedInIcon} url={person.linkedinUrl} onSave={(val) => saveField("linkedinUrl", val || null)} colors="text-[#0A66C2] bg-blue-50 hover:bg-blue-100 border border-blue-200" />
                <LinkChip label="Twitter" icon={TwitterIcon} url={person.twitterUrl} onSave={(val) => saveField("twitterUrl", val || null)} colors="text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200" />
                <LinkChip label="Instagram" icon={InstagramIcon} url={person.instagramUrl} onSave={(val) => saveField("instagramUrl", val || null)} colors="text-[#E4405F] bg-pink-50 hover:bg-pink-100 border border-pink-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="col-span-2 space-y-6">
          {/* Quick Activity Logger */}
          <QuickActivityLogger personId={person.id} onActivityLogged={fetchActivities} />

          {/* Activity Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Activity Timeline</h2>
              </div>
              <span className="text-xs font-medium text-slate-400">{activities.length} activities</span>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              <ActivityTimeline activities={activities} onActivityClick={(a) => setSelectedActivityId(a.id)} loading={loadingActivities} />
            </div>
          </div>

          {/* Deals & Activity */}
          {(relatedDealsCount > 0 || relatedInterestsCount > 0 || relatedBlocksCount > 0) && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Deal Involvement</h2>
              </div>
              <div className="p-4 space-y-3">
                {person.relatedDeals.map((deal) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900">{deal.name}</span>
                        {deal.company && <span className="text-xs text-slate-500 block">{deal.company}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-lg">{deal.role}</span>
                      <StatusBadge status={deal.status} />
                    </div>
                  </Link>
                ))}
                {person.relatedInterests.map((interest) => (
                  <Link key={interest.id} href={`/deals/${interest.dealId}`} className="flex items-center justify-between py-3 px-4 bg-purple-50/50 rounded-xl hover:bg-purple-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900">{interest.dealName}</span>
                        {interest.investor && <span className="text-xs text-slate-500 block">via {interest.investor}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">{interest.role}</span>
                      <StatusBadge status={interest.status} />
                    </div>
                  </Link>
                ))}
                {person.relatedBlocks.map((block) => (
                  <Link key={block.id} href={`/deals/${block.dealId}`} className="flex items-center justify-between py-3 px-4 bg-amber-50/50 rounded-xl hover:bg-amber-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900">{block.dealName}</span>
                        {block.seller && <span className="text-xs text-slate-500 block">from {block.seller}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">{block.role}</span>
                      <StatusBadge status={block.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Relationships - Always Visible */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Relationships</h2>
              </div>
              <button
                onClick={() => { setNewRelationship(createEmptyRelationship()); setAddingRelationship(true); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Add/Edit Relationship Form */}
              {(addingRelationship || editingRelationshipId !== null) && newRelationship && (
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                      {editingRelationshipId ? "Edit Relationship" : "New Relationship"}
                    </span>
                    <button onClick={() => { setAddingRelationship(false); setEditingRelationshipId(null); setNewRelationship(null); }} className="p-1 hover:bg-white/50 rounded">
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Entity Type Toggle */}
                  <div className="flex gap-1 p-1 bg-white rounded-lg">
                    {(["Person", "Organization"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewRelationship({ ...newRelationship, otherEntityType: type, otherEntityId: null, otherEntityName: "", relationshipTypeId: null })}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                          newRelationship.otherEntityType === type ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {type === "Person" ? <Users className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Entity Selector */}
                  {newRelationship.otherEntityType === "Person" ? (
                    <PersonSelector value={newRelationship.otherEntityId} onChange={(id, p) => setNewRelationship({ ...newRelationship, otherEntityId: id, otherEntityName: p ? `${p.firstName} ${p.lastName}` : "" })} people={allPeople} excludeId={person.id} placeholder="Select person..." />
                  ) : (
                    <OrganizationSelector value={newRelationship.otherEntityId} onChange={(id, org) => setNewRelationship({ ...newRelationship, otherEntityId: id, otherEntityName: org?.name || "" })} organizations={organizations} onOrganizationCreated={(newOrg) => setOrganizations([...organizations, newOrg])} placeholder="Select organization..." />
                  )}

                  {/* Relationship Type */}
                  {newRelationship.otherEntityId && (
                    <RelationshipTypeSelector
                      value={newRelationship.relationshipTypeId}
                      onChange={(id) => setNewRelationship({ ...newRelationship, relationshipTypeId: id })}
                      relationshipTypes={relationshipTypes.filter(rt => (!rt.sourceType || rt.sourceType === "Person") && (!rt.targetType || rt.targetType === newRelationship.otherEntityType))}
                      targetEntityType={newRelationship.otherEntityType}
                      onTypeCreated={(newType) => setRelationshipTypes([...relationshipTypes, newType])}
                      placeholder="Select type..."
                    />
                  )}

                  {/* Strength */}
                  {newRelationship.relationshipTypeId && (
                    <div>
                      <span className="text-xs font-medium text-slate-600 block mb-2">Strength</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            onClick={() => setNewRelationship({ ...newRelationship, strength: newRelationship.strength === level ? null : level })}
                            className={`flex-1 h-3 rounded-full transition-all ${
                              level <= (newRelationship.strength || 0) ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-slate-200 hover:bg-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {newRelationship.relationshipTypeId && (
                    <input
                      value={newRelationship.notes}
                      onChange={(e) => setNewRelationship({ ...newRelationship, notes: e.target.value })}
                      placeholder="Add a note..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  )}

                  {/* Save */}
                  {newRelationship.relationshipTypeId && (
                    <button
                      onClick={() => saveRelationship(newRelationship)}
                      disabled={savingSection === "relationship"}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md shadow-indigo-500/25 disabled:opacity-50"
                    >
                      {savingSection === "relationship" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save Relationship
                    </button>
                  )}
                </div>
              )}

              {/* Relationship Cards */}
              {person.relationships && person.relationships.length > 0 ? (
                person.relationships.map((rel) => (
                  <RelationshipCard
                    key={rel.id}
                    relationship={rel}
                    onEdit={() => {
                      setNewRelationship({
                        id: rel.id,
                        relationshipTypeId: rel.relationshipTypeId,
                        otherEntityType: rel.otherEntityType,
                        otherEntityId: rel.otherEntityId,
                        otherEntityName: rel.otherEntityName || "",
                        strength: rel.strength,
                        notes: rel.notes || ""
                      });
                      setEditingRelationshipId(rel.id);
                    }}
                    onDelete={() => deleteRelationship(rel.id)}
                  />
                ))
              ) : !addingRelationship && (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No relationships yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add connections to track your network</p>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">About</h2>
            </div>
            <div className="p-4">
              <BioEditor value={person.bio} onSave={(val) => saveField("bio", val || null)} />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Tags</h2>
            </div>
            <div className="p-4">
              <TagsEditor tags={person.tags || []} onSave={(val) => saveField("tags", val)} />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
            </div>
            <div className="p-4">
              <NotesEditor value={person.notes} onSave={(val) => saveField("notes", val || null)} />
            </div>
          </div>

          {/* More Details */}
          <Collapsible.Root open={moreDetailsOpen} onOpenChange={setMoreDetailsOpen}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <Collapsible.Trigger asChild>
                <button className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors">
                  <span>More Details</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${moreDetailsOpen ? "rotate-180" : ""}`} />
                </button>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <div className="px-5 pb-4 pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Source</span>
                    {person.source ? <SourceBadge source={person.source} /> : <span className="text-xs text-slate-300 italic">Not set</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Created</span>
                    <span className="text-sm text-slate-700">{formatDate(person.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Updated</span>
                    <span className="text-sm text-slate-700">{formatDate(person.updatedAt)}</span>
                  </div>
                </div>
              </Collapsible.Content>
            </div>
          </Collapsible.Root>
        </div>
      </div>

      {/* Event Modal */}
      {selectedActivityId && (
        <EventModal activityId={selectedActivityId} onClose={() => setSelectedActivityId(null)} />
      )}
    </div>
  );
}
