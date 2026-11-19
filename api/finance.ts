import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "../lib/http";
import {
  FinanceSummary,
  FinanceRecord,
  FinancePaginatedResponse,
  InstallmentsPaginatedResponse,
  CustomerStatement,
  FinanceCategory,
  FinanceStatus,
  FinanceSourceType,
  FinanceFlowDirection,
  FinanceFlowType,
  InstallmentStatus,
  ManualFinanceEntryBody,
} from "@/types/types";

type SummaryParams = {
  startDate?: string;
  endDate?: string;
  category?: FinanceCategory;
  flowDirection?: FinanceFlowDirection;
  flowType?: FinanceFlowType;
};

export const useGetFinanceSummary = (params?: SummaryParams) => {
  return useQuery({
    queryKey: ["finance", "summary", params],
    queryFn: async () => {
      const res = await http.get("/admin/finance/summary", { params });
      return res?.data?.data as FinanceSummary;
    },
  });
};

type RecordsParams = {
  category?: FinanceCategory;
  status?: FinanceStatus;
  paymentMethod?: string;
  sourceType?: FinanceSourceType;
  flowDirection?: FinanceFlowDirection;
  flowType?: FinanceFlowType;
  customerId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export const useGetFinanceRecords = (params?: RecordsParams) => {
  return useQuery({
    queryKey: ["finance", "records", params],
    queryFn: async () => {
      const res = await http.get("/admin/finance/records", { params });
      return res?.data?.data as FinancePaginatedResponse<FinanceRecord>;
    },
  });
};

export const useGetFinanceRecord = (id: number | null) => {
  return useQuery({
    queryKey: ["finance", "record", id],
    queryFn: async () => {
      const res = await http.get(`/admin/finance/records/${id}`);
      return res?.data?.data?.record as FinanceRecord;
    },
    enabled: !!id,
  });
};

type InstallmentsParams = {
  status?: InstallmentStatus;
  customerId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export const useGetInstallments = (params?: InstallmentsParams) => {
  return useQuery({
    queryKey: ["finance", "installments", params],
    queryFn: async () => {
      const res = await http.get("/admin/finance/installments", { params });
      return res?.data?.data as InstallmentsPaginatedResponse;
    },
  });
};

export const useGetOverdueInstallments = (params?: {
  customerId?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["finance", "installments", "overdue", params],
    queryFn: async () => {
      const res = await http.get("/admin/finance/installments/overdue", { params });
      return res?.data?.data as InstallmentsPaginatedResponse;
    },
  });
};

type RefundsParams = {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export const useGetRefunds = (params?: RefundsParams) => {
  return useQuery({
    queryKey: ["finance", "refunds", params],
    queryFn: async () => {
      const res = await http.get("/admin/finance/refunds", { params });
      return res?.data?.data as FinancePaginatedResponse<FinanceRecord>;
    },
  });
};

type StatementParams = {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export const useGetCustomerStatement = (
  customerId: number | null,
  params?: StatementParams
) => {
  return useQuery({
    queryKey: ["finance", "customer-statement", customerId, params],
    queryFn: async () => {
      const res = await http.get(
        `/admin/finance/customers/${customerId}/statement`,
        { params }
      );
      return res?.data?.data as CustomerStatement;
    },
    enabled: !!customerId,
  });
};

export const useCreateManualFinanceEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ManualFinanceEntryBody) => {
      const res = await http.post("/admin/finance/manual-entries", body);
      return res?.data?.data?.record as FinanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"], exact: false });
    },
  });
};
