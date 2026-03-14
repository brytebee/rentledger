"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authService } from "@/services/auth";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";

interface TopBarProps {
  title: string;
  user: {
    name: string;
    email: string;
    role: "landlord" | "tenant";
    avatarUrl?: string;
  };
  notificationCount?: number;
}

export function TopBar({ title, user }: TopBarProps) {
  const router = useRouter();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("rl_access_token");
        sessionStorage.removeItem("rl_refresh_token");
        sessionStorage.removeItem("rl_user");
      }
      await authService.signOut();
    } catch {
      // fail silently
    } finally {
      router.push("/auth/login");
    }
  }

  return (
    <header className="sticky top-0 z-40 lg:hidden bg-background/80 backdrop-blur-md border-b border-border transition-all">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Menu + Title */}
        <div className="flex items-center gap-3">
          <button className="max-sm:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>

        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-violet-500 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 rounded-2xl border border-border shadow-xl p-1.5 bg-card"
            >
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground font-normal capitalize">
                  {user.role}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-100 my-1" />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                  <Link href="/account" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                  <Link href="/account" className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                  <Link
                    href="/notifications"
                    className="flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Notifications</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-gray-100 my-1" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-xl cursor-pointer text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
