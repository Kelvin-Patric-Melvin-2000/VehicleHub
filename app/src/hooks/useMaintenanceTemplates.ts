import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import type { MaintenanceTemplate } from "@/types/domain";

export function useMaintenanceTemplates(vehicleType: string) {
  return useQuery({
    queryKey: ["maintenance-templates", vehicleType],
    queryFn: () =>
      apiJson<MaintenanceTemplate[]>(
        `/api/v1/maintenance-templates?vehicleType=${encodeURIComponent(vehicleType)}`,
      ),
    staleTime: 60 * 60 * 1000,
  });
}
