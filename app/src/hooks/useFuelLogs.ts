import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import type { FuelLog } from "@/types/domain";

export type { FuelLog };

export function useFuelLogs(vehicleId: string) {
  return useQuery({
    queryKey: ["fuel_logs", vehicleId],
    queryFn: () => apiJson<FuelLog[]>(`/api/v1/vehicles/${vehicleId}/fuel-logs`),
    enabled: !!vehicleId,
  });
}

export function useCreateFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<FuelLog, "id" | "user_id" | "created_at">) => {
      const { vehicle_id, ...body } = log;
      return apiJson<FuelLog>(`/api/v1/vehicles/${vehicle_id}/fuel-logs`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["fuel_logs", vars.vehicle_id] });
    },
  });
}

export function useDeleteFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      await apiJson(`/api/v1/fuel-logs/${id}`, { method: "DELETE" });
      return vehicleId;
    },
    onSuccess: (vehicleId) => {
      qc.invalidateQueries({ queryKey: ["fuel_logs", vehicleId] });
    },
  });
}
