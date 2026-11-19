import http from "@/lib/http";
import {
  GetLibrariesResponse,
  LibraryParams,
  LibraryPayload,
  SingleLibrary,
} from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetLibraries = (params: LibraryParams) => {
  return useQuery<GetLibrariesResponse>({
    queryKey: ["libraries", params],
    queryFn: async () => {
      const res = await http.get("/admin/libraries", { params });
      return res.data;
    },
  });
};

export const useGetLibrary = (id: number) => {
  return useQuery<SingleLibrary>({
    queryKey: ["libraries", id],
    queryFn: async () => {
      const res = await http.get(`/admin/libraries/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateLibrary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LibraryPayload) => {
      return http.post(`/admin/libraries`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
    },
  });
};

export const useUpdateLibrary = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LibraryPayload) => {
      return http.put(`/admin/libraries/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
    },
  });
};

export const useDeleteLibrary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return http.delete(`/admin/libraries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
    },
  });
};