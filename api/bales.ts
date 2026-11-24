import { keepPreviousData, useQuery } from "@tanstack/react-query"
import http from "../lib/http"
import { BaleFilters, CreateBale, GetBaleResponse, RelistData, SingleBale, SubscriberResponse, UpdateBale } from "@/types/types";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { qk } from "./keys";
// @ts-ignore
import qs from "qs";

// export const useGetBales = () => {
//   return useQuery({
//     queryKey: ["bale"],
//     queryFn: async () => {
//       const res = await http.get("/admin/bales");
//       return res?.data?.data;
//     },
//   });
// };

export const useGetBales = (params: BaleFilters, enabled = true) => {
  return useQuery<GetBaleResponse>({
    queryKey: [...qk.bales.all, params],
    queryFn: async () => {
      const res = await http.get("/admin/bales", {
        params: {
          page: params.page,
          limit: params.limit,
          categories: params.categories,
          search: params.search || undefined,
          status: params.status || undefined,
          "priceRange[min]": params.priceRange?.min,
          "priceRange[max]": params.priceRange?.max,
        },
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: "brackets" }),
      });

      return res?.data;
    },
    select: (res) => ({
      ...res,
      data: [...res.data].sort((a, b) => b.id - a.id),
    }),
    placeholderData: keepPreviousData,
    enabled,
  });
};

export const useGetSingleBale = (id: string) => {
  return useQuery<SingleBale>({
    queryKey: qk.bales.detail(id),
    queryFn: async () => {
      const res = await http.get(`/admin/bale/${id}`);
      const bale = res?.data?.data;

      if (!bale) {
        throw new Error("Bale not found");
      }

      return bale;
    },
    enabled: !!id
  });
};

export const useCreateBale = () =>
  useAdminMutation<unknown, CreateBale>({
    mutationFn: (body) => http.post("/admin/bale", body),
    // A new pool shows in the bale list, and the product list shows whether a product has one.
    invalidate: [qk.bales.all, qk.products.all],
    successMessage: "Bale created",
    silentError: true,
  });

export const useUpdateBale = (id: number) =>
  useAdminMutation<unknown, UpdateBale>({
    mutationFn: (body) => http.put(`/admin/bale/${id}`, body),
    invalidate: [qk.bales.all],
    successMessage: "Bale updated",
    silentError: true,
  });

export const useRelistBale = () =>
  useAdminMutation<unknown, RelistData>({
    mutationFn: ({ id, body }) => http.post(`/admin/bale/${id}/restart`, body ?? {}),
    invalidate: [qk.bales.all],
    successMessage: "Bale relisted",
  });

export const useGetBaleSubscribers = (baleId: string) => {
  return useQuery<SubscriberResponse>({
    queryKey: ["subscribers", baleId],
    queryFn: async () => {
      const res = await http.get(`/admin/bales/${baleId}/subscribers`);
      return res?.data;
    },
    enabled: !!baleId,
  });
};