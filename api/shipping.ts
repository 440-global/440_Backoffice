import { useQuery } from "@tanstack/react-query";
import http from "../lib/http";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { qk } from "./keys";
import type {
  AddOrderShippingChargesPayload,
  ChargeWriteResponse,
  MarkPaidChargePayload,
  OrderShippingResponse,
  ReasonPayload,
  ShippingResponse,
  ShippingSettingsPayload,
} from "../types/shipping";

type WithKey<T> = T & { idempotencyKey: string };

export const useGetShippingSettings = () => {
  return useQuery<ShippingResponse>({
    queryKey: qk.shippingSettings.all,
    queryFn: async () => {
      const res = await http.get("/admin/shipping/settings");
      return res.data;
    },
  });
};

export const usePutShippingSettings = () =>
  useAdminMutation<unknown, ShippingSettingsPayload>({
    mutationFn: async (body) => http.put("/admin/shipping/settings", body),
    invalidate: [qk.shippingSettings.all],
    successMessage: "Shipping settings saved",
  });

export const useGetOrderShippingCharges = (orderId: number | undefined) => {
  return useQuery<OrderShippingResponse>({
    queryKey: orderId != null ? qk.shippingCharges.forOrder(orderId) : ["shipping-charges", "none"],
    queryFn: async () => {
      if (orderId == null) throw new Error("orderId is required");
      const res = await http.get(`/admin/orders/${orderId}/shipping-charges`);
      return res.data;
    },
    enabled: orderId != null,
  });
};

/** A charge write changes the order's own panel and the order list too (payment state, amounts). */
const chargeKeys = (orderId: number) => [qk.shippingCharges.forOrder(orderId), qk.orders.all];

export const useAddOrderShippingCharges = (orderId: number) =>
  useAdminMutation<ChargeWriteResponse, WithKey<{ payload: AddOrderShippingChargesPayload }>>({
    mutationFn: async ({ payload, idempotencyKey }) => {
      const res = await http.post<ChargeWriteResponse>(`/admin/orders/${orderId}/shipping-charges`, payload, {
        headers: { "Idempotency-Key": idempotencyKey },
      });
      return res.data;
    },
    invalidate: () => chargeKeys(orderId),
    successMessage: "Shipping charge added",
    silentError: true,
  });

export const useEditOrderShippingCharges = (orderId: number) =>
  useAdminMutation<ChargeWriteResponse, WithKey<{ chargeId: number; payload: AddOrderShippingChargesPayload }>>({
    mutationFn: async ({ chargeId, payload, idempotencyKey }) => {
      const res = await http.patch<ChargeWriteResponse>(
        `/admin/orders/${orderId}/shipping-charges/${chargeId}`,
        payload,
        { headers: { "Idempotency-Key": idempotencyKey } },
      );
      return res.data;
    },
    invalidate: () => chargeKeys(orderId),
    successMessage: "Shipping charge updated",
    silentError: true,
  });

export const useVoidOrderShippingCharge = (orderId: number) =>
  useAdminMutation<unknown, { chargeId: number; payload: ReasonPayload }>({
    mutationFn: async ({ chargeId, payload }) =>
      http.post(`/admin/orders/${orderId}/shipping-charges/${chargeId}/void`, payload),
    invalidate: () => chargeKeys(orderId),
    successMessage: "Shipping charge voided",
    silentError: true,
  });

export const useMarkPaidOrderShippingCharge = (orderId: number) =>
  useAdminMutation<unknown, WithKey<{ chargeId: number; payload: MarkPaidChargePayload }>>({
    mutationFn: async ({ chargeId, payload, idempotencyKey }) =>
      http.post(`/admin/orders/${orderId}/shipping-charges/${chargeId}/mark-paid`, payload, {
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    invalidate: () => chargeKeys(orderId),
    successMessage: "Charge marked as paid",
    silentError: true,
  });

export const useReverseShippingPayment = (orderId: number) =>
  useAdminMutation<unknown, { chargeId: number; payload: ReasonPayload }>({
    mutationFn: async ({ chargeId, payload }) =>
      http.post(`/admin/orders/${orderId}/shipping-charges/${chargeId}/reverse-payment`, payload),
    invalidate: () => chargeKeys(orderId),
    successMessage: "Payment reversed",
    silentError: true,
  });
