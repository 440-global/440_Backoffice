import http from "@/lib/http";
import { ChangePasswordFormTypes, LoginFormTypes } from "@/types/types";
import { useMutation } from "@tanstack/react-query";

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (body: LoginFormTypes) => {
      return http.post("/admin/login", body);
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (body: { email: string }) => {
      return http.post("/admin/reset-password", body);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (body: ChangePasswordFormTypes) => {
      return http.post("/admin/change-password", body);
    },
  });
}