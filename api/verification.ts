import http from "@/lib/http";
import { SingleSupplierVerification, SupplierVerificationFindings, SupplierVerificationParams, SupplierVerificationResponse } from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetSupplierVerifications = (params: SupplierVerificationParams) => {
  return useQuery<SupplierVerificationResponse>({
    queryKey: ["supplier-verification", params],
    queryFn: async () => {
      const res = await http.get("/admin/supplier-verification/requests", { params });
      return res?.data;
    },
  });
};

export const useGetSupplierVerification = (id: number) => {
  return useQuery<SingleSupplierVerification>({
    queryKey: ["supplier-verification", id],
    queryFn: async () => {
      const res = await http.get(`/admin/supplier-verification/requests/${id}`);
      return res?.data?.data;
    },
    enabled: !!id,
  });
};

export const useUpdateSupplierVerificationStatus = () => {
  return useMutation({
    mutationFn: async ({id, body}: {id: number, body: any}) => {
      const res = await http.post(
        `/admin/supplier-verification/requests/${id}/status`,
        body,
      );
      return res?.data;
    },
  });
};

export const useUpdateSupplierVerificationFindings = () => {
  return useMutation({
    mutationFn: async ({id, body}: {id: number, body: SupplierVerificationFindings}) => {
      const res = await http.patch(
        `/admin/supplier-verification/requests/${id}/findings`,
        body,
      );
      return res?.data;
    },
  });
};