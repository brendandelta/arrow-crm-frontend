"use client"

import * as React from "react"
import {
  Building2,
  CircleDollarSign,
  FileText,
  Home,
  LifeBuoy,
  Settings,
  Users,
  Calendar,
  TrendingUp,
  Map,
  CheckSquare,
  FolderKanban,
} from "lucide-react"

import { NavMain } from "@/components/Sidebar/nav-main"
import { NavSecondary } from "@/components/Sidebar/nav-secondary"
import { NavUser } from "@/components/Sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Gabriel Borden",
    email: "gabe@arrow.fund",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Deals",
      url: "/deals",
      icon: CircleDollarSign,
      items: [
        { title: "All Deals", url: "/deals" },
        { title: "Live", url: "/deals/live" },
        { title: "Sourcing", url: "/deals/sourcing" },
      ],
    },
    {
      title: "Organizations",
      url: "/organizations",
      icon: Building2,
      items: [
        { title: "All", url: "/organizations" },
        { title: "Funds", url: "/organizations/funds" },
        { title: "Companies", url: "/organizations/companies" },
      ],
    },
    {
      title: "People",
      url: "/people",
      icon: Users,
      items: [
        { title: "All Contacts", url: "/people" },
        { title: "New Contact", url: "/people/new" },
        { title: "Champions", url: "/people/champions" },
        { title: "Hot", url: "/people/hot" },
      ],
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: CheckSquare,
      items: [
        { title: "All Tasks", url: "/tasks" },
        { title: "My Tasks", url: "/tasks/my" },
        { title: "By Deal", url: "/tasks/by-deal" },
        { title: "By Project", url: "/tasks/by-project" },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderKanban,
    },
    {
      title: "Map",
      url: "/map",
      icon: Map,
    },
    {
      title: "Events",
      url: "/events",
      icon: Calendar,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: FileText,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <TrendingUp className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Arrow</span>
                  <span className="truncate text-xs">Fund Holdings</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
