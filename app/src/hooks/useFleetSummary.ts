import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { FleetSummary } from "@/types/domain";

export function useFleetSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analytics", "fleet", "summary"],
    queryFn: () => apiJson<FleetSummary>("/api/v1/analytics/fleet/summary"),
    enabled: !!user,
  });
}
