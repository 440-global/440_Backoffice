import { cn } from "@/components/ui/utils";
import {
  AnalyticsResourceType,
  AnalyticsSource,
  EventCategory,
  InspectionStatus,
  LogisticStatus,
  PayMerchantStatus,
  PaymentOption,
  PaymentStatus,
  ShipmentStatus,
  SupplierVerificationStatus,
  TaxiBookingStatus,
} from "@/types/types";

const ORDER_STATUS_BUCKET: Record<
  string,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  CREATED: "secondary",
  LOCKED: "warning",
  AWAITING_BALANCE: "warning",
  PAYMENT_PENDING: "warning",
  PENDING: "warning",
  PARTIALLY_PAID: "warning",
  PAID_IN_FULL: "success",
  PAID: "success",
  PROCESSING: "primary",
  SHIPPED: "primary",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  REFUNDED: "secondary",
  DEFAULTED: "danger",
  DISPUTE_RAISED: "warning",
};

const SUPPLIER_VERIFICATION_STATUS_BUCKET: Record<
  SupplierVerificationStatus,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  SUBMITTED: "secondary",
  INTAKE_REVIEW: "warning",
  ONLINE_CHECK: "warning",
  SUPPLIER_ENGAGED: "primary",
  DOC_REVIEW: "warning",
  SCORED: "primary",
  REPORT_READY: "primary",
  COMPLETED: "success",
  REJECTED: "danger",
  REFUNDED: "secondary",
  CANCELLED: "danger",
};

const TAXI_BOOKING_STATUS_BUCKET: Record<
  TaxiBookingStatus,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  SUBMITTED: "secondary",
  AVAILABILITY_CHECK: "warning",
  CONFIRMED: "primary",
  DRIVER_ASSIGNED: "primary",
  IN_TRANSIT: "primary",
  COMPLETED: "success",
  CANCELLED: "danger",
  DECLINED: "danger",
  REFUND_PENDING: "warning",
};

const INSPECTION_STATUS_BUCKET: Record<
  InspectionStatus,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  SUBMITTED: "secondary",
  SCHEDULED: "warning",
  IN_PROGRESS: "warning",
  REPORT_READY: "primary",
  COMPLETED: "success",
  REJECTED: "danger",
  REFUNDED: "secondary",
  CANCELLED: "danger"
};

const PAY_MERCHANT_STATUS_BUCKET: Record<
  PayMerchantStatus,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  SUBMITTED: "secondary",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  PROCESSING: "primary",
  CANCELLED: "danger",
  FAILED: "danger",
  COMPLETED: "success",
  REJECTED: "danger",
  REFUNDED: "secondary"
};

const EVENT_CATEGORY_BUCKET: Record<
  EventCategory,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  USER: "secondary",
  PRODUCT: "primary",
  WISHLIST: "primary",
  CART: "warning",
  SEARCH: "secondary",
  CHECKOUT: "warning",
  PAYMENT: "warning",
  ORDER: "success",
  BALE: "primary",
  RFQ: "primary",
};

const ANALYTICS_SOURCE_BUCKET: Record<
  AnalyticsSource,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  web: "primary",
  mobile_ios: "secondary",
  mobile_android: "success",
  server: "warning",
};

const ANALYTICS_RESOURCE_TYPE_BUCKET: Record<
  AnalyticsResourceType,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  product: "primary",
  order: "success",
  checkout: "warning",
  bale: "primary",
  rfq: "primary",
};

const PAYMENT_OPTION_BUCKET: Record<
  PaymentOption | "none",
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  full: "success",
  installment: "warning",
  none: "secondary",
};

const LOGISTIC_STATUS_BUCKET: Record<
  LogisticStatus | "none",
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  pending: "warning",
  accepted: "primary",
  processing: "primary",
  rejected: "danger",
  canceled: "danger",
  complete: "success",
  close: "secondary",
  none: "secondary",
};

const SERVICE_PAYMENT_STATUS_BUCKET: Record<
  PaymentStatus | "none",
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  unpaid: "danger",
  partially_paid: "warning",
  paid_in_full: "success",
  defaulted: "danger",
  none: "secondary",
};

const SHIPMENT_STATUS_BUCKET: Record<
  ShipmentStatus | "none",
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  CREATED: "primary",
  PROCESSING: "warning",
  IN_TRANSIT: "secondary",
  DELIVERED: "success",
  LOST: "danger",
  CANCELLED: "danger",
  none: "secondary"
};

/**
 * Same hue for fill + label: very light background, deep text (light mode).
 * Dark mode: soft same-hue surface + bright same-hue label.
 */
const BUCKET_CLASS: Record<
  "success" | "warning" | "danger" | "secondary" | "primary",
  string
> = {
  success:
    "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100",
  warning:
    "bg-amber-50 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100",
  danger: "bg-red-50 text-red-950 dark:bg-red-950/50 dark:text-red-100",
  secondary:
    "bg-slate-100 text-slate-950 dark:bg-slate-800/90 dark:text-slate-100",
  primary:
    "bg-blue-50 text-blue-950 dark:bg-blue-950/50 dark:text-blue-100",
};

export function adminOrderStatusPillClass(status: string | undefined): string {
  const bucket = ORDER_STATUS_BUCKET[(status ?? "").toUpperCase()] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function supplierVerificationStatusPillClass(
  status: string | undefined,
): string {
  const normalized = (status ?? "SUBMITTED").toUpperCase().replace(/-/g, "_");

  const bucket =
    SUPPLIER_VERIFICATION_STATUS_BUCKET[
      normalized as SupplierVerificationStatus
    ] ?? "secondary";

  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function taxiBookingStatusPillClass(status: string | undefined): string {
  const normalized = (status ?? "SUBMITTED").toUpperCase().replace(/-/g, "_");
  
  const bucket = TAXI_BOOKING_STATUS_BUCKET[normalized as TaxiBookingStatus] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function inspectionStatusPillClass(status: string | undefined): string {
  const normalized = (status ?? "SUBMITTED").toUpperCase().replace(/-/g, "_");
  
  const bucket = INSPECTION_STATUS_BUCKET[normalized as InspectionStatus] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function transactionStatusPillClass(status: string | undefined): string {
  const normalized = (status ?? "SUBMITTED").toUpperCase().replace(/-/g, "_");
  
  const bucket = PAY_MERCHANT_STATUS_BUCKET[normalized as PayMerchantStatus] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function eventCategoryPillClass(category: string | undefined): string {
  const normalized = (category ?? "").toUpperCase() as EventCategory;
  const bucket = EVENT_CATEGORY_BUCKET[normalized] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function analyticsSourcePillClass(source: string | undefined): string {
  const normalized = (source ?? "").toLowerCase() as AnalyticsSource;
  const bucket = ANALYTICS_SOURCE_BUCKET[normalized] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function analyticsResourceTypePillClass(
  resourceType: string | undefined,
): string {
  const normalized = (
    resourceType ?? ""
  ).toLowerCase() as AnalyticsResourceType;
  const bucket = ANALYTICS_RESOURCE_TYPE_BUCKET[normalized] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function paymentOptionPillClass(
  option: string | null | undefined,
): string {
  const normalized = (option || "none").toLowerCase() as PaymentOption | "none";
  const bucket = PAYMENT_OPTION_BUCKET[normalized] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function logisticStatusPillClass(
  status: string | null | undefined,
): string {
  const normalized = (status || "none").toLowerCase() as
    | LogisticStatus
    | "none";
  const bucket = LOGISTIC_STATUS_BUCKET[normalized] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function servicePaymentStatusPillClass(
  status: string | null | undefined,
): string {
  const normalized = (status || "none").toLowerCase() as PaymentStatus | "none";
  const bucket = SERVICE_PAYMENT_STATUS_BUCKET[normalized] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function shipmentStatusPillClass(
  status: string | null | undefined,
): string {
  const normalized = (status || "none").toLowerCase() as ShipmentStatus | "none";
  const bucket = SHIPMENT_STATUS_BUCKET[normalized] ?? "secondary";
  return cn("font-bold tracking-tight", BUCKET_CLASS[bucket]);
}

export function eventPillClass(event: string | undefined): string {
  const e = (event ?? "").toUpperCase();

  if (
    [
      "PAYMENT_COMPLETED",
      "ORDER_DELIVERED",
      "USER_REGISTERED",
      "REVIEW_SUBMITTED",
      "PRODUCT_SAVED",
      "BALE_JOINED",
    ].includes(e)
  ) {
    return cn("font-bold tracking-tight", BUCKET_CLASS.success);
  }

  if (
    [
      "PAYMENT_FAILED",
      "ORDER_CANCELLED",
      "CHECKOUT_ABANDONED",
      "CART_ITEM_REMOVED",
      "CART_CLEARED",
      "PRODUCT_UNSAVED",
    ].includes(e)
  ) {
    return cn("font-bold tracking-tight", BUCKET_CLASS.danger);
  }

  if (
    [
      "PAYMENT_INITIATED",
      "CHECKOUT_CREATED",
      "ORDER_STATUS_CHANGED",
      "INSTALLMENT_PAYMENT_INITIATED",
      "CART_ITEM_ADDED",
    ].includes(e)
  ) {
    return cn("font-bold tracking-tight", BUCKET_CLASS.warning);
  }

  if (
    [
      "ORDER_CREATED",
      "RFQ_CREATED",
      "RFQ_VIEWED",
      "PRODUCT_VIEWED",
      "PRODUCT_LIST_VIEWED",
    ].includes(e)
  ) {
    return cn("font-bold tracking-tight", BUCKET_CLASS.primary);
  }

  // USER_LOGIN, SEARCH_PERFORMED, and any unmatched/future events
  return cn("font-bold tracking-tight", BUCKET_CLASS.secondary);
}

const BALE_DIRECT = {
  bale: "bg-violet-50 text-violet-950 dark:bg-violet-950/50 dark:text-violet-100",
  direct: "bg-sky-50 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100",
} as const;

export function orderTypePillClass(orderType: "bale" | "direct"): string {
  return cn("font-bold tracking-tight", BALE_DIRECT[orderType]);
}

export function paymentStatusPillClass(status: string | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (["PAID", "PAID_IN_FULL", "COMPLETED", "DELIVERED", "SUCCESS"].includes(s)) {
    return cn("font-bold tracking-tight", BUCKET_CLASS.success);
  }
  if (["FAILED", "CANCELLED", "DEFAULTED", "REVERSED"].includes(s)) {
    return cn("font-bold tracking-tight", BUCKET_CLASS.danger);
  }
  if (["INITIATED", "PENDING", "CREATED", "LOCKED", "PROCESSING"].includes(s)) {
    return cn("font-bold tracking-tight", BUCKET_CLASS.warning);
  }
  return "bg-slate-100 font-bold tracking-tight text-slate-950 dark:bg-slate-800/90 dark:text-slate-100";
}
