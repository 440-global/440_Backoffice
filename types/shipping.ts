import type {
  ChargeStatus,
  DeliveryMethod,
  GoodsType,
  PaymentMethod,
  ShippingService,
  ShippingUnit,
} from "@/lib/enums";

export type { ChargeStatus, DeliveryMethod, GoodsType, PaymentMethod, ShippingService, ShippingUnit };

/** One rate card as GET /admin/shipping/settings returns it. `null` means "to be advised". */
export type ShippingCard = {
  id: number;
  service: ShippingService;
  goodsType: GoodsType;
  freightUsd: number;
  clearingNgn: number | null;
  miscNgn: number | null;
  isActive: boolean;
  serviceLabel: string;
  goodsTypeLabel: string;
  unit: ShippingUnit;
};

export type ShippingResponse = {
  success: boolean;
  data: {
    usdToNgn: number | null;
    cards: ShippingCard[];
  };
};

/**
 * PUT /admin/shipping/settings merges per service + goods type: a field left out keeps its saved value,
 * `null` sets "to be advised" (container clearing / misc only). Send only what changed.
 */
export type ShippingCardPatch = {
  service: ShippingService;
  goodsType: GoodsType;
  freightUsd?: number;
  clearingNgn?: number | null;
  miscNgn?: number | null;
  isActive?: boolean;
};

export type ShippingSettingsPayload = {
  usdToNgn?: number;
  cards?: ShippingCardPatch[];
};

export type ShippingCharge = {
  id: number;
  orderId: number;
  checkoutId: number;
  customerId: number;
  shipmentId: number | null;
  status: ChargeStatus;
  service: ShippingService;
  goodsType: GoodsType;
  unit: ShippingUnit;
  measuredValue: number;
  freightRateUsd: number;
  freightUsd: number;
  fxRate: number;
  freightNgn: number;
  clearingRateNgn: number;
  clearingNgn: number;
  doorstepNgn: number;
  miscNgn: number;
  totalNgn: number;
  deliveryMethod: DeliveryMethod | null;
  deliveryAddress: string | null;
  note: string | null;
  createdByAdminId: number | null;
  paymentId: number | null;
  paidAt: string | null;
  paidVia: "WALLET" | "CARD" | "OFFLINE" | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
};

export type OrderShippingResponse = {
  success: boolean;
  data: {
    order: {
      id: number;
      reference: string | null;
      status: string;
      paymentStatus: string | null;
      deliveryMethod: DeliveryMethod;
      deliveryAddress: string | null;
      shippingCollectedAtCheckout: number;
    };
    usdToNgn: number | null;
    charges: ShippingCharge[];
  };
};

/** What the rate card would otherwise fill in. Anything left out is taken from the card. */
export type ChargeOverrides = {
  freightRateUsd?: number;
  clearingRateNgn?: number;
  miscNgn?: number;
};

export type AddOrderShippingChargesPayload = {
  service: ShippingService;
  goodsType: GoodsType;
  /** kg, CBM or a whole number of containers, depending on the service. */
  measuredValue: number;
  overrides?: ChargeOverrides;
  /** Only for orders the customer chose doorstep delivery for. */
  doorstepNgn?: number;
  note?: string;
};

export type ChargeWriteResponse = {
  success: boolean;
  data: { charge: ShippingCharge; warnings: string[] };
  message: string;
};

export type MarkPaidChargePayload = {
  method?: PaymentMethod;
  bankReference?: string;
  paidAt?: string;
  note?: string;
};

export type ReasonPayload = { reason: string };
