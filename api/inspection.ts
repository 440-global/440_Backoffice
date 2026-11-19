import http from "@/lib/http";
import { InspectionParams, InspectionResponse, SingleInspection } from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetInspections = (params: InspectionParams) => {
  return useQuery<InspectionResponse>({
    queryKey: ["inspection", params],
    queryFn: async () => {
      const res = await http.get("/admin/inspection/requests", { params });
      return res?.data;
    },
  });
};

export const useGetInspection = (id: number) => {
  return useQuery<SingleInspection>({
    queryKey: ["inspection", id],
    queryFn: async () => {
      const res = await http.get(`/admin/inspection/requests/${id}`);
      return res?.data?.data;
    },
    enabled: !!id,
  });
};

export const useUpdateInspectionStatus = () => {
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) => {
      const res = await http.post(
        `/admin/inspection/requests/${id}/status`,
        body,
      );
      return res?.data;
    },
  });
};