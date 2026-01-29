"use client";

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
  ChevronRight,
  GripVertical,
  Pin,
  PinOff,
  EyeOff,
  Eye,
  Settings2,
  Check,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarPreferences } from "@/contexts/SidebarPreferencesContext";
import { type ResolvedSidebarItem } from "@/lib/sidebar-preferences";
import { type NavigationItem } from "@/lib/navigation-registry";

// ============================================================================
// SORTABLE ITEM COMPONENT
// ============================================================================

interface SortableNavItemProps {
  item: ResolvedSidebarItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isEditMode: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onHide: () => void;
}

function SortableNavItem({
  item,
  isActive,
  isExpanded,
  onToggleExpand,
  isEditMode,
  onPin,
  onUnpin,
  onHide,
}: SortableNavItemProps) {
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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
  };

  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  return (
    <Collapsible
      asChild
      open={isExpanded}
      onOpenChange={onToggleExpand}
    >
      <SidebarMenuItem ref={setNodeRef} style={style}>
        <div className="flex items-center">
          {/* Drag Handle - only visible in edit mode */}
          {isEditMode && !isCollapsed && (
            <button
              className="flex items-center justify-center w-6 h-8 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          <SidebarMenuButton
            asChild
            tooltip={item.title}
            isActive={isActive}
            className={`flex-1 ${isEditMode && !isCollapsed ? "ml-0" : ""}`}
          >
            <Link href={item.url}>
              <item.icon
                className="transition-colors"
                style={{
                  color: isActive ? item.color.primary : undefined,
                }}
              />
              <span>{item.title}</span>
              {item.pinned && !isEditMode && (
                <Pin className="h-3 w-3 ml-auto text-muted-foreground" />
              )}
            </Link>
          </SidebarMenuButton>

          {/* Edit Mode Actions */}
          {isEditMode && !isCollapsed && (
            <div className="flex items-center gap-0.5 mr-1">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={item.pinned ? onUnpin : onPin}
                      className={`p-1.5 rounded-md transition-colors ${
                        item.pinned
                          ? "text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 dark:text-indigo-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {item.pinned ? (
                        <PinOff className="h-3.5 w-3.5" />
                      ) : (
                        <Pin className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.pinned ? "Unpin" : "Pin to top"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {item.canHide !== false && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={onHide}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      Hide from sidebar
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>

        {/* Sub Items */}
        {item.items?.length ? (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="data-[state=open]:rotate-90">
                <ChevronRight />
                <span className="sr-only">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items.map((subItem: { id: string; title: string; url: string }) => (
                  <SidebarMenuSubItem key={subItem.id}>
                    <SidebarMenuSubButton asChild>
                      <Link href={subItem.url}>
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : null}
      </SidebarMenuItem>
    </Collapsible>
  );
}

// ============================================================================
// DRAG OVERLAY ITEM
// ============================================================================

function DragOverlayItem({ item }: { item: ResolvedSidebarItem }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-popover rounded-lg shadow-xl border border-border ring-2 ring-indigo-500/20">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <item.icon className="h-4 w-4" style={{ color: item.color.primary }} />
      <span className="text-sm font-medium text-foreground">{item.title}</span>
    </div>
  );
}

// ============================================================================
// HIDDEN ITEMS SECTION
// ============================================================================

function HiddenItemsDropdown({
  hiddenItems,
  onShow,
}: {
  hiddenItems: NavigationItem[];
  onShow: (id: string) => void;
}) {
  if (hiddenItems.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
          <Eye className="h-3.5 w-3.5" />
          <span>Show {hiddenItems.length} hidden</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-48">
        {hiddenItems.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => onShow(item.id)}
            className="flex items-center gap-2"
          >
            <item.icon className="h-4 w-4" style={{ color: item.color.primary }} />
            <span>{item.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NavCustomizable() {
  const pathname = usePathname();
  const {
    items,
    hiddenItems,
    isEditMode,
    setEditMode,
    pinItem,
    unpinItem,
    hideItem,
    showItem,
    reorderItems,
    isSectionExpanded,
    toggleSectionExpanded,
    resetToDefaults,
    isLoaded,
  } = useSidebarPreferences();

  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(
            items.map((item) => item.id),
            oldIndex,
            newIndex
          );
          reorderItems(newOrder);
        }
      }
    },
    [items, reorderItems]
  );

  const isItemActive = useCallback(
    (item: ResolvedSidebarItem) => {
      if (pathname === item.url) return true;
      if (pathname.startsWith(item.url + "/")) return true;
      return item.items?.some(
        (sub: { id: string; title: string; url: string }) =>
          pathname === sub.url || pathname.startsWith(sub.url + "/")
      );
    },
    [pathname]
  );

  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : null;

  // Separate pinned and unpinned items
  const pinnedItems = items.filter((item) => item.pinned);
  const unpinnedItems = items.filter((item) => !item.pinned);

  if (!isLoaded) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          {[...Array(6)].map((_, i) => (
            <SidebarMenuItem key={i}>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      {/* Header with Edit Toggle */}
      <div className="flex items-center justify-between pr-2">
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        {!isCollapsed && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setEditMode(!isEditMode)}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    isEditMode
                      ? "text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 dark:text-indigo-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {isEditMode ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Settings2 className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {isEditMode ? "Done editing" : "Customize sidebar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SidebarMenu>
          {/* Pinned Section */}
          {pinnedItems.length > 0 && (
            <>
              {!isCollapsed && isEditMode && (
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Pinned
                  </span>
                </div>
              )}
              <SortableContext
                items={pinnedItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {pinnedItems.map((item) => (
                  <SortableNavItem
                    key={item.id}
                    item={item}
                    isActive={isItemActive(item) ?? false}
                    isExpanded={isSectionExpanded(item.id)}
                    onToggleExpand={() => toggleSectionExpanded(item.id)}
                    isEditMode={isEditMode}
                    onPin={() => pinItem(item.id)}
                    onUnpin={() => unpinItem(item.id)}
                    onHide={() => hideItem(item.id)}
                  />
                ))}
              </SortableContext>
              {pinnedItems.length > 0 && unpinnedItems.length > 0 && (
                <div className="my-2 mx-3 border-t border-border" />
              )}
            </>
          )}

          {/* Regular Items */}
          {!isCollapsed && isEditMode && unpinnedItems.length > 0 && (
            <div className="px-3 pt-1 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation
              </span>
            </div>
          )}
          <SortableContext
            items={unpinnedItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {unpinnedItems.map((item) => (
              <SortableNavItem
                key={item.id}
                item={item}
                isActive={isItemActive(item) ?? false}
                isExpanded={isSectionExpanded(item.id)}
                onToggleExpand={() => toggleSectionExpanded(item.id)}
                isEditMode={isEditMode}
                onPin={() => pinItem(item.id)}
                onUnpin={() => unpinItem(item.id)}
                onHide={() => hideItem(item.id)}
              />
            ))}
          </SortableContext>
        </SidebarMenu>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && <DragOverlayItem item={activeItem} />}
        </DragOverlay>
      </DndContext>

      {/* Edit Mode Footer */}
      {isEditMode && !isCollapsed && (
        <div className="mt-3 pt-3 border-t border-border space-y-1">
          {/* Hidden Items */}
          <HiddenItemsDropdown hiddenItems={hiddenItems} onShow={showItem} />

          {/* Reset Button */}
          <button
            onClick={resetToDefaults}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to default</span>
          </button>
        </div>
      )}
    </SidebarGroup>
  );
}
