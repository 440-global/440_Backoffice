import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import http from "../lib/http"
import { AddCategoryForm, AddProductForm, EditProductForm, ProductFilters, ProductResponse, ProductStatsByCreator, ProductPurchaseOptions, ProductStatsParams, SingleProduct, Type } from "@/types/types";
import { qk } from "./keys";
import { useAdminMutation } from "@/hooks/use-admin-mutation";

type AddSubCategoryPayload = {
  body: AddCategoryForm[];
  categoryId: number;
};

type EditProduct = {
  body: EditProductForm,
  id: number
}

export const useGetCategories = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["category"],
    queryFn: async () => {
      const res = await http.get("/admin/categories");
      return res?.data?.data;
    },
    enabled: options?.enabled ?? true,
  });
};

export const useGetCategory = (id: number) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const res = await http.get(`/admin/category/${id}`);
      return res?.data?.data;
    },
    enabled: !!id
  });
}

export const useAddCategory = () => {
  return useMutation({
    mutationFn: (body: AddCategoryForm[]) => {
      return http.post('/admin/category', body);
    }
  });
}

export const useUpdateCategory = (id: number) => {
  return useMutation({
    mutationFn: (body: AddCategoryForm[]) => {
      return http.put(`/admin/category/${id}`, body);
    }
  });
};

export const useGetSubCategories = () => {
  return useQuery({
    queryKey: ["sub-category"],
    queryFn: async () => {
      const res = await http.get("/admin/sub-categories");
      return res?.data?.data;
    }
  });
};

export const useGetSubCategory = (id: number) => {
  return useQuery({
    queryKey: qk.subCategory.byCategory(id),
    queryFn: async () => {
      const res = await http.get(`/admin/sub-categories-by-categoryId/${id}`);
      return res?.data?.data;
    },
    enabled: !!id
  });
};

export const useGetSubCat = (id: number) => {
  return useQuery({
    queryKey: qk.subCategory.one(id),
    queryFn: async () => {
      const res = await http.get(`/admin/sub-category/${id}`);
      return res?.data?.data;
    },
    enabled: !!id
  });
};

export const useUpdateSubCat = (id: number) => {
  return useMutation({
    mutationFn: (body: AddCategoryForm) => {
      return http.put(`/admin/sub-category/${id}`, body);
    },
  });
};

export const useAddSubCategory = () => {
  return useMutation({
    mutationFn: ({ body, categoryId }: AddSubCategoryPayload) => {
      return http.post(`/admin/sub-category?categoryId=${categoryId}`, body);
    },
  });
};

export const useGetProductTypes = (id: number) => {
  return useQuery({
    queryKey: ["product-types", id],
    queryFn: async () => {
      const res = await http.get(`/admin/product-types?subCategoryId=${id}`);
      return res?.data?.data;
    },
    enabled: !!id
  });
};

export const useCreateType = () => {
  return useMutation({
    mutationFn: (body: Type) => {
      return http.post('/admin/product-type', body);
    },
  });
};

export const useUpdateType = (id: number) => {
  return useMutation({
    mutationFn: (body: Type) => {
      return http.put(`/admin/product-type/${id}`, body);
    },
  });
};

export const useDeleteType = (id: number) => {
  return useMutation({
    mutationFn: () => {
      return http.delete(`/admin/product-type/${id}`);
    },
  });
};

/** A new product shows up in the full list, the supplier's list and the stats. */
const productListKeys = [qk.products.all, ["product-stats"]];

export const useCreateProduct = () =>
  useAdminMutation<{ data: { data: { product: { id: number; name: string } } } }, AddProductForm>({
    mutationFn: (body) => http.post("/admin/product", body),
    invalidate: productListKeys,
    silentError: true,
  });

export const useCreateTelegramProduct = () =>
  useAdminMutation<{ data: { data: { product: { id: number; name: string } } } }, AddProductForm>({
    mutationFn: (body) => http.post("/admin/product/telegram", body),
    invalidate: productListKeys,
    silentError: true,
  });

export const useEditProduct = () =>
  useAdminMutation<unknown, EditProduct>({
    mutationFn: ({ body, id }) => http.put(`/admin/product/${id}`, body),
    // The list, the supplier's list and this product's own page all show what was just changed.
    invalidate: (_data, { id }) => [qk.products.all, qk.products.detail(id)],
    successMessage: "Product updated",
    silentError: true,
  });

export type SavedPurchaseOptions = {
  productId: number;
  /** SAVED: set by an admin. DERIVED: worked out from the product's price and pool until options are saved. */
  source: "SAVED" | "DERIVED";
  options: (ProductPurchaseOptions & { version: number | null })[];
};

export const useGetPurchaseOptions = (productId: number, enabled = true) =>
  useQuery<SavedPurchaseOptions>({
    queryKey: qk.products.purchaseOptions(productId),
    queryFn: async () => (await http.get(`/admin/products/${productId}/purchase-options`)).data.data,
    enabled: enabled && !!productId,
  });

export const useSavePurchaseOptions = () =>
  useAdminMutation<unknown, { productId: number; options: ProductPurchaseOptions[]; expectedVersions?: Partial<Record<"DIRECT" | "POOL", number>> }>({
    mutationFn: ({ productId, ...body }) => http.put(`/admin/products/${productId}/purchase-options`, body),
    invalidate: (_data, { productId }) => [qk.products.purchaseOptions(productId), qk.products.detail(productId), qk.products.all],
    successMessage: "Purchase options saved",
  });

export const useDeleteProduct = () =>
  useAdminMutation<unknown, string>({
    mutationFn: (id) => http.delete(`/admin/product/${id}`),
    invalidate: productListKeys,
    successMessage: "Product deleted",
  });

export const useGetSingleProduct = (id: number) => {
  return useQuery<SingleProduct>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await http.get(`/admin/product/${id}`);
      return res?.data?.data;
    },
    enabled: !!id
  });
};

function normalizeProductsList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.rows)) return r.rows;
    if (Array.isArray(r.products)) return r.products;
    if (Array.isArray(r.data)) return r.data;
  }
  return [];
}

/** GET /admin/products — all products (omit supplierId). Fetches when enabled (e.g. products page without ?supplierId). */
export const useGetAllProducts = (params: ProductFilters, enabled: boolean) => {
  return useQuery<ProductResponse>({
    queryKey: ["products", "all", params],
    queryFn: async () => {
      const res = await http.get("/admin/products", {
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search || undefined,
          category: params.category || undefined,
          productTypeId: params.productTypeId || undefined,
          supplierId: params.supplierId || undefined,
          status: params.status || undefined,
          minPrice: params.minPrice || undefined,
          maxPrice: params.maxPrice || undefined,
          start_date: params.start_date || undefined,
          end_date: params.end_date || undefined,
          sortBy: params.sortBy || undefined,
          sortOrder: params.sortOrder || undefined,
        },
      });
      return res?.data;
    },
    enabled: enabled,
  });
};

export const useGetProductBySupplier = (supplierId: number | null) => {
  return useQuery<ProductResponse>({
    queryKey: ["products", "supplier", supplierId],
    queryFn: async () => {
      const res = await http.get(`/admin/products?supplierId=${supplierId}`);
      return res?.data;
    },
    enabled: supplierId !== null,
  });
};

export const useGetProductStatsByCreator = (params?: ProductStatsParams) => {
  return useQuery({
    queryKey: ["product-stats", "by-creator", params],
    queryFn: async () => {
      const res = await http.get("/admin/products/stats/by-creator", { params });
      return res?.data?.data as ProductStatsByCreator;
    },
  });
};