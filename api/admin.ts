import { useAdminMutation } from "@/hooks/use-admin-mutation";
import http from "@/lib/http"
import { AddAdminPayload, AddRolePayload, Admin, AdminParams, AdminProfileDetails, Admins, EditRolePayload, PatchAdminPayload, PermissionGroup, Role } from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query"
import { qk } from "./keys";

export const useGetAdminProfile = () => {
  return useQuery<AdminProfileDetails>({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const response = await http.get(`/admin/me`);
      return response.data?.data;
    },
  });
};

export const useGetAllAdmins = (params: AdminParams) => {
  return useQuery<Admins>({
    queryKey: ['admins', params],
    queryFn: async () => {
      const response = await http.get(`/admin/admins`, { params });
      return response.data;
    },
    select: (res) => ({
      ...res,
      data: [...res.data].sort((a, b) => a.id - b.id),
    }),
  });
};

export const useGetAdmin = (adminId: number) => {
  return useQuery<Admin>({
    queryKey: ['admins', adminId],
    queryFn: async () => {
      const response = await http.get(`/admin/admins/${adminId}`);
      return response.data.data;
    },
    enabled: !!adminId
  });
};

export const useAddAdmin = () => 
  useAdminMutation<unknown, { body: AddAdminPayload }>({
    mutationFn: async ({ body }) => 
      await http.post(`/admin/admins`, body),
    invalidate: [qk.admins.all],
    successMessage: "Admin added",
    silentError: false,
  });

export const useEditAdmin = (adminId: number) => 
  useAdminMutation<unknown, { body: PatchAdminPayload }>({
    mutationFn: async ({ body }) => 
      await http.patch(`/admin/admins/${adminId}`, body),
    invalidate: [qk.admins.all, ["admins", adminId]],
    successMessage: "Admin updated",
    silentError: false,
  });

export const useDeleteAdmin = () =>
  useAdminMutation<unknown, number>({
    mutationFn: async (adminId) =>
      await http.delete(`/admin/admins/${adminId}`),
    invalidate: [qk.admins.all],
    successMessage: "Admin deleted",
  });

export const useGetPermissions = () => {
  return useQuery<PermissionGroup[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await http.get(`/admin/permissions`);
      return response.data.data;
    },
  });
};

export const useGetRoles = () => {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await http.get(`/admin/roles`);
      return response.data.data;
    },
    select: (items) => [...items].sort((a, b) => a.id - b.id),
  });
};

export const useGetRole = (roleId: number) => {
  return useQuery<Role>({
    queryKey: ['roles', roleId],
    queryFn: async () => {
      const response = await http.get(`/admin/roles/${roleId}`);
      return response.data.data;
    },
    enabled: !!roleId
  });
};

export const useAddRole = () =>
  useAdminMutation<unknown, { body: AddRolePayload }>({
    mutationFn: async ({ body }) => 
      await http.post(`/admin/roles`, body),
    invalidate: [qk.roles.all],
    successMessage: "Role added",
    silentError: false,
  });

export const useEditRole = (roleId: number) => 
  useAdminMutation<unknown, { body: EditRolePayload }>({
    mutationFn: async ({ body }) => 
      await http.patch(`/admin/roles/${roleId}`, body),
    invalidate: [qk.roles.all, ["roles", roleId]],
    successMessage: "Role updated",
    silentError: false,
  });

export const useDeleteRole = () => 
  useAdminMutation<unknown, number>({
    mutationFn: async (roleId) => 
      await http.delete(`/admin/roles/${roleId}`),
    invalidate: [qk.roles.all],
    successMessage: "Role deleted",
    silentError: false,
  });