/**
 * Which admin roles may do what, copied from the backend route guards (`requireRole(...)` in
 * app/routes/btob/*.routes.ts). The backend is still the one that enforces this; the UI uses it only to
 * hide actions that would come back 403. Change a route's role list there and change it here too.
 */

export const ADMIN_ROLES = [
  "super_admin",
  "finance_admin",
  "operations_admin",
  "support_admin",
  "read_only",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSIONS = {
  "customer.create": ["super_admin", "operations_admin", "support_admin"],
  "customer.resendWelcome": ["super_admin", "operations_admin", "support_admin"],

  "order.createOffline": ["super_admin", "operations_admin", "support_admin", "finance_admin"],
  "order.addPayment": ["super_admin", "finance_admin"],
  "order.voidPayment": ["super_admin"],

  "payments.update": ["super_admin", "finance_admin", "support_admin"],

  "shipment.write": ["super_admin", "operations_admin", "support_admin"],
  "shipment.update": ["super_admin", "operations_admin", "support_admin"],

  "shippingCharge.write": ["super_admin", "operations_admin", "finance_admin", "support_admin"],
  "shippingCharge.markPaid": ["super_admin", "finance_admin", "support_admin"],
  "shippingCharge.reverse": ["super_admin", "support_admin"],
  "shippingSettings.write": ["super_admin", "finance_admin", "support_admin"],

  "product.purchaseOptions": ["super_admin", "operations_admin"],
  "product.duplicateCheck": ["super_admin", "operations_admin", "support_admin"],
} as const satisfies Record<string, readonly AdminRole[]>;

export type Permission = keyof typeof PERMISSIONS;

const KNOWN = new Set<string>(ADMIN_ROLES);

/**
 * True when `role` may do `permission`. A role the backend does not know (an old account, a typo) is not
 * hidden from anything: the backend answers for it, and a missing button would only hide why it fails.
 */
export function can(role: string | null | undefined, permission: Permission): boolean {
  if (!role || !KNOWN.has(role)) return true;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}
