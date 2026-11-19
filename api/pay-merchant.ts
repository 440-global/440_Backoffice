import http from "@/lib/http";
import { PayMerchantParams, PayMerchantResponse, SinglePayMerchantResponse } from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetTransactions = (params: PayMerchantParams) => {
  return useQuery<PayMerchantResponse>({
    queryKey: ["transactions", params],
    queryFn: async () => {
      const res = await http.get("/admin/pay-merchant/requests", { params });
      return res?.data;
    },
  });
};

export const useGetTransaction = (id: number) => {
  return useQuery<SinglePayMerchantResponse>({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const res = await http.get(`/admin/pay-merchant/requests/${id}`);
      return res?.data?.data;
    },
    enabled: !!id,
  });
};

export const useUpdateTransactionStatus = () => {
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) => {
      const res = await http.post(
        `/admin/pay-merchant/requests/${id}/status`,
        body,
      );
      return res?.data;
    },
  });
};
