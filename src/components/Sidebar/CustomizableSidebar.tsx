"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pin,
  PinOff,
  EyeOff,
  Eye,
  Settings2,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSidebarPreferences,
  type ResolvedSidebarItem,
} from "@/lib/sidebar-preferences";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/Sidebar/nav-user";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Sortable navigation item component
 */
function SortableNavItem({
  item,
  isActive,
  isEditMode,
  isExpanded,
  onToggleExpand,
  onPin,
  onHide,
  isSidebarCollapsed,
}: {
  item: ResolvedSidebarItem;
  isActive: boolean;
  isEditMode: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPin: () => void;
  onHide: () => void;
  isSidebarCollapsed: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  const content = (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center rounded-lg transition-all duration-200",
        isDragging && "opacity-50 scale-105 shadow-lg z-50",
        isActive && !isEditMode && `bg-gradient-to-r ${item.theme.gradient} text-white shadow-md`,
        !isActive && !isDragging && "hover:bg-slate-100",
        isEditMode && "pr-2"
      )}
    >
      {/* Drag handle - only in edit mode */}
      {isEditMode && (
        <button
          className="flex-shrink-0 p-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Main link/button */}
      <Link
        href={isEditMode ? "#" : item.href}
        onClick={(e) => {
          if (isEditMode) {
            e.preventDefault();
          }
        }}
        className={cn(
          "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
          !isEditMode && "hover:translate-x-0.5",
          isEditMode && "cursor-default"
        )}
      >
        {/* Icon with themed background when not active */}
        <div
          className={cn(
            "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all",
            isActive
              ? "bg-white/20"
              : `bg-gradient-to-br ${item.theme.gradient} text-white shadow-sm`
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        {/* Label */}
        {!isSidebarCollapsed && (
          <span className={cn(
            "flex-1 text-sm font-medium truncate",
            isActive ? "text-white" : "text-slate-700"
          )}>
            {item.label}
          </span>
        )}

        {/* Pin indicator */}
        {item.isPinned && !isEditMode && !isSidebarCollapsed && (
          <Pin className="h-3 w-3 text-slate-400" />
        )}

        {/* Expand/collapse for items with children */}
        {hasChildren && !isEditMode && !isSidebarCollapsed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpand();
            }}
            className={cn(
              "p-1 rounded hover:bg-slate-200/50 transition-colors",
              isActive && "hover:bg-white/20"
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
      </Link>

      {/* Edit mode actions */}
      {isEditMode && !isSidebarCollapsed && (
        <div className="flex items-center gap-1 pr-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onPin}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  item.isPinned
                    ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
              >
                {item.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {item.isPinned ? "Unpin" : "Pin to top"}
            </TooltipContent>
          </Tooltip>

          {!item.isCore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onHide}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Hide</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );

  // Wrap in tooltip when sidebar is collapsed
  if (isSidebarCollapsed && !isEditMode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${item.theme.text}`} />
          <span>{item.label}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

/**
 * Drag overlay component for smooth drag animations
 */
function DragOverlayItem({ item }: { item: ResolvedSidebarItem | null }) {
  if (!item) return null;

  const Icon = item.icon;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg shadow-xl border border-slate-200 scale-105">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.theme.gradient} text-white`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium text-slate-700">{item.label}</span>
    </div>
  );
}

/**
 * Hidden items recovery panel
 */
function HiddenItemsPanel({
  items,
  onRestore,
}: {
  items: ResolvedSidebarItem[];
  onRestore: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <div className="px-3 mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
        Hidden Items
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onRestore(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm flex-1 text-left">{item.label}</span>
              <Eye className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main customizable sidebar component
 */
export function CustomizableSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const isSidebarCollapsed = sidebarState === "collapsed";

  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { visibleItems, hiddenItems, actions, isLoaded } = useSidebarPreferences();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = visibleItems.findIndex((item) => item.id === active.id);
        const newIndex = visibleItems.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(
          visibleItems.map((item) => item.id),
          oldIndex,
          newIndex
        );

        actions.reorder(newOrder);
      }
    },
    [visibleItems, actions]
  );

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    if (isEditMode) {
      // Save on exit
      actions.saveNow();
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, actions]);

  // Check if path is active
  const isPathActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  // Get active item for drag overlay
  const activeItem = activeId
    ? visibleItems.find((item) => item.id === activeId) || null
    : null;

  if (!isLoaded) {
    return (
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <div className="h-12 animate-pulse bg-slate-100 rounded-lg" />
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse bg-slate-100 rounded-lg" />
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar variant="inset" {...props}>
        {/* Header with branding */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/" className="group">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex aspect-square size-10 items-center justify-center rounded-xl shadow-lg shadow-indigo-500/25 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-shadow">
                    <TrendingUp className="size-5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-slate-900">Arrow Fund</span>
                      <span className="truncate text-xs text-slate-500">Holdings</span>
                    </div>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2">
          {/* Edit mode header */}
          {isEditMode && !isSidebarCollapsed && (
            <div className="mb-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-indigo-700 uppercase tracking-wide">
                  Customize Sidebar
                </span>
                <button
                  onClick={toggleEditMode}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Done
                </button>
              </div>
              <p className="text-xs text-indigo-600/70">
                Drag to reorder. Pin items to keep them at the top.
              </p>
            </div>
          )}

          {/* Navigation items with DnD */}
          <SidebarGroup>
            {!isSidebarCollapsed && (
              <SidebarGroupLabel className="flex items-center justify-between px-2">
                <span>Navigation</span>
                {!isEditMode && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleEditMode}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Customize sidebar</TooltipContent>
                  </Tooltip>
                )}
              </SidebarGroupLabel>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <SortableNavItem
                        item={item}
                        isActive={isPathActive(item.href)}
                        isEditMode={isEditMode}
                        isExpanded={item.isExpanded}
                        onToggleExpand={() => actions.expand(item.id)}
                        onPin={() => actions.pin(item.id)}
                        onHide={() => actions.hide(item.id)}
                        isSidebarCollapsed={isSidebarCollapsed}
                      />

                      {/* Sub-items */}
                      {item.children &&
                        item.children.length > 0 &&
                        item.isExpanded &&
                        !isEditMode &&
                        !isSidebarCollapsed && (
                          <div className="ml-11 space-y-0.5 mt-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                href={child.href}
                                className={cn(
                                  "block px-3 py-1.5 text-sm rounded-md transition-colors",
                                  isPathActive(child.href)
                                    ? `${item.theme.text} ${item.theme.bgLight} font-medium`
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                )}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                    </React.Fragment>
                  ))}
                </div>
              </SortableContext>

              <DragOverlay dropAnimation={null}>
                <DragOverlayItem item={activeItem} />
              </DragOverlay>
            </DndContext>

            {/* Hidden items recovery - only in edit mode */}
            {isEditMode && !isSidebarCollapsed && (
              <HiddenItemsPanel
                items={hiddenItems}
                onRestore={(id) => actions.hide(id)}
              />
            )}
          </SidebarGroup>

          {/* Reset button in edit mode */}
          {isEditMode && !isSidebarCollapsed && (
            <div className="mt-4 px-2">
              <button
                onClick={actions.reset}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to defaults
              </button>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
