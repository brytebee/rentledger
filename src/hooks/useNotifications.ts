import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string | null;
  data: { tenancy_id?: string } | null;
}

interface NotificationsResponse {
  notifications: Notification[];
}

async function fetchNotifications(unreadOnly = false): Promise<Notification[]> {
  const { data } = await axios.get<NotificationsResponse>(
    unreadOnly ? "/api/notifications?unread=true" : "/api/notifications"
  );
  return data.notifications ?? [];
}

async function markAsRead(notificationId: string): Promise<void> {
  await axios.patch("/api/notifications", { notification_id: notificationId });
}

async function markAllAsRead(): Promise<void> {
  await axios.patch("/api/notifications", { mark_all_read: true });
}

async function respondToInvitation(
  notificationId: string,
  action: "accept" | "reject",
  tenancyId: string
): Promise<void> {
  await axios.patch("/api/notifications", {
    notification_id: notificationId,
    action,
    tenancy_id: tenancyId,
  });
}

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => fetchNotifications(unreadOnly),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onMutate: async (notificationId) => {
      // Cancel both queries
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Keep track of old data for rollback
      const previousFull = queryClient.getQueryData<Notification[]>(["notifications", false]);
      const previousUnread = queryClient.getQueryData<Notification[]>(["notifications", true]);

      // Optimistically update full list
      queryClient.setQueryData<Notification[]>(["notifications", false], (old) =>
        old?.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );

      // Optimistically update unread list (remove the item or mark as read)
      queryClient.setQueryData<Notification[]>(["notifications", true], (old) =>
        old?.filter((n) => n.id !== notificationId)
      );

      return { previousFull, previousUnread };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (_err, _id, context) => {
      if (context?.previousFull) {
        queryClient.setQueryData(["notifications", false], context.previousFull);
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(["notifications", true], context.previousUnread);
      }
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      
      const previousFull = queryClient.getQueryData<Notification[]>(["notifications", false]);
      const previousUnread = queryClient.getQueryData<Notification[]>(["notifications", true]);

      queryClient.setQueryData<Notification[]>(["notifications", false], (old) =>
        old?.map((n) => ({ ...n, read: true }))
      );

      queryClient.setQueryData<Notification[]>(["notifications", true], () => []);

      return { previousFull, previousUnread };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFull) {
        queryClient.setQueryData(["notifications", false], context.previousFull);
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(["notifications", true], context.previousUnread);
      }
    },
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notificationId, action, tenancyId }: { notificationId: string; action: "accept" | "reject"; tenancyId: string }) =>
      respondToInvitation(notificationId, action, tenancyId),
    onMutate: async ({ notificationId, action }) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      
      const previousFull = queryClient.getQueryData<Notification[]>(["notifications", false]);
      const previousUnread = queryClient.getQueryData<Notification[]>(["notifications", true]);

      // Update full list
      queryClient.setQueryData<Notification[]>(["notifications", false], (old) =>
        old?.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                read: true,
                title: action === "accept" ? "Tenancy Accepted" : "Tenancy Declined",
              }
            : n
        )
      );

      // Update unread list (remove the item)
      queryClient.setQueryData<Notification[]>(["notifications", true], (old) =>
        old?.filter((n) => n.id !== notificationId)
      );

      return { previousFull, previousUnread };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFull) {
        queryClient.setQueryData(["notifications", false], context.previousFull);
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(["notifications", true], context.previousUnread);
      }
    },
  });
}
