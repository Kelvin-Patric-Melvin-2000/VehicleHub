import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import type { VehicleTypeOption } from "@/types/domain";

export function useVehicleTypes() {
  return useQuery({
    queryKey: ["vehicle-types"],
    queryFn: () => apiJson<VehicleTypeOption[]>("/api/v1/vehicle-types"),
    staleTime: 60 * 60 * 1000,
  });
}
