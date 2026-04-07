import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ServiceRecord } from "@/types/domain";

export type { ServiceRecord };

export function useServiceRecords(vehicleId: string) {
  return useQuery({
    queryKey: ["service_records", vehicleId],
    queryFn: () =>
      apiJson<ServiceRecord[]>(`/api/v1/service-records?vehicleId=${encodeURIComponent(vehicleId)}`),
    enabled: !!vehicleId,
  });
}

export function useAllServiceRecords() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["all_service_records"],
    queryFn: () => apiJson<ServiceRecord[]>("/api/v1/service-records"),
    enabled: !!user,
  });
}

export function useCreateServiceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<ServiceRecord, "id" | "user_id" | "created_at" | "vehicles">) => {
      return apiJson<ServiceRecord>("/api/v1/service-records", {
        method: "POST",
        body: JSON.stringify(record),
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["service_records", vars.vehicle_id] });
      qc.invalidateQueries({ queryKey: ["all_service_records"] });
    },
  });
}

export function useDeleteServiceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      await apiJson(`/api/v1/service-records/${id}`, { method: "DELETE" });
      return vehicleId;
    },
    onSuccess: (vehicleId) => {
      qc.invalidateQueries({ queryKey: ["service_records", vehicleId] });
      qc.invalidateQueries({ queryKey: ["all_service_records"] });
    },
  });
}
