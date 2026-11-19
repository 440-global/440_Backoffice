"use client";

import { useAuth } from "@/hooks/use-auth";
import { can, type Permission } from "@/lib/permissions";

/** `const canVoid = useCan("order.voidPayment")` - false when the signed-in admin's role would get a 403. */
export function useCan(permission: Permission): boolean {
  const { user } = useAuth();
  return can(user?.role, permission);
}
