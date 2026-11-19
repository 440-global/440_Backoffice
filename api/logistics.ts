import http from "@/lib/http";
import { LogisticsResponse, LogisticStatus, ServiceRequestFilters, SingleLogisticsRow } from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const emptyToNull = <T>(value: T | "") => (value === "" ? null : value);

export const useGetLogisticRequests = (params: ServiceRequestFilters) => {
  return useQuery<LogisticsResponse>({
    queryKey: ['logistics', params],
    queryFn: async () => {
      const res = await http.get("/admin/service-orders", {
        params: {
          page: params.page,
          limit: params.limit,
          serviceType: params.serviceType,
          paymentOption: emptyToNull(params.paymentOption),
          paymentStatus: emptyToNull(params.paymentStatus),
          status: emptyToNull(params.status),
        },
      });
      return res.data.data;
    },
    enabled: true
  });
};

export const useGetSingleLogisticOrder = (orderId: string) => {
  return useQuery<SingleLogisticsRow>({
    queryKey: ['logistics', orderId],
    queryFn: async () => {
      const res = await http.get(`/admin/service-orders/${orderId}`);
      return res.data.data
    },
    enabled: !!orderId,
  });
};

export const useUpdateSingleLogisticOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: LogisticStatus;
    }) => {
      return await http.patch(`/admin/service-orders/${orderId}/status`, {status});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistics"] });
    },
  });
};