import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Vehicle } from "@/types/domain";

export type { Vehicle };

export function useVehicles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: () => apiJson<Vehicle[]>("/api/v1/vehicles"),
    enabled: !!user,
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => apiJson<Vehicle>(`/api/v1/vehicles/${id}`),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, "id" | "user_id" | "created_at" | "updated_at">) => {
      return apiJson<Vehicle>("/api/v1/vehicles", {
        method: "POST",
        body: JSON.stringify(vehicle),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Vehicle> & { id: string }) => {
      await apiJson<Vehicle>(`/api/v1/vehicles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiJson(`/api/v1/vehicles/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["analytics", "fleet", "fuel"] });
    },
  });
}
