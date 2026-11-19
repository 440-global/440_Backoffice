import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import http from "../lib/http";
import type {
  AdminApproveRfqBody,
  AdminInitiateRfqPaymentBody,
  AdminManualRfqPaymentConvertBody,
  AdminRfqActivity,
  AdminRfqCommentBody,
  AdminRfqCommentResponse,
  AdminRfqListParams,
  AdminRfqListResult,
  AdminRfqOrder,
  AdminRfqSummary,
  AdminSetRfqQuoteBody,
  AdminUpdateRfqBody,
} from "@/types/types";

function unwrapData(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const root = payload as Record<string, unknown>;
  return (root.data as unknown) ?? payload;
}

function normalizeRfqList(
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number
): AdminRfqListResult {
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
  const rows = Array.isArray(rawRows)
    ? (rawRows as AdminRfqOrder[])
    : Array.isArray(p.data)
      ? (p.data as AdminRfqOrder[])
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
    typeof p.totalPages === "number" && p.totalPages > 0
      ? p.totalPages
      : Math.max(1, Math.ceil(total / (limit || 1)));

  return { rows, total, page, limit, totalPages };
}

export const useGetAdminRfqSummary = () => {
  return useQuery({
    queryKey: ["admin", "rfqs", "summary"],
    queryFn: async () => {
      const res = await http.get("/admin/rfqs/summary");
      return unwrapData(res?.data) as AdminRfqSummary;
    },
  });
};

export const useGetAdminRfqs = (params?: AdminRfqListParams) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  return useQuery({
    queryKey: ["admin", "rfqs", params],
    queryFn: async () => {
      const res = await http.get("/admin/rfqs", { params });
      return normalizeRfqList(unwrapData(res?.data), page, limit);
    },
  });
};

export const useGetAdminRfq = (rfqOrderId: number | null) => {
  return useQuery({
    queryKey: ["admin", "rfqs", "one", rfqOrderId],
    queryFn: async () => {
      const res = await http.get(`/admin/rfqs/${rfqOrderId}`);
      return unwrapData(res?.data) as AdminRfqOrder;
    },
    enabled: !!rfqOrderId && rfqOrderId > 0,
  });
};

export const useGetAdminRfqActivities = (rfqOrderId: number | null) => {
  return useQuery({
    queryKey: ["admin", "rfqs", "activities", rfqOrderId],
    queryFn: async () => {
      const res = await http.get(`/admin/rfqs/${rfqOrderId}/activities`);
      const payload = unwrapData(res?.data);
      if (Array.isArray(payload)) return payload as AdminRfqActivity[];
      if (!payload || typeof payload !== "object") return [];
      const p = payload as Record<string, unknown>;
      if (Array.isArray(p.rows)) return p.rows as AdminRfqActivity[];
      if (Array.isArray(p.activities)) return p.activities as AdminRfqActivity[];
      if (Array.isArray(p.auditLogs)) return p.auditLogs as AdminRfqActivity[];
      return [];
    },
    enabled: !!rfqOrderId && rfqOrderId > 0,
  });
};

function useRfqMutation<TBody>(
  key: string,
  request: (rfqOrderId: number, body: TBody) => Promise<unknown>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { rfqOrderId: number; body: TBody }) =>
      request(args.rfqOrderId, args.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "rfqs"], exact: false });
      qc.invalidateQueries({ queryKey: ["admin", "rfqs", "activities"], exact: false });
      qc.invalidateQueries({ queryKey: ["admin", "orders"], exact: false });
      qc.invalidateQueries({ queryKey: ["finance"], exact: false });
    },
  });
}

export const useSetAdminRfqQuote = () =>
  useRfqMutation("quote", async (rfqOrderId, body: AdminSetRfqQuoteBody) => {
    const res = await http.patch(`/admin/rfqs/${rfqOrderId}/quote`, body);
    return unwrapData(res?.data);
  });

export const useApproveAdminRfq = () =>
  useRfqMutation("approve", async (rfqOrderId, body: AdminApproveRfqBody) => {
    const res = await http.patch(`/admin/rfqs/${rfqOrderId}/approve`, body);
    return unwrapData(res?.data);
  });

export const useInitiateAdminRfqPayment = () =>
  useRfqMutation("initiate-payment", async (rfqOrderId, body: AdminInitiateRfqPaymentBody) => {
    const res = await http.post(`/admin/rfqs/${rfqOrderId}/initiate-payment`, body);
    return unwrapData(res?.data);
  });

export const useManualAdminRfqPaymentConvert = () =>
  useRfqMutation(
    "manual-payment-convert",
    async (rfqOrderId, body: AdminManualRfqPaymentConvertBody) => {
      const res = await http.post(`/admin/rfqs/${rfqOrderId}/manual-payment-convert`, body);
      return unwrapData(res?.data);
    }
  );

export const useConvertAdminRfq = () =>
  {
    const qc = useQueryClient();
    return useMutation({
    mutationFn: async (rfqOrderId: number) => {
      const res = await http.post(`/admin/rfqs/${rfqOrderId}/convert`);
      return unwrapData(res?.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "rfqs"], exact: false });
      qc.invalidateQueries({ queryKey: ["admin", "rfqs", "activities"], exact: false });
      qc.invalidateQueries({ queryKey: ["admin", "orders"], exact: false });
      qc.invalidateQueries({ queryKey: ["finance"], exact: false });
    },
    });
  };

export const useUpdateAdminRfq = () =>
  useRfqMutation("update", async (rfqOrderId, body: AdminUpdateRfqBody) => {
    const res = await http.patch(`/admin/rfqs/${rfqOrderId}`, body);
    return unwrapData(res?.data);
  });

export const usePostAdminRfqComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminRfqCommentBody) => {
      const res = await http.post("/admin/rfqs/comments", body);
      return unwrapData(res?.data) as AdminRfqCommentResponse;
    },
    onSuccess: (_data, body) => {
      const raw = body.rfq_id;
      const id = typeof raw === "string" ? Number.parseInt(raw, 10) : raw;
      if (Number.isFinite(id) && id > 0) {
        qc.invalidateQueries({ queryKey: ["admin", "rfqs", "activities", id] });
      }
      qc.invalidateQueries({ queryKey: ["admin", "rfqs"], exact: false });
    },
  });
};
