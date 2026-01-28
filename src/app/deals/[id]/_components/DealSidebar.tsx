"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Shield,
  ChevronDown,
  ChevronRight,
  Check,
  Plus,
  Upload,
  CalendarDays,
  Pencil,
  MessageSquare,
  Mail,
  Phone,
  Video,
  FileEdit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ============ Shared Types ============

export interface Task {
  id: number;
  subject: string;
  body?: string | null;
  dueAt: string | null;
  completed: boolean;
  overdue: boolean;
  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  parentTaskId?: number | null;
  isSubtask?: boolean;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  dealId?: number;
  priority?: number | null;
  taskableType?: string | null;
  taskableId?: number | null;
}

export interface DealTarget {
  id: number;
  targetName: string;
  targetType: string;
  targetId?: number;
  status: string;
  lastActivityAt: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  isStale: boolean;
  daysSinceContact: number | null;
  firstContactedAt?: string | null;
  owner?: { id: number; firstName: string; lastName: string } | null;
}

interface DocumentItem {
  kind: string;
  label: string;
  category: string;
  present: boolean;
  document?: {
    id: number;
    name: string;
    url: string;
    uploadedAt: string;
  } | null;
}

interface Advantage {
  id: number;
  kind: string;
  title: string;
  description?: string | null;
  confidence: number | null;
  confidenceLabel: string;
  timeliness: string | null;
  timelinessLabel: string;
  source?: string | null;
}

// ============ Constants ============

const CRITICAL_DOC_KINDS = [
  "subscription_agreement",
  "wire_instructions",
  "kyc_aml",
  "purchase_agreement",
  "nda",
  "loi_term_sheet",
  "cap_table",
  "consent_to_transfer",
  "rofr_waiver",
];

const DOC_CATEGORIES: Record<string, string[]> = {
  "Deal Sourcing & Diligence": ["teaser", "cim", "data_room", "cap_table", "financials", "pitch_deck", "valuation_409a", "investor_update", "compliance_memo"],
  "Confidentiality": ["nda", "ncnda", "intro_agreement", "finder_agreement"],
  "Transaction & Transfer": ["loi_term_sheet", "purchase_agreement", "assignment_agreement", "stock_transfer_agreement", "consent_to_transfer", "rofr_waiver", "board_consent", "joinder", "escrow_agreement", "closing_instructions", "wire_instructions"],
  "SPV Formation": ["spv_formation_packet", "series_designation", "ein_letter", "banking_docs", "authorized_signers", "beneficial_ownership", "tax_forms", "insurance_policy"],
  "Investor Onboarding": ["subscription_agreement", "investor_questionnaire", "kyc_aml", "accredited_verification", "side_letter", "mfn_side_letter", "capital_call_notice", "closing_notice"],
  "Economics & Arrangements": ["co_gp_agreement", "fee_split_agreement", "carry_allocation", "broker_engagement", "side_agreement"],
  "Token & Special": ["token_purchase", "token_warrant", "saft", "custody_agreement", "settlement_instructions", "regulatory_memo_token"],
  "Communications": ["key_email_export", "whatsapp_export", "external_tracker"],
};

// ============ NextActionsTab Component ============

interface NextActionsTabProps {
  tasks: {
    overdue: Task[];
    dueThisWeek: Task[];
    backlog: Task[];
    completed: Task[];
  };
  currentUserId?: number | null;
  onTaskToggle?: (taskId: number, currentlyCompleted: boolean) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
  onScrollToTarget?: (targetId: number) => void;
}

function NextActionsTab({ tasks, currentUserId, onTaskToggle, onTaskClick, onAddTask, onScrollToTarget }: NextActionsTabProps) {
  const [ownerFilter, setOwnerFilter] = useState<number | "all">("all");
  const [showBacklog, setShowBacklog] = useState(false);

  // Derive unique assignees from all tasks
  const assignees = useMemo(() => {
    const allTasks = [...tasks.overdue, ...tasks.dueThisWeek, ...tasks.backlog, ...tasks.completed];
    const map = new Map<number, { id: number; firstName: string; lastName: string }>();
    allTasks.forEach((t) => {
      if (t.assignedTo) map.set(t.assignedTo.id, t.assignedTo);
    });
    return Array.from(map.values());
  }, [tasks]);

  const filterTasks = (taskList: Task[]): Task[] => {
    if (ownerFilter === "all") return taskList;
    return taskList.filter((t) => t.assignedTo?.id === ownerFilter);
  };

  const filteredOverdue = filterTasks(tasks.overdue);
  const filteredDueThisWeek = filterTasks(tasks.dueThisWeek);
  const filteredBacklog = filterTasks(tasks.backlog);
  const filteredCompleted = filterTasks(tasks.completed);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No date";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const PriorityDots = ({ priority }: { priority?: number | null }) => {
    if (priority == null) return null;
    const filled = Math.min(Math.max(priority, 0), 2) + 1; // 0->1, 1->2, 2->3
    return (
      <span className="inline-flex items-center gap-0.5 ml-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${i < filled ? "bg-slate-600" : "bg-slate-200"}`}
          />
        ))}
      </span>
    );
  };

  const ContextBadge = ({ task }: { task: Task }) => {
    if (!task.taskableType || !task.taskableId) return null;
    const label = task.taskableType === "DealTarget" ? "Target" : task.taskableType === "Document" ? "Doc" : task.taskableType;
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (task.taskableType === "DealTarget" && task.taskableId) {
            onScrollToTarget?.(task.taskableId);
          }
        }}
        className="text-[10px] px-1.5 py-0 h-4 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
      >
        {label}
      </button>
    );
  };

  const TaskRow = ({ task, variant }: { task: Task; variant: "overdue" | "upcoming" | "backlog" }) => (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer hover:opacity-80 transition-all ${
        variant === "overdue" ? "bg-red-50 border-red-200" :
        variant === "upcoming" ? "bg-amber-50 border-amber-200" :
        "bg-white border-slate-200"
      }`}
      onClick={() => onTaskClick?.(task)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTaskToggle?.(task.id, task.completed);
        }}
        className="mt-0.5 w-4 h-4 rounded border border-slate-300 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center shrink-0 transition-colors"
      >
        {task.completed && <Check className="h-3 w-3 text-green-500" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium truncate">{task.subject}</span>
          <PriorityDots priority={task.priority} />
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
          <span className={variant === "overdue" ? "text-red-600 font-medium" : ""}>
            {formatDate(task.dueAt)}
          </span>
          {task.assignedTo && (
            <>
              <span>·</span>
              <span>@{task.assignedTo.firstName}</span>
            </>
          )}
          <ContextBadge task={task} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Owner Filter + Add Task */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setOwnerFilter("all")}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              ownerFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {currentUserId && assignees.some((a) => a.id === currentUserId) && (
            <button
              onClick={() => setOwnerFilter(currentUserId)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                ownerFilter === currentUserId ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Me
            </button>
          )}
          {assignees
            .filter((a) => a.id !== currentUserId)
            .map((a) => (
              <button
                key={a.id}
                onClick={() => setOwnerFilter(a.id)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  ownerFilter === a.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {a.firstName}
              </button>
            ))}
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>
        )}
      </div>

      {/* Overdue */}
      {filteredOverdue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">OVERDUE ({filteredOverdue.length})</span>
          </div>
          <div className="space-y-1.5">
            {filteredOverdue.map((task) => (
              <TaskRow key={task.id} task={task} variant="overdue" />
            ))}
          </div>
        </div>
      )}

      {/* Due This Week */}
      {filteredDueThisWeek.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600">DUE THIS WEEK ({filteredDueThisWeek.length})</span>
          </div>
          <div className="space-y-1.5">
            {filteredDueThisWeek.map((task) => (
              <TaskRow key={task.id} task={task} variant="upcoming" />
            ))}
          </div>
        </div>
      )}

      {/* Backlog */}
      {filteredBacklog.length > 0 && (
        <div>
          <button
            onClick={() => setShowBacklog(!showBacklog)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {showBacklog ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <CheckSquare className="h-4 w-4 text-slate-400" />
            <span>Backlog ({filteredBacklog.length})</span>
          </button>
          {showBacklog && (
            <div className="space-y-1.5 mt-2">
              {filteredBacklog.map((task) => (
                <TaskRow key={task.id} task={task} variant="backlog" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed */}
      {filteredCompleted.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-green-500" />
          <span>Completed ({filteredCompleted.length})</span>
        </div>
      )}

      {/* Empty state */}
      {filteredOverdue.length === 0 && filteredDueThisWeek.length === 0 && filteredBacklog.length === 0 && filteredCompleted.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
      )}
    </div>
  );
}

// ============ FollowUpsTab Component ============

interface FollowUpsTabProps {
  targets: DealTarget[];
  currentUserId?: number | null;
  onScrollToTarget?: (targetId: number) => void;
  onFollowUpUpdate?: (targetId: number, nextStepAt: string | null) => void;
}

function FollowUpsTab({ targets, currentUserId, onScrollToTarget, onFollowUpUpdate }: FollowUpsTabProps) {
  const [editingDateFor, setEditingDateFor] = useState<number | null>(null);
  const [dateValue, setDateValue] = useState("");

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const staleTargets = useMemo(() =>
    targets.filter((t) =>
      t.status !== "passed" && t.status !== "on_hold" &&
      (t.isStale || (t.daysSinceContact !== null && t.daysSinceContact > 7))
    ), [targets]);

  const dueSoonTargets = useMemo(() =>
    targets.filter((t) => {
      if (!t.nextStepAt) return false;
      if (t.status === "passed" || t.status === "on_hold") return false;
      const stepDate = new Date(t.nextStepAt);
      return stepDate >= now && stepDate <= sevenDaysFromNow;
    }), [targets]);

  const uncontactedTargets = useMemo(() =>
    targets.filter((t) => !t.firstContactedAt && t.status === "not_started"),
    [targets]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDateSave = async (targetId: number, value: string) => {
    const nextStepAt = value || null;
    setEditingDateFor(null);
    onFollowUpUpdate?.(targetId, nextStepAt);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next_step_at: nextStepAt }),
      });
    } catch (err) {
      console.error("Failed to update follow-up date:", err);
    }
  };

  const TargetFollowUpRow = ({ target }: { target: DealTarget }) => {
    const statusLabels: Record<string, string> = {
      not_started: "Not started",
      contacted: "Contacted",
      engaged: "Engaged",
      negotiating: "Negotiating",
      committed: "Committed",
    };
    const daysLabel = target.daysSinceContact !== null
      ? target.daysSinceContact === 0 ? "today" : `${target.daysSinceContact}d ago`
      : "Never";

    return (
      <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white text-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onScrollToTarget?.(target.id)}
              className="font-medium text-slate-900 hover:text-indigo-600 transition-colors truncate text-left"
            >
              {target.targetName}
            </button>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
              {statusLabels[target.status] || target.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>{daysLabel}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              Follow-up:
              {editingDateFor === target.id ? (
                <input
                  type="date"
                  autoFocus
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  onBlur={() => handleDateSave(target.id, dateValue)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleDateSave(target.id, dateValue);
                    if (e.key === "Escape") setEditingDateFor(null);
                  }}
                  className="text-xs border border-slate-200 rounded px-1.5 py-0.5 w-[120px]"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditingDateFor(target.id);
                    setDateValue(target.nextStepAt ? target.nextStepAt.split("T")[0] : "");
                  }}
                  className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800"
                >
                  {formatDate(target.nextStepAt) || "set"}
                  <Pencil className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
            {target.owner && (
              <>
                <span>·</span>
                <span>@{target.owner.firstName}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const allEmpty = staleTargets.length === 0 && dueSoonTargets.length === 0 && uncontactedTargets.length === 0;

  return (
    <div className="space-y-4">
      {/* Counter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${staleTargets.length > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>
          {staleTargets.length} Stale
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${dueSoonTargets.length > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
          {dueSoonTargets.length} Due Soon
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${uncontactedTargets.length > 0 ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-400"}`}>
          {uncontactedTargets.length} Uncontacted
        </span>
      </div>

      {allEmpty && (
        <div className="text-center py-8">
          <CheckSquare className="h-8 w-8 mx-auto text-green-300 mb-2" />
          <p className="text-sm text-muted-foreground">All caught up</p>
        </div>
      )}

      {/* Stale */}
      {staleTargets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-600">STALE</span>
          </div>
          <div className="space-y-1.5">
            {staleTargets.map((target) => (
              <TargetFollowUpRow key={target.id} target={target} />
            ))}
          </div>
        </div>
      )}

      {/* Due Soon */}
      {dueSoonTargets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-600">DUE SOON</span>
          </div>
          <div className="space-y-1.5">
            {dueSoonTargets.map((target) => (
              <TargetFollowUpRow key={target.id} target={target} />
            ))}
          </div>
        </div>
      )}

      {/* Uncontacted */}
      {uncontactedTargets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 ring-2 ring-slate-200" />
            <span className="text-sm font-medium text-slate-600">UNCONTACTED</span>
          </div>
          <div className="space-y-1.5">
            {uncontactedTargets.map((target) => (
              <TargetFollowUpRow key={target.id} target={target} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ DiligenceTab Component ============

interface DiligenceTabProps {
  checklist: {
    total: number;
    completed: number;
    completionPercent: number;
    items: DocumentItem[];
  };
  onUpload?: (kind: string) => void;
  onAddDocument?: () => void;
}

function DiligenceTab({ checklist, onUpload, onAddDocument }: DiligenceTabProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const missingCritical = useMemo(() =>
    checklist.items.filter((item) => !item.present && CRITICAL_DOC_KINDS.includes(item.kind)),
    [checklist.items]);

  const recentlyUpdated = useMemo(() =>
    checklist.items
      .filter((item) => item.present && item.document?.uploadedAt)
      .sort((a, b) => {
        const dateA = a.document?.uploadedAt ? new Date(a.document.uploadedAt).getTime() : 0;
        const dateB = b.document?.uploadedAt ? new Date(b.document.uploadedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3),
    [checklist.items]);

  // Group items by their frontend category mapping
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, DocumentItem[]> = {};
    checklist.items.forEach((item) => {
      const cat = item.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [checklist.items]);

  const formatUploadDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar + Add Doc */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{checklist.completionPercent}% Complete</span>
            <span className="text-xs text-muted-foreground">({checklist.completed}/{checklist.total})</span>
          </div>
          {onAddDocument && (
            <button
              onClick={onAddDocument}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Doc
            </button>
          )}
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              checklist.completionPercent === 100
                ? "bg-green-500"
                : checklist.completionPercent >= 50
                ? "bg-blue-500"
                : "bg-amber-500"
            }`}
            style={{ width: `${checklist.completionPercent}%` }}
          />
        </div>
      </div>

      {/* Missing Critical */}
      {missingCritical.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">MISSING CRITICAL ({missingCritical.length})</span>
          </div>
          <div className="space-y-1">
            {missingCritical.map((item) => (
              <div key={item.kind} className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-sm text-red-800">{item.label}</span>
                </div>
                <button
                  onClick={() => onUpload?.(item.kind)}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Updated */}
      {recentlyUpdated.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-muted-foreground">RECENTLY UPDATED</span>
          </div>
          <div className="space-y-1">
            {recentlyUpdated.map((item) => (
              <div key={item.kind} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-sm text-slate-700">{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  uploaded {item.document?.uploadedAt ? formatUploadDate(item.document.uploadedAt) : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Checklist */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-muted-foreground">FULL CHECKLIST</span>
        </div>
        <div className="space-y-1.5">
          {Object.entries(groupedByCategory).map(([category, items]) => {
            const isExpanded = expandedCategory === category;
            const completedInCategory = items.filter((i) => i.present).length;

            return (
              <div key={category} className="border rounded-lg">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="w-full flex items-center justify-between p-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span className="text-sm">{category}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {completedInCategory}/{items.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-2.5 pb-2.5 space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.kind}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                          item.present ? "bg-green-50" : "bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            item.present
                              ? "bg-green-500 text-white"
                              : "border border-slate-300"
                          }`}
                        >
                          {item.present && <Check className="h-3 w-3" />}
                        </div>
                        <span className="flex-1 truncate">{item.label}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {item.present ? "Received" : "Missing"}
                        </Badge>
                        {!item.present && (
                          <button
                            onClick={() => onUpload?.(item.kind)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Upload
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ EdgeTab Component ============

interface EdgeTabProps {
  advantages: Advantage[];
  onAddAdvantage?: () => void;
}

function EdgeTab({ advantages, onAddAdvantage }: EdgeTabProps) {
  const [showAll, setShowAll] = useState(false);

  const kindLabels: Record<string, string> = {
    pricing_edge: "Pricing",
    relationship_edge: "Relation.",
    timing_edge: "Timing",
    information_edge: "Info",
  };

  const timelinessConfig: Record<string, { label: string; color: string; weight: number }> = {
    fresh: { label: "Fresh", color: "text-green-600", weight: 3 },
    current: { label: "Current", color: "text-blue-600", weight: 2 },
    stale: { label: "Stale", color: "text-slate-400", weight: 1 },
  };

  // Rank by (confidence || 0) * timelinessWeight
  const ranked = useMemo(() => {
    return [...advantages].sort((a, b) => {
      const scoreA = (a.confidence || 0) * (timelinessConfig[a.timeliness || "stale"]?.weight || 1);
      const scoreB = (b.confidence || 0) * (timelinessConfig[b.timeliness || "stale"]?.weight || 1);
      return scoreB - scoreA;
    });
  }, [advantages]);

  const visible = showAll ? ranked : ranked.slice(0, 5);
  const hiddenCount = ranked.length - 5;

  if (advantages.length === 0) {
    return (
      <div className="text-center py-6">
        <Shield className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-muted-foreground">No edges documented</p>
        {onAddAdvantage && (
          <button
            onClick={onAddAdvantage}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Add edge
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add Edge Button */}
      {onAddAdvantage && (
        <div className="flex justify-end">
          <button
            onClick={onAddAdvantage}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Edge
          </button>
        </div>
      )}

      {/* Edge Rows */}
      <div className="space-y-1.5">
        {visible.map((advantage) => {
          const tConfig = timelinessConfig[advantage.timeliness || "stale"] || timelinessConfig.stale;
          return (
            <div key={advantage.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white">
              {/* Type Badge */}
              <span className="text-[11px] font-medium text-slate-500 w-[60px] shrink-0 truncate">
                {kindLabels[advantage.kind] || advantage.kind}
              </span>
              {/* Title */}
              <span className="text-sm text-slate-800 flex-1 truncate">{advantage.title}</span>
              {/* Confidence Dots (5) */}
              <span className="inline-flex items-center gap-0.5 shrink-0">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < (advantage.confidence || 0) ? "bg-blue-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </span>
              {/* Timeliness Pill */}
              <span className={`text-[11px] font-medium shrink-0 ${tConfig.color}`}>
                {tConfig.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* View all */}
      {hiddenCount > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-600"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          View all ({hiddenCount} more)
        </button>
      )}
    </div>
  );
}

// ============ ActivityTab Component ============

export interface Activity {
  id: number;
  kind: string;
  subject: string | null;
  body?: string | null;
  occurredAt: string;
  startsAt?: string | null;
  endsAt?: string | null;
  outcome?: string | null;
  direction?: string | null;
  isTask?: boolean;
  taskCompleted?: boolean;
  taskDueAt?: string | null;
  performedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

interface ActivityTabProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
  onAddActivity?: () => void;
}

function ActivityTab({ activities, onActivityClick, onAddActivity }: ActivityTabProps) {
  const kindIcons: Record<string, typeof Mail> = {
    email: Mail,
    call: Phone,
    meeting: Video,
    note: FileEdit,
  };

  const kindLabels: Record<string, string> = {
    email: "Email",
    call: "Call",
    meeting: "Meeting",
    note: "Note",
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const recentActivities = activities.slice(0, 10);

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-muted-foreground">No activity logged yet</p>
        {onAddActivity && (
          <button
            onClick={onAddActivity}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Log activity
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add Activity Button */}
      {onAddActivity && (
        <div className="flex justify-end">
          <button
            onClick={onAddActivity}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Log Activity
          </button>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-2">
        {recentActivities.map((activity) => {
          const Icon = kindIcons[activity.kind] || MessageSquare;
          return (
            <div
              key={activity.id}
              onClick={() => onActivityClick?.(activity)}
              className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 cursor-pointer transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    {kindLabels[activity.kind] || activity.kind}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(activity.occurredAt)}
                  </span>
                </div>
                {activity.subject && (
                  <p className="text-sm font-medium text-slate-800 truncate mt-0.5">
                    {activity.subject}
                  </p>
                )}
                {activity.body && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {activity.body}
                  </p>
                )}
                {activity.performedBy && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>by {activity.performedBy.firstName}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more indicator */}
      {activities.length > 10 && (
        <p className="text-xs text-center text-muted-foreground">
          Showing 10 of {activities.length} activities
        </p>
      )}
    </div>
  );
}

// ============ Combined DealSidebar Component ============

interface DealSidebarProps {
  tasks: {
    overdue: Task[];
    dueThisWeek: Task[];
    backlog: Task[];
    completed: Task[];
  };
  dealId?: number;
  targets: DealTarget[];
  documentChecklist: {
    total: number;
    completed: number;
    completionPercent: number;
    items: DocumentItem[];
  };
  advantages: Advantage[];
  activities: Activity[];
  riskFlags: Record<string, { active: boolean; message: string; severity: string }>;
  lpMode: boolean;
  currentUserId?: number | null;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onTaskToggle?: (taskId: number, currentlyCompleted: boolean) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
  onScrollToTarget?: (targetId: number) => void;
  onFollowUpUpdate?: (targetId: number, nextStepAt: string | null) => void;
  onDocumentUpload?: (kind: string) => void;
  onAddAdvantage?: () => void;
  onActivityClick?: (activity: Activity) => void;
  onAddActivity?: () => void;
}

export function DealSidebar({
  tasks,
  dealId,
  targets,
  documentChecklist,
  advantages,
  activities,
  riskFlags,
  lpMode,
  currentUserId,
  activeSection,
  onSectionChange,
  onTaskToggle,
  onTaskClick,
  onAddTask,
  onScrollToTarget,
  onFollowUpUpdate,
  onDocumentUpload,
  onAddAdvantage,
  onActivityClick,
  onAddActivity,
}: DealSidebarProps) {
  const [internalSection, setInternalSection] = useState<string>("next-actions");

  useEffect(() => {
    if (activeSection) setInternalSection(activeSection);
  }, [activeSection]);

  const expandedSection = internalSection;

  const handleSectionChange = (section: string) => {
    setInternalSection(section);
    onSectionChange?.(section);
  };

  const sections = [
    { key: "next-actions", label: "Next Actions", icon: CheckSquare },
    { key: "follow-ups", label: "Follow-ups", icon: Users },
    { key: "diligence", label: "Diligence", icon: FileText },
    { key: "activity", label: "Activity", icon: MessageSquare },
    ...(!lpMode ? [{ key: "edge", label: "Edge", icon: Shield }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex border-b overflow-x-auto">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.key}
              onClick={() => handleSectionChange(section.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                expandedSection === section.key
                  ? "border-slate-900 text-slate-900 font-medium"
                  : "border-transparent text-muted-foreground hover:text-slate-600"
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="min-h-[300px]">
        {expandedSection === "next-actions" && (
          <NextActionsTab
            tasks={tasks}
            currentUserId={currentUserId}
            onTaskToggle={onTaskToggle}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            onScrollToTarget={onScrollToTarget}
          />
        )}
        {expandedSection === "follow-ups" && (
          <FollowUpsTab
            targets={targets}
            currentUserId={currentUserId}
            onScrollToTarget={onScrollToTarget}
            onFollowUpUpdate={onFollowUpUpdate}
          />
        )}
        {expandedSection === "diligence" && (
          <DiligenceTab
            checklist={documentChecklist}
            onUpload={onDocumentUpload}
          />
        )}
        {expandedSection === "activity" && (
          <ActivityTab
            activities={activities}
            onActivityClick={onActivityClick}
            onAddActivity={onAddActivity}
          />
        )}
        {expandedSection === "edge" && !lpMode && (
          <EdgeTab
            advantages={advantages}
            onAddAdvantage={onAddAdvantage}
          />
        )}
      </div>
    </div>
  );
}
