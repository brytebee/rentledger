"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Bell, Loader2, Check, X, RefreshCw, CheckCircle2, XCircle, Info, CreditCard, UserPlus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/dashboard/top-bar";
import { useSessionUser } from "@/components/auth/auth-context";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useRespondToInvitation } from "@/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getIcon(type: string) {
  switch (type) {
    case "payment":  return <CreditCard className="w-4 h-4 text-blue-500" />;
    case "message":  return <MessageSquare className="w-4 h-4 text-green-500" />;
    case "tenancy":  return <UserPlus className="w-4 h-4 text-purple-500" />;
    default:         return <Info className="w-4 h-4 text-gray-400" />;
  }
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  if (minutes < 1)  return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours   < 24) return `${hours}h ago`;
  if (days    <  7) return `${days}d ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

export default function NotificationsPage() {
  const router  = useRouter();
  const user    = useSessionUser();

  // All data via React Query — same cache as the notification bell
  const { data: notifications = [], isLoading, refetch } = useNotifications(false);
  const markAsRead       = useMarkAsRead();
  const markAllAsRead    = useMarkAllAsRead();
  const respondToInvite  = useRespondToInvitation();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const headerUser = { name: user.name, email: user.email, role: user.role };

  // ── helpers ────────────────────────────────────────────────────────────────

  const isTenancyInvite = (n: typeof notifications[number]) =>
    n.type === "tenancy" && !!n.data?.tenancy_id;

  const isActioned = (n: typeof notifications[number]) =>
    n.title.includes("Accepted") || n.title.includes("Declined");

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id);
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleAction = useCallback(async (
    notificationId: string,
    action: "accept" | "reject",
    tenancyId: string,
  ) => {
    setActionLoading(notificationId);
    try {
      await respondToInvite.mutateAsync({ notificationId, action, tenancyId });
      toast.success(action === "accept" ? "Tenancy accepted! Redirecting to dashboard…" : "Invitation declined");

      // Give the toast time to show, then navigate so the dashboard reloads with fresh data.
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch {
      toast.error("Failed to process action. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }, [respondToInvite, router]);

  // ── render ─────────────────────────────────────────────────────────────────

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <TopBar title="Notifications" user={headerUser} />
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-xl h-9 border-gray-200 hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4 text-gray-500", isLoading && "animate-spin")} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="rounded-xl h-9 border-gray-200 text-sm text-gray-600"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-sm font-semibold text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const isInvite   = isTenancyInvite(n);
              const actioned   = isActioned(n);
              const isBusy     = actionLoading === n.id;
              const accepted   = n.title.includes("Accepted");
              const declined   = n.title.includes("Declined");

              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 transition-all duration-150",
                    !n.read
                      ? "border-blue-200 bg-blue-50/40"
                      : "border-gray-200 bg-white",
                    !n.read && !isInvite && "cursor-pointer hover:bg-blue-50/70"
                  )}
                  onClick={() => {
                    if (!n.read && !isInvite) handleMarkRead(n.id);
                  }}
                >
                  {/* Icon */}
                  <div className="mt-0.5 shrink-0">
                    {actioned ? (
                      accepted
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-red-400" />
                    ) : getIcon(n.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1.5">{formatTime(n.created_at)}</p>
                      </div>

                      {/* Status / Unread dot */}
                      {!n.read && !isInvite && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                      )}

                      {actioned && (
                        <Badge
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                            accepted
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-gray-100 text-gray-500 border border-gray-200"
                          )}
                        >
                          {accepted ? "Accepted" : "Declined"}
                        </Badge>
                      )}
                    </div>

                    {/* Accept / Decline actions */}
                    {isInvite && !actioned && (
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(n.id, "accept", n.data!.tenancy_id!);
                          }}
                          disabled={isBusy}
                          className="h-8 px-4 rounded-xl text-xs font-semibold bg-green-500 hover:bg-green-600 gap-1.5 shadow-sm shadow-green-100"
                        >
                          {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(n.id, "reject", n.data!.tenancy_id!);
                          }}
                          disabled={isBusy}
                          className="h-8 px-4 rounded-xl text-xs font-semibold border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 gap-1.5"
                        >
                          {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
