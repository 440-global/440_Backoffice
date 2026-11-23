"use client";

import { useAuth } from "@/hooks/use-auth";
import { can, type Permission } from "@/lib/permissions";

/** Only the new `resource:action` keys (the legacy dotted ones are left out on purpose). */
type ColonPermission = Extract<Permission, `${string}:${string}`>;

/** "orders" | "admins" | "shipments" ... */
export type Resource = ColonPermission extends infer P
  ? P extends `${infer R}:${string}`
    ? R
    : never
  : never;

/** The actions that exist for one resource: ActionOf<"rfq"> = "manage" | "update" | "view" */
export type ActionOf<R extends Resource> = ColonPermission extends infer P
  ? P extends `${R}:${infer A}`
    ? A
    : never
  : never;

/** The resources that have a given action: ResourceWith<"delete"> = "admins" | "catalog" | ... */
export type ResourceWith<A extends string> = ColonPermission extends infer P
  ? P extends `${infer R}:${A}`
    ? R
    : never
  : never;

/** Same check as useCan, but usable outside React (route guards, utils). */
export function canDo<R extends Resource>(
  user: { role?: string; permissions?: readonly string[] } | null | undefined,
  resource: R,
  action: ActionOf<R>,
): boolean {
  return can(user?.permissions, `${resource}:${action}` as Permission, user?.role);
}

/** `const canVoid = useCan("order.voidPayment")` - works for any key, including the legacy dotted ones. */
export function useCan(permission: Permission): boolean {
  const { user } = useAuth();
  return can(user?.permissions, permission, user?.role);
}

/** `useCanDo("shipments", "create")` - the action is typed from the resource, so ("rfq", "create") won't compile. */
export function useCanDo<R extends Resource>(resource: R, action: ActionOf<R>): boolean {
  const { user } = useAuth();
  return canDo(user, resource, action);
}

/** `useCanManage("admins")`, `useCanView("orders")` ... each only accepts resources that have that action. */
export const useCanView = (resource: ResourceWith<"view">) => useCanDo(resource, "view" as never);
export const useCanCreate = (resource: ResourceWith<"create">) => useCanDo(resource, "create" as never);
export const useCanUpdate = (resource: ResourceWith<"update">) => useCanDo(resource, "update" as never);
export const useCanDelete = (resource: ResourceWith<"delete">) => useCanDo(resource, "delete" as never);
export const useCanManage = (resource: ResourceWith<"manage">) => useCanDo(resource, "manage" as never);