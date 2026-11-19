import { useMutation, useQuery } from "@tanstack/react-query"
import http from "../lib/http"
import { AddMarketForm } from "@/types/types";

export const useGetMarkets = () => {
  return useQuery({
    queryKey: ["market"],
    queryFn: async () => {
      const res = await http.get("/admin/markets");
      return res?.data?.data?.markets;
    }
  })
}

export const useCreateMarket = () => {
  return useMutation({
    mutationFn:  (body: AddMarketForm) => {
      return http.post('/admin/market', body);
    },
  });
};

export const useEditMarket = () => {
  return useMutation({
    mutationFn:  ({ marketId, ...body }: AddMarketForm) => {
      return http.put(`/admin/market/${marketId}`, body);
    },
  });
};