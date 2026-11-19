/**
 * Every enum the admin forms and tables share, mirrored from the backend so a value is spelled once.
 * Each list is `as const`; the matching union type is derived from it, and `labelFor` turns any value
 * into readable text (so `GENERAL_SEA` is never printed raw, and never half-replaced by `replace("_", " ")`).
 */

export type Option<T extends string = string> = { value: T; label: string };

export const labelize = (value: string | null | undefined): string => {
  if (!value) return "—";
  const spaced = value.replace(/_/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

// ── Shipments (BE: app/services/shipping/stages.ts, shipment.types.ts) ─────────────────────────────

export const SHIPMENT_MODES = ["SEA", "AIR"] as const;
export type ShipmentMode = (typeof SHIPMENT_MODES)[number];

export const SHIPMENT_PROVIDERS = ["MANUAL", "SKYCARGO"] as const;
export type ShipmentProvider = (typeof SHIPMENT_PROVIDERS)[number];

export const SHIPMENT_STATUSES = ["CREATED", "PROCESSING", "IN_TRANSIT", "DELIVERED", "LOST", "CANCELLED"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

/** The moves the backend allows. A terminal status has none. */
export const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  CREATED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "LOST", "CANCELLED"],
  DELIVERED: [],
  LOST: [],
  CANCELLED: [],
};

export const SEA_STAGES = [
  "BOOKED",
  "AT_ORIGIN_WAREHOUSE",
  "LOADED",
  "DEPARTED_ORIGIN_PORT",
  "IN_TRANSIT",
  "ARRIVED_DEST_PORT",
  "CUSTOMS",
  "CLEARED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export const AIR_STAGES = [
  "BOOKED",
  "AT_ORIGIN_WAREHOUSE",
  "DEPARTED_ORIGIN_AIRPORT",
  "ARRIVED_DEST_AIRPORT",
  "CUSTOMS",
  "CLEARED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

/** Can happen in either mode, at any point. */
export const EXCEPTION_STAGES = ["DELAYED", "ON_HOLD", "CUSTOMS_HOLD", "DAMAGED", "LOST", "CANCELLED"] as const;

export const SHIPMENT_STAGES = [
  "BOOKED",
  "AT_ORIGIN_WAREHOUSE",
  "LOADED",
  "DEPARTED_ORIGIN_PORT",
  "DEPARTED_ORIGIN_AIRPORT",
  "IN_TRANSIT",
  "ARRIVED_DEST_PORT",
  "ARRIVED_DEST_AIRPORT",
  "CUSTOMS",
  "CLEARED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  ...EXCEPTION_STAGES,
] as const;
export type ShipmentStage = (typeof SHIPMENT_STAGES)[number];

export const STAGE_LABELS: Record<ShipmentStage, string> = {
  BOOKED: "Booked",
  AT_ORIGIN_WAREHOUSE: "At origin warehouse",
  LOADED: "Loaded",
  DEPARTED_ORIGIN_PORT: "Departed origin port",
  DEPARTED_ORIGIN_AIRPORT: "Departed origin airport",
  IN_TRANSIT: "In transit",
  ARRIVED_DEST_PORT: "Arrived at destination port",
  ARRIVED_DEST_AIRPORT: "Arrived at destination airport",
  CUSTOMS: "In customs",
  CLEARED: "Cleared customs",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  DELAYED: "Delayed",
  ON_HOLD: "On hold",
  CUSTOMS_HOLD: "Held at customs",
  DAMAGED: "Damaged",
  LOST: "Lost",
  CANCELLED: "Cancelled",
};

export const stageLabel = (stage: string | null | undefined): string =>
  stage ? (STAGE_LABELS as Record<string, string>)[stage] ?? labelize(stage) : "—";

/** Stages an event on a shipment of this mode may carry: the mode's journey plus the exceptions. */
export const stagesForMode = (mode: ShipmentMode | string | null | undefined): readonly ShipmentStage[] => [
  ...(mode === "AIR" ? AIR_STAGES : SEA_STAGES),
  ...EXCEPTION_STAGES,
];

export const stageOptions = (mode: ShipmentMode | string | null | undefined): Option<ShipmentStage>[] =>
  stagesForMode(mode).map((value) => ({ value, label: STAGE_LABELS[value] }));

export const EVENT_VISIBILITIES = ["PUBLIC", "INTERNAL"] as const;
export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];

// ── Payments ─────────────────────────────────────────────────────────────────────────────────────

export const PAYMENT_METHODS = ["bank_transfer", "cash", "cheque", "pos", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_OPTIONS: Option<PaymentMethod>[] = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "pos", label: "POS" },
  { value: "other", label: "Other" },
];

/** The states an admin can record on a new offline order. There is no REFUNDED. */
export const OFFLINE_PAYMENT_STATES = ["UNPAID", "PARTIAL", "PAID"] as const;
export type OfflinePaymentState = (typeof OFFLINE_PAYMENT_STATES)[number];

/** Smallest share a split (partial) payment may be, same as a buyer's upfront. Mirrors the backend. */
export const MIN_UPFRONT_PERCENT = 50;

// ── Shipping charges (BE: shipping-charge-math.ts, shipping-charge.types.ts) ────────────────────

export const SHIPPING_SERVICES = ["EXPRESS_AIR", "GENERAL_AIR", "GENERAL_SEA", "CONTAINER"] as const;
export type ShippingService = (typeof SHIPPING_SERVICES)[number];
export const SHIPPING_SERVICE_OPTIONS: Option<ShippingService>[] = [
  { value: "EXPRESS_AIR", label: "Express air" },
  { value: "GENERAL_AIR", label: "General air" },
  { value: "GENERAL_SEA", label: "General sea" },
  { value: "CONTAINER", label: "Container" },
];

export const GOODS_TYPES = ["NORMAL", "DANGEROUS"] as const;
export type GoodsType = (typeof GOODS_TYPES)[number];
export const GOODS_TYPE_OPTIONS: Option<GoodsType>[] = [
  { value: "NORMAL", label: "Normal goods" },
  { value: "DANGEROUS", label: "Dangerous goods" },
];

export const SHIPPING_UNITS = ["KG", "CBM", "CONTAINER"] as const;
export type ShippingUnit = (typeof SHIPPING_UNITS)[number];

export const UNIT_OF_SERVICE: Record<ShippingService, ShippingUnit> = {
  EXPRESS_AIR: "KG",
  GENERAL_AIR: "KG",
  GENERAL_SEA: "CBM",
  CONTAINER: "CONTAINER",
};

/** What the "measured value" box means for each unit, with the limits the backend enforces. */
export const UNIT_INPUT: Record<ShippingUnit, { label: string; suffix: string; max: number; integer: boolean }> = {
  KG: { label: "Weight", suffix: "kg", max: 100_000, integer: false },
  CBM: { label: "Volume", suffix: "CBM", max: 10_000, integer: false },
  CONTAINER: { label: "Number of containers", suffix: "containers", max: 100, integer: true },
};

export const CHARGE_STATUSES = ["OPEN", "PAID", "VOID"] as const;
export type ChargeStatus = (typeof CHARGE_STATUSES)[number];

export const DELIVERY_METHODS = ["PICKUP", "DOORSTEP"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

// ── Orders ───────────────────────────────────────────────────────────────────────────────────────

export const ORDER_SOURCES = ["CUSTOMER", "ADMIN_OFFLINE", "ADMIN_CART"] as const;
export const orderSourceLabel = (source: string | null | undefined): string => {
  switch (source) {
    case "ADMIN_OFFLINE":
      return "Created by admin";
    case "CUSTOMER":
      return "Customer";
    default:
      return labelize(source);
  }
};

/** Orders the backend no longer takes payments or shipping charges for. */
export const CLOSED_ORDER_STATUSES = ["CANCELLED", "REFUNDED", "DEFAULTED", "DISPUTE_RAISED"] as const;
export const isClosedOrder = (status: string | null | undefined): boolean =>
  !!status && (CLOSED_ORDER_STATUSES as readonly string[]).includes(status);

// ── Bales ────────────────────────────────────────────────────────────────────────────────────────

export const BALE_STATUSES = [
  "OPEN",
  "FILLED",
  "EXPIRED",
  "LOCKED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type BaleStatus = (typeof BALE_STATUSES)[number];

/** A bale can only be relisted while it is in one of these. */
export const RELISTABLE_BALE_STATUSES: readonly BaleStatus[] = ["OPEN", "EXPIRED"];

// ── Products ─────────────────────────────────────────────────────────────────────────────────────

export const PRODUCT_VISIBILITIES = ["PUBLIC", "UNLISTED", "HIDDEN"] as const;
export type ProductVisibility = (typeof PRODUCT_VISIBILITIES)[number];
export const PRODUCT_VISIBILITY_OPTIONS: Option<ProductVisibility>[] = [
  { value: "PUBLIC", label: "Public" },
  { value: "UNLISTED", label: "Unlisted (link only)" },
  { value: "HIDDEN", label: "Hidden" },
];
