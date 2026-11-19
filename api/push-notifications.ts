import { useMutation, useQuery } from "@tanstack/react-query";
import http from "@/lib/http";
import type { FinanceCustomer } from "@/types/types";

/**
 * Admin push notifications — align these paths with your API.
 * Search: GET `/admin/push-notifications/recipients/search?q=&limit=`
 * Send: POST `/admin/push-notifications` body {@link AdminSendPushNotificationBody}
 */
const SEARCH_PATH = "/admin/push-notifications/recipients/search";
const SEND_PATH = "/admin/push-notifications";

export type AdminSendPushNotificationBody = {
  title: string;
  subtitle: string;
  message: string;
  /** When true, `customerIds` is ignored. */
  broadcastToAllCustomers: boolean;
  /** Required when `broadcastToAllCustomers` is false. */
  customerIds?: number[];
};

function unwrapData<T>(res: { data?: { data?: T } | T }): T {
  const node = res?.data;
  if (node && typeof node === "object" && "data" in node) {
    return (node as { data: T }).data;
  }
  return node as T;
}

function parseCustomerSearchPayload(payload: unknown): FinanceCustomer[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload as FinanceCustomer[];
  if (typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  const candidates = [p.customers, p.rows, p.users, p.recipients, p.data];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as FinanceCustomer[];
  }
  return [];
}

function normalizeCustomer(raw: Record<string, unknown>): FinanceCustomer | null {
  const id = raw.id ?? raw.customerId ?? raw.userId;
  const numId = typeof id === "number" ? id : Number(id);
  if (!Number.isFinite(numId)) return null;
  const name =
    (typeof raw.name === "string" && raw.name) ||
    (typeof raw.fullName === "string" && raw.fullName) ||
    String(raw.email ?? raw.phone ?? `Customer #${numId}`);
  return {
    id: numId,
    name,
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    shop_name: typeof raw.shop_name === "string" ? raw.shop_name : typeof raw.shopName === "string" ? raw.shopName : "",
  };
}

export function useAdminPushNotificationRecipientSearch(q: string, limit = 20) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: ["push-notifications", "recipient-search", trimmed, limit],
    queryFn: async () => {
      const res = await http.get(SEARCH_PATH, {
        params: { q: trimmed, limit },
      });
      const raw = unwrapData<unknown>(res);
      const list = parseCustomerSearchPayload(raw);
      if (list.length > 0) return list;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const inner = (raw as Record<string, unknown>).data;
        if (Array.isArray(inner)) {
          return inner
            .map((item) =>
              item && typeof item === "object"
                ? normalizeCustomer(item as Record<string, unknown>)
                : null
            )
            .filter((x): x is FinanceCustomer => x != null);
        }
      }
      return [];
    },
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });
}

export function useSendAdminPushNotification() {
  return useMutation({
    mutationFn: async (body: AdminSendPushNotificationBody) => {
      const res = await http.post(SEND_PATH, body);
      return unwrapData<unknown>(res);
    },
  });
}
