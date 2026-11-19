
import http from "@/lib/http";
import { AnalyticsFunnelParams, AnalyticsOverviewParams, AnalyticsParams, AnalyticsResponse, CartAbandonmentParams, RawAnalyticsResponse, TopProductAnalyticsParams } from "@/types/types";
import { useQuery } from "@tanstack/react-query";

type UserParams = {
  from: string;
  to: string;
  page: number;
  limit: number;
};

export const useGetAnalyticsOverview = (params: AnalyticsOverviewParams) => {
  return useQuery<AnalyticsResponse>({
    queryKey: ["analytics_overview", params],
    queryFn: async () => {
      const res = await http.get("/analytics/overview", { params });
      return res.data.data;
    },
  });
};

export const useGetAnalyticsRaw = (params: AnalyticsParams) => {
  return useQuery<RawAnalyticsResponse>({
    queryKey: ["analytics", params],
    queryFn: async () => {
      const res = await http.get("/analytics/events", { params });
      return res.data;
    },
  });
};

export const useGetUserAnalytics = (userId: number, params?: UserParams) => {
  return useQuery({
    queryKey: ["user_analytics", userId, params],
    queryFn: async () => {
      const res = await http.get(`/analytics/users/${userId}/activity`, {
        params,
      });
      return res.data;
    },
    enabled: !!userId,
  });
};

export const useGetAnalyticsFunnel = (params: AnalyticsFunnelParams) => {
  return useQuery({
    queryKey: ['analytics_funnel', params],
    queryFn: async () => {
      const res = await http.get("/analytics/funnels", { params });
      return res.data;
    },
  });
};

export const useGetTopProductsAnalysis = (params: TopProductAnalyticsParams) => {
  return useQuery({
    queryKey: ["top_products", params],
    queryFn: async () => {
      const res = await http.get("/analytics/top-products", { params });
      return res.data;
    },
  });
};

export const useGetCartAbandonAnalytics = (params: CartAbandonmentParams) => {
  return useQuery({
    queryKey: ["cart_abandonment", params],
    queryFn: async () => {
      const res = await http.get("/analytics/reports/cart-abandonment", {
        params,
      });
      return res.data;
    },
  });
};