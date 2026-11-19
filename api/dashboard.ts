import { useQuery } from "@tanstack/react-query";
import http from "../lib/http";
import type {
  AdminDashboardRecent,
  AdminDashboardSummary,
  DashboardRecentParams,
  DashboardSummaryParams,
} from "@/types/types";

function unwrapData<T>(payload: unknown): T | undefined {
  if (payload == null) return undefined;
  if (typeof payload !== "object") return payload as T;
  const root = payload as Record<string, unknown>;
  if ("data" in root && root.data !== undefined) return unwrapData<T>(root.data);
  return root as T;
}

export const useGetDashboardSummary = (params?: DashboardSummaryParams) => {
  return useQuery({
    queryKey: ["dashboard", "summary", params],
    queryFn: async () => {
      const res = await http.get("/admin/dashboard/summary", { params });
      return unwrapData<AdminDashboardSummary>(res.data);
    },
  });
};

export const useGetDashboardRecent = (params?: DashboardRecentParams) => {
  return useQuery({
    queryKey: ["dashboard", "recent", params],
    queryFn: async () => {
      const res = await http.get("/admin/dashboard/recent", { params });
      const data = unwrapData<AdminDashboardRecent>(res.data);
      return data ?? { items: [] };
    },
  });
};
