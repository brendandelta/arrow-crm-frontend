"use client";

import { useState } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Check,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ============ TaskList Component ============
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
  dealId?: number;
}

interface TaskListProps {
  tasks: {
    overdue: Task[];
    dueThisWeek: Task[];
    backlog: Task[];
    completed: Task[];
  };
  onTaskToggle?: (taskId: number, currentlyCompleted: boolean) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
}

export function TaskList({ tasks, onTaskToggle, onTaskClick, onAddTask }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const TaskItem = ({ task, variant }: { task: Task; variant: "overdue" | "upcoming" | "backlog" | "completed" }) => {
    const bgColors = {
      overdue: "bg-red-50 border-red-200",
      upcoming: "bg-amber-50 border-amber-200",
      backlog: "bg-white border-slate-200",
      completed: "bg-slate-50 border-slate-200",
    };

    return (
      <div
        className={`flex items-start gap-2 p-2 rounded-lg border ${bgColors[variant]} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => onTaskClick?.(task)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTaskToggle?.(task.id, task.completed);
          }}
          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
            task.completed
              ? "bg-green-500 border-green-500 text-white hover:bg-green-600"
              : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          {task.completed && <Check className="h-3 w-3" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
            {task.subject}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span className={variant === "overdue" ? "text-red-600 font-medium" : ""}>
              {formatDate(task.dueAt)}
            </span>
            {task.assignedTo && (
              <>
                <span>·</span>
                <span>{task.assignedTo.firstName}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Add Task Button */}
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 border-dashed transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      )}

      {/* Overdue */}
      {tasks.overdue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">Overdue ({tasks.overdue.length})</span>
          </div>
          <div className="space-y-1.5">
            {tasks.overdue.map((task) => (
              <TaskItem key={task.id} task={task} variant="overdue" />
            ))}
          </div>
        </div>
      )}

      {/* Due This Week */}
      {tasks.dueThisWeek.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600">Due This Week ({tasks.dueThisWeek.length})</span>
          </div>
          <div className="space-y-1.5">
            {tasks.dueThisWeek.map((task) => (
              <TaskItem key={task.id} task={task} variant="upcoming" />
            ))}
          </div>
        </div>
      )}

      {/* Backlog */}
      {tasks.backlog.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-muted-foreground">Backlog ({tasks.backlog.length})</span>
          </div>
          <div className="space-y-1.5">
            {tasks.backlog.map((task) => (
              <TaskItem key={task.id} task={task} variant="backlog" />
            ))}
          </div>
        </div>
      )}

      {/* Completed (collapsible) */}
      {tasks.completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {showCompleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>Completed ({tasks.completed.length})</span>
          </button>
          {showCompleted && (
            <div className="space-y-1.5 mt-2">
              {tasks.completed.map((task) => (
                <TaskItem key={task.id} task={task} variant="completed" />
              ))}
            </div>
          )}
        </div>
      )}

      {tasks.overdue.length === 0 && tasks.dueThisWeek.length === 0 && tasks.backlog.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
      )}
    </div>
  );
}

// ============ OutreachTracker Component ============
interface DealTarget {
  id: number;
  targetName: string;
  targetType: string;
  status: string;
  lastActivityAt: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  isStale: boolean;
  daysSinceContact: number | null;
}

interface OutreachTrackerProps {
  targets: DealTarget[];
  onTargetClick?: (target: DealTarget) => void;
}

export function OutreachTracker({ targets, onTargetClick }: OutreachTrackerProps) {
  const staleTargets = targets.filter((t) => t.isStale);
  const activeTargets = targets.filter((t) => !t.isStale && t.status !== "passed" && t.status !== "on_hold");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const TargetItem = ({ target, isStale }: { target: DealTarget; isStale: boolean }) => (
    <button
      onClick={() => onTargetClick?.(target)}
      className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-colors hover:bg-slate-50 ${
        isStale ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"
      }`}
    >
      <Users className={`h-4 w-4 shrink-0 ${isStale ? "text-amber-500" : "text-slate-400"}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{target.targetName}</div>
        <div className="text-xs text-muted-foreground">
          {target.nextStep || `Last: ${formatDate(target.lastActivityAt)}`}
        </div>
      </div>
      {isStale && (
        <Badge className="bg-amber-100 text-amber-700 text-xs">
          {target.daysSinceContact}d
        </Badge>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Stale - Needs Follow-up */}
      {staleTargets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600">
              Needs Follow-up ({staleTargets.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {staleTargets.slice(0, 5).map((target) => (
              <TargetItem key={target.id} target={target} isStale={true} />
            ))}
          </div>
        </div>
      )}

      {/* Active */}
      {activeTargets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-muted-foreground">
              Active ({activeTargets.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {activeTargets.slice(0, 5).map((target) => (
              <TargetItem key={target.id} target={target} isStale={false} />
            ))}
          </div>
        </div>
      )}

      {targets.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No outreach targets</p>
      )}
    </div>
  );
}

// ============ DocumentChecklist Component ============
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

interface DocumentChecklistProps {
  checklist: {
    total: number;
    completed: number;
    completionPercent: number;
    items: DocumentItem[];
  };
  onUpload?: (kind: string) => void;
}

export function DocumentChecklist({ checklist, onUpload }: DocumentChecklistProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Group by category
  const byCategory = checklist.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, DocumentItem[]>);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Diligence Progress</span>
          <span className="font-medium">{checklist.completionPercent}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
        <div className="text-xs text-muted-foreground mt-1">
          {checklist.completed} of {checklist.total} documents
        </div>
      </div>

      {/* Categorized List */}
      <div className="space-y-2">
        {Object.entries(byCategory).map(([category, items]) => {
          const isExpanded = expandedCategory === category;
          const completedInCategory = items.filter((i) => i.present).length;

          return (
            <div key={category} className="border rounded-lg">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="text-sm font-medium">{category}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {completedInCategory}/{items.length}
                </span>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.kind}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        item.present ? "bg-green-50" : "bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          item.present
                            ? "bg-green-500 text-white"
                            : "border border-slate-300"
                        }`}
                      >
                        {item.present && <Check className="h-3 w-3" />}
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {item.present && item.document ? (
                        <a
                          href={item.document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
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
  );
}

// ============ AdvantagesPanel Component ============
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

interface AdvantagesPanelProps {
  advantages: Advantage[];
  onAddAdvantage?: () => void;
}

export function AdvantagesPanel({ advantages, onAddAdvantage }: AdvantagesPanelProps) {
  const kindLabels: Record<string, string> = {
    pricing_edge: "Pricing",
    relationship_edge: "Relationship",
    timing_edge: "Timing",
    information_edge: "Information",
  };

  const timelinessColors: Record<string, string> = {
    fresh: "text-green-600 bg-green-100",
    current: "text-blue-600 bg-blue-100",
    stale: "text-slate-500 bg-slate-100",
  };

  if (advantages.length === 0) {
    return (
      <div className="text-center py-6">
        <Shield className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-muted-foreground">No advantages documented</p>
        {onAddAdvantage && (
          <button
            onClick={onAddAdvantage}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Add advantage
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {advantages.map((advantage) => (
        <div key={advantage.id} className="p-3 border rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium">{advantage.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {kindLabels[advantage.kind] || advantage.kind}
              </div>
            </div>
            {advantage.timeliness && (
              <Badge className={`text-xs ${timelinessColors[advantage.timeliness] || ""}`}>
                {advantage.timelinessLabel}
              </Badge>
            )}
          </div>
          {advantage.description && (
            <p className="text-sm text-muted-foreground mt-2">{advantage.description}</p>
          )}
          {advantage.confidence && (
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < advantage.confidence! ? "bg-blue-500" : "bg-slate-200"
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {advantage.confidenceLabel}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ Combined DealSidebar Component ============
interface DealSidebarProps {
  tasks: TaskListProps["tasks"];
  targets: DealTarget[];
  documentChecklist: DocumentChecklistProps["checklist"];
  advantages: Advantage[];
  riskFlags: Record<string, { active: boolean; message: string; severity: string }>;
  lpMode: boolean;
  onTaskToggle?: (taskId: number, currentlyCompleted: boolean) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
  onTargetClick?: (target: DealTarget) => void;
  onDocumentUpload?: (kind: string) => void;
  onAddAdvantage?: () => void;
}

export function DealSidebar({
  tasks,
  targets,
  documentChecklist,
  advantages,
  riskFlags,
  lpMode,
  onTaskToggle,
  onTaskClick,
  onAddTask,
  onTargetClick,
  onDocumentUpload,
  onAddAdvantage,
}: DealSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string>("tasks");

  const sections = [
    { key: "tasks", label: "Tasks", icon: CheckSquare },
    { key: "outreach", label: "Outreach", icon: Users },
    { key: "documents", label: "Documents", icon: FileText },
    ...(!lpMode ? [{ key: "advantages", label: "Advantages", icon: Shield }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex border-b">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.key}
              onClick={() => setExpandedSection(section.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
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
        {expandedSection === "tasks" && (
          <TaskList
            tasks={tasks}
            onTaskToggle={onTaskToggle}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
          />
        )}
        {expandedSection === "outreach" && (
          <OutreachTracker targets={targets} onTargetClick={onTargetClick} />
        )}
        {expandedSection === "documents" && (
          <DocumentChecklist checklist={documentChecklist} onUpload={onDocumentUpload} />
        )}
        {expandedSection === "advantages" && !lpMode && (
          <AdvantagesPanel advantages={advantages} onAddAdvantage={onAddAdvantage} />
        )}
      </div>
    </div>
  );
}
