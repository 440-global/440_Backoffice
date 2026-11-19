import http from "@/lib/http";
import { AddCustomerPayload, CustomerParams, CustomerResponse } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { qk } from "./keys";

export const useGetCustomers = (params: CustomerParams) => {
  return useQuery<CustomerResponse>({
    queryKey: [...qk.customers.all, params],
    queryFn: async () => {
      const res = await http.get("/admin/customers", {
        params: {
          page: params.page,
          limit: params.limit,
          q: params.q || undefined,
        },
      });
      return res.data;
    },
  });
};

export type AddCustomerResponse = {
  success: boolean;
  data: { customer: { id: number; name: string; email: string }; welcomeEmailSent: boolean };
};

/** The backend wants an Idempotency-Key on this write; lib/http adds one when the caller does not. */
export const useAddCustomer = () =>
  useAdminMutation<AddCustomerResponse, AddCustomerPayload>({
    mutationFn: async (body) => {
      const res = await http.post<AddCustomerResponse>("/admin/customers", body);
      return res.data;
    },
    invalidate: [qk.customers.all],
    silentError: true,
  });

export const useSendWelcomeEmail = () =>
  useAdminMutation<unknown, number>({
    mutationFn: async (customerId) => http.post(`/admin/customers/${customerId}/resend-welcome`),
    invalidate: [qk.customers.all],
    successMessage: "Welcome email sent",
  });
