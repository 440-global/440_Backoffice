import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import http from "../lib/http"
import { AddSupplierForm } from "@/types/types";

export const useGetSuppliers = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["supplier"],
    queryFn: async () => {
      const res = await http.get("/admin/suppliers");
      return res?.data?.data?.suppliers;
    },
    enabled: options?.enabled ?? true,
  });
};

export const useGetSupplier = (id: number) => {
  return useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const res = await http.get(`/admin/supplier/${id}`);
      return res?.data?.data;
    },
    enabled: !!id
  });
}

export const useCreateSupplier = () => {
  return useMutation({
    mutationFn: (body: AddSupplierForm) => {
      return http.post('/admin/supplier', body);
    },
  });
}