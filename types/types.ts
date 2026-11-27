export type LoginFormTypes = {
  email: string;
  password: string;
  remember?: boolean;
};

export type ChangePasswordFormTypes = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type NavigationItem = {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
};

export type MarketDetails = {
  id: number;
  cityId: number | null;
  name: string;
  category: number | null;
  country: string;
  image: string;
  profile_picture?: string | null;
  address: string;
  amap: string | null;
  appleMap: string | null;
  description: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AddMarketForm = {
  name: string;
  country: string;
  city: string;
  image?: File | string | null;
  profile_picture?: File | string | null;
  address: string;
  description: string;
  marketId?: number;
  appleMap: string;
  amap: string;
};

export type AddSupplierForm = {
  name: string;
  userName: string;
  marketId: number;
  image?: File | string | null;
  profile?: File | string | null;
  location: string;
  description: string;
  categories: string[];
  clubCode?: string;
};

export type SupplierDetails = {
  id: number;
  clubCode: string | null;
  name: string;
  userName: string;
  marketId: number;
  image: string;
  profile: string;
  location: string;
  description: string;
  status: boolean;
  year: number | null;
  returnRate: number | null;
  rate: number | null;
  supplierType: number | null;
  medal: string | null;
  cityId: string | null;
  createdAt: string;
  updatedAt: string;
  supplierId: number | null;
};

export type CategoryDetails = {
  id: number;
  name: string;
  categorySlug: string | null;
  priority: number | string;
  image: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type AddCategoryForm = {
  name: string;
  priority?: number | string | null;
  image?: File | string | null;
  description: string;
  categoryId?: number;
};

export type SubCategoryDetails = {
  id: number;
  name: string;
  categoryId: number;
  slug: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type Type = {
  name: string;
  subCategoryId: number;
};

/** A relist needs no date: the backend picks the new end (1 to 3 days ahead) when none is sent. */
export type RelistData = {
  id: number;
  body?: {
    endIn?: string;
  };
};

export type TypeDetails = {
  id: number;
  name: string;
  subCategoryId: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductVisibility = "PUBLIC" | "UNLISTED" | "HIDDEN";

/**
 * One way a product can be bought. A pool's size lives on its bale, so only per-buyer limits are set here.
 * `null` for a maximum means no limit.
 */
export type ProductPurchaseOptions = {
  mode: "DIRECT" | "POOL";
  enabled: boolean;
  /** DIRECT only. */
  minQty?: number | null;
  maxQty?: number | null;
  /** POOL only. */
  minSlotsPerBuyer?: number | null;
  maxSlotsPerBuyer?: number | null;
};

export type AddProductForm = {
  product: {
    name: string;
    description: string;
    price: number | string;
    oldPrice: number | string;
    currency: string;
    supplierId: string | number;
    categoryId: string | number;
    subCategoryId: string | number;
    productTypeId: string | number;
    images: string[];
    status?: boolean;
    link?: string;
    visibility: ProductVisibility;
  };
  colors?: {
    color: string;
    otherColor: string;
    images: string[];
  }[];
  sizes?: string[];
  /** Create the product even though it looks like one that already exists. */
  allowDuplicate?: boolean;
  /** Not accepted by the Telegram create endpoint. */
  purchaseOptions?: ProductPurchaseOptions[];
};

/** A product the backend thinks this new one may duplicate (409 DUPLICATE_PRODUCT, details.matches). */
export type DuplicateMatch = {
  productId: number;
  name: string | null;
  score: number;
  reasons: string[];
  status: boolean | null;
  visibility: string | null;
};

/** What PUT /admin/product/:id accepts. The retired options (shipping fee, MOQ, 2-for-1, single slot) are gone. */
export type EditProductForm = {
  name: string;
  description: string;
  price: number;
  oldPrice: number;
  currency: string;
  isSpecial: boolean;
  subCategoryId: number;
  productTypeId: number;
  images: string[];
  visibility: ProductVisibility;
};

export type Product = {
  id: number;
  supplierId?: number;
  subCategoryId: number;
  price: number;
  oldPrice: number;
  name: string;
  description: string;
  status: boolean;
  images: string[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

export type ProductFilters = {
  search?: string;
  page: number;
  limit: number;
  category?: number;
  productTypeId?: number;
  supplierId?: number;
  status?: "true" | "false";
  minPrice?: number;
  maxPrice?: number;
  start_date?: string;
  end_date?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface BaleFilters {
  page?: number;
  limit?: number;
  search?: string;
  productId?: number;
  status?: BaleStatus;
  shipmentId?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  start_date?: string;
  end_date?: string;
  categories?: number[];
  priceRange?: {
    min: number;
    max: number;
  };
  supplierRating?: string;
  marketLocation?: string[];
}

// Cities ────────────────────────────────────────────────────────────────
export type AddCityPayload = {
  name: string;
  province: string;
  country: string;
};

export type SingleCity = {
  id: number;
  name: string;
  province: string;
  country: string;
  createdAt: string;
  updatedAt: string;
};

export type CityResponse = {
  success: boolean;
  data: SingleCity[];
  message: string;
};

export type ImportCityMarket = {
  name: string;
  category: string;
  address: string;
  amap: string;
  appleMap: string;
};

export type ImportCity = {
  city: string;
  province: string;
  markets: ImportCityMarket[];
};

// ─── Finance ────────────────────────────────────────────────────────────────

export type FinanceCategory =
  | "SIM_VPN"
  | "HOTEL"
  | "FLIGHT"
  | "ITEM_PURCHASED"
  | "RFQ_ORDER";

export type FinanceStatus =
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type FinanceSourceType = "CHECKOUT" | "SERVICE_ORDER" | "RFQ_ORDER";
export type FinanceFlowDirection = "INFLOW" | "OUTFLOW";
export type FinanceFlowType =
  | "DEPOSIT_FROM_CUSTOMER"
  | "POST_DEPOSIT_PAYMENT"
  | "INTER_COMPANY"
  | "REFUND"
  | "INC"
  | "PAYMENT_FOR_GOODS_SERVICES";

export type PaymentPurpose =
  | "LOCK"
  | "HALF"
  | "BALANCE"
  | "INSTALLMENT"
  | "UPFRONT"
  | "DIRECT_REMAINING"
  | "FULL";

export type InstallmentStatus = "PENDING" | "PAID" | "OVERDUE";

export type FinanceCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  shop_name: string;
};

export type FinanceRecord = {
  id: number;
  category: FinanceCategory;
  description: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: FinanceStatus;
  paymentMethod: string;
  paymentPurpose: PaymentPurpose | null;
  flowDirection: FinanceFlowDirection;
  flowType: FinanceFlowType;
  reference: string;
  sourceType: FinanceSourceType;
  sourceId: string;
  paymentId: number | null;
  transactionId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  customer?: FinanceCustomer;
};

export type FinanceSummary = {
  totalRevenue: number;
  totalInflow: number;
  totalOutflow: number;
  inflowMinusOutflow: number;
  totalRefunded: number;
  netRevenue: number;
  totalPending: number;
  totalFailed: number;
  transactionCount: number;
  byCategory: Record<string, { total: number; count: number }>;
  byStatus: Record<string, { total: number; count: number }>;
};

export type FinancePaginatedResponse<T> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type Installment = {
  id: number;
  orderId: number;
  sequence: number;
  dueDate: string;
  amount: number;
  interest: number;
  penalty: number;
  status: InstallmentStatus;
  paidAt: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  btobOrder?: {
    id: number;
    status: string;
    totalAmount: number;
    amountPaid: number;
    checkout: {
      id: number;
      customerId: number;
      checkoutType: string;
      serialNumber: string;
      merchant: FinanceCustomer;
    };
  };
};

export type InstallmentsPaginatedResponse =
  FinancePaginatedResponse<Installment> & {
    overdueTotal: number;
    pendingTotal: number;
  };

export type CustomerStatement = {
  customer: FinanceCustomer;
  summary: {
    totalPaid: number;
    totalRefunded: number;
    totalOutstanding: number;
  };
  records: FinanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** POST /admin/finance/manual-entries — send positive magnitude; direction sets sign (UI strips a leading −). */
export type ManualEntryDirection = "INFLOW" | "OUTFLOW";

type ManualFinanceEntryCommon = {
  amount: number;
  currency?: string;
  narration: string;
  paidDate: string;
  customerId?: number;
  supplierId?: number;
  baleId?: number;
  baleCycle?: string;
  /** `btobOrders.id` — not the checkout id. */
  orderId?: number;
  /** `checkouts.id` when linking B2B checkout context. */
  checkoutId?: number;
  fullName?: string;
  email?: string;
  reference?: string;
  paymentMethod?: string;
};

export type ManualFinanceEntryBody =
  | (ManualFinanceEntryCommon & {
      direction: "INFLOW";
      entryType: string;
      counterpartyName?: string;
      flowTypeOverride?:
        | "INTER_COMPANY"
        | "MANUAL_INFLOW"
        | "POST_DEPOSIT_PAYMENT"
        | "DEPOSIT_FROM_CUSTOMER";
    })
  | (ManualFinanceEntryCommon & {
      direction: "OUTFLOW";
      expenseType: string;
    });

export type AdminOrderListItem = {
  id: number;
  status?: string;
  /** Supplier for this order (preferred for finance linking). */
  supplierId?: number | null;
  checkoutId?: number | null;
  checkoutType?: string | null;
  shipmentId?: number | null;
  lockPaymentId?: number | null;
  paymentOption?: "full" | "split" | null;
  upfrontPercent?: number | null;
  /** CUSTOMER (placed by the buyer) or ADMIN_OFFLINE (recorded by an admin). */
  source?: string | null;
  createdByAdminId?: number | null;
  /** UNPAID | PARTIAL | PAID | REFUNDED, or null for orders from before it was tracked. */
  paymentStatus?: string | null;
  /** PICKUP, or DOORSTEP when the buyer asked for delivery. null means pickup. */
  deliveryMethod?: string | null;
  discountRate: number | null;
  discountAmount: number | null;
  customerId?: number | null;
  baleId?: number | null;
  baleCycle?: number | string | null;
  totalAmount?: number;
  amountPaid?: number;
  placedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  checkout?: {
    id?: number;
    checkoutType?: string;
    serialNumber?: string;
    customerId?: number | null;
    status?: string | null;
    baleCycle?: number | string | null;
    orderStatus?: string | null;
    shipmentId?: number | null;
    createdAt?: string;
    merchant?: Partial<FinanceCustomer> & { id?: number };
  };
  customer?: Partial<FinanceCustomer> & { id?: number };
  bale?: Record<string, unknown> | null;
  shipment?: Record<string, unknown> | null;
} & Record<string, unknown>;

export type AdminOrderLineItem = {
  id: number;
  orderId?: number;
  productId?: number;
  variantId?: number | null;
  colorId?: number | null;
  sizeId?: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: number;
    name: string;
    images?: string[];
    supplierId?: number;
  };
};

export type AdminBtobPayment = {
  id: number;
  checkoutId?: number;
  amount: number;
  currency?: string;
  paymentLink?: string | null;
  accessCode?: string | null;
  reference?: string;
  provider?: string;
  status?: string;
  purpose?: string | null;
  orderId?: number | null;
  installmentId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminOrderPaymentSummary = {
  successfulPaymentAmount?: number;
  totalPayments?: number;
  successfulPayments?: number;
  failedPayments?: number;
};

export type AdminOrderInstallmentSummary = {
  totalInstallments?: number;
  paidInstallments?: number;
  pendingInstallments?: number;
  overdueInstallments?: number;
  totalInstallmentAmount?: number;
};

export type AdminOrderHistoryEntry = {
  id: number;
  orderId?: number;
  fromStatus?: string;
  toStatus?: string;
  actor?: string;
  createdBy?: number | null;
  createdAt?: string;
};

export type AdminOrderShipmentEvent = {
  id: number;
  shipmentId: number;
  stage: ShipmentStage;
  status: ShipmentStatus;
  title: string;
  description: string | null;
  location: string | null;
  occurredAt: string;
  source: string;
  visibility: EventVisibility;
  etaSnapshot: string;
  meta: string | null;
  createdByAdminId: number;
  idempotencyKey: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminShipmentTimeline = {
  at: string;
  stage: ShipmentStage | null;
  title: string;
  location: string;
  description: string;
};

export type AdminOrderDetail = AdminOrderListItem & {
  orderItems?: AdminOrderLineItem[];
  btobOrderInstallments?: unknown[];
  orderHistories?: AdminOrderHistoryEntry[];
  btobPayments?: AdminBtobPayment[];
  paymentSummary?: AdminOrderPaymentSummary;
  installmentSummary?: AdminOrderInstallmentSummary;
  trackingUrl: string;
  trackingToken: string;
  reference: string;
  shipmentEvents: AdminOrderShipmentEvent[];
  timeline: AdminShipmentTimeline[];
};

export type AdminOrderCheckoutType = "BALE" | "DIRECT";
export type AdminOrderPaymentState = "COMPLETED" | "PENDING";
export type AdminOrdersListView = "orders" | "pool_checkout";
export type AdminOrdersSortBy =
  | "id"
  | "status"
  | "totalAmount"
  | "amountPaid"
  | "createdAt"
  | "updatedAt";
export type AdminSortOrder = "ASC" | "DESC";

export type AdminOrdersListParams = {
  status?: string;
  checkoutType?: AdminOrderCheckoutType;
  paymentState?: AdminOrderPaymentState;
  view?: AdminOrdersListView;
  baleId?: number;
  baleCycle?: number;
  customerId?: number;
  page?: number;
  limit?: number;
  sortBy?: AdminOrdersSortBy;
  sortOrder?: AdminSortOrder;
};

export type AdminOrdersListResult = {
  rows: AdminOrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── RFQ Orders (Admin) ──────────────────────────────────────────────────────

export type RfqWorkflowState =
  | "PENDING"
  | "REVIEWING"
  | "QUOTED"
  | "APPROVED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "CONVERTED"
  | "CANCELLED";

export type AdminRfqOrderLine = {
  id?: number;
  rfqOrderId?: number;
  orderId?: number;
  name?: string | null;
  productName?: string | null;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  images?: Array<string | null>;
  notes?: string | null;
  snapshotLabel?: string | null;
  quotedUnitPrice?: number | null;
  amount?: number | null;
} & Record<string, unknown>;

export type AdminRfqContact = {
  id?: number;
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  message?: string | null;
} & Record<string, unknown>;

export type AdminRfqOrder = {
  id: number;
  status?: string;
  workflow?: RfqWorkflowState | string;
  workflowStatus?: RfqWorkflowState | string;
  serialNumber?: string | null;
  serialCode?: string | null;
  quotedAmount?: number | null;
  quotedCurrency?: string | null;
  currency?: string | null;
  notes?: string | null;
  adminNotes?: string | null;
  linkedMerchantId?: number | null;
  convertedCheckoutId?: number | null;
  convertedBtobOrderId?: number | null;
  rfqPaymentId?: number | null;
  approvedByAdminId?: number | null;
  approvedAt?: string | null;
  linkedCheckoutId?: number | null;
  linkedOrderId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  Rfq?: AdminRfqContact | null;
  rfq?: AdminRfqContact | null;
  /** Detail API may use snake_case. */
  rfq_products?: AdminRfqOrderLine[];
  rfqProducts?: AdminRfqOrderLine[];
  rfqProductLines?: AdminRfqOrderLine[];
  /** List API often uses `products`. */
  products?: AdminRfqOrderLine[];
} & Record<string, unknown>;

/** GET /admin/rfqs/summary — dashboard KPI cards */
export type AdminRfqSummary = {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
};

export type AdminRfqListParams = {
  workflow?: RfqWorkflowState;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type AdminRfqListResult = {
  rows: AdminRfqOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminRfqActivity = {
  id?: number;
  action?: string;
  message?: string;
  entity?: string;
  entityId?: number | string;
  createdAt?: string;
  updatedAt?: string;
  adminId?: number | null;
  /** Flat name (some responses); prefer `adminUser.name` when present */
  adminName?: string | null;
  adminUser?: { id?: number; name?: string; email?: string };
  oldValue?: unknown;
  newValue?: unknown;
  status?: boolean;
  metadata?: Record<string, unknown>;
} & Record<string, unknown>;

/** POST /admin/rfqs/comments — audit row with `action: "COMMENT"` on `RfqOrder` */
export type AdminRfqCommentBody = {
  comment: string;
  rfq_id: string | number;
  request_id?: string;
};

export type AdminRfqCommentResponse = {
  rfqOrderId: number;
  logged: boolean;
};

export type AdminSetRfqQuoteBody = {
  quotedAmount: number;
  currency?: string;
  notes?: string;
};

export type AdminApproveRfqBody = {
  linkedMerchantId?: number;
  notes?: string;
};

export type AdminInitiateRfqPaymentBody = {
  returnUrl?: string;
};

export type AdminManualRfqPaymentConvertBody = {
  amount: number;
  paidDate: string;
  narration: string;
  entryType: string;
  currency?: string;
  reference?: string;
  paymentMethod?: string;
};

export type AdminUpdateRfqBody = {
  client: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  products: {
    id?: number;
    name: string;
    description: string;
    quantity: number;
    images: string[];
  }[];
  adminNotes: string;
};

// ─── Product Stats ───────────────────────────────────────────────────────────

export type ProductStatsParams = {
  startDate?: string;
  endDate?: string;
};

export type ProductCreatorStat = {
  adminId: number | null;
  adminName: string | null;
  adminEmail: string | null;
  productCount: number;
};

export type ProductStatsByCreator = {
  totalProducts: number;
  byCreator: ProductCreatorStat[];
};

// ─── Bale ────────────────────────────────────────────────────────────────────

import type { BaleStatus } from "@/lib/enums";

export type Bale = {
  id: number;
  productId: number;
  quantity: number;
  filled: number;
  slot: number;
  filledSlot: number;
  price: number;
  oldPrice: number;
  totalDeliveryFee: number;
  deliveryFee: number;
  baleId?: string;
  endIn: string; // ISO date string
  status: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  product: Product;
};

/** One price for a range of slots. `max: null` runs to the last slot. */
export type BalePriceTier = {
  price: number;
  min: number;
  max: number | null;
};

/**
 * POST /admin/bale. Only the product and the number of slots are required. Anything left out is filled in
 * by the backend: price, old price and currency from the product, the quantity from the slots, and an end
 * date 5 to 10 days away.
 */
export type CreateBale = {
  productId: number;
  slot: number;
  quantity?: number;
  currency?: string;
  price?: number;
  oldPrice?: number;
  originalPrice?: number;
  filledSlot?: number;
  /** ISO date-time. */
  endIn?: string;
  /** Slot prices that must cover every slot from 1 to `slot`, with no overlap. */
  prices?: BalePriceTier[];
  /** Create the pool even though the product already has an open one. */
  allowSecondPool?: boolean;
};

/** PUT /admin/bale/:id. Send only what changed. */
export type UpdateBale = {
  quantity?: number;
  slot?: number;
  filledSlot?: number;
  price?: number;
  oldPrice?: number;
  originalPrice?: number;
  currency?: string;
  endIn?: string;
  prices?: BalePriceTier[];
  isSpecial?: boolean;
  status?: BaleStatus;
};

export type GetBaleResponse = {
  success: boolean;
  data: SingleBale[];
  message: string;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SingleBale = {
  id: number;
  productId: number;
  quantity: number;
  filled: number;
  slot: number;
  filledSlot: number;
  price: number;
  oldPrice: number;
  originalPrice: number | null;
  currency: string;
  totalDeliveryFee?: number;
  deliveryFee?: number;
  baleId?: string;
  startedAt: string;
  restartedCount: number;
  cycle: number;
  endIn: string;
  shipmentId?: string | null;
  createdBy?: number | null;
  status: BaleStatus;
  prices?: BalePriceTier[] | null;
  isSpecial?: boolean;
  createdAt: string;
  updatedAt: string;
  product: ProductType;
  paidJoinCount: number;
  buying: BuyingSummary | null;
};

/**
 * What a product can be bought as. `null` for products that never had purchase options saved; `direct` or
 * `pool` is `null` when that mode is switched off.
 */
export type BuyingSummary = {
  modes: ("DIRECT" | "POOL")[];
  defaultMode: "DIRECT" | "POOL";
  direct: { minQty: number; maxQty: number | null } | null;
  pool: { minSlotsPerBuyer: number; maxSlotsPerBuyer: number | null } | null;
};

export type ProductType = {
  images: string[];
  productAttributes: ProductSubItem | null;
  packageInfo: ProductSubItem;
  id: number;
  supplierId: number;
  subCategoryId: number;
  productTypeId?: number;
  price: number;
  oldPrice: number;
  name: string;
  description: string;
  status: boolean;
  platform?: string;
  link?: string;
  currency?: string;
  relistPriceCapPercent?: null;
  relistMinQuantity?: null;
  createdBy?: number;
  rate?: number;
  positiveFeedbackRate?: number;
  reviewsNumber?: number;
  reviews?: ProductReview[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  variants: any[];
  productSizes: ProductSize[];
  colors: ProductColorVariant[];
};

export type ProductRow = Record<string, string>;

export type ProductSubItem = {
  title: string | null;
  headers: string[];
  rows: ProductRow[];
};

export type ProductSize = {
  id: number;
  sizeId: number;
  productId: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  size: Size;
};

export type ProductColorVariant = {
  id: number;
  productId: number;

  color: string;
  otherColor?: string;

  images: string[];
  hex_code: string | null;

  quantity: number;
  status: boolean;

  tagId: number | null;

  createdAt: string;
  updatedAt: string;
};

export type ProductReview = {
  id: number;
  buyerId: number | null;
  productId: number;
  rating: string;
  note: string;
  purchasedItem: string;
  buyerName: string;
  images: string[];
  dateRaw: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: unknown | null;
};

export type Size = {
  id: number;
  label: string;
  formart: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  tagId: number | null;
};

// ─── Admin Dashboard (role-scoped) ───────────────────────────────────────────

export type DashboardSummaryParams = {
  startDate?: string;
  endDate?: string;
};

export type AdminDashboardScope = "full" | "finance" | "operations";

export type AdminDashboardQuickAction = {
  key?: string;
  label: string;
  iconKey?: string;
  href?: string;
  route?: string;
};

export type AdminDashboardMoneyKpis = {
  totalRevenueNgn?: number;
  netInflowMinusOutflowNgn?: number;
  totalRefundedNgn?: number;
  revenueChangePctVsPriorMonth?: number | null;
  thisMonthRevenueNgn?: number;
  priorMonthRevenueNgn?: number;
  installments?: Record<string, unknown>;
  refundsNeedingAttention?: unknown;
};

export type AdminDashboardOrderKpis = {
  activeBales?: number;
  balesClosingWithin6Hours?: number;
  newBalesLast7Days?: number;
  totalMerchants?: number;
  merchantsJoinedThisWeek?: number;
  totalCheckouts?: number;
  checkoutsLast24h?: number;
};

export type AdminDashboardSecondaryKpis = {
  avgPoolFillRatePct?: number;
  poolsCompletedAllTime?: number;
  failedPoolsAllTime?: number;
  failedPoolsRefundNgnApprox?: number;
  activeSuppliers?: number;
  inTransitShipments?: number;
  refundsNeedingAttention?: number;
} & Record<string, unknown>;

export type AdminDashboardRevenueWeek = {
  weekStart: string;
  label: string;
  amountNgn: number;
};

/** GET /admin/dashboard/summary */
export type AdminDashboardSummary = {
  scope: AdminDashboardScope;
  currency?: string;
  generatedAt?: string;
  timeWindow?: { startDate?: string; endDate?: string };
  quickActions?: AdminDashboardQuickAction[];
  primaryKpis?: {
    money?: AdminDashboardMoneyKpis;
    orders?: AdminDashboardOrderKpis;
  };
  secondaryKpis?: AdminDashboardSecondaryKpis;
  revenueByWeek?: AdminDashboardRevenueWeek[];
  /** super_admin only — legacy breakdown */
  detail?: unknown;
};

export type DashboardRecentParams = {
  limit?: number;
};

export type AdminDashboardActivityItem = {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  amountNgn?: number;
  currency?: string;
  occurredAt: string;
};

/** GET /admin/dashboard/recent | /admin/dashboard/activity */
export type AdminDashboardRecent = {
  scope?: AdminDashboardScope;
  items: AdminDashboardActivityItem[];
};

// ─── Support Chat ─────────────────────────────────────────────────────────────

export type SupportConversationStatus =
  | "open"
  | "waiting"
  | "resolved"
  | "closed";

export type SupportMessageContentType = "text" | "image" | "file";

export type SupportConversation = {
  id: number;
  referenceCode: string;
  customerType: string;
  chatCustomerId: number | null;
  buyerId: number | null;
  assignedAgentId: number | null;
  status: SupportConversationStatus;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: number;
  conversationId: number;
  senderType: "customer" | "agent" | string;
  senderId: number | null;
  content: string | null;
  contentType: SupportMessageContentType;
  attachmentUrl: string | null;
  attachmentMimeType: string | null;
  attachmentSize: number | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupportConversationListPayload = {
  conversations: SupportConversation[];
  page: number;
  limit: number;
  total: number;
};

export type SupportConversationMessagesPayload = {
  messages: SupportMessage[];
  page: number;
  limit: number;
  total: number;
};

export type SupportStats = {
  open: number;
  waiting: number;
  resolved: number;
  closed: number;
  unassigned: number;
  avgResponseTimeMs: number;
};

// History -------------
export type HistoryEntry = {
  from: InspectionStatus;
  to: InspectionStatus;
  actorType: "MERCHANT" | "ADMIN";
  actorId: number;
  note: string;
  at: string;
};

// Attachment -------------
export type AttachmentStatus =
  | "INVOICE"
  | "QUOTATION"
  | "RECEIPT"
  | "SCREENSHOT"
  | "PHOTO"
  | "VIDEO"
  | "REPORT"
  | "OTHER";

export type AttachmentType = {
  url: string;
  kind: AttachmentStatus;
  uploadedBy: "MERCHANT";
  uploadedById: number;
  uploadedAt: string;
  note: string;
};

// Inspection Types ------------
export type InspectionDepth = "BASIC" | "STANDARD" | "COMPREHENSIVE";

export type InspectionProductDetails = {
  description: string;
  quantity: number;
  unit: string;
  specifications?: string;
};

export type InspectionStatus =
  | "SUBMITTED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "REPORT_READY"
  | "COMPLETED"
  | "REJECTED"
  | "REFUNDED"
  | "CANCELLED";

export type InspectionRequestType = {
  depth: InspectionDepth;
  supplier: {
    name: string;
    address: string;
    contact?: string;
  };
  productDetails: InspectionProductDetails;
  pin: string;
  attachments?: {
    url: string;
    kind: string;
    note: string;
  }[];
};

export type InspectionParams = {
  status?: string;
  depth?: string;
  merchantId?: number;
  assignedAdminId?: number;
  page?: number;
  limit?: number;
};

export type SingleInspection = {
  id: number;
  reference: string;
  merchantId: number;
  depth: InspectionDepth;
  feePaidNaira: number;
  supplier: {
    name: string;
    address: string;
    contact: string;
  };
  productDetails: InspectionProductDetails;
  attachments: AttachmentType[];
  status: InspectionStatus;
  assignedAdminId: number;
  report: string | null;
  adminNotes: string;
  wallet: {
    debitTxnId: string;
    refundTxnId: string | null;
  };
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type InspectionResponse = {
  success: boolean;
  message: string;
  data: {
    rows: SingleInspection[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Supplier Verification Types ------------
export type SupplierVerificationStatus =
  | "SUBMITTED"
  | "INTAKE_REVIEW"
  | "ONLINE_CHECK"
  | "SUPPLIER_ENGAGED"
  | "DOC_REVIEW"
  | "SCORED"
  | "REPORT_READY"
  | "COMPLETED"
  | "REJECTED"
  | "REFUNDED"
  | "CANCELLED";

export type SupplierVerificationParams = {
  status?: SupplierVerificationStatus | "";
  page?: number | 0;
  limit?: number | 0;
  merchantId?: number | null;
  assignedAdminId?: number | null;
};

export type SupplierVerificationFindings = {
  identityNotes?: string;
  communicationNotes?: string;
  documentationNotes?: string;
  physicalNotes?: string;
  generalNotes?: string;
};

export type SupplierVerificationScore = {
  total: number;
  identity: number | null;
  physical: number | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  communication: number | null;
  documentation: number | null;
};

export type SingleSupplierVerification = {
  id: number;
  reference: string;
  merchantId: number;
  feePaidNaira: string;
  supplier: {
    name: string;
    productType: string;
    location: {
      city: string;
      address: string;
      country: string;
    };
    contact: {
      person: string;
      phone: string;
      wechat: string;
      email: string;
    };
  };
  attachments: AttachmentType[];
  status: SupplierVerificationStatus;
  assignedAdminId: number;
  findings: SupplierVerificationFindings | null;
  scores: SupplierVerificationScore | null;
  report: {
    url: string;
    summary: string;
    uploadedAt: string;
    recommendation: string;
  } | null;
  adminNotes: string | null;
  wallet: {
    debitTxnId: string;
    refundTxnId: string | null;
  };
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type SupplierVerificationResponse = {
  success: boolean;
  message: string;
  data: {
    rows: SingleSupplierVerification[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Taxi Booking Types ------------
export type TaxiBookingStatus =
  | "SUBMITTED"
  | "AVAILABILITY_CHECK"
  | "CONFIRMED"
  | "DRIVER_ASSIGNED"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "CANCELLED"
  | "DECLINED"
  | "REFUND_PENDING";

export type SingleTaxiBooking = {
  id: number;
  reference: string;
  merchantId: number;
  city: string;
  plan: string;
  zone: string;
  locations:
    | {
        order: number;
        district: string;
        address: string;
        landmark?: string;
      }[]
    | null;
  flightDetails: {
    flightNumber: string;
    scheduledAt: string;
  } | null;
  pickupTime: string;
  passengerCount: number;
  luggageCount: number;
  fareYuan: number;
  fareNaira: number;
  fx: { rateUsed: number; lockedAt: string };
  status: TaxiBookingStatus;
  availabilityNote: string | null;
  refundReason: string | null;
  driverDetails: {
    name: string;
    phone: string;
    vehicleDetails: string;
  } | null;
  adminNotes: string | null;
  assignedAdminId: number | null;
  wallet: { debitTxnId: string; refundTxnId: string } | null;
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type TaxiBookingResponse = {
  success: boolean;
  message: string;
  data: {
    rows: SingleTaxiBooking[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type TaxiBookingParams = {
  status?: TaxiBookingStatus;
  city?: "GUANGZHOU" | "FOSHAN" | "DONGGUAN";
  plan?: "A" | "B";
  merchantId?: number;
  assignedAdminId?: number;
  page?: number;
  limit?: number;
};

// Pay Merchant Types ------------
export type PayMerchantStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PROCESSING"
  | "REJECTED"
  | "REFUNDED"
  | "CANCELLED"
  | "COMPLETED"
  | "FAILED";

export type SinglePayMerchantResponse = {
  id: number;
  reference: string;
  merchantId: number;
  amountForeign: number;
  currency: string;
  amountNaira: number;
  totalPayableNaira: number;
  fx: {
    rateUsed: number;
    lockedAt: string;
    feeNaira: number;
  };
  supplier: {
    channel: string;
    name: string;
    bank: {
      accountNumber: string;
      accountHolder: string;
      bankName: string;
      swift: string;
    };
  };
  attachments: AttachmentType[];
  status: PayMerchantStatus;
  riskFlags: {
    code: number;
    severity: number;
    note?: string;
  }[];
  adminNotes: string | null;
  execution: string | null;
  wallet: {
    debitTxnId: string;
    refundTxnId: string | null;
    financeRecordId: number;
  };
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type PayMerchantResponse = {
  success: boolean;
  message: string;
  data: SinglePayMerchantResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type PayMerchantParams = {
  status?: PayMerchantStatus;
  currency?: "USD" | "CNY";
  merchantId?: number;
  page: number;
  limit: number;
};

// Product Types ______________
export type SingleProduct = {
  images: string[];
  productAttributes: ProductSubItem | null;
  packageInfo: ProductSubItem | null;
  prices: {} | null;
  evaluatePanelSummary: {} | null;
  id: number;
  supplierId: number;
  subCategoryId: number;
  productTypeId: number;
  price: number;
  oldPrice: number;
  originalPrice: number | null;
  name: string;
  description: string;
  status: boolean;
  visibility: "HIDDEN" | "PUBLIC" | "UNLISTED";
  source: string;
  duplicateOfProductId: string | null;
  canonicalKey: string;
  isSpecial: boolean;
  isBogoPromo: boolean;
  isSingleSlot: boolean;
  platform: "telegram" | "1688";
  link: string | null;
  /** The currency the price is stored in, as a symbol (¥, ₦, $...). */
  currency: string;
  relistPriceCapPercent: number | null;
  relistMinQuantity: number | null;
  shippingFee: number;
  moq: number;
  createdBy: string | null;
  rate: number | null;
  positiveFeedbackRate: number | null;
  reviewsNumber: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
  Variants?: [];
  ProductSizes?:
    | {
        id: number;
        sizeId: number;
        productId: number;
        status: boolean;
        createdAt: string;
        updatedAt: string;
      }[]
    | null;
  Colors?: ProductColorVariant[] | null;
  ProductTags?: string[];
  buying: BuyingSummary | null;
};

export type ProductResponse = {
  success: boolean;
  data: SingleProduct[];
  message: string;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Shipment Types ____________________
import type { EventVisibility, ShipmentMode, ShipmentProvider, ShipmentStage, ShipmentStatus } from "@/lib/enums";
import { ReactNode } from "react";

export type BaseShipment = {
  id: number;
  containerNumber: string | null;
  trackingNumber: string | null;
  /** Optional since carrier-optional shipments: many have none. */
  carrier: string | null;
  shippingMethod: string | null;
  shippedAt: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  deliveryLocation: string | null;
  status: ShipmentStatus;
  totalWeight: number | null;
  totalCost: number | null;
  notes: string | null;
  /** Send this back as `expectedVersion` when editing, so two admins cannot overwrite each other. */
  version: number;

  provider: ShipmentProvider;
  providerRef: string | null;
  providerSyncedAt: string | null;

  stage: ShipmentStage | null;
  stageUpdatedAt: string | null;
  etd: string | null;
  etaOriginal: string | null;
  etaLatest: string | null;
  etaUpdatedAt: string | null;

  isDelayed: boolean;

  originPort: string | null;
  destinationPort: string | null;

  lastEventAt: string | null;
  createdAt: string;
  updatedAt: string;

  ordersCount: number;
};

export type SingleShipment =
  | (BaseShipment & {
      mode: "SEA";
      modeDetails: Partial<SeaModeDetails> | null;
    })
  | (BaseShipment & {
      mode: "AIR";
      modeDetails: Partial<AirModeDetails> | null;
    });

export type ShipmentResponse = {
  success: boolean;
  data: {
    shipments: SingleShipment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
};

export type { ShipmentStatus, ShipmentMode, ShipmentProvider, ShipmentStage, EventVisibility };

export type ShipmentParams = {
  page: number;
  limit: number;
  status?: ShipmentStatus | "";
  mode?: ShipmentMode | "";
  stage?: ShipmentStage | "";
  delayed?: boolean;
  provider?: ShipmentProvider | "";
  carrier?: string;
  containerNumber?: string;
  trackingNumber?: string;
  orderId?: number | string;
  orderReference?: string;
  etaFrom?: string;
  etaTo?: string;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?:  "ASC" | "DESC";
};

export type SeaModeDetails = {
  vesselName: string;
  voyage: string;
  billOfLading: string;
  cbm: number;
};

export type AirModeDetails = {
  awb: string;
  flightNumber: string;
  originAirport: string;
  destinationAirport: string;
  chargeableWeightKg: number;
};

/** Only the ETA and at least one order are required; everything else may be left out. */
export type AddShipmentPayload = {
  mode: ShipmentMode;
  estimatedDelivery: string;
  orderIds: number[];
  carrier?: string;
  trackingNumber?: string;
  containerNumber?: string;
  etd?: string;
  originPort?: string;
  destinationPort?: string;
  deliveryLocation?: string;
  totalWeight?: number;
  totalCost?: number;
  provider?: ShipmentProvider;
  notes?: string;
  modeDetails?: Partial<SeaModeDetails> | Partial<AirModeDetails>;
};

export type BalePrice = {
  price: string;
  piece: string;
};

export type BaleProduct = {
  images: string[];
  id: number;
  name: string;
};

export type ShipmentBale = {
  prices: BalePrice[] | null;
  id: number;
  productId: number;
  quantity: number;
  filled: number;
  slot: number;
  filledSlot: number;
  price: number;
  oldPrice: number;
  originalPrice: number | null;
  totalDeliveryFee: number;
  deliveryFee: number;
  currency: string;
  baleId: string;
  startedAt: string;
  restartedCount: number;
  cycle: number;
  endIn: string;
  shipmentId: number;
  createdBy: number | null;
  status: "OPEN" | "CLOSED";
  isSpecial: boolean;
  isSingleSlot: boolean;
  createdAt: string;
  updatedAt: string;
  product: BaleProduct;
};

export type CheckoutMerchant = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export type OrderCheckout = {
  id: number;
  serialNumber: string;
  checkoutType: "DIRECT" | "CART";
  customerId: number;
  status: "PAID" | "PENDING" | "CANCELLED";
  merchant: CheckoutMerchant;
};

export type ShipmentOrder = {
  id: number;
  checkoutId: number;
  baleId: number | null;
  shipmentId: number;
  status: "PAID_IN_FULL" | "PENDING" | "CANCELLED";
  lockPaymentId: number | null;
  totalAmount: number;
  amountPaid: number;
  paymentOption: "full" | "installment";
  upfrontPercent: number | null;
  customerId: number;
  paymentStatus: "PAID" | "PENDING" | "FAILED";
  source: "CUSTOMER" | "ADMIN";
  reference: string;
  publicToken: string;
  interestRate: number | null;
  createdByAdminId: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  checkout: OrderCheckout;
  bale: ShipmentBale | null;
};

export type ShipmentEvent = {
  id: number;
  shipmentId: number;
  /** Null for an event that only moved the ETA or left a note. */
  stage: ShipmentStage | null;
  status: ShipmentStatus;
  title: string | null;
  description: string | null;
  location: string | null;
  occurredAt: string;
  source: "SYSTEM" | "ADMIN" | "PROVIDER";
  visibility: EventVisibility;
  etaSnapshot: string | null;
  meta: Record<string, unknown> | null;
  createdByAdminId: number | null;
  idempotencyKey: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentMetrics = {
  totalBales: number;
  totalOrders: number;
};

export type ShipmentDetails = {
  shipment: SingleShipment;
  bales: ShipmentBale[];
  orders: ShipmentOrder[];
  metrics: ShipmentMetrics;
  events: ShipmentEvent[];
};

/** PATCH is strict: only these keys are accepted, and `null` clears a field. */
export type EditShipmentPayload = {
  expectedVersion: number;
  carrier?: string;
  trackingNumber?: string | null;
  containerNumber?: string | null;
  estimatedDelivery?: string | null;
  etd?: string | null;
  originPort?: string | null;
  destinationPort?: string | null;
  notes?: string | null;
  modeDetails?: Partial<SeaModeDetails> | Partial<AirModeDetails> | null;
  notify?: boolean;
};

export type UpdateShipmentPayload = {
  status: ShipmentStatus;
  expectedVersion: number;
  note?: string;
};

/** At least one of stage, eta or title is required. */
export type AddShipmentEventPayload = {
  stage?: ShipmentStage;
  title?: string;
  description?: string;
  location?: string;
  occurredAt?: string;
  visibility?: EventVisibility;
  eta?: string;
  isDelayed?: boolean;
  notify?: boolean;
  expectedVersion?: number;
};

export type ShipmentEventVoidPayload = {
  reason: string;
};

export type ShipmentEventUpdatePayload = {
  occurredAt: string;
  title: string;
  description: string;
  location: string;
  expectedVersion: number;
};

// Subscriber
export type SubscriberObject = {
  orderId: number;
  checkoutId: number;
  status: string;
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  paymentCohort: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
    shopName: string;
  };
  followUp: {
    needsRemainderPayment: boolean;
    hasOverdueInstallments: boolean;
  };
};

export type SubscriberResponse = {
  success: boolean;
  data: {
    bale: {
      prices: {} | null;
      id: number;
      productId: number;
      quantity: number;
      filled: number;
      slot: number;
      filledSlot: number;
      price: number;
      oldPrice: number;
      originalPrice: number | null;
      totalDeliveryFee: number;
      deliveryFee: number;
      currency: string;
      baleId: string;
      startedAt: string;
      restartedCount: number;
      cycle: number;
      endIn: string;
      shipmentId: number | string | null;
      createdBy: string | null;
      status: "OPEN" | "CLOSED";
      isSpecial: boolean;
      createdAt: string;
      updatedAt: string;
      product: {
        images: string[];
        id: number;
        name: string;
      };
    };
    totalSubscribers: number;
    cohortSummary: {
      completed: number;
      pending: number;
    };
    subscribers: SubscriberObject[];
  };
  message: string;
};

// ─── Admin Add To Cart ───────────────────────────────────────────
export type AdminAddToCart = {
  type: "existing" | "new";
  customer: {
    email: string;
    phone: string;
  };
  productId?: number;
  colorId?: number;
  quantity?: number;
  sizes?:
    | {
        sizeId: number;
        quantity: number;
      }[]
    | string[];
  colorSelections?: {
    colorId: number;
    quantity: number;
    sizes: [
      {
        sizeId: number;
        quantity: number;
      },
    ];
  }[];
  product?: {};
  colors?: {
    color: string;
    otherColor?: string;
    images: string[];
    hex?: string;
  }[];
};

// Analytics_________________
export type EventCategory =
  | "USER"
  | "PRODUCT"
  | "WISHLIST"
  | "CART"
  | "SEARCH"
  | "CHECKOUT"
  | "PAYMENT"
  | "ORDER"
  | "BALE"
  | "RFQ";

export type EventSource = "web" | "mobile_ios" | "mobile_android" | "server";

export type AnalyticsOverviewParams = {
  from?: string;
  to?: string;
  granularity?: "day" | "week" | "month";
};

export type AnalyticsSource =
  | "web"
  | "mobile_ios"
  | "mobile_android"
  | "server";

export type AnalyticsResourceType =
  | "product"
  | "order"
  | "checkout"
  | "bale"
  | "rfq";

export type AnalyticsParams = {
  event_name?: string;
  event_category?: EventCategory;
  user_id?: number | null;
  resource_type?: AnalyticsResourceType;
  resource_id?: string;
  source?: AnalyticsSource;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type ConversionSteps =
  | "PRODUCT_VIEWED"
  | "CART_ITEM_ADDED"
  | "CHECKOUT_CREATED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_COMPLETED";

export type AnalyticsFunnelParams = {
  steps?: ConversionSteps;
  from?: string;
  to?: string;
};

export type TopProductAnalyticsParams = {
  metric?: "views" | "saves" | "orders";
  from?: string;
  to?: string;
  limit?: number;
};

export type CartAbandonmentParams = {
  from: string;
  to: string;
  hours: number;
  page: number;
  limit: number;
};

export type UserAnalyticsEvent = "USER_REGISTERED" | "USER_LOGIN";

export type ProductAnalyticsEvent = "PRODUCT_VIEWED" | "PRODUCT_LIST_VIEWED";

export type WishListAnalyticsEvent = "PRODUCT_SAVED" | "PRODUCT_UNSAVED";

export type CartAnalyticsEvent =
  | "CART_ITEM_ADDED"
  | "CART_ITEM_REMOVED"
  | "CART_CLEARED";

export type SearchAnalyticsEvent = "SEARCH_PERFORMED";

export type CheckoutAnalyticsEvent = "CHECKOUT_CREATED" | "CHECKOUT_ABANDONED";

export type PaymentAnalyticsEvent =
  | "PAYMENT_INITIATED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_FAILED";

export type OrderAnalyticsEvent =
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "REVIEW_SUBMITTED"
  | "INSTALLMENT_PAYMENT_INITIATED";

export type BaleAnalyticsEvent = "BALE_JOINED";

export type RFQAnalyticsEvent = "RFQ_CREATED" | "RFQ_VIEWED";

export type AnalyticsEvent =
  | UserAnalyticsEvent
  | ProductAnalyticsEvent
  | WishListAnalyticsEvent
  | CartAnalyticsEvent
  | SearchAnalyticsEvent
  | CheckoutAnalyticsEvent
  | PaymentAnalyticsEvent
  | OrderAnalyticsEvent
  | BaleAnalyticsEvent
  | RFQAnalyticsEvent;

export type AnalyticsResponse = {
  active_users: number;
  total_events: number;
  events_by_category: {
    event_name: AnalyticsEvent;
    count: number;
  }[];
  daily_active_users: {
    day: string;
    count: number;
  }[];
  payment_funnel: {
    step: AnalyticsEvent;
    count: number;
    conversion_rate: number | null;
  }[];
};

export type RawAnalyticsItem = {
  id: number;
  event_id: string;
  user_id: number | null;
  user_type: string;
  session_id: string;
  event_category: EventCategory;
  event_name: AnalyticsEvent;
  source: AnalyticsSource;
  resource_type: AnalyticsResourceType;
  resource_id: string;
  properties: {
    price: number;
    category: string;
    currency: string;
  };
  platform: string;
  ip_address: string;
  occurred_at: string;
  received_at: string;
};

export type RawAnalyticsResponse = {
  success: boolean;
  data: RawAnalyticsItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

// Library
export type LibraryParams = {
  page?: number;
  limit?: number;
  isActive?: boolean;
};

export type LibraryPayload = {
  title: string;
  description: string;
  fileUrl: string;
  isActive: boolean;
};

export type SingleLibrary = {
  id: number;
  title: string;
  description: string;
  fileUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetLibrariesResponse = {
  success: boolean;
  data: SingleLibrary[];
  message: string;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Admin
export type AddAdmin = {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  role: string;
};

// Rates
export type SingleRate = {
  id: number;
  Name: string;
  Short_Name: string;
  Symbol: string;
  Rate: string;
  createdAt: string;
  updatedAt: string;
};

export type RateHistory = {
  id: number;
  currencyId: number;
  rate: string;
  adminId: number;
  effectiveAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SingleLogisticsRate = {
  method: "SEA" | "AIR";
  currency: string;
  ratePerCbm: number | null;
  effectiveAt: string | null;
};

export type UpdateRatePayload = {
  method: "SEA" | "AIR";
  currency: string;
  ratePerCbm: number;
};

export type SingleInspectionRate = {
  tier: InspectionDepth;
  feeKobo: number;
  source: string;
  effectiveAt: string | null;
};

export type UpdateInspectRate = {
  tier: InspectionDepth;
  feeKobo: number;
};

export type InspectTierHistory = {
  id: number;
  tier: InspectionDepth;
  feeKobo: number;
  adminId: number;
  effectiveAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentOption = "full" | "installment";

export type LogisticStatus =
  | "pending"
  | "accepted"
  | "processing"
  | "rejected"
  | "canceled"
  | "complete"
  | "close";

export type PaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "paid_in_full"
  | "defaulted";

export type ServiceType = "travel" | "logistics";

export type ServiceRequestFilters = {
  type?: "hotel" | "sim" | "vpn" | "sim_vpn" | "flight";
  serviceType: ServiceType;
  status?: LogisticStatus | null;
  startDate?: string;
  endDate?: string;
  departureDate?: string;
  paymentOption: PaymentOption | null;
  paymentStatus: PaymentStatus | null;
  page: number;
  limit: number;
};

export type SingleLogisticsRow = {
  id: string;
  userId: number;
  serviceId: string | null;
  referenceCode: string | null;
  status: LogisticStatus;
  amount: string;
  currency: string;
  notes: string | null;
  serviceType: ServiceType;
  images: string[];
  description: string;
  currentAddress: string;
  destination: string;
  phone: string;
  email: string;
  fullName: string;
  checkinDate: string | null;
  checkoutDate: string | null;
  flightId: string | null;
  departureDate: string | null;
  paymentOption: PaymentOption | null;
  paymentStatus: PaymentStatus | null;
  upfrontPercent: number | null;
  amountPaid: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  service: string | null;
  transactionHistory: [];
};

export type LogisticsResponse = {
  rows: SingleLogisticsRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Customer Types
export type CustomerParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export type SingleCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  accountSource: string | null;
  mustChangePassword: boolean;
  tempPasswordExpiresAt: string | null;
  welcomeSentAt: string | null;
};

export type CustomerResponse = {
  success: true;
  data: SingleCustomer[];
  message: string;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AddCustomerPayload = {
  name: string;
  email: string;
  phone: string;
  /** Optional: defaults to the customer's name. */
  shopName?: string;
  /** Optional. */
  address?: string;
  /** Optional, at least 8 characters. Left out, the server makes one and emails it to the customer. */
  temporaryPassword?: string;
};

/** The payment states an admin can record on a new order. There is no REFUNDED. */
export type OrderPaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export type OrderPaymentMethod = "bank_transfer" | "cash" | "cheque" | "pos" | "other";

/** How and when a payment was received. Every field is optional on the backend. */
export type OfflinePaymentDetails = {
  method?: OrderPaymentMethod;
  bankReference?: string;
  /** ISO date-time; not more than 24 hours in the future. */
  paidAt?: string;
  note?: string;
};

export type OfflineOrderItem = {
  /** A catalog product, or leave out for a free-text line (then `name` is required). */
  productId?: number;
  name?: string;
  /** https only. */
  image?: string;
  quantity: number;
  /** Naira, final: the backend does not reprice it. */
  unitPrice: number;
  colorId?: number;
  sizeId?: number;
};

export type OfflineOrderPayment =
  | { state: "UNPAID" }
  | ({ state: "PAID"; amount?: number } & OfflinePaymentDetails)
  /** Give exactly one of percent (50 to under 100) or amount (at least half the total, under the total). */
  | ({ state: "PARTIAL"; percent?: number; amount?: number } & OfflinePaymentDetails);

export type AddCustomerOrderPayload = {
  customer: { id: number };
  items: OfflineOrderItem[];
  payment: OfflineOrderPayment;
  balance?: {
    /** YYYY-MM-DD */
    dueDate?: string;
    /** 0 to 50 */
    interestPercent?: number;
  };
  notifyCustomer?: boolean;
  notes?: string;
};

// Offline orders & payments
export type OfflinePaymentPayload = { amount: number } & OfflinePaymentDetails;

// Admin Profile
export type Admin = {
  id: number,
  name: string,
  email: string,
  phoneNumber: string,
  status: boolean,
  role: {
    id: number,
    key: string,
    name: string,
    isSystem: boolean
  },
  createdAt: string,
  updatedAt: string
}

export type Admins = {
  data: Admin[],
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

export type AdminProfileDetails = {
  admin: Admin,
  isSuper: boolean,
  permissions: string[]
};

export type AdminParams = {
  search?: string;
  roleId?: number;
  // status?: boolean;
  page?: number;
  limit?: number;
}

export type Role = {
  id: number,
  key: string,
  name: string,
  description: string,
  isSystem: boolean,
  locked: boolean,
  permissions: string[],
  adminCount: number
};

export type AddAdminPayload = {
  email: string,
  password: string,
  name: string,
  phoneNumber: string,
  roleId: number,
  role: string
}

export type PatchAdminPayload = {
  name: string,
  phoneNumber: string,
  roleId: number,
  status: boolean
}

export type AddRolePayload = {
  key: string,
  name: string,
  description: string,
  permissions: string[]
}

export type EditRolePayload = {
  name: string,
  description: string,
  permissions: string[]
}

export type PermissionGroup = {
  resource: string;
  label: string;
  description: string;
  actions: string[];
  permissions: string[];
};


// Nav types
export type NavLinkItem = {
  title: string;
  href: string;
  icon: ReactNode;
  /** extra path prefixes that should highlight this link (e.g. its tab pages) */
  matchPaths?: string[];
  /** only match href exactly (for /dashboard) */
  exact?: boolean;
};

export type NavSection = { label?: string; links: NavLinkItem[] };

export type PageTab = { title: string; href: string };
export type PageTabGroup = { id: string; tabs: PageTab[] };