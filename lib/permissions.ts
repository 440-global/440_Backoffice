/**
 * Permission checks for the UI. The backend decides what each role can do and sends the signed-in
 * admin's permission list (for example ["orders:view", "products:create"]). This file only knows the
 * *names* of permissions, never which role has which, so editing a role needs no change here.
 * It only needs an update when the backend adds a brand new resource or action.
 * The backend still enforces everything; the UI uses this to hide actions that would come back 403.
 */

export const RESOURCES = [
  "admins",
  "analytics",
  "app_versions",
  "bales",
  "catalog",
  "customers",
  "finance",
  "library",
  "notifications",
  "orders",
  "payments",
  "products",
  "rates",
  "refunds",
  "rfq",
  "roles",
  "services",
  "shipments",
  "shipping",
  "suppliers",
  "support",
  "telegram",
  "travel",
] as const;
export const ACTIONS = ["view", "create", "update", "delete", "manage"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type Permission = `${Resource}:${Action}`;

/** The permission list the backend returns for the signed-in admin. */
export type PermissionList = readonly string[] | null | undefined;

/**
 * True when the admin's permission list contains `permission`.
 * - A missing list (not loaded yet) is false. Callers that must wait for it (RouteGuard) should check
 *   `user?.permissions` first and render nothing until it exists.
 * - super_admin always passes, so a permission the backend adds later never hides things from it.
 * - If your backend treats `resource:manage` as covering every action on that resource, keep the
 *   `manage` line. If it does not, delete that line so the UI matches the API.
 */
export function can(
  permissions: PermissionList,
  permission: Permission,
  role?: string | null,
): boolean {
  if (role === "super_admin") return true;
  if (!permissions) return false;
  if (permissions.includes(permission)) return true;

  const [resource] = permission.split(":");
  return permissions.includes(`${resource}:manage`);
}