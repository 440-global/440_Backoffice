import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import http from "@/lib/http";
import type {
  ContactPerson,
  CreateContactPersonBody,
  CreateTravelServiceBody,
  PatchContactPersonBody,
  PatchServiceOrderStatusBody,
  PatchTravelServiceBody,
  ServiceOrdersListResponse,
  TravelService,
  TravelServiceType,
} from "@/types/travel";

const QK_SERVICES = ["travel", "services"] as const;
const QK_CONTACTS = ["travel", "contact-persons"] as const;
const QK_ORDERS = ["travel", "service-orders"] as const;

type ListServicesParams = {
  type?: TravelServiceType;
  isActive?: boolean;
};

export const useTravelServices = (params?: ListServicesParams) => {
  return useQuery({
    queryKey: [...QK_SERVICES, params],
    queryFn: async () => {
      const res = await http.get("/admin/services", {
        params: {
          ...(params?.type ? { type: params.type } : {}),
          ...(params?.isActive !== undefined
            ? { isActive: String(params.isActive) }
            : {}),
        },
      });
      const raw = res?.data?.data;
      return Array.isArray(raw) ? (raw as TravelService[]) : [];
    },
  });
};

export const useTravelService = (serviceId: string | null) => {
  return useQuery({
    queryKey: [...QK_SERVICES, "one", serviceId],
    enabled: Boolean(serviceId),
    queryFn: async () => {
      const res = await http.get(`/admin/services/${serviceId}`);
      return res?.data?.data as TravelService;
    },
  });
};

export const useCreateTravelService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTravelServiceBody) => {
      const res = await http.post("/admin/services", body);
      return res?.data?.data as TravelService;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_SERVICES });
    },
  });
};

export const usePatchTravelService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serviceId,
      body,
    }: {
      serviceId: string;
      body: PatchTravelServiceBody;
    }) => {
      const res = await http.patch(`/admin/services/${serviceId}`, body);
      return res?.data?.data as TravelService;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_SERVICES });
    },
  });
};

export const usePutTravelServiceContacts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serviceId,
      contactPersonIds,
    }: {
      serviceId: string;
      contactPersonIds: string[];
    }) => {
      const res = await http.put(`/admin/services/${serviceId}/contacts`, {
        contactPersonIds,
      });
      return res?.data?.data as TravelService;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_SERVICES });
    },
  });
};

export const useContactPersons = () => {
  return useQuery({
    queryKey: QK_CONTACTS,
    queryFn: async () => {
      const res = await http.get("/admin/contact-persons");
      const raw = res?.data?.data;
      return Array.isArray(raw) ? (raw as ContactPerson[]) : [];
    },
  });
};

export const useContactPerson = (id: string | null) => {
  return useQuery({
    queryKey: [...QK_CONTACTS, "one", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await http.get(`/admin/contact-persons/${id}`);
      return res?.data?.data as ContactPerson;
    },
  });
};

export const useCreateContactPerson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateContactPersonBody) => {
      const res = await http.post("/admin/contact-persons", body);
      return res?.data?.data as ContactPerson;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_CONTACTS });
    },
  });
};

export const usePatchContactPerson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: PatchContactPersonBody;
    }) => {
      const res = await http.patch(`/admin/contact-persons/${id}`, body);
      return res?.data?.data as ContactPerson;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: QK_CONTACTS });
      qc.invalidateQueries({
        queryKey: [...QK_CONTACTS, "one", vars.id],
      });
    },
  });
};

type ListOrdersParams = {
  type?: TravelServiceType;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export const useServiceOrders = (params?: ListOrdersParams) => {
  return useQuery({
    queryKey: [...QK_ORDERS, params],
    queryFn: async () => {
      const res = await http.get("/admin/service-orders", { params });
      const d = res?.data?.data;
      if (d && typeof d === "object" && "rows" in d) {
        return d as ServiceOrdersListResponse;
      }
      return {
        rows: [],
        total: 0,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        totalPages: 0,
      } satisfies ServiceOrdersListResponse;
    },
  });
};

export const useServiceOrder = (orderId: string | null) => {
  return useQuery({
    queryKey: [...QK_ORDERS, "one", orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const res = await http.get(`/admin/service-orders/${orderId}`);
      return res?.data?.data as Record<string, unknown>;
    },
  });
};

export const usePatchServiceOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      body,
    }: {
      orderId: string;
      body: PatchServiceOrderStatusBody;
    }) => {
      const res = await http.patch(
        `/admin/service-orders/${orderId}/status`,
        body
      );
      return res?.data?.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: QK_ORDERS });
      qc.invalidateQueries({
        queryKey: [...QK_ORDERS, "one", vars.orderId],
      });
    },
  });
};
