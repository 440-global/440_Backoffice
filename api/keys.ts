/**
 * One place for react-query keys, so a mutation can name exactly what it made stale instead of guessing at
 * strings. Keep each key's first segment equal to the string the matching query already used: invalidating
 * a prefix refreshes every variant (`qk.shipments.all` refreshes every filter of the list).
 */
export const qk = {
  products: {
    all: ["products"] as const,
    detail: (id: number) => ["product", id] as const,
    purchaseOptions: (id: number) => ["product", id, "purchase-options"] as const,
  },
  subCategory: {
    byCategory: (categoryId: number | string) => ["sub-category", "by-category", categoryId] as const,
    one: (id: number | string) => ["sub-category", "one", id] as const,
  },
  bales: {
    all: ["bales"] as const,
    detail: (id: number | string) => ["bales", id] as const,
  },
  customers: { all: ["customers"] as const },
  orders: {
    all: ["admin", "orders"] as const,
    detail: (id: number) => ["admin", "orders", id] as const,
  },
  shipments: {
    all: ["shipments"] as const,
    detail: (id: number) => ["shipments", id] as const,
  },
  shippingCharges: {
    forOrder: (orderId: number) => ["shipping-charges", orderId] as const,
  },
  shippingSettings: { all: ["shipping-settings"] as const },
  admins: {
    all: ['admins'] as const,
    detail: (id: number) => ["admins", id] as const
  },
  roles: {
    all: ['roles'] as const,
    detail: (id: number) => ["roles", id] as const
  }
} as const;
