export type TravelServiceType = "hotel" | "sim" | "vpn" | "sim_vpn" | "flight";

export type ServiceOrderStatus =
  | "pending"
  | "accepted"
  | "processing"
  | "rejected"
  | "canceled"
  | "complete"
  | "close";

export type ContactPerson = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  wechat?: string | null;
  whatsapp?: string | null;
};

export type TravelService = {
  id: string;
  name: string;
  description?: string | null;
  type: TravelServiceType;
  price: number;
  currency: string;
  isActive: boolean;
  address?: string | null;
  amap?: string | null;
  appleMap?: string | null;
  contactPersons?: ContactPerson[];
};

export type CreateTravelServiceBody = {
  name: string;
  description?: string | null;
  type: TravelServiceType;
  price: number;
  currency: string;
  isActive?: boolean;
  address?: string | null;
  amap?: string | null;
  appleMap?: string | null;
};

export type PatchTravelServiceBody = Partial<
  Omit<CreateTravelServiceBody, "name"> & { name?: string }
>;

export type CreateContactPersonBody = {
  name: string;
  phone?: string | null;
  email?: string | null;
  wechat?: string | null;
  whatsapp?: string | null;
};

export type PatchContactPersonBody = Partial<CreateContactPersonBody>;

export type ServiceOrdersListResponse = {
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PatchServiceOrderStatusBody = {
  status:
    | "accepted"
    | "processing"
    | "rejected"
    | "canceled"
    | "complete"
    | "close";
};

export const TRAVEL_SERVICE_TYPES: TravelServiceType[] = [
  "hotel",
  "sim",
  "vpn",
  "sim_vpn",
  "flight",
];

export const SERVICE_ORDER_STATUSES: ServiceOrderStatus[] = [
  "pending",
  "accepted",
  "processing",
  "rejected",
  "canceled",
  "complete",
  "close",
];

/** Allowed next statuses for PATCH (server enforces; this is UX hint). */
export const ORDER_STATUS_TRANSITIONS: Record<
  ServiceOrderStatus,
  ServiceOrderStatus[]
> = {
  pending: ["accepted", "rejected", "canceled"],
  accepted: ["processing", "canceled"],
  processing: ["complete", "canceled"],
  complete: ["close"],
  rejected: [],
  canceled: [],
  close: [],
};
