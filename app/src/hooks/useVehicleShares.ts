import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";

export type VehicleShareRow = {
  id: string;
  role: "view" | "edit";
  user: { id: string; email: string; display_name: string | null } | null;
};

export function useVehicleShares(vehicleId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["vehicle-shares", vehicleId],
    queryFn: () => apiJson<VehicleShareRow[]>(`/api/v1/vehicles/${vehicleId}/shares`),
    enabled: !!vehicleId && enabled,
  });
}

export function useCreateVehicleShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      vehicleId,
      email,
      role,
    }: {
      vehicleId: string;
      email: string;
      role: "view" | "edit";
    }) =>
      apiJson<VehicleShareRow>(`/api/v1/vehicles/${vehicleId}/shares`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["vehicle-shares", v.vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useDeleteVehicleShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, shareId }: { vehicleId: string; shareId: string }) => {
      await apiJson(`/api/v1/vehicles/${vehicleId}/shares/${shareId}`, { method: "DELETE" });
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["vehicle-shares", v.vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
