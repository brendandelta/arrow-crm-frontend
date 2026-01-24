"use client"

import { LogOut, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Nice things to say about each team member
const userCompliments: Record<string, string> = {
  "Brendan Conn": "The visionary leader",
  "Chris Clifford": "The deal architect",
  "Gabriel Borden": "The relationship builder",
}

export function NavUser() {
  const { user, logout } = useAuth()

  if (!user) return null

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const compliment = userCompliments[user.name] || "Making moves"

  return (
    <SidebarMenu>
      {/* Logout Button */}
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={logout}
          className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* User Info */}
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent"
        >
          <Avatar className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
            <AvatarFallback className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3 text-emerald-500" />
              {compliment}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
