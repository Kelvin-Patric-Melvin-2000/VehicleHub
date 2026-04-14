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
      return apiJson<FuelLog & { warnings?: string[] }>(`/api/v1/vehicles/${vehicle_id}/fuel-logs`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["fuel_logs", vars.vehicle_id] });
      qc.invalidateQueries({ queryKey: ["analytics", "fleet", "fuel"] });
      qc.invalidateQueries({ queryKey: ["analytics", "fleet", "summary"] });
      qc.invalidateQueries({ queryKey: ["analytics", "vehicle", vars.vehicle_id, "fuel"] });
    },
  });
}

export function useImportFuelLogs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      vehicle_id: string;
      rows: {
        date: string;
        odometer_reading: number;
        fuel_quantity_liters: number;
        cost: number;
        energy_unit?: "L" | "kWh";
        fuel_station?: string | null;
      }[];
    }) =>
      apiJson<{ imported: number }>("/api/v1/imports/fuel-logs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["fuel_logs", vars.vehicle_id] });
      qc.invalidateQueries({ queryKey: ["analytics", "fleet", "fuel"] });
      qc.invalidateQueries({ queryKey: ["analytics", "fleet", "summary"] });
      qc.invalidateQueries({ queryKey: ["analytics", "vehicle", vars.vehicle_id, "fuel"] });
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
      qc.invalidateQueries({ queryKey: ["analytics", "fleet", "fuel"] });
      qc.invalidateQueries({ queryKey: ["analytics", "fleet", "summary"] });
      qc.invalidateQueries({ queryKey: ["analytics", "vehicle", vehicleId, "fuel"] });
    },
  });
}
