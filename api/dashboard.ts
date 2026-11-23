import { useQuery } from "@tanstack/react-query";
import http from "../lib/http";
import type {
  AdminDashboardRecent,
  AdminDashboardSummary,
  DashboardRecentParams,
  DashboardSummaryParams,
} from "@/types/types";
import { useCan } from "@/hooks/use-can";
import { useAuth } from "@/hooks/use-auth";

function unwrapData<T>(payload: unknown): T | undefined {
  if (payload == null) return undefined;
  if (typeof payload !== "object") return payload as T;
  const root = payload as Record<string, unknown>;
  if ("data" in root && root.data !== undefined) return unwrapData<T>(root.data);
  return root as T;
}

export const useGetDashboardSummary = (params?: DashboardSummaryParams) => {
  const canViewAnalytics = useCan("analytics:view");
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "summary", params],
    queryFn: async () => {
      const res = await http.get("/admin/dashboard/summary", { params });
      return unwrapData<AdminDashboardSummary>(res.data);
    },
    enabled: !!user?.role && canViewAnalytics,
  });
};

export const useGetDashboardRecent = (params?: DashboardRecentParams) => {
  const canViewAnalytics = useCan("analytics:view");
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "recent", params],
    queryFn: async () => {
      const res = await http.get("/admin/dashboard/recent", { params });
      const data = unwrapData<AdminDashboardRecent>(res.data);
      return data ?? { items: [] };
    },
    enabled: !!user?.role && canViewAnalytics,
  });
};
