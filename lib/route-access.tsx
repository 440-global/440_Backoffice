"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { can, type Permission } from "@/lib/permissions";
import { RiForbidLine } from "react-icons/ri";

/**
 * One place that says which permission a page needs. Adjust the paths to your real routes.
 * The longest matching prefix wins, so "/orders/new" can be stricter than "/orders".
 * A path with no entry is open to every signed-in admin.
 */
const BASE = "/dashboard";

const ROUTE_PERMISSIONS: { prefix: string; permission: Permission; exact?: boolean }[] = [
  // { prefix: BASE, permission: "analytics:view", exact: true },
  { prefix: `${BASE}/admins`, permission: "admins:view" },
  { prefix: `${BASE}/analytics`, permission: "analytics:view" },
  { prefix: `${BASE}/bales`, permission: "bales:view" },
  { prefix: `${BASE}/cities`, permission: "suppliers:view" },
  { prefix: `${BASE}/customers`, permission: "customers:view" },
  { prefix: `${BASE}/finance`, permission: "finance:view" },
  { prefix: `${BASE}/inspections`, permission: "services:view" },
  { prefix: `${BASE}/library`, permission: "library:view" },
  { prefix: `${BASE}/logistics`, permission: "services:view" },
  { prefix: `${BASE}/markets`, permission: "suppliers:view" },
  { prefix: `${BASE}/orders`, permission: "orders:view" },
  { prefix: `${BASE}/pay-merchant`, permission: "payments:create" },
  { prefix: `${BASE}/products`, permission: "products:view" },
  { prefix: `${BASE}/products/stats`, permission: "analytics:view" },
  { prefix: `${BASE}/rates`, permission: "rates:view" },
  { prefix: `${BASE}/rfqs`, permission: "rfq:view" },
  { prefix: `${BASE}/roles`, permission: "roles:view" },
  { prefix: `${BASE}/shipments`, permission: "shipments:view" },
  { prefix: `${BASE}/shipping-charges`, permission: "shipping:view" },
  { prefix: `${BASE}/supplier-verifications`, permission: "services:view" },
  { prefix: `${BASE}/suppliers`, permission: "suppliers:view" },
  { prefix: `${BASE}/support`, permission: "support:view" },
  { prefix: `${BASE}/taxi-bookings`, permission: "travel:view" },
  { prefix: `${BASE}/telegram`, permission: "telegram:view" },
  { prefix: `${BASE}/travel-services`, permission: "travel:view" },
];

export function requiredPermission(pathname: string): Permission | null {
  const match = ROUTE_PERMISSIONS
    .filter(({ prefix, exact }) =>
      exact
        ? pathname === prefix
        : pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return match?.permission ?? null;
}

/** Same check for the sidebar: `items.filter((i) => canAccess(role, i.href))`. */
export function canAccess(user: { role?: string; permissions?: readonly string[] } | null | undefined, pathname: string) {
  const required = requiredPermission(pathname);
  return !required || can(user?.permissions, required, user?.role);
}

function Forbidden() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <RiForbidLine size={60} className="text-red-500" />
      <h1 className="text-xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="text-sm text-muted-foreground">Ask a super admin to change your role if you need it.</p>
    </div>
  );
}

/**
 * Wrap `children` with this in the dashboard layout. It reads the pathname, so it re-checks on every
 * navigation even though the layout itself does not re-render.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user?.permissions) return null; // wait until permissions have loaded
  if (!canAccess(user, pathname)) return <Forbidden />;
  return <>{children}</>;
}