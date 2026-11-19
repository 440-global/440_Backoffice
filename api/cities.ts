import http from "@/lib/http";
import { AddCityPayload, CityResponse, ImportCity, SingleCity } from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetCities = () => {
  return useQuery<CityResponse>({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await http.get('/admin/cities');
      return res?.data;
    },
  });
};

export const useGetCity = (id: number) => {
  return useQuery<SingleCity>({
    queryKey: ['cities', id],
    queryFn: async () => {
      const res = await http.get(`/admin/city/${id}`);
      return res?.data?.data;
    },
    enabled: !!id,
  });
};

export const useUpdateCity = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AddCityPayload) => {
      return http.put(`/admin/city/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    },
  });
};

export const useDeleteCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return http.delete(`/admin/city/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    },
  });
};

export const useAddCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddCityPayload) => {
      return http.post(`/admin/city`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    },
  });
};

export const useImportCities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ImportCity[]) => {
      return http.post(`/admin/cities/import`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    },
  });
}