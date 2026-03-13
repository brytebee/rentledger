"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Home,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Bell,
  HelpCircle,
  Wrench,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const landlordNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4.5 h-4.5" />,
  },
  {
    href: "/properties",
    label: "Properties",
    icon: <Building2 className="w-4.5 h-4.5" />,
  },
  {
    href: "/tenants",
    label: "Tenants",
    icon: <Users className="w-4.5 h-4.5" />,
  },
  {
    href: "/payments",
    label: "Payments",
    icon: <CreditCard className="w-4.5 h-4.5" />,
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    icon: <Wrench className="w-4.5 h-4.5" />,
  },
  {
    href: "/account",
    label: "Account",
    icon: <User className="w-4.5 h-4.5" />,
  },
];

const tenantNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4.5 h-4.5" />,
  },
  {
    href: "/history",
    label: "History",
    icon: <CreditCard className="w-4.5 h-4.5" />,
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    icon: <Wrench className="w-4.5 h-4.5" />,
  },
  {
    href: "/account",
    label: "Account",
    icon: <User className="w-4.5 h-4.5" />,
  },
];

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: "landlord" | "tenant";
    avatarUrl?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = user.role === "tenant" ? tenantNav : landlordNav;

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
    <aside className="hidden lg:flex flex-col w-60 xl:w-65 h-screen sticky top-0 bg-sidebar border-r border-border shrink-0 z-30 transition-colors">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-sm shadow-blue-200">
          <Home className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-foreground text-[1.0625rem] tracking-[-0.02em]">
          RentLedger
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-gray-400 mb-3">
          Main Menu
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px]",
                "text-sm font-semibold transition-all duration-150",
                "min-h-11",
                isActive
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 shadow-sm relative"
                  : "text-gray-600 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-900/50 hover:text-gray-900 dark:hover:text-zinc-100",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-blue-500"
                      : "text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="absolute left-0 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
                )}
              </div>
              {item.badge ? (
                <Badge className="h-5 min-w-[20px] px-1.5 text-[0.625rem] font-bold bg-blue-500 text-white hover:bg-blue-500 rounded-full">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-3 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-gray-400 mb-3">
            Support
          </p>
          <Link
            href="/account"
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-[10px]",
              "text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-zinc-100",
              "transition-all duration-150 min-h-[44px]",
            )}
          >
            <Settings className="w-[18px] h-[18px] text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors" />
            Settings
          </Link>
          <Link
            href="/help"
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-[10px]",
              "text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-zinc-100",
              "transition-all duration-150 min-h-[44px]",
            )}
          >
            <HelpCircle className="w-[18px] h-[18px] text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors" />
            Help & Support
          </Link>
        </div>
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-border mt-auto">
        <div className="flex items-center justify-end gap-2 mb-3 px-2">
          <ThemeToggle />
          <NotificationBell />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-900/50 transition-all group">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-violet-500 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate leading-none mb-0.5">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate capitalize font-[Roboto,sans-serif]">
                  {user.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 group-hover:text-gray-600 transition-colors" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={8}
            className="w-56 rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/60 p-1.5"
          >
            <DropdownMenuLabel className="px-2 py-1.5">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-400 font-normal truncate">
                {user.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100 my-1" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                asChild
                className="rounded-xl cursor-pointer focus:bg-gray-50"
              >
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="rounded-xl cursor-pointer focus:bg-gray-50"
              >
                <Link href="/account" className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="rounded-xl cursor-pointer focus:bg-gray-50"
              >
                <Link href="/notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Notifications</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-100 my-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-xl cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
