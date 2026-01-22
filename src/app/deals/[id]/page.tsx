"use client";

import { useEffect, useState } from "react";
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
import { BlockSlideOut } from "./_components/BlockSlideOut";
import { InterestSlideOut } from "./_components/InterestSlideOut";
import { EditableDealDetails } from "./_components/EditableDealDetails";
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
  nextStep: string | null;
  nextStepAt: string | null;
  isStale: boolean;
  daysSinceContact: number | null;
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
  const [activeTab, setActiveTab] = useState<"blocks" | "interests" | "activity">("blocks");

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

  const refreshDeal = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals/${params.id}`)
      .then((res) => res.json())
      .then((data) => setDeal(data))
      .catch((err) => console.error("Failed to refresh deal:", err));
  };

  const handleTaskComplete = async (taskId: number) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities/${taskId}/complete_task`,
        { method: "POST" }
      );
      refreshDeal();
    } catch (err) {
      console.error("Failed to complete task:", err);
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
          },
        }),
      }
    );
    if (!res.ok) {
      throw new Error("Failed to update deal");
    }
    refreshDeal();
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
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b">
            {[
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
              onBlockClick={(block) => setSelectedBlock(block)}
              onAddBlock={() => setShowAddBlock(true)}
            />
          )}

          {activeTab === "interests" && (
            <InterestsSection
              interests={deal.interests}
              funnel={deal.demandFunnel}
              onInterestClick={(interest) => setSelectedInterest(interest)}
              onAddInterest={() => setShowAddInterest(true)}
            />
          )}

          {activeTab === "activity" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed activities={deal.activities} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <DealSidebar
                tasks={deal.tasks}
                targets={deal.targets}
                documentChecklist={deal.documentChecklist}
                advantages={deal.advantages}
                riskFlags={deal.riskFlags}
                lpMode={lpMode}
                onTaskComplete={handleTaskComplete}
                onTargetClick={(target) => {
                  // Could open target slide-out
                }}
                onDocumentUpload={(kind) => {
                  // Could open upload modal
                }}
                onAddAdvantage={() => {
                  // Could open add advantage modal
                }}
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

          {/* Deal Details */}
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
    </div>
  );
}
