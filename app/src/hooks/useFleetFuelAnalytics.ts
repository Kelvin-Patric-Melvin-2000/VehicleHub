import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { FleetFuelAnalytics } from "@/types/domain";

export function useFleetFuelAnalytics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analytics", "fleet", "fuel"],
    queryFn: () => apiJson<FleetFuelAnalytics>("/api/v1/analytics/fleet/fuel"),
    enabled: !!user,
  });
}
