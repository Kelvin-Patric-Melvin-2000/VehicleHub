import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type FuelPriceIndicative = {
  pricePerLiter: number | null;
  region: string;
  source: string | null;
  updatedAt: string | null;
};

export function useFuelPriceIndicative() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["fuel-price", "indicative"],
    queryFn: () => apiJson<FuelPriceIndicative>("/api/v1/fuel-price/indicative"),
    enabled: !!user,
    staleTime: 6 * 60 * 60 * 1000,
  });
}
