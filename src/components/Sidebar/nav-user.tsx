"use client"

import { LogOut, Sparkles, Sun, Moon, Monitor } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Nice things to say about each team member
const userCompliments: Record<string, string> = {
  "Brendan Conn": "The visionary leader",
  "Chris Clifford": "The deal architect",
  "Gabriel Borden": "The relationship builder",
}

export function NavUser() {
  const { user, logout } = useAuth()
  const { theme, resolvedTheme, setTheme } = useTheme()

  if (!user) return null

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const compliment = userCompliments[user.name] || "Making moves"

  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun

  return (
    <SidebarMenu>
      {/* Theme Toggle */}
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent">
              <ThemeIcon className="size-4" />
              <span>{theme === "system" ? "System" : resolvedTheme === "dark" ? "Dark" : "Light"}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-36">
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className={theme === "light" ? "bg-accent" : ""}
            >
              <Sun className="size-4 mr-2" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className={theme === "dark" ? "bg-accent" : ""}
            >
              <Moon className="size-4 mr-2" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className={theme === "system" ? "bg-accent" : ""}
            >
              <Monitor className="size-4 mr-2" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

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
