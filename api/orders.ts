import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import http from "../lib/http";
import type {
  AdminOrderDetail,
  AdminOrdersListParams,
  AdminOrdersListResult,
  AdminOrderListItem,
} from "@/types/types";

function normalizeListPayload(
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number
): AdminOrdersListResult {
  if (!payload || typeof payload !== "object") {
    return {
      rows: [],
      total: 0,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages: 1,
    };
  }

  const p = payload as Record<string, unknown>;
  const rawRows = p.rows;
  const rows: AdminOrderListItem[] = Array.isArray(rawRows)
    ? (rawRows as AdminOrderListItem[])
    : Array.isArray(p.data)
      ? (p.data as AdminOrderListItem[])
      : [];

  const total =
    typeof p.total === "number"
      ? p.total
      : typeof p.count === "number"
        ? p.count
        : rows.length;
  const page = typeof p.page === "number" ? p.page : fallbackPage;
  const limit = typeof p.limit === "number" ? p.limit : fallbackLimit;
  const totalPages =
    typeof p.totalPages === "number" && p.totalPages >= 1
      ? p.totalPages
      : Math.max(1, Math.ceil(total / (limit || 1)));

  return { rows, total, page, limit, totalPages };
}

export const useGetAdminOrders = (params?: AdminOrdersListParams) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  return useQuery({
    queryKey: ["admin", "orders", params],
    queryFn: async () => {
      const res = await http.get("/admin/orders", { params });
      return normalizeListPayload(res?.data?.data, page, limit);
    },
  });
};

export const useGetAdminOrder = (orderId: number | null) => {
  return useQuery({
    queryKey: ["admin", "orders", orderId],
    queryFn: async () => {
      const res = await http.get(`/admin/orders/${orderId}`);
      return res?.data?.data as AdminOrderDetail;
    },
    enabled: !!orderId && orderId > 0,
  });
};

export const useUpdateOrderDate = (orderId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "orders", orderId, "update-date"],
    mutationFn: async (payload: { placedAt: string }) => {
      const res = await http.patch(`/admin/orders/${orderId}/dates`, payload);
      return res?.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", orderId] });
    }
  });
};

export const useCancelOrder = (orderId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "orders", orderId, "cancel"],
    mutationFn: async (payload: { reason: string, notifyCustomer: boolean }) => {
      const res = await http.post(`/admin/orders/${orderId}/cancel`, payload);
      return res?.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", orderId] });
    }
  });
};

export const useCompleteOrder = (orderId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "orders", orderId, "complete"],
    mutationFn: async () => {
      const res = await http.post(`/admin/orders/${orderId}/complete`);
      return res?.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", orderId] });
    },
  });
};