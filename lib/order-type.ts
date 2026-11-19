import type { AdminOrderListItem } from "@/types/types";

type OrderTypeSource = Pick<AdminOrderListItem, "checkoutType" | "checkout">;

export function getOrderType(order: OrderTypeSource): "bale" | "direct" | null {
  const raw = (order.checkout?.checkoutType ?? order.checkoutType ?? "").trim().toUpperCase();
  if (raw === "BALE") return "bale";
  if (raw === "DIRECT") return "direct";
  return null;
}

export function formatOrderTypeLabel(order: OrderTypeSource): string {
  const t = getOrderType(order);
  if (t === "bale") return "Bale";
  if (t === "direct") return "Direct";
  return "—";
}
