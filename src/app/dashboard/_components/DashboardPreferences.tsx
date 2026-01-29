"use client";

import { useState, useCallback } from "react";
import {
  Settings2,
  X,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  type DashboardPreferences,
  DEFAULT_PREFERENCES,
  saveDashboardPreferences,
} from "@/lib/dashboard-api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DashboardPreferencesProps {
  preferences: DashboardPreferences;
  onPreferencesChange: (preferences: DashboardPreferences) => void;
}

const MODULE_LABELS: Record<string, string> = {
  truth_bar: "Truth Bar (Stats)",
  attention: "Needs Attention",
  active_deals: "Active Deals",
  capital: "Capital by Entity",
  relationships: "Follow-ups",
  events: "Upcoming Events",
  alerts: "Alerts",
};

function SortableModuleItem({
  id,
  isHidden,
  onToggleVisibility,
}: {
  id: string;
  isHidden: boolean;
  onToggleVisibility: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg border bg-white",
        isDragging ? "opacity-50 shadow-lg" : "opacity-100",
        isHidden ? "border-slate-100 bg-slate-50" : "border-slate-200"
      )}
    >
      <button
        className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span
        className={cn(
          "flex-1 text-sm",
          isHidden ? "text-slate-400" : "text-slate-700"
        )}
      >
        {MODULE_LABELS[id] || id}
      </span>

      <button
        onClick={onToggleVisibility}
        className={cn(
          "p-1 rounded transition-colors",
          isHidden
            ? "text-slate-300 hover:text-slate-500"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        {isHidden ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function DashboardPreferences({
  preferences,
  onPreferencesChange,
}: DashboardPreferencesProps) {
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = preferences.moduleOrder.indexOf(active.id as string);
        const newIndex = preferences.moduleOrder.indexOf(over.id as string);
        const newOrder = arrayMove(preferences.moduleOrder, oldIndex, newIndex);

        const newPrefs = { ...preferences, moduleOrder: newOrder };
        onPreferencesChange(newPrefs);
        saveDashboardPreferences(newPrefs);
      }
    },
    [preferences, onPreferencesChange]
  );

  const handleToggleModule = useCallback(
    (moduleId: string) => {
      const newHidden = preferences.hiddenModules.includes(moduleId)
        ? preferences.hiddenModules.filter((id) => id !== moduleId)
        : [...preferences.hiddenModules, moduleId];

      const newPrefs = { ...preferences, hiddenModules: newHidden };
      onPreferencesChange(newPrefs);
      saveDashboardPreferences(newPrefs);
    },
    [preferences, onPreferencesChange]
  );

  const handleReset = useCallback(() => {
    onPreferencesChange(DEFAULT_PREFERENCES);
    saveDashboardPreferences(DEFAULT_PREFERENCES);
  }, [onPreferencesChange]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px]">
        <SheetHeader>
          <SheetTitle className="text-base">Dashboard Settings</SheetTitle>
          <SheetDescription className="text-sm">
            Customize your dashboard layout and modules
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Module Order */}
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Module Order
            </Label>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              Drag to reorder, click eye to hide
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={preferences.moduleOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {preferences.moduleOrder.map((moduleId) => (
                    <SortableModuleItem
                      key={moduleId}
                      id={moduleId}
                      isHidden={preferences.hiddenModules.includes(moduleId)}
                      onToggleVisibility={() => handleToggleModule(moduleId)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <Separator />

          {/* Attention Settings */}
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Attention Module Defaults
            </Label>

            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Default Timeframe</span>
                <select
                  value={preferences.attentionTimeframe}
                  onChange={(e) => {
                    const newPrefs = {
                      ...preferences,
                      attentionTimeframe: e.target.value as "today" | "this_week" | "all",
                    };
                    onPreferencesChange(newPrefs);
                    saveDashboardPreferences(newPrefs);
                  }}
                  className="text-sm border rounded-md px-2 py-1"
                >
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="all">All</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Default Scope</span>
                <select
                  value={preferences.attentionScope}
                  onChange={(e) => {
                    const newPrefs = {
                      ...preferences,
                      attentionScope: e.target.value as "mine" | "team",
                    };
                    onPreferencesChange(newPrefs);
                    saveDashboardPreferences(newPrefs);
                  }}
                  className="text-sm border rounded-md px-2 py-1"
                >
                  <option value="mine">Mine</option>
                  <option value="team">Team</option>
                </select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Reset */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full text-slate-600"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
