"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import page-specific components
import { DealHeader } from "./_components/DealHeader";
import { TruthPanel } from "./_components/TruthPanel";
import { BlocksSection } from "./_components/BlocksSection";
import { InterestsSection } from "./_components/InterestsSection";
import { ActivityFeed } from "./_components/ActivityFeed";
import { DealSidebar } from "./_components/DealSidebar";
import { DealTargetsSection } from "./_components/DealTargetsSection";
import { BlockSlideOut } from "./_components/BlockSlideOut";
import { InterestSlideOut } from "./_components/InterestSlideOut";
import { ActivitySlideOut } from "./_components/ActivitySlideOut";
import { TaskSlideOut } from "./_components/TaskSlideOut";
import { OutreachTargetModal } from "./_components/OutreachTargetModal";
import { EditableDealDetails } from "./_components/EditableDealDetails";
import { Task as SidebarTask } from "./_components/DealSidebar";
// Import shared components
import { RiskFlagsPanel } from "@/components/deals/RiskFlagIndicator";
import { useLPMode } from "@/contexts/LPModeContext";

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
  valuation: number | null;
  sharePrice: number | null;
  shareClass: string | null;
  expectedClose: string | null;
  deadline: string | null;
  daysUntilClose: number | null;
  sourcedAt: string | null;
  qualifiedAt: string | null;
  closedAt: string | null;
  source: string | null;
  sourceDetail: string | null;
  driveUrl: string | null;
  dataRoomUrl: string | null;
  deckUrl: string | null;
  notionUrl: string | null;
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
  const [activeTab, setActiveTab] = useState<"blocks" | "interests" | "activity" | "targets">("targets");
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
    stage: string | null;
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
    notionUrl: string | null;
    ownerId: number | null;
  }>) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${params.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal: {
            stage: data.stage,
            confidence: data.confidence,
            share_price_cents: data.sharePrice,
            target_valuation_cents: data.valuation,
            source: data.source,
            source_detail: data.sourceDetail,
            expected_close: data.expectedClose,
            deadline: data.deadline,
            tags: data.tags,
            notes: data.notes,
            drive_url: data.driveUrl,
            data_room_url: data.dataRoomUrl,
            deck_url: data.deckUrl,
            notion_url: data.notionUrl,
            owner_id: data.ownerId !== undefined ? data.ownerId : undefined,
          },
        }),
      }
    );
    if (!res.ok) {
      throw new Error("Failed to update deal");
    }
    refreshDeal();
  };

  const handleMissingDocClick = () => {
    setSidebarSection("documents");
    sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleConstraintClick = () => {
    setSidebarSection("tasks");
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
    setSidebarSection("tasks");
    sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBlockingClick = () => {
    setSidebarSection("tasks");
    sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Deal not found</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DealHeader
        name={deal.name}
        company={deal.company}
        status={deal.status}
        stage={deal.stage}
        kind={deal.kind}
        owner={deal.owner}
        softCircled={deal.softCircled}
        totalCommitted={deal.totalCommitted}
        wired={deal.wired}
        inventory={deal.inventory}
        coverageRatio={deal.coverageRatio}
        expectedClose={deal.expectedClose}
        daysUntilClose={deal.daysUntilClose}
        driveUrl={deal.driveUrl}
        dataRoomUrl={deal.dataRoomUrl}
        deckUrl={deal.deckUrl}
        lpMode={lpMode}
        onLpModeToggle={toggleLpMode}
        onBack={() => router.back()}
      />

      {/* Truth Panel */}
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

      {/* Deal Details - Inline Editable */}
      <EditableDealDetails
        deal={{
          stage: deal.stage,
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
          notionUrl: deal.notionUrl,
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
            {[
              { key: "targets", label: "Outreach Targets", count: deal.targets.length },
              { key: "blocks", label: "Blocks", count: deal.blocks.length },
              { key: "interests", label: "Interests", count: deal.interests.length },
              { key: "activity", label: "Activity", count: deal.activities.length },
            ].map((tab) => (
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
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "blocks" && (
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

          {activeTab === "activity" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Activity Feed</CardTitle>
                <button
                  onClick={() => setShowAddActivity(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <span className="text-lg leading-none">+</span>
                  Log Activity
                </button>
              </CardHeader>
              <CardContent>
                <ActivityFeed
                  activities={deal.activities}
                  onActivityClick={(activity) => setSelectedActivity(activity)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6" ref={sidebarRef}>
          <Card>
            <CardContent className="pt-6">
              <DealSidebar
                tasks={deal.tasks}
                dealId={deal.id}
                targets={deal.targets}
                documentChecklist={deal.documentChecklist}
                advantages={deal.advantages}
                riskFlags={deal.riskFlags}
                lpMode={lpMode}
                activeSection={sidebarSection}
                onSectionChange={setSidebarSection}
                onTaskToggle={handleTaskToggle}
                onTaskClick={(task) => setSelectedTask(task)}
                onAddTask={() => setShowAddTask(true)}
                onTargetClick={(target) => {
                  // Could open target slide-out
                }}
                onDocumentUpload={(kind) => {
                  // Could open upload modal
                }}
                onAddAdvantage={() => {
                  // Could open add advantage modal
                }}
                onSwitchToTargetsTab={() => setActiveTab("targets")}
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

        </div>
      </div>

      {/* Block Slide-out */}
      {(selectedBlock || showAddBlock) && (
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
          blocks={deal.blocks}
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
            nextStep: selectedTarget.nextStep,
            nextStepAt: selectedTarget.nextStepAt,
            notes: selectedTarget.notes || null,
            ownerId: selectedTarget.owner?.id || null,
            ownerName: selectedTarget.owner ? `${selectedTarget.owner.firstName} ${selectedTarget.owner.lastName}` : null,
            firstContactedAt: selectedTarget.firstContactedAt || null,
            lastContactedAt: selectedTarget.lastContactedAt || null,
            activityCount: selectedTarget.activityCount,
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
