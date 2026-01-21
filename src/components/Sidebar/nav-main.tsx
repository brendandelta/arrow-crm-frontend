"use client"

import { useState, useEffect } from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
} from "@/components/ui/sidebar"

const STORAGE_KEY = "arrow-crm-sidebar-expanded"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Mark as mounted after hydration to prevent ID mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setExpandedItems(JSON.parse(stored))
      } else {
        // Default: expand items marked as isActive
        const defaults: Record<string, boolean> = {}
        items.forEach((item) => {
          if (item.isActive && item.items?.length) {
            defaults[item.title] = true
          }
        })
        setExpandedItems(defaults)
      }
    } catch (e) {
      console.error("Failed to load sidebar state:", e)
    }
    setIsInitialized(true)
  }, [items])

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedItems))
    }
  }, [expandedItems, isInitialized])

  const handleToggle = (title: string, isOpen: boolean) => {
    setExpandedItems((prev) => ({ ...prev, [title]: isOpen }))
  }

  // Determine if an item should be expanded
  const isItemOpen = (item: typeof items[0]) => {
    if (!isMounted) return false // Return consistent false during SSR
    if (isInitialized) return expandedItems[item.title] ?? false
    return item.isActive ?? false
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            open={isItemOpen(item)}
            onOpenChange={(isOpen) => handleToggle(item.title, isOpen)}
          >
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
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
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
