"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/App"
import { updateUserRole, ROLES } from "@/api/firebase/roles"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}) {
  const { state } = useSidebar()
  const { signOut, role, getRoleLabel, getRoleColor } = useAuth()

  const handleLogout = async () => {
    await signOut()
    window.location.reload()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-white/50 data-[state=open]:bg-white/50 text-sidebar-foreground rounded-xl transition-colors">
              <Avatar className="h-9 w-9 rounded-lg border border-sidebar-border/50 shadow-sm">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-sidebar-primary/10 text-sidebar-primary font-bold">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-sidebar-foreground flex items-center gap-2">
                  {user.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleColor(role)}`}>
                    {getRoleLabel(role)}
                  </span>
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {/* ... keeping content same ... */}
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
            side="bottom"
            align="start"
            sideOffset={12}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold flex items-center gap-2">
                    {user.name}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleColor(role)}`}>
                      {getRoleLabel(role)}
                    </span>
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>

            {/* DEV TOOL: Promote self to Manager */}
            {role !== 'manager' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                  if (confirm('Promote self to Manager? This will refresh the page.')) {
                    await updateUserRole(user.id, 'manager');
                    window.location.reload();
                  }
                }}>
                  <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                  Dev: Make Manager
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
