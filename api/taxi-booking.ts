import http from "@/lib/http";
import {
  SingleTaxiBooking,
  TaxiBookingParams,
  TaxiBookingResponse,
} from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetTaxiBookings = (params: TaxiBookingParams) => {
  return useQuery<TaxiBookingResponse>({
    queryKey: ["taxi-booking", params],
    queryFn: async () => {
      const res = await http.get("/admin/taxi-booking/requests", { params });
      return res?.data;
    },
  });
};

export const useGetTaxiBooking = (id: number) => {
  return useQuery<SingleTaxiBooking>({
    queryKey: ["taxi-booking", id],
    queryFn: async () => {
      const res = await http.get(`/admin/taxi-booking/requests/${id}`);
      return res?.data?.data;
    },
    enabled: !!id,
  });
};

export const useUpdateTaxiBookingStatus = () => {
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) => {
      const res = await http.post(
        `/admin/taxi-booking/requests/${id}/status`,
        body,
      );
      return res?.data;
    },
  });
};