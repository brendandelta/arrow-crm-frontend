"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import page-specific components
import { DealHeader } from "./_components/DealHeader";
import { TruthPanel } from "./_components/TruthPanel";
import { PrimaryTruthPanel } from "./_components/PrimaryTruthPanel";
import { BlocksSection } from "./_components/BlocksSection";
import { InterestsSection } from "./_components/InterestsSection";
import { ActivityFeed } from "./_components/ActivityFeed";
import { DealSidebar, Task as SidebarTask } from "./_components/DealSidebar";
import { DealTargetsSection } from "./_components/DealTargetsSection";
import { BlockSlideOut } from "./_components/BlockSlideOut";
import { InterestSlideOut } from "./_components/InterestSlideOut";
import { ActivitySlideOut } from "./_components/ActivitySlideOut";
import { TaskSlideOut } from "./_components/TaskSlideOut";
import { EdgeSlideOut } from "./_components/EdgeSlideOut";
import { OutreachTargetModal } from "./_components/OutreachTargetModal";
import { EditableDealDetails } from "./_components/EditableDealDetails";
import { EntityLinksSection } from "./_components/EntityLinksSection";
import { RoundDetailsSection } from "./_components/RoundDetailsSection";
import { SecondaryOverviewSection } from "./_components/SecondaryOverviewSection";
// Import shared components
import { RiskFlagsPanel } from "@/components/deals/RiskFlagIndicator";
import { useLPMode } from "@/contexts/LPModeContext";
import { useAuth } from "@/contexts/AuthContext";

// Types
interface Company {
  id: number;
  name: string;
  kind: string;
  sector: string | null;
  website: string | null;
  logoUrl: string | null;
}

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

interface MappedInterest {
  id: number;
  investor: string | null;
  committedCents: number | null;
  status: string;
}

interface Block {
  id: number;
  seller: { id: number; name: string; kind: string } | null;
  sellerType?: string | null;
  contact?: Person | null;
  broker?: { id: number; name: string } | null;
  brokerContact?: Person | null;
  shareClass?: string | null;
  shares?: number | null;
  priceCents?: number | null;
  totalCents?: number | null;
  minSizeCents?: number | null;
  impliedValuationCents?: number | null;
  discountPct?: number | null;
  status: string;
  heat: number;
  heatLabel: string;
  terms?: string | null;
  expiresAt?: string | null;
  source?: string | null;
  sourceDetail?: string | null;
  verified?: boolean;
  internalNotes?: string | null;
  createdAt?: string;
  mappedInterests?: MappedInterest[];
  mappedInterestsCount?: number;
  mappedCommittedCents?: number;
}

interface Interest {
  id: number;
  investor: { id: number; name: string; kind: string } | null;
  contact: Person | null;
  decisionMaker: Person | null;
  targetCents: number | null;
  minCents: number | null;
  maxCents: number | null;
  committedCents: number | null;
  allocatedCents: number | null;
  allocatedBlockId: number | null;
  allocatedBlock?: {
    id: number;
    seller: string | null;
    priceCents: number | null;
    status: string;
  } | null;
  status: string;
  source: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  isStale: boolean;
}

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
  isTask?: boolean;
  taskCompleted?: boolean;
  taskDueAt?: string | null;
  performedBy?: Owner | null;
  assignedTo?: Owner | null;
}

interface Task {
  id: number;
  subject: string;
  body?: string | null;
  dueAt: string | null;
  completed: boolean;
  overdue: boolean;
  assignedTo?: Owner | null;
}

interface DealTarget {
  id: number;
  targetType: string;
  targetId: number;
  targetName: string;
  status: string;
  role: string | null;
  priority: number;
  lastActivityAt: string | null;
  activityCount: number;
  firstContactedAt?: string | null;
  lastContactedAt?: string | null;
  nextStep: string | null;
  nextStepAt: string | null;
  notes?: string | null;
  isStale: boolean;
  daysSinceContact: number | null;
  owner?: { id: number; firstName: string; lastName: string } | null;
  recentActivities?: Activity[];
  tasks?: { id: number; subject: string; dueAt: string | null; overdue: boolean; assignedTo?: { id: number; firstName: string; lastName: string } | null }[];
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

interface RiskFlag {
  active: boolean;
  message: string;
  severity: "danger" | "warning" | "info";
  count?: number;
  missing?: string[];
}

// Edge from backend API (matches DealSidebar.Edge interface)
interface DealEdge {
  id: number;
  title: string;
  edgeType: "information" | "relationship" | "structural" | "timing";
  confidence: number;
  timeliness: number;
  notes?: string | null;
  relatedPersonId?: number | null;
  relatedPerson?: { id: number; firstName: string; lastName: string } | null;
  relatedOrgId?: number | null;
  relatedOrg?: { id: number; name: string } | null;
  createdBy?: { id: number; firstName: string; lastName: string } | null;
  createdAt: string;
}

interface Deal {
  id: number;
  name: string;
  company: Company | null;
  status: string;
  stage: string | null;
  kind: string;
  priority: number;
  confidence: number | null;
  owner: Owner | null;
  committed: number;
  closed: number;
  softCircled: number;
  totalCommitted: number;
  wired: number;
  inventory: number;
  coverageRatio: number | null;
  target: number | null;
  minRaise: number | null;
  maxRaise: number | null;
  valuation: number | null;
  sharePrice: number | null;
  shareClass: string | null;
  expectedClose: string | null;
  deadline: string | null;
  customFields: Record<string, unknown> | null;
  daysUntilClose: number | null;
  sourcedAt: string | null;
  qualifiedAt: string | null;
  closedAt: string | null;
  source: string | null;
  sourceDetail: string | null;
  driveUrl: string | null;
  dataRoomUrl: string | null;
  deckUrl: string | null;
  tags: string[] | null;
  notes: string | null;
  structureNotes: string | null;
  truthPanel: {
    bestPrice: { priceCents: number; source: string | null; blockId: number } | null;
    biggestConstraint: { type: string; message: string } | null;
    missingDoc: { kind: string; label: string } | null;
    nextDeadline: { date: string; type: string; label: string } | null;
    blocking: RiskFlag | null;
  };
  tasksSummary: {
    total: number;
    completed: number;
    overdue: number;
    dueThisWeek: number;
  };
  demandFunnel: {
    prospecting: number;
    contacted: number;
    softCircled: number;
    committed: number;
    allocated: number;
    funded: number;
  };
  riskFlags: Record<string, RiskFlag>;
  documentChecklist: {
    total: number;
    completed: number;
    completionPercent: number;
    items: DocumentItem[];
  };
  advantages: Advantage[];
  edges: DealEdge[];
  blocks: Block[];
  interests: Interest[];
  targets: DealTarget[];
  targetsSummary: {
    total: number;
    active: number;
    notStarted: number;
    contacted: number;
    engaged: number;
    committed: number;
    passed: number;
    needsFollowup: number;
  };
  activities: Activity[];
  tasks: {
    overdue: Task[];
    dueThisWeek: Task[];
    backlog: Task[];
    completed: Task[];
  };
  createdAt: string;
  updatedAt: string;
}

// Main Page Component
export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lpMode, toggleLpMode } = useLPMode();
  const { user } = useAuth();
  const currentUserId = user?.backendUserId ?? null;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [showAddInterest, setShowAddInterest] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [selectedTask, setSelectedTask] = useState<SidebarTask | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<DealTarget | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<DealEdge | null>(null);
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [activeTab, setActiveTab] = useState<"blocks" | "interests" | "targets">("targets");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarSection, setSidebarSection] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setDeal(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch deal:", err);
        setLoading(false);
      });
  }, [params.id]);

  const handleBlockUpdate = (updatedBlock: Block) => {
    if (!deal) return;
    const existingBlock = deal.blocks.find((b) => b.id === updatedBlock.id);
    if (existingBlock) {
      // Update existing block
      setDeal({
        ...deal,
        blocks: deal.blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
      });
      setSelectedBlock(updatedBlock);
    } else {
      // New block created
      setDeal({
        ...deal,
        blocks: [...deal.blocks, updatedBlock],
      });
      setShowAddBlock(false);
      setSelectedBlock(null);
    }
  };

  const handleBlockDelete = (blockId: number) => {
    if (!deal) return;
    setDeal({
      ...deal,
      blocks: deal.blocks.filter((b) => b.id !== blockId),
    });
    setSelectedBlock(null);
  };

  const handleInterestUpdate = (updatedInterest: Interest) => {
    if (!deal) return;
    const existingInterest = deal.interests.find((i) => i.id === updatedInterest.id);
    if (existingInterest) {
      // Update existing interest
      setDeal({
        ...deal,
        interests: deal.interests.map((i) => (i.id === updatedInterest.id ? updatedInterest : i)),
      });
      setSelectedInterest(updatedInterest);
    } else {
      // New interest created
      setDeal({
        ...deal,
        interests: [...deal.interests, updatedInterest],
      });
      setShowAddInterest(false);
      setSelectedInterest(null);
    }
  };

  const handleInterestDelete = (interestId: number) => {
    if (!deal) return;
    setDeal({
      ...deal,
      interests: deal.interests.filter((i) => i.id !== interestId),
    });
    setSelectedInterest(null);
  };

  const handleActivityUpdate = (updatedActivity: Activity) => {
    if (!deal) return;
    const existingActivity = deal.activities.find((a) => a.id === updatedActivity.id);
    if (existingActivity) {
      // Update existing activity
      setDeal({
        ...deal,
        activities: deal.activities.map((a) => (a.id === updatedActivity.id ? updatedActivity : a)),
      });
      setSelectedActivity(updatedActivity);
    } else {
      // New activity created - add to beginning of list
      setDeal({
        ...deal,
        activities: [updatedActivity, ...deal.activities],
      });
      setShowAddActivity(false);
      setSelectedActivity(null);
    }
  };

  const handleActivityDelete = (activityId: number) => {
    if (!deal) return;
    setDeal({
      ...deal,
      activities: deal.activities.filter((a) => a.id !== activityId),
    });
    setSelectedActivity(null);
  };

  const handleTaskUpdate = (updatedTask: SidebarTask) => {
    if (!deal) return;
    // Refresh deal to get updated task lists (since tasks are grouped by status)
    refreshDeal();
    setShowAddTask(false);
    setSelectedTask(null);
  };

  const handleTaskDelete = (taskId: number) => {
    if (!deal) return;
    refreshDeal();
    setSelectedTask(null);
  };

  const refreshDeal = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${params.id}`)
      .then((res) => res.json())
      .then((data) => setDeal(data))
      .catch((err) => console.error("Failed to refresh deal:", err));
  };

  const handleTaskToggle = async (taskId: number, currentlyCompleted: boolean) => {
    try {
      // Use the dedicated tasks API - complete or uncomplete endpoint
      const action = currentlyCompleted ? "uncomplete" : "complete";
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      refreshDeal();
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleDealUpdate = async (data: Partial<{
    priority: number;
    status: string;
    confidence: number | null;
    sharePrice: number | null;
    valuation: number | null;
    source: string | null;
    sourceDetail: string | null;
    expectedClose: string | null;
    deadline: string | null;
    tags: string[] | null;
    notes: string | null;
    driveUrl: string | null;
    dataRoomUrl: string | null;
    deckUrl: string | null;
    ownerId: number | null;
    // New fields for Primary/Secondary terms
    target: number | null;
    minRaise: number | null;
    maxRaise: number | null;
    shareClass: string | null;
    structureNotes: string | null;
    customFields: Record<string, unknown>;
  }>) => {
    const payload: Record<string, unknown> = {};

    // Only include fields that are explicitly set
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.status !== undefined) payload.status = data.status;
    if (data.confidence !== undefined) payload.confidence = data.confidence;
    if (data.sharePrice !== undefined) payload.share_price_cents = data.sharePrice;
    if (data.valuation !== undefined) payload.valuation_cents = data.valuation;
    if (data.source !== undefined) payload.source = data.source;
    if (data.sourceDetail !== undefined) payload.source_detail = data.sourceDetail;
    if (data.expectedClose !== undefined) payload.expected_close = data.expectedClose;
    if (data.deadline !== undefined) payload.deadline = data.deadline;
    if (data.tags !== undefined) payload.tags = data.tags;
    if (data.notes !== undefined) payload.internal_notes = data.notes;
    if (data.driveUrl !== undefined) payload.drive_url = data.driveUrl;
    if (data.dataRoomUrl !== undefined) payload.data_room_url = data.dataRoomUrl;
    if (data.deckUrl !== undefined) payload.deck_url = data.deckUrl;
    if (data.ownerId !== undefined) payload.owner_id = data.ownerId;
    // New fields
    if (data.target !== undefined) payload.target_cents = data.target;
    if (data.minRaise !== undefined) payload.min_raise_cents = data.minRaise;
    if (data.maxRaise !== undefined) payload.max_raise_cents = data.maxRaise;
    if (data.shareClass !== undefined) payload.share_class = data.shareClass;
    if (data.structureNotes !== undefined) payload.structure_notes = data.structureNotes;
    if (data.customFields !== undefined) payload.custom_fields = data.customFields;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${params.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      throw new Error("Failed to update deal");
    }
    refreshDeal();
  };

  const handleTaskStatusChange = async (taskId: number, status: "open" | "waiting" | "completed") => {
    try {
      if (status === "completed") {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}/complete`,
          { method: "POST", headers: { "Content-Type": "application/json" } }
        );
      } else if (status === "open") {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}/uncomplete`,
          { method: "POST", headers: { "Content-Type": "application/json" } }
        );
      }
      // For "waiting" status, we'd need a separate endpoint or patch
      refreshDeal();
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleMissingDocClick = () => {
    setSidebarSection("diligence");
    sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleConstraintClick = () => {
    setSidebarSection("next-actions");
    sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDeadlineClick = () => {
    if (deal?.truthPanel.nextDeadline?.type === "task") {
      const allTasks = [...(deal.tasks.overdue || []), ...(deal.tasks.dueThisWeek || []), ...(deal.tasks.backlog || [])];
      const match = allTasks.find(t =>
        t.subject === deal.truthPanel.nextDeadline?.label ||
        t.dueAt?.startsWith(deal.truthPanel.nextDeadline?.date || "")
      );
      if (match) { setSelectedTask(match); return; }
    }
    setSidebarSection("next-actions");
    sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBlockingClick = () => {
    setSidebarSection("next-actions");
    sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleScrollToTarget = (targetId: number) => {
    setActiveTab("targets");
    // Wait for render, then scroll to the target card
    setTimeout(() => {
      const el = document.getElementById(`target-card-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add highlight ring briefly
        el.classList.add("ring-2", "ring-indigo-400", "ring-offset-2");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-indigo-400", "ring-offset-2");
        }, 2000);
      }
    }, 100);
  };

  const handleFollowUpUpdate = (targetId: number, nextStepAt: string | null) => {
    if (!deal) return;
    setDeal({
      ...deal,
      targets: deal.targets.map((t) =>
        t.id === targetId ? { ...t, nextStepAt } : t
      ),
    });
  };

  if (loading) {
    return (
      <div className="px-8 py-6 flex items-center justify-center h-64">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="px-8 py-6 flex items-center justify-center h-64">
        <span className="text-muted-foreground">Deal not found</span>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 space-y-6">
      {/* Header */}
      <DealHeader
        name={deal.name}
        company={deal.company}
        status={deal.status}
        kind={deal.kind}
        priority={deal.priority}
        owner={deal.owner}
        softCircled={deal.softCircled}
        totalCommitted={deal.totalCommitted}
        wired={deal.wired}
        inventory={deal.inventory}
        coverageRatio={deal.coverageRatio}
        target={deal.target}
        valuation={deal.valuation}
        committed={deal.committed}
        expectedClose={deal.expectedClose}
        daysUntilClose={deal.daysUntilClose}
        driveUrl={deal.driveUrl}
        dataRoomUrl={deal.dataRoomUrl}
        deckUrl={deal.deckUrl}
        lpMode={lpMode}
        onLpModeToggle={toggleLpMode}
        onBack={() => router.back()}
      />

      {/* Truth Panel - Different for Primary vs Secondary deals */}
      {deal.kind === "primary" ? (
        <PrimaryTruthPanel
          target={deal.target}
          committed={deal.committed}
          softCircled={deal.softCircled}
          leadInvestor={(deal.customFields?.primary as { lead_investor?: string })?.lead_investor ?? null}
          interestsCount={deal.interests.length}
          committedInterestsCount={deal.interests.filter((i) => i.status === "committed").length}
          missingDoc={deal.truthPanel?.missingDoc ?? null}
          documentCompletionPercent={deal.documentChecklist?.completionPercent ?? 100}
          nextDeadline={deal.truthPanel?.nextDeadline ?? null}
          overdueTasksCount={deal.tasksSummary?.overdue ?? 0}
          onMissingDocClick={handleMissingDocClick}
          onDeadlineClick={handleDeadlineClick}
          onTasksClick={handleBlockingClick}
        />
      ) : deal.truthPanel ? (
        <TruthPanel
          bestPrice={deal.truthPanel.bestPrice}
          biggestConstraint={deal.truthPanel.biggestConstraint}
          missingDoc={deal.truthPanel.missingDoc}
          nextDeadline={deal.truthPanel.nextDeadline}
          blocking={deal.truthPanel.blocking}
          onBlockClick={(blockId) => {
            const block = deal.blocks.find((b) => b.id === blockId);
            if (block) setSelectedBlock(block);
          }}
          onMissingDocClick={handleMissingDocClick}
          onConstraintClick={handleConstraintClick}
          onDeadlineClick={handleDeadlineClick}
          onBlockingClick={handleBlockingClick}
        />
      ) : null}

      {/* Deal Details - Inline Editable */}
      <EditableDealDetails
        deal={{
          priority: deal.priority,
          status: deal.status,
          confidence: deal.confidence,
          sharePrice: deal.sharePrice,
          valuation: deal.valuation,
          source: deal.source,
          sourceDetail: deal.sourceDetail,
          expectedClose: deal.expectedClose,
          deadline: deal.deadline,
          tags: deal.tags,
          notes: deal.notes,
          driveUrl: deal.driveUrl,
          dataRoomUrl: deal.dataRoomUrl,
          deckUrl: deal.deckUrl,
          owner: deal.owner,
        }}
        lpMode={lpMode}
        onSave={handleDealUpdate}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b">
            {(() => {
              const isPrimaryDeal = deal.kind === "primary";
              const tabs = isPrimaryDeal
                ? [
                    { key: "targets", label: "Outreach Targets", count: deal.targets.length },
                    { key: "interests", label: "Interests", count: deal.interests.length },
                  ]
                : [
                    { key: "targets", label: "Outreach Targets", count: deal.targets.length },
                    { key: "interests", label: "Interests", count: deal.interests.length },
                    { key: "blocks", label: "Blocks", count: deal.blocks.length },
                  ];
              return tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-slate-900 text-slate-900 font-medium"
                      : "border-transparent text-muted-foreground hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                  <Badge variant="secondary" className="text-xs">
                    {tab.count}
                  </Badge>
                </button>
              ));
            })()}
          </div>

          {/* Tab Content */}
          {activeTab === "blocks" && deal.kind !== "primary" && (
            <BlocksSection
              blocks={deal.blocks}
              dealId={deal.id}
              onBlockClick={(block) => setSelectedBlock(block)}
              onAddBlock={() => setShowAddBlock(true)}
              onBlocksUpdated={refreshDeal}
            />
          )}

          {activeTab === "interests" && (
            <InterestsSection
              interests={deal.interests}
              dealId={deal.id}
              funnel={deal.demandFunnel}
              onInterestClick={(interest) => setSelectedInterest(interest)}
              onAddInterest={() => setShowAddInterest(true)}
              onInterestsUpdated={refreshDeal}
              isPrimaryDeal={deal.kind === "primary"}
            />
          )}

          {activeTab === "targets" && (
            <DealTargetsSection
              targets={deal.targets}
              dealId={deal.id}
              onTargetUpdated={refreshDeal}
              onAddTarget={() => setShowAddTarget(true)}
              onTargetClick={(target) => setSelectedTarget(target)}
            />
          )}

          {/* Round Details - Only shown for Primary deals, positioned after tabs */}
          {deal.kind === "primary" && (
            <RoundDetailsSection
              deal={{
                id: deal.id,
                name: deal.name,
                target: deal.target,
                minRaise: deal.minRaise,
                maxRaise: deal.maxRaise,
                valuation: deal.valuation,
                sharePrice: deal.sharePrice,
                shareClass: deal.shareClass,
                expectedClose: deal.expectedClose,
                deadline: deal.deadline,
                structureNotes: deal.structureNotes,
                softCircled: deal.softCircled,
                committed: deal.committed,
                wired: deal.wired,
                customFields: deal.customFields as { primary?: Record<string, unknown> } | undefined,
              }}
              onSave={handleDealUpdate}
            />
          )}

          {/* Secondary Overview - Only shown for Secondary deals */}
          {deal.kind !== "primary" && (
            <SecondaryOverviewSection
              deal={{
                id: deal.id,
                customFields: deal.customFields as { secondary?: Record<string, unknown> } | undefined,
              }}
              onSave={handleDealUpdate}
            />
          )}

        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6" ref={sidebarRef}>
          <Card>
            <CardContent className="pt-6">
              <DealSidebar
                tasks={deal.tasks}
                dealId={deal.id}
                documentChecklist={deal.documentChecklist}
                edges={deal.edges || []}
                activities={deal.activities}
                lpMode={lpMode}
                currentUserId={currentUserId}
                activeSection={sidebarSection}
                isPrimaryDeal={deal.kind === "primary"}
                onSectionChange={setSidebarSection}
                onTaskToggle={handleTaskToggle}
                onTaskClick={(task) => setSelectedTask(task)}
                onAddTask={() => setShowAddTask(true)}
                onTaskStatusChange={handleTaskStatusChange}
                onDocumentUpload={(kind) => {
                  // Could open upload modal
                }}
                onAddDocument={() => {
                  // Could open document upload modal
                }}
                onAddEdge={() => setShowAddEdge(true)}
                onEdgeClick={(edge) => setSelectedEdge(edge)}
                onActOnEdge={(edge) => {
                  // Creates a task from the edge - pre-fill with edge context
                  setShowAddTask(true);
                }}
                onActivityClick={(activity) => setSelectedActivity(activity)}
              />
            </CardContent>
          </Card>

          {/* Risk Flags Panel */}
          {!lpMode && Object.values(deal.riskFlags).some((f) => f?.active) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskFlagsPanel riskFlags={deal.riskFlags} />
              </CardContent>
            </Card>
          )}

          {/* Linked Entities */}
          {!lpMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <EntityLinksSection
                  linkedObjectType="Deal"
                  linkedObjectId={deal.id}
                  linkedObjectLabel={deal.name}
                />
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Block Slide-out - Only for non-Primary deals */}
      {deal.kind !== "primary" && (selectedBlock || showAddBlock) && (
        <BlockSlideOut
          block={selectedBlock}
          dealId={deal.id}
          onClose={() => {
            setSelectedBlock(null);
            setShowAddBlock(false);
          }}
          onSave={handleBlockUpdate}
          onDelete={handleBlockDelete}
        />
      )}

      {/* Interest Slide-out */}
      {(selectedInterest || showAddInterest) && (
        <InterestSlideOut
          interest={selectedInterest}
          dealId={deal.id}
          blocks={deal.kind === "primary" ? [] : deal.blocks}
          onClose={() => {
            setSelectedInterest(null);
            setShowAddInterest(false);
          }}
          onSave={handleInterestUpdate}
          onDelete={handleInterestDelete}
        />
      )}

      {/* Activity Slide-out */}
      {(selectedActivity || showAddActivity) && (
        <ActivitySlideOut
          activity={selectedActivity}
          dealId={deal.id}
          onClose={() => {
            setSelectedActivity(null);
            setShowAddActivity(false);
          }}
          onSave={handleActivityUpdate}
          onDelete={handleActivityDelete}
        />
      )}

      {/* Task Slide-out */}
      {(selectedTask || showAddTask) && (
        <TaskSlideOut
          key={selectedTask?.id ?? `new-${Date.now()}`}
          task={selectedTask}
          dealId={deal.id}
          existingTasks={[
            ...deal.tasks.overdue,
            ...deal.tasks.dueThisWeek,
            ...deal.tasks.backlog,
          ]}
          onClose={() => {
            setSelectedTask(null);
            setShowAddTask(false);
          }}
          onSave={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {/* Edge Slide-out */}
      {(selectedEdge || showAddEdge) && (
        <EdgeSlideOut
          edge={selectedEdge}
          dealId={deal.id}
          onClose={() => {
            setSelectedEdge(null);
            setShowAddEdge(false);
          }}
          onSave={(savedEdge) => {
            refreshDeal();
            setSelectedEdge(null);
            setShowAddEdge(false);
          }}
          onDelete={(edgeId) => {
            refreshDeal();
            setSelectedEdge(null);
          }}
        />
      )}

      {/* Outreach Target Modal (Add / Edit) */}
      {(showAddTarget || selectedTarget) && deal && (
        <OutreachTargetModal
          dealId={deal.id}
          target={selectedTarget ? {
            id: selectedTarget.id,
            dealId: deal.id,
            targetType: selectedTarget.targetType,
            targetId: selectedTarget.targetId,
            targetName: selectedTarget.targetName,
            status: selectedTarget.status,
            role: selectedTarget.role,
            priority: selectedTarget.priority,
            notes: selectedTarget.notes || null,
            ownerId: selectedTarget.owner?.id || null,
            ownerName: selectedTarget.owner ? `${selectedTarget.owner.firstName} ${selectedTarget.owner.lastName}` : null,
            firstContactedAt: selectedTarget.firstContactedAt || null,
            lastContactedAt: selectedTarget.lastContactedAt || null,
            activityCount: selectedTarget.activityCount,
            tasks: selectedTarget.tasks || [],
          } : undefined}
          onClose={() => { setShowAddTarget(false); setSelectedTarget(null); }}
          onSaved={() => { refreshDeal(); }}
          onConvertToInterest={async (target) => {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/interests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  deal_id: deal.id,
                  investor_id: target.targetType === "Organization" ? target.targetId : null,
                  contact_id: target.targetType === "Person" ? target.targetId : null,
                  status: "prospecting",
                  source: "outreach",
                }),
              });
              if (res.ok) {
                // Mark target as committed if not already
                if (target.status !== "committed") {
                  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deal_targets/${target.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "committed" }),
                  });
                }
                setSelectedTarget(null);
                refreshDeal();
                setActiveTab("interests");
              }
            } catch (err) {
              console.error("Failed to convert to interest:", err);
            }
          }}
        />
      )}
    </div>
  );
}
