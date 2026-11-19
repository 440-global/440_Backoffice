import http from "@/lib/http";
import { InspectionDepth, InspectTierHistory, RateHistory, SingleLogisticsRate, SingleRate, UpdateInspectRate, UpdateRatePayload } from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query"

type UpdatePayload = {
  rate: number;
}

export const useGetRates = () => {
  return useQuery<SingleRate[]>({
    queryKey: ['rates'],
    queryFn: async () => {
      const res = await http.get('/admin/rates/exchange');
      return res.data.data;
    },
  });
};

export const useGetCurrencyHistory = (currencyId: number) => {
  return useQuery<RateHistory[]>({
    queryKey: ["rates", "history", currencyId],
    queryFn: async () => {
      const res = await http.get(`/admin/rates/exchange/${currencyId}/history`);
      return res.data.data;
    },
    enabled: !!currencyId,
  });
};

export const useUpdateCurrency = (currencyId: number) => {
  return useMutation({
    mutationKey: ['rates', currencyId],
    mutationFn: (body: UpdatePayload) => {
      return http.put(`/admin/rates/exchange/${currencyId}`, body);
    },
  });
};

export const useGetLogisticsRate = () => {
  return useQuery<SingleLogisticsRate[]>({
    queryKey: ["logistics-rates"],
    queryFn: async () => {
      const res = await http.get("/admin/rates/logistics");
      return res.data.data;
    },
  });
};

export const useUpdateLogisticsRate = () => {
  return useMutation({
    mutationKey: ['logistics-rate'],
    mutationFn: async (body: UpdateRatePayload) => {
      return await http.put('/admin/rates/logistics', body);
    },
  });
};

export const useGetInspectionRates = () => {
  return useQuery({
    queryKey: ['inspection-rates'],
    queryFn: async () => {
      const res = await http.get('/admin/rates/inspection');
      return res.data.data;
    },
  });
};

export const useUpdateTierRate = () => {
  return useMutation({
    mutationKey: ["inspection-rates"],
    mutationFn: async (body: UpdateInspectRate) => {
      return await http.put(`/admin/rates/inspection/${body.tier}`, {
        feeKobo: body.feeKobo,
      });
    },
  });
};

export const useGetTierHistory = (tier: InspectionDepth) => {
  return useQuery<InspectTierHistory[]>({
    queryKey: ["tier-history", tier],
    queryFn: async () => {
      const res = await http.get(`/admin/rates/inspection/${tier}/history`);
      return res.data.data;
    },
    enabled: !!tier,
  });
};