import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationSettings = {
  notification_email_enabled: boolean;
  reminder_lead_days_service: number;
  reminder_lead_days_documents: number;
};

export function useNotificationSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => apiJson<NotificationSettings>("/api/v1/me/notification-settings"),
    enabled: !!user,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NotificationSettings>) =>
      apiJson<NotificationSettings>("/api/v1/me/notification-settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}
