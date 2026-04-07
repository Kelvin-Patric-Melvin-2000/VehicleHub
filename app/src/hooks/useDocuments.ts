import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type VehicleDocument = {
  id: string;
  vehicle_id: string;
  user_id: string;
  document_type: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
};

export function useDocuments(vehicleId: string) {
  return useQuery({
    queryKey: ["documents", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data as VehicleDocument[];
    },
    enabled: !!vehicleId,
  });
}

export function useAllDocuments() {
  return useQuery({
    queryKey: ["all_documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, vehicles(name)")
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (doc: Omit<VehicleDocument, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("documents")
        .insert({ ...doc, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["documents", vars.vehicle_id] });
      qc.invalidateQueries({ queryKey: ["all_documents"] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId) => {
      qc.invalidateQueries({ queryKey: ["documents", vehicleId] });
      qc.invalidateQueries({ queryKey: ["all_documents"] });
    },
  });
}

export async function uploadDocumentFile(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("vehicle-documents")
    .upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("vehicle-documents").getPublicUrl(path);
  return data.publicUrl;
}
