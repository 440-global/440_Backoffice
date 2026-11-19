import http from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { qk } from "./keys";
import type { AddCustomerOrderPayload, OfflinePaymentPayload } from "@/types/types";

type WithKey<T> = T & { idempotencyKey: string };

/** A payment or a new order changes the order list and detail, and the customer's row. */
const orderKeys = [qk.orders.all, qk.customers.all];

export const useAddOfflineOrder = () =>
  useAdminMutation<unknown, WithKey<{ body: AddCustomerOrderPayload }>>({
    mutationFn: async ({ body, idempotencyKey }) =>
      http.post("admin/orders/offline", body, { headers: { "Idempotency-Key": idempotencyKey } }),
    invalidate: orderKeys,
    successMessage: "Order created",
    silentError: true,
  });

export const useGetOfflinePayments = (orderId: number) => {
  return useQuery({
    queryKey: ["offline-payments", orderId],
    queryFn: async () => {
      const res = await http.get(`/admin/orders/${orderId}/payments`);
      return res.data.data;
    },
  });
};

export const useCreateOfflinePayment = (orderId: number) =>
  useAdminMutation<unknown, WithKey<{ body: OfflinePaymentPayload }>>({
    mutationFn: async ({ body, idempotencyKey }) =>
      http.post(`/admin/orders/${orderId}/payments`, body, { headers: { "Idempotency-Key": idempotencyKey } }),
    // The order panel reads its payments and amounts from the order itself, not from the payments list.
    invalidate: [qk.orders.all, ["offline-payments", orderId]],
    successMessage: "Payment recorded",
    silentError: true,
  });

export const useVoidOfflinePayment = (orderId: number) =>
  useAdminMutation<unknown, WithKey<{ paymentId: number; reason: string }>>({
    mutationFn: async ({ paymentId, reason, idempotencyKey }) =>
      http.post(
        `/admin/orders/${orderId}/payments/${paymentId}/void`,
        { reason },
        { headers: { "Idempotency-Key": idempotencyKey } },
      ),
    invalidate: [qk.orders.all, ["offline-payments", orderId]],
    successMessage: "Payment voided",
    silentError: true,
  });

export const useUpdateOfflinePaymentDate = (orderId: number) =>
  useAdminMutation<unknown, { paymentId: number; body: { paidAt: string } }>({
    mutationFn: async ({ paymentId, body }) => 
      http.patch(`/admin/orders/${orderId}/payments/${paymentId}`, body),
    invalidate: [qk.orders.all, ["offline-payments", orderId]],
    successMessage: "Payment date updated",
    silentError: true,
  });