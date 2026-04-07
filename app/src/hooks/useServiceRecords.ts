import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ServiceRecord = {
  id: string;
  vehicle_id: string;
  user_id: string;
  date: string;
  odometer: number | null;
  service_type: string;
  description: string | null;
  cost: number;
  next_service_date: string | null;
  next_service_mileage: number | null;
  created_at: string;
};

export function useServiceRecords(vehicleId: string) {
  return useQuery({
    queryKey: ["service_records", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_records")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as ServiceRecord[];
    },
    enabled: !!vehicleId,
  });
}

export function useAllServiceRecords() {
  return useQuery({
    queryKey: ["all_service_records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_records")
        .select("*, vehicles(name)")
        .order("next_service_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateServiceRecord() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (record: Omit<ServiceRecord, "id" | "user_id" | "created_at">) => {
      const { data, error } = await supabase
        .from("service_records")
        .insert({ ...record, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["service_records", vars.vehicle_id] });
      qc.invalidateQueries({ queryKey: ["all_service_records"] });
    },
  });
}

export function useDeleteServiceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      const { error } = await supabase.from("service_records").delete().eq("id", id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId) => {
      qc.invalidateQueries({ queryKey: ["service_records", vehicleId] });
      qc.invalidateQueries({ queryKey: ["all_service_records"] });
    },
  });
}
