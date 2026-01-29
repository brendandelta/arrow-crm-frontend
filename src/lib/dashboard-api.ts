/**
 * Dashboard API - Types and data fetching for the command center
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Truth Bar metrics - the global reality snapshot
 */
export interface TruthBarMetrics {
  activeDeals: number;
  totalCommittedCents: number;
  totalWiredCents: number;
  totalDeployedCents: number;
  overdueTasks: number;
  tasksDueToday: number;
  nextCloseDate: string | null;
  nextDeadlineDate: string | null;
  nextCloseDealName: string | null;
}

/**
 * Attention item severity levels
 */
export type AttentionSeverity = "critical" | "high" | "medium" | "low";

/**
 * Attention item types
 */
export type AttentionItemType =
  | "overdue_task"
  | "due_today_task"
  | "high_priority_task"
  | "deal_closing_soon"
  | "interest_stale"
  | "capital_gap"
  | "document_expiring"
  | "document_missing"
  | "credential_rotation"
  | "follow_up_needed";

/**
 * Related entity reference for deep linking
 */
export interface EntityRef {
  type: "deal" | "task" | "person" | "organization" | "document" | "credential" | "interest" | "internal_entity";
  id: number;
  name: string;
}

/**
 * Unified attention item - ranked action item
 */
export interface AttentionItem {
  id: string;
  type: AttentionItemType;
  title: string;
  subtitleReason: string;
  severity: AttentionSeverity;
  score: number;
  relatedEntities: EntityRef[];
  primaryAction: {
    label: string;
    href: string;
  };
  dueAt?: string;
  createdAt: string;
}

/**
 * Deal health status
 */
export type DealHealth = "on_track" | "watch" | "at_risk";

/**
 * Active deal snapshot for dashboard
 */
export interface ActiveDealSnapshot {
  id: number;
  name: string;
  company: string | null;
  stage: string;
  stageLabel: string;
  priority: number | null;
  confidence: number | null;
  ownerId: number | null;
  ownerName: string | null;
  nextDate: string | null;
  nextDateType: "deadline" | "expected_close" | null;
  // Capital rollups
  softCircledCents: number;
  committedCents: number;
  wiredCents: number;
  deployedCents: number;
  // Health
  health: DealHealth;
  healthReason: string | null;
  overdueTaskCount: number;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Capital by entity snapshot
 */
export interface CapitalByEntity {
  entityId: number;
  entityName: string;
  entityType: string;
  status: string;
  committedCents: number;
  wiredCents: number;
  deployedCents: number;
  gapCents: number; // committed - wired
  dealCount: number;
  activeDeals: Array<{
    id: number;
    name: string;
    committedCents: number;
    wiredCents: number;
  }>;
}

/**
 * Person follow-up signal
 */
export interface RelationshipSignal {
  personId: number;
  firstName: string;
  lastName: string;
  title: string | null;
  organizationId: number | null;
  organizationName: string | null;
  warmth: number;
  warmthLabel: string;
  lastContactedAt: string | null;
  daysSinceContact: number | null;
  // Context
  activeDealsCount: number;
  closingDealsCount: number;
  interestStatus: string | null;
  reason: string;
}

/**
 * Upcoming event/activity
 */
export interface UpcomingEvent {
  id: number;
  kind: string;
  kindLabel: string;
  subject: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  meetingUrl: string | null;
  dealId: number | null;
  dealName: string | null;
  attendeeCount: number;
}

/**
 * Alert types
 */
export type AlertType =
  | "document_expiring"
  | "document_missing"
  | "credential_overdue"
  | "credential_due_soon";

/**
 * Quiet alert item
 */
export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: "warning" | "error";
  relatedEntity: EntityRef;
  action: {
    label: string;
    href: string;
  };
}

/**
 * Full dashboard data payload
 */
export interface DashboardData {
  truthBar: TruthBarMetrics;
  attentionItems: AttentionItem[];
  activeDeals: ActiveDealSnapshot[];
  capitalByEntity: CapitalByEntity[];
  relationshipSignals: RelationshipSignal[];
  upcomingEvents: UpcomingEvent[];
  alerts: AlertItem[];
  // Metadata
  generatedAt: string;
  userId: number | null;
}

/**
 * Dashboard filter options
 */
export interface DashboardFilters {
  timeframe: "today" | "this_week" | "all";
  scope: "mine" | "team";
  userId?: number;
}

/**
 * Dashboard preferences
 */
export interface DashboardPreferences {
  moduleOrder: string[];
  hiddenModules: string[];
  attentionTimeframe: "today" | "this_week" | "all";
  attentionScope: "mine" | "team";
}

export const DEFAULT_PREFERENCES: DashboardPreferences = {
  moduleOrder: [
    "truth_bar",
    "attention",
    "active_deals",
    "capital",
    "relationships",
    "events",
    "alerts",
  ],
  hiddenModules: [],
  attentionTimeframe: "this_week",
  attentionScope: "mine",
};

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch complete dashboard data
 */
export async function fetchDashboardData(
  filters?: DashboardFilters
): Promise<DashboardData> {
  const params = new URLSearchParams();
  if (filters?.timeframe) params.set("timeframe", filters.timeframe);
  if (filters?.scope) params.set("scope", filters.scope);
  if (filters?.userId) params.set("user_id", filters.userId.toString());

  const url = `${API_BASE}/api/dashboard${params.toString() ? `?${params}` : ""}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Dashboard fetch failed: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Return empty dashboard data as fallback
    return getEmptyDashboardData();
  }
}

/**
 * Fetch dashboard data from individual endpoints (fallback mode)
 * Used when the unified endpoint isn't available
 */
export async function fetchDashboardDataFromEndpoints(
  filters?: DashboardFilters
): Promise<DashboardData> {
  const [
    dealsRes,
    tasksRes,
    activitiesRes,
    peopleRes,
    entitiesRes,
    documentsRes,
  ] = await Promise.allSettled([
    fetch(`${API_BASE}/api/deals`),
    fetch(`${API_BASE}/api/tasks`),
    fetch(`${API_BASE}/api/activities?time_filter=upcoming`),
    fetch(`${API_BASE}/api/people`),
    fetch(`${API_BASE}/api/internal_entities`),
    fetch(`${API_BASE}/api/documents`),
  ]);

  // Parse results
  const deals = dealsRes.status === "fulfilled" && dealsRes.value.ok
    ? await dealsRes.value.json()
    : [];
  const tasks = tasksRes.status === "fulfilled" && tasksRes.value.ok
    ? await tasksRes.value.json()
    : [];
  const activities = activitiesRes.status === "fulfilled" && activitiesRes.value.ok
    ? await activitiesRes.value.json()
    : [];
  const people = peopleRes.status === "fulfilled" && peopleRes.value.ok
    ? await peopleRes.value.json()
    : [];
  const entities = entitiesRes.status === "fulfilled" && entitiesRes.value.ok
    ? (await entitiesRes.value.json()).entities || []
    : [];
  const documents = documentsRes.status === "fulfilled" && documentsRes.value.ok
    ? (await documentsRes.value.json()).documents || []
    : [];

  // Transform into dashboard data
  return transformToDashboardData(deals, tasks, activities, people, entities, documents, filters);
}

/**
 * Transform raw API data into dashboard format with scoring
 */
function transformToDashboardData(
  deals: any[],
  tasks: any[],
  activities: any[],
  people: any[],
  entities: any[],
  documents: any[],
  filters?: DashboardFilters
): DashboardData {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Active deals (sourcing, live, closing)
  const activeDeals = deals.filter((d: any) =>
    ["sourcing", "live", "closing"].includes(d.stage)
  );

  // Calculate truth bar metrics
  const truthBar = calculateTruthBar(activeDeals, tasks, today);

  // Build attention items
  const attentionItems = buildAttentionItems(deals, tasks, people, documents, filters, today);

  // Build active deal snapshots
  const dealSnapshots = buildDealSnapshots(activeDeals, tasks, today);

  // Build capital by entity (simplified - would need entity links data)
  const capitalByEntity: CapitalByEntity[] = [];

  // Build relationship signals
  const relationshipSignals = buildRelationshipSignals(people, deals, activities, today);

  // Build upcoming events
  const upcomingEvents = buildUpcomingEvents(activities);

  // Build alerts
  const alerts = buildAlerts(documents, today);

  return {
    truthBar,
    attentionItems,
    activeDeals: dealSnapshots,
    capitalByEntity,
    relationshipSignals,
    upcomingEvents,
    alerts,
    generatedAt: now.toISOString(),
    userId: null,
  };
}

/**
 * Calculate truth bar metrics
 */
function calculateTruthBar(
  activeDeals: any[],
  tasks: any[],
  today: Date
): TruthBarMetrics {
  // Sum capital from interests across active deals
  let totalCommittedCents = 0;
  let totalWiredCents = 0;
  let totalDeployedCents = 0;

  for (const deal of activeDeals) {
    if (deal.interests) {
      for (const interest of deal.interests) {
        totalCommittedCents += interest.committedCents || 0;
        totalWiredCents += interest.wiredCents || 0;
        totalDeployedCents += interest.deployedCents || 0;
      }
    }
    // Fallback to deal-level rollups if available
    if (deal.committedCents) totalCommittedCents += deal.committedCents;
    if (deal.wiredCents) totalWiredCents += deal.wiredCents;
  }

  // Count overdue and due today tasks
  const overdueTasks = tasks.filter((t: any) => {
    if (t.status === "completed" || t.completed) return false;
    if (!t.dueAt) return false;
    return new Date(t.dueAt) < today;
  }).length;

  const tasksDueToday = tasks.filter((t: any) => {
    if (t.status === "completed" || t.completed) return false;
    if (!t.dueAt) return false;
    const dueDate = new Date(t.dueAt);
    return dueDate.toDateString() === today.toDateString();
  }).length;

  // Find next close/deadline
  let nextCloseDate: string | null = null;
  let nextDeadlineDate: string | null = null;
  let nextCloseDealName: string | null = null;

  for (const deal of activeDeals) {
    if (deal.expectedClose) {
      const closeDate = new Date(deal.expectedClose);
      if (closeDate >= today) {
        if (!nextCloseDate || closeDate < new Date(nextCloseDate)) {
          nextCloseDate = deal.expectedClose;
          nextCloseDealName = deal.name;
        }
      }
    }
    if (deal.deadline) {
      const deadlineDate = new Date(deal.deadline);
      if (deadlineDate >= today) {
        if (!nextDeadlineDate || deadlineDate < new Date(nextDeadlineDate)) {
          nextDeadlineDate = deal.deadline;
        }
      }
    }
  }

  return {
    activeDeals: activeDeals.length,
    totalCommittedCents,
    totalWiredCents,
    totalDeployedCents,
    overdueTasks,
    tasksDueToday,
    nextCloseDate,
    nextDeadlineDate,
    nextCloseDealName,
  };
}

/**
 * Build and score attention items
 */
function buildAttentionItems(
  deals: any[],
  tasks: any[],
  people: any[],
  documents: any[],
  filters: DashboardFilters | undefined,
  today: Date
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const now = new Date();

  // Score weights
  const WEIGHTS = {
    overdue: 100,
    dueToday: 80,
    highPriority: 60,
    closingSoon: 70,
    capitalGap: 50,
    documentExpiring: 40,
    staleContact: 30,
  };

  // Overdue tasks
  for (const task of tasks) {
    if (task.status === "completed" || task.completed) continue;
    if (!task.dueAt) continue;

    const dueDate = new Date(task.dueAt);
    const isOverdue = dueDate < today;
    const isDueToday = dueDate.toDateString() === today.toDateString();
    const isHighPriority = task.priority === 0;

    if (isOverdue) {
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id: `task-overdue-${task.id}`,
        type: "overdue_task",
        title: task.subject || "Untitled task",
        subtitleReason: `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
        severity: daysOverdue > 3 ? "critical" : "high",
        score: WEIGHTS.overdue + (daysOverdue * 5) + (isHighPriority ? 20 : 0),
        relatedEntities: buildTaskRelatedEntities(task),
        primaryAction: {
          label: "Complete",
          href: `/tasks?id=${task.id}`,
        },
        dueAt: task.dueAt,
        createdAt: task.createdAt,
      });
    } else if (isDueToday) {
      items.push({
        id: `task-today-${task.id}`,
        type: "due_today_task",
        title: task.subject || "Untitled task",
        subtitleReason: "Due today",
        severity: isHighPriority ? "high" : "medium",
        score: WEIGHTS.dueToday + (isHighPriority ? 20 : 0),
        relatedEntities: buildTaskRelatedEntities(task),
        primaryAction: {
          label: "Complete",
          href: `/tasks?id=${task.id}`,
        },
        dueAt: task.dueAt,
        createdAt: task.createdAt,
      });
    } else if (isHighPriority) {
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 7) {
        items.push({
          id: `task-priority-${task.id}`,
          type: "high_priority_task",
          title: task.subject || "Untitled task",
          subtitleReason: `High priority, due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`,
          severity: "medium",
          score: WEIGHTS.highPriority + (7 - daysUntilDue) * 5,
          relatedEntities: buildTaskRelatedEntities(task),
          primaryAction: {
            label: "Open",
            href: `/tasks?id=${task.id}`,
          },
          dueAt: task.dueAt,
          createdAt: task.createdAt,
        });
      }
    }
  }

  // Deals closing soon
  for (const deal of deals) {
    if (deal.stage !== "closing") continue;

    const closeDate = deal.expectedClose ? new Date(deal.expectedClose) : null;
    const deadline = deal.deadline ? new Date(deal.deadline) : null;
    const relevantDate = closeDate || deadline;

    if (relevantDate && relevantDate >= today) {
      const daysUntil = Math.floor((relevantDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 14) {
        // Check for capital gap
        const committed = deal.committedCents || 0;
        const wired = deal.wiredCents || 0;
        const hasGap = committed > 0 && wired < committed;

        items.push({
          id: `deal-closing-${deal.id}`,
          type: hasGap ? "capital_gap" : "deal_closing_soon",
          title: deal.name,
          subtitleReason: hasGap
            ? `Closing in ${daysUntil} days with ${formatCurrency((committed - wired) / 100)} unwired`
            : `Closing in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
          severity: daysUntil <= 3 ? "critical" : daysUntil <= 7 ? "high" : "medium",
          score: WEIGHTS.closingSoon + (14 - daysUntil) * 5 + (hasGap ? WEIGHTS.capitalGap : 0),
          relatedEntities: [{ type: "deal", id: deal.id, name: deal.name }],
          primaryAction: {
            label: "Open Deal",
            href: `/deals/${deal.id}`,
          },
          dueAt: relevantDate.toISOString(),
          createdAt: deal.createdAt,
        });
      }
    }
  }

  // Documents expiring soon
  for (const doc of documents) {
    if (!doc.expiresAt) continue;
    const expiresAt = new Date(doc.expiresAt);
    if (expiresAt < today) continue; // Already expired

    const daysUntil = Math.floor((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 30) {
      items.push({
        id: `doc-expiring-${doc.id}`,
        type: "document_expiring",
        title: doc.title || doc.name,
        subtitleReason: `Expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
        severity: daysUntil <= 7 ? "high" : "medium",
        score: WEIGHTS.documentExpiring + (30 - daysUntil) * 2,
        relatedEntities: [{ type: "document", id: doc.id, name: doc.title || doc.name }],
        primaryAction: {
          label: "View Document",
          href: `/documents?id=${doc.id}`,
        },
        dueAt: doc.expiresAt,
        createdAt: doc.createdAt,
      });
    }
  }

  // Sort by score descending
  items.sort((a, b) => b.score - a.score);

  // Apply timeframe filter
  if (filters?.timeframe === "today") {
    const todayStr = today.toDateString();
    return items.filter((item) => {
      if (!item.dueAt) return item.severity === "critical";
      return new Date(item.dueAt).toDateString() === todayStr || item.severity === "critical";
    });
  }

  if (filters?.timeframe === "this_week") {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return items.filter((item) => {
      if (!item.dueAt) return true;
      const dueDate = new Date(item.dueAt);
      return dueDate <= weekEnd;
    });
  }

  return items;
}

function buildTaskRelatedEntities(task: any): EntityRef[] {
  const entities: EntityRef[] = [
    { type: "task", id: task.id, name: task.subject || "Task" },
  ];

  if (task.dealId && task.dealName) {
    entities.push({ type: "deal", id: task.dealId, name: task.dealName });
  }

  return entities;
}

/**
 * Build active deal snapshots with health indicators
 */
function buildDealSnapshots(
  activeDeals: any[],
  tasks: any[],
  today: Date
): ActiveDealSnapshot[] {
  return activeDeals.map((deal) => {
    // Count overdue tasks for this deal
    const dealTasks = tasks.filter((t: any) => t.dealId === deal.id);
    const overdueTaskCount = dealTasks.filter((t: any) => {
      if (t.status === "completed" || t.completed) return false;
      if (!t.dueAt) return false;
      return new Date(t.dueAt) < today;
    }).length;

    // Calculate health
    const { health, healthReason } = calculateDealHealth(deal, overdueTaskCount, today);

    // Get next date
    let nextDate: string | null = null;
    let nextDateType: "deadline" | "expected_close" | null = null;

    if (deal.deadline && deal.expectedClose) {
      const deadlineDate = new Date(deal.deadline);
      const closeDate = new Date(deal.expectedClose);
      if (deadlineDate < closeDate) {
        nextDate = deal.deadline;
        nextDateType = "deadline";
      } else {
        nextDate = deal.expectedClose;
        nextDateType = "expected_close";
      }
    } else if (deal.deadline) {
      nextDate = deal.deadline;
      nextDateType = "deadline";
    } else if (deal.expectedClose) {
      nextDate = deal.expectedClose;
      nextDateType = "expected_close";
    }

    return {
      id: deal.id,
      name: deal.name,
      company: deal.company,
      stage: deal.stage,
      stageLabel: getStageLabel(deal.stage),
      priority: deal.priority,
      confidence: deal.confidence,
      ownerId: deal.ownerId,
      ownerName: deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : null,
      nextDate,
      nextDateType,
      softCircledCents: deal.softCircledCents || 0,
      committedCents: deal.committedCents || 0,
      wiredCents: deal.wiredCents || 0,
      deployedCents: deal.deployedCents || 0,
      health,
      healthReason,
      overdueTaskCount,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
  });
}

function calculateDealHealth(
  deal: any,
  overdueTaskCount: number,
  today: Date
): { health: DealHealth; healthReason: string | null } {
  // At risk conditions
  if (overdueTaskCount >= 3) {
    return { health: "at_risk", healthReason: `${overdueTaskCount} overdue tasks` };
  }

  const committed = deal.committedCents || 0;
  const wired = deal.wiredCents || 0;

  if (deal.stage === "closing") {
    const closeDate = deal.expectedClose ? new Date(deal.expectedClose) : null;
    if (closeDate) {
      const daysUntil = Math.floor((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7 && committed > 0 && wired < committed * 0.5) {
        return { health: "at_risk", healthReason: "Close imminent, capital not wired" };
      }
    }
  }

  // Watch conditions
  if (overdueTaskCount > 0) {
    return { health: "watch", healthReason: `${overdueTaskCount} overdue task${overdueTaskCount === 1 ? "" : "s"}` };
  }

  if (committed > 0 && wired < committed * 0.8) {
    return { health: "watch", healthReason: "Capital gap" };
  }

  if (deal.confidence !== null && deal.confidence < 50) {
    return { health: "watch", healthReason: "Low confidence" };
  }

  return { health: "on_track", healthReason: null };
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    sourcing: "Sourcing",
    live: "Live",
    closing: "Closing",
    closed: "Closed",
    dead: "Dead",
  };
  return labels[stage] || stage;
}

/**
 * Build relationship signals for follow-ups
 */
function buildRelationshipSignals(
  people: any[],
  deals: any[],
  activities: any[],
  today: Date
): RelationshipSignal[] {
  const signals: RelationshipSignal[] = [];
  const STALE_THRESHOLD_DAYS = 14;

  // Get active deals by person (via interests or ownership)
  const dealsByPerson = new Map<number, any[]>();
  for (const deal of deals) {
    if (!["sourcing", "live", "closing"].includes(deal.stage)) continue;

    if (deal.ownerId) {
      if (!dealsByPerson.has(deal.ownerId)) {
        dealsByPerson.set(deal.ownerId, []);
      }
      dealsByPerson.get(deal.ownerId)!.push(deal);
    }

    // Also check interests
    if (deal.interests) {
      for (const interest of deal.interests) {
        if (interest.investorId) {
          if (!dealsByPerson.has(interest.investorId)) {
            dealsByPerson.set(interest.investorId, []);
          }
          dealsByPerson.get(interest.investorId)!.push(deal);
        }
      }
    }
  }

  for (const person of people) {
    // Skip cold contacts
    if (person.warmth < 1) continue;

    const lastContactedAt = person.lastContactedAt ? new Date(person.lastContactedAt) : null;
    const daysSinceContact = lastContactedAt
      ? Math.floor((today.getTime() - lastContactedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Check if stale
    const isStale = daysSinceContact === null || daysSinceContact > STALE_THRESHOLD_DAYS;
    if (!isStale) continue;

    // Get their deals
    const personDeals = dealsByPerson.get(person.id) || [];
    const activeDealsCount = personDeals.length;
    const closingDealsCount = personDeals.filter((d) => d.stage === "closing").length;

    // Build reason
    let reason = "";
    if (daysSinceContact === null) {
      reason = "Never contacted";
    } else if (closingDealsCount > 0) {
      reason = `${closingDealsCount} closing deal${closingDealsCount === 1 ? "" : "s"}, ${daysSinceContact} days since contact`;
    } else if (activeDealsCount > 0) {
      reason = `${activeDealsCount} active deal${activeDealsCount === 1 ? "" : "s"}, ${daysSinceContact} days since contact`;
    } else if (person.warmth >= 2) {
      reason = `${getWarmthLabel(person.warmth)} contact, ${daysSinceContact} days since contact`;
    } else {
      continue; // Skip if no compelling reason
    }

    signals.push({
      personId: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      title: person.title,
      organizationId: person.organizationId,
      organizationName: person.org || person.organization?.name || null,
      warmth: person.warmth,
      warmthLabel: getWarmthLabel(person.warmth),
      lastContactedAt: person.lastContactedAt,
      daysSinceContact,
      activeDealsCount,
      closingDealsCount,
      interestStatus: null,
      reason,
    });
  }

  // Sort by importance (closing deals first, then by warmth, then by staleness)
  signals.sort((a, b) => {
    if (a.closingDealsCount !== b.closingDealsCount) {
      return b.closingDealsCount - a.closingDealsCount;
    }
    if (a.warmth !== b.warmth) {
      return b.warmth - a.warmth;
    }
    return (b.daysSinceContact || 999) - (a.daysSinceContact || 999);
  });

  return signals.slice(0, 10); // Limit to top 10
}

function getWarmthLabel(warmth: number): string {
  const labels: Record<number, string> = {
    0: "Cold",
    1: "Warm",
    2: "Hot",
    3: "Champion",
  };
  return labels[warmth] || "Unknown";
}

/**
 * Build upcoming events
 */
function buildUpcomingEvents(activities: any[]): UpcomingEvent[] {
  const now = new Date();

  return activities
    .filter((a) => {
      if (!a.startsAt) return false;
      return new Date(a.startsAt) > now;
    })
    .map((a) => ({
      id: a.id,
      kind: a.kind,
      kindLabel: getKindLabel(a.kind),
      subject: a.subject,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      location: a.location,
      meetingUrl: a.meetingUrl,
      dealId: a.dealId,
      dealName: a.dealName,
      attendeeCount: a.attendeeCount || 0,
    }))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5);
}

function getKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    call: "Call",
    video_call: "Video Call",
    in_person_meeting: "In Person",
    meeting: "Meeting",
    email: "Email",
    note: "Note",
  };
  return labels[kind] || kind;
}

/**
 * Build quiet alerts
 */
function buildAlerts(documents: any[], today: Date): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const doc of documents) {
    if (!doc.expiresAt) continue;

    const expiresAt = new Date(doc.expiresAt);
    const daysUntil = Math.floor((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      alerts.push({
        id: `doc-expired-${doc.id}`,
        type: "document_expiring",
        title: doc.title || doc.name,
        description: `Expired ${Math.abs(daysUntil)} days ago`,
        severity: "error",
        relatedEntity: { type: "document", id: doc.id, name: doc.title || doc.name },
        action: {
          label: "Upload New Version",
          href: `/documents?id=${doc.id}`,
        },
      });
    } else if (daysUntil <= 14) {
      alerts.push({
        id: `doc-expiring-${doc.id}`,
        type: "document_expiring",
        title: doc.title || doc.name,
        description: `Expires in ${daysUntil} days`,
        severity: "warning",
        relatedEntity: { type: "document", id: doc.id, name: doc.title || doc.name },
        action: {
          label: "Review",
          href: `/documents?id=${doc.id}`,
        },
      });
    }
  }

  return alerts;
}

/**
 * Empty dashboard data for error states
 */
function getEmptyDashboardData(): DashboardData {
  return {
    truthBar: {
      activeDeals: 0,
      totalCommittedCents: 0,
      totalWiredCents: 0,
      totalDeployedCents: 0,
      overdueTasks: 0,
      tasksDueToday: 0,
      nextCloseDate: null,
      nextDeadlineDate: null,
      nextCloseDealName: null,
    },
    attentionItems: [],
    activeDeals: [],
    capitalByEntity: [],
    relationshipSignals: [],
    upcomingEvents: [],
    alerts: [],
    generatedAt: new Date().toISOString(),
    userId: null,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format cents to currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format cents to compact currency (e.g., $1.2M)
 */
export function formatCompactCurrency(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(1)}B`;
  }
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(dollars);
}

/**
 * Format relative date
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Get preferences from localStorage
 */
export function getDashboardPreferences(): DashboardPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem("arrow-dashboard-preferences");
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load dashboard preferences:", e);
  }

  return DEFAULT_PREFERENCES;
}

/**
 * Save preferences to localStorage
 */
export function saveDashboardPreferences(preferences: DashboardPreferences): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("arrow-dashboard-preferences", JSON.stringify(preferences));
  } catch (e) {
    console.error("Failed to save dashboard preferences:", e);
  }
}
