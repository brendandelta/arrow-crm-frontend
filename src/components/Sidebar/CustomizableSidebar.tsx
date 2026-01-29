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
  Pencil,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronRight,
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
 * Minimal nav item component with sortable support
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
        "group relative flex items-center transition-all duration-150",
        isDragging && "opacity-50 z-50"
      )}
    >
      {/* Drag handle - only in edit mode */}
      {isEditMode && (
        <button
          className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Main link */}
      <Link
        href={isEditMode ? "#" : item.href}
        onClick={(e) => {
          if (isEditMode) e.preventDefault();
        }}
        className={cn(
          "flex-1 flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all",
          isActive
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
          isEditMode && "cursor-default",
          !isEditMode && !isSidebarCollapsed && "group-hover:pr-1"
        )}
      >
        {/* Active indicator */}
        {isActive && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
            style={{ backgroundColor: item.theme.solid }}
          />
        )}

        {/* Icon */}
        <Icon
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-colors",
            isActive ? "text-slate-700" : "text-slate-400 group-hover:text-slate-600"
          )}
          style={isActive ? { color: item.theme.solid } : undefined}
        />

        {/* Label */}
        {!isSidebarCollapsed && (
          <span className="flex-1 truncate">{item.label}</span>
        )}

        {/* Pin indicator (subtle) */}
        {item.isPinned && !isEditMode && !isSidebarCollapsed && (
          <Pin className="h-3 w-3 text-slate-300" />
        )}

        {/* Expand/collapse */}
        {hasChildren && !isEditMode && !isSidebarCollapsed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpand();
            }}
            className="p-0.5 rounded hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        )}
      </Link>

      {/* Edit mode actions */}
      {isEditMode && !isSidebarCollapsed && (
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={onPin}
            className={cn(
              "p-1 rounded transition-colors",
              item.isPinned
                ? "text-slate-700 bg-slate-100"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            )}
          >
            {item.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          </button>

          {!item.isCore && (
            <button
              onClick={onHide}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <EyeOff className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Tooltip when collapsed
  if (isSidebarCollapsed && !isEditMode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

/**
 * Minimal drag overlay
 */
function DragOverlayItem({ item }: { item: ResolvedSidebarItem | null }) {
  if (!item) return null;
  const Icon = item.icon;

  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 bg-white rounded-md shadow-lg border border-slate-200 text-[13px] font-medium text-slate-900">
      <Icon className="h-4 w-4 text-slate-500" />
      <span>{item.label}</span>
    </div>
  );
}

/**
 * Hidden items panel
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
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="px-2.5 mb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
        Hidden
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onRestore(item.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left truncate">{item.label}</span>
              <Eye className="h-3 w-3" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Premium minimal sidebar
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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = visibleItems.findIndex((item) => item.id === active.id);
        const newIndex = visibleItems.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(visibleItems.map((item) => item.id), oldIndex, newIndex);
        actions.reorder(newOrder);
      }
    },
    [visibleItems, actions]
  );

  const toggleEditMode = useCallback(() => {
    if (isEditMode) actions.saveNow();
    setIsEditMode(!isEditMode);
  }, [isEditMode, actions]);

  const isPathActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const activeItem = activeId ? visibleItems.find((item) => item.id === activeId) || null : null;

  if (!isLoaded) {
    return (
      <Sidebar variant="inset" {...props}>
        <SidebarHeader className="p-4">
          <div className="h-6 w-24 animate-pulse bg-slate-100 rounded" />
        </SidebarHeader>
        <SidebarContent className="px-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-7 animate-pulse bg-slate-50 rounded-md mb-1" />
          ))}
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar variant="inset" {...props}>
        {/* Clean header */}
        <SidebarHeader className="px-4 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 leading-none">Arrow</span>
                    <span className="text-[10px] text-slate-400 leading-none mt-0.5">Fund Holdings</span>
                  </div>
                )}
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-3">
          {/* Edit mode banner */}
          {isEditMode && !isSidebarCollapsed && (
            <div className="mb-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Edit Navigation
                </span>
                <button
                  onClick={toggleEditMode}
                  className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white text-[11px] font-medium rounded hover:bg-slate-800 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Done
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Drag to reorder · Click pin to keep at top
              </p>
            </div>
          )}

          {/* Customize button (when not in edit mode) */}
          {!isEditMode && !isSidebarCollapsed && (
            <div className="flex items-center justify-between px-2.5 mb-2">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Menu
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleEditMode}
                    className="p-1 rounded text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Customize
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Navigation items */}
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
              <div className="space-y-0.5">
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
                        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2.5">
                          {item.children.map((child) => (
                            <Link
                              key={child.id}
                              href={child.href}
                              className={cn(
                                "block px-2 py-1 text-[12px] rounded transition-colors",
                                isPathActive(child.href)
                                  ? "text-slate-900 font-medium bg-slate-50"
                                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
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

          {/* Hidden items in edit mode */}
          {isEditMode && !isSidebarCollapsed && (
            <HiddenItemsPanel items={hiddenItems} onRestore={(id) => actions.hide(id)} />
          )}

          {/* Reset button */}
          {isEditMode && !isSidebarCollapsed && (
            <button
              onClick={actions.reset}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset defaults
            </button>
          )}
        </SidebarContent>

        <SidebarFooter className="px-3 pb-3">
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
