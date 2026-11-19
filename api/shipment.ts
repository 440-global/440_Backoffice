import http from "@/lib/http";
import {
  AddShipmentEventPayload,
  AddShipmentPayload,
  EditShipmentPayload,
  ShipmentDetails,
  ShipmentEventUpdatePayload,
  ShipmentEventVoidPayload,
  ShipmentParams,
  ShipmentResponse,
  UpdateShipmentPayload,
} from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { qk } from "./keys";

type WithKey<T> = T & { idempotencyKey: string };

export type AddShipmentResponse = {
  success: boolean;
  data: { shipment: { id: number }; warnings?: string[] };
};

export const useGetShipments = (params: ShipmentParams) => {
  return useQuery<ShipmentResponse>({
    queryKey: [...qk.shipments.all, params],
    queryFn: async () => {
      const res = await http.get("/admin/shipments", {
        params: {
          page: params.page,
          limit: params.limit,
          status: params.status || undefined,
          mode: params.mode || undefined,
          stage: params.stage || undefined,
          delayed: params.delayed || undefined,
          provider: params.provider || undefined,
          carrier: params.carrier || undefined,
          containerNumber: params.containerNumber || undefined,
          trackingNumber: params.trackingNumber || undefined,
          orderId: params.orderId || undefined,
          orderReference: params.orderReference || undefined,
          etaFrom: params.etaFrom || undefined,
          etaTo: params.etaTo || undefined,
          createdFrom: params.createdFrom || undefined,
          createdTo: params.createdTo || undefined,
          search: params.search || undefined,
          sortBy: params.sortBy || undefined,
          sortOrder: params.sortOrder || undefined,
        },
      });
      return res?.data;
    },
    // Keep the old page on screen while the next one loads instead of flashing a spinner.
    placeholderData: (previous) => previous,
  });
};

export const useGetShipment = (shipmentId: number) => {
  return useQuery<ShipmentDetails>({
    queryKey: qk.shipments.detail(shipmentId),
    queryFn: async () => {
      const res = await http.get(`/admin/shipments/${shipmentId}`);
      return res?.data.data;
    },
    enabled: !!shipmentId,
  });
};

/** Every shipment write changes the list, the open shipment, and the orders linked to it. */
const shipmentKeys = [qk.shipments.all, qk.orders.all];

export const useUpdateShipment = (shipmentId: number) =>
  useAdminMutation<unknown, EditShipmentPayload>({
    mutationFn: async (body) => http.patch(`/admin/shipments/${shipmentId}`, body),
    invalidate: shipmentKeys,
    successMessage: "Shipment updated",
    silentError: true,
  });

export const useUpdateShipmentStatus = (shipmentId: number) =>
  useAdminMutation<unknown, WithKey<{ body: UpdateShipmentPayload }>>({
    mutationFn: async ({ body, idempotencyKey }) =>
      http.patch(`/admin/shipments/${shipmentId}/status`, body, { headers: { "Idempotency-Key": idempotencyKey } }),
    invalidate: shipmentKeys,
    successMessage: "Shipment status updated",
    silentError: true,
  });

export const useAddShipment = () =>
  useAdminMutation<AddShipmentResponse, AddShipmentPayload>({
    mutationFn: async (shipmentData) => {
      const res = await http.post<AddShipmentResponse>("/admin/shipments", shipmentData);
      return res.data;
    },
    invalidate: shipmentKeys,
    successMessage: "Shipment created",
    silentError: true,
  });

export const useAddShipmentEvent = (shipmentId: number) =>
  useAdminMutation<unknown, WithKey<{ body: AddShipmentEventPayload }>>({
    mutationFn: async ({ body, idempotencyKey }) =>
      http.post(`/admin/shipments/${shipmentId}/events`, body, { headers: { "Idempotency-Key": idempotencyKey } }),
    invalidate: shipmentKeys,
    successMessage: "Update added to the shipment",
    silentError: true,
  });

export const useVoidShipmentEvent = (shipmentId: number) =>
  useAdminMutation<unknown, WithKey<{ eventId: number; body: ShipmentEventVoidPayload }>>({
    mutationFn: async ({ eventId, body, idempotencyKey }) =>
      http.post(`/admin/shipments/${shipmentId}/events/${eventId}/void`, body, {
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    invalidate: shipmentKeys,
    successMessage: "Update voided",
    silentError: true,
  });

export const useUpdateShipmentEvent = (shipmentId: number) =>
  useAdminMutation<unknown, { eventId: number; body: ShipmentEventUpdatePayload }>({
    mutationFn: async ({ eventId, body }) =>
      http.patch(`/admin/shipments/${shipmentId}/events/${eventId}`, body),
    invalidate: shipmentKeys,
    successMessage: "Update updated",
    silentError: true,
  });

export const useAddOrdersToShipment = (shipmentId: number) =>
  useAdminMutation<unknown, { orderIds: number[] }>({
    mutationFn: async ({ orderIds }) =>
      http.post(`/admin/shipments/${shipmentId}/orders`, { orderIds }),
    invalidate: shipmentKeys,
    successMessage: "Orders added to shipment",
    silentError: true,
  });

export const useDeleteShipmentOrders = (shipmentId: number) =>
  useAdminMutation<unknown, { orderIds: number[] }>({
    mutationFn: async ({ orderIds }) =>
      http.delete(`/admin/shipments/${shipmentId}/orders`, { data: { orderIds } }),
    invalidate: shipmentKeys,
    successMessage: "Orders removed from shipment",
    silentError: true,
  });