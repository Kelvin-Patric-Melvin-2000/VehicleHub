import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { VehicleFuelAnalytics } from "@/types/domain";

export function useVehicleFuelAnalytics(vehicleId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analytics", "vehicle", vehicleId, "fuel"],
    queryFn: () => apiJson<VehicleFuelAnalytics>(`/api/v1/vehicles/${vehicleId}/analytics/fuel`),
    enabled: !!user && !!vehicleId,
  });
}
