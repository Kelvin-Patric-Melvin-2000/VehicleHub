import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FuelLog = {
  id: string;
  vehicle_id: string;
  user_id: string;
  date: string;
  odometer_reading: number;
  fuel_quantity_liters: number;
  cost: number;
  fuel_station: string | null;
  created_at: string;
};

export function useFuelLogs(vehicleId: string) {
  return useQuery({
    queryKey: ["fuel_logs", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as FuelLog[];
    },
    enabled: !!vehicleId,
  });
}

export function useCreateFuelLog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (log: Omit<FuelLog, "id" | "user_id" | "created_at">) => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .insert({ ...log, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
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
      const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId) => {
      qc.invalidateQueries({ queryKey: ["fuel_logs", vehicleId] });
    },
  });
}
