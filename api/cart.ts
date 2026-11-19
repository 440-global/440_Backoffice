import http from "@/lib/http";
import { AdminAddToCart } from "@/types/types";
import { useMutation } from "@tanstack/react-query"

export const useAddToCart = () => {
  return useMutation({
    mutationFn: (body: AdminAddToCart) => {
      return http.post('/admin/customer-cart', body);
    },
  });
};