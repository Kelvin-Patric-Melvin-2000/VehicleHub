import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson, apiUploadFile } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { VehicleDocument } from "@/types/domain";

export type { VehicleDocument };

export function useDocuments(vehicleId: string) {
  return useQuery({
    queryKey: ["documents", vehicleId],
    queryFn: () =>
      apiJson<VehicleDocument[]>(`/api/v1/documents?vehicleId=${encodeURIComponent(vehicleId)}`),
    enabled: !!vehicleId,
  });
}

export function useAllDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["all_documents"],
    queryFn: () => apiJson<VehicleDocument[]>("/api/v1/documents"),
    enabled: !!user,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Omit<VehicleDocument, "id" | "user_id" | "created_at" | "updated_at" | "vehicles">) => {
      return apiJson<VehicleDocument>("/api/v1/documents", {
        method: "POST",
        body: JSON.stringify(doc),
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["documents", vars.vehicle_id] });
      qc.invalidateQueries({ queryKey: ["all_documents"] });
      qc.invalidateQueries({ queryKey: ["analytics", "fleet", "summary"] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      await apiJson(`/api/v1/documents/${id}`, { method: "DELETE" });
      return vehicleId;
    },
    onSuccess: (vehicleId) => {
      qc.invalidateQueries({ queryKey: ["documents", vehicleId] });
      qc.invalidateQueries({ queryKey: ["all_documents"] });
      qc.invalidateQueries({ queryKey: ["analytics", "fleet", "summary"] });
    },
  });
}

export async function uploadDocumentFile(file: File): Promise<string> {
  const { url } = await apiUploadFile(file);
  return url;
}
