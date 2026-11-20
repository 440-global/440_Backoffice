"use client";

import { usePatchServiceOrderStatus, useServiceOrder } from "@/api/travel";
import { Badge, Button } from "@/components/ui";
import { useToast } from "@/components/ui/toast/ToastContext";
import type {
  PatchServiceOrderStatusBody,
  ServiceOrderStatus,
} from "@/types/travel";
import { ORDER_STATUS_TRANSITIONS } from "@/types/travel";
import { useEffect, useMemo, useState } from "react";
import { RiCloseLine, RiLoader4Fill } from "react-icons/ri";

type Props = {
  orderId: string | null;
  onClose: () => void;
};

function isServiceOrderStatus(s: string): s is ServiceOrderStatus {
  return (
    s === "pending" ||
    s === "accepted" ||
    s === "processing" ||
    s === "rejected" ||
    s === "canceled" ||
    s === "complete" ||
    s === "close"
  );
}

function formatDate(iso: unknown): string {
  if (typeof iso !== "string") return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function displayScalar(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  ) {
    return String(v);
  }
  return "—";
}

function statusBadgeVariant(
  status: string
): "primary" | "secondary" | "warning" | "success" | "danger" {
  switch (status) {
    case "pending":
      return "warning";
    case "accepted":
    case "processing":
      return "primary";
    case "complete":
      return "success";
    case "rejected":
    case "canceled":
      return "danger";
    default:
      return "secondary";
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-(--table-border) py-4 last:border-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-(--muted)">
        {title}
      </h3>
      <div className="space-y-0">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-1 py-1.5 text-sm sm:grid-cols-[9rem_1fr]">
      <dt className="text-(--muted)">{label}</dt>
      <dd className="min-w-0 wrap-break-word font-medium">{value}</dd>
    </div>
  );
}

export default function ServiceOrderDetailPanel({ orderId, onClose }: Props) {
  const { toast } = useToast();
  const { data: order, isPending, isError } = useServiceOrder(orderId);
  const patchMut = usePatchServiceOrderStatus();

  const [selection, setSelection] = useState<{
    orderId: string | null;
    status: PatchServiceOrderStatusBody["status"] | "";
  }>({ orderId: null, status: "" });
  
  // A selection only counts for the order it was made on.
  const selectedStatus = selection.orderId === orderId ? selection.status : "";
  const setSelectedStatus = (status: PatchServiceOrderStatusBody["status"] | "") =>
    setSelection({ orderId, status });

  useEffect(() => {
    if (!orderId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [orderId, onClose]);

  useEffect(() => {
    if (!orderId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [orderId]);

  const currentStatus: ServiceOrderStatus = useMemo(() => {
    if (!order || typeof order.status !== "string") return "pending";
    return isServiceOrderStatus(order.status) ? order.status : "pending";
  }, [order]);

  const allowedNext = ORDER_STATUS_TRANSITIONS[currentStatus];

  const applyStatus = async () => {
    if (!orderId || !selectedStatus) return;
    try {
      await patchMut.mutateAsync({
        orderId,
        body: { status: selectedStatus },
      });
      toast({
        title: "Status updated",
        description: "",
        variant: "success",
      });
      setSelectedStatus("");
    } catch {
      toast({
        title: "Status update failed",
        description: "The server may reject invalid transitions.",
        variant: "danger",
      });
    }
  };

  if (!orderId) return null;

  const user =
    order?.user && typeof order.user === "object" && order.user !== null
      ? (order.user as Record<string, unknown>)
      : null;
  const service =
    order?.service && typeof order.service === "object" && order.service !== null
      ? (order.service as Record<string, unknown>)
      : null;
  const txHistory = order?.transactionHistory;
  const txRows = Array.isArray(txHistory) ? txHistory : [];

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-100 bg-black/40 transition-opacity md:bg-black/30"
        onClick={onClose}
      />

      <aside
        className="fixed inset-y-0 right-0 z-110 flex w-full max-w-xl flex-col border-l border-(--table-border) bg-(--surface) shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="travel-order-panel-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-(--table-border) p-4">
          <div className="min-w-0">
            <h2
              id="travel-order-panel-title"
              className="text-lg font-semibold"
            >
              Order details
            </h2>
            {order && typeof order.referenceCode === "string" && order.referenceCode ? (
              <p className="mt-0.5 font-mono text-sm text-(--primary)">
                {order.referenceCode}
              </p>
            ) : null}
            <p className="mt-1 font-mono text-xs text-(--muted) break-all">
              {orderId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-(--muted) hover:bg-(--background) hover:text-(--foreground)"
            aria-label="Close"
          >
            <RiCloseLine className="h-6 w-6" />
          </button>
        </div>

        <div className="shrink-0 border-b border-(--table-border) bg-(--card) p-4">
          {isPending ? (
            <div className="flex items-center gap-2 text-sm text-(--muted)">
              <RiLoader4Fill className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : isError || !order ? (
            <p className="text-sm text-red-600">
              Could not load this order. Try again from the list.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-(--muted)">Status</span>
                <Badge
                  variant={statusBadgeVariant(currentStatus)}
                  className="lowercase"
                >
                  {currentStatus}
                </Badge>
              </div>
              {allowedNext.length > 0 ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-50">
                  <label className="text-xs text-(--muted)">New status</label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={selectedStatus}
                      onChange={(e) =>
                        setSelectedStatus(
                          e.target
                            .value as PatchServiceOrderStatusBody["status"] | ""
                        )
                      }
                      className="w-full rounded-xl border border-(--table-border) bg-(--card) px-3 py-2 text-sm"
                    >
                      <option value="">Choose…</option>
                      {allowedNext.map((s) => (
                        <option
                          key={s}
                          value={s as PatchServiceOrderStatusBody["status"]}
                        >
                          {s}
                        </option>
                      ))}
                    </select>
                    <Button
                      primary
                      type="button"
                      onClick={applyStatus}
                      disabled={!selectedStatus}
                      isLoading={patchMut.isPending}
                      className="shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-(--muted)">No further changes.</p>
              )}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isPending || isError || !order ? null : (
            <>
              <Section title="Summary">
                <Row label="Amount" value={`${displayScalar(order.amount)} ${displayScalar(order.currency)}`} />
                <Row label="Service type" value={displayScalar(order.serviceType)} />
                <Row label="Created" value={formatDate(order.createdAt)} />
                <Row label="Updated" value={formatDate(order.updatedAt)} />
              </Section>

              {(order.checkinDate != null ||
                order.checkoutDate != null ||
                order.destination != null ||
                order.phone != null) && (
                <Section title="Booking">
                  <Row label="Check-in" value={formatDate(order.checkinDate)} />
                  <Row label="Check-out" value={formatDate(order.checkoutDate)} />
                  <Row label="Destination" value={displayScalar(order.destination)} />
                  <Row label="Phone" value={displayScalar(order.phone)} />
                </Section>
              )}

              {(order.notes != null ||
                order.description != null) && (
                <Section title="Notes">
                  {order.description != null && (
                    <Row label="Description" value={displayScalar(order.description)} />
                  )}
                  {order.notes != null && (
                    <Row label="Notes" value={displayScalar(order.notes)} />
                  )}
                </Section>
              )}

              {user && (
                <Section title="Customer">
                  <Row label="Name" value={displayScalar(user.name)} />
                  <Row label="Email" value={displayScalar(user.email)} />
                  <Row label="Shop" value={displayScalar(user.shop_name)} />
                  <Row label="Phone" value={displayScalar(user.phone)} />
                </Section>
              )}

              {service && (
                <Section title="Catalog service">
                  <Row label="Name" value={displayScalar(service.name)} />
                  <Row label="Type" value={displayScalar(service.type)} />
                  <Row
                    label="Price"
                    value={`${displayScalar(service.price)} ${displayScalar(service.currency)}`}
                  />
                  {service.address != null && (
                    <Row label="Address" value={displayScalar(service.address)} />
                  )}
                  {Array.isArray(service.contactPersons) &&
                    service.contactPersons.length > 0 && (
                      <Row
                        label="Contacts"
                        value={
                          <ul className="list-inside list-disc space-y-1">
                            {service.contactPersons.map((cp, i) => {
                              const c =
                                cp &&
                                typeof cp === "object" &&
                                cp !== null
                                  ? (cp as Record<string, unknown>)
                                  : null;
                              if (!c) return null;
                              const nm = displayScalar(c.name);
                              const ph = displayScalar(c.phone);
                              return (
                                <li key={String(c.id ?? i)}>
                                  {nm}
                                  {ph !== "—" ? ` · ${ph}` : ""}
                                </li>
                              );
                            })}
                          </ul>
                        }
                      />
                    )}
                </Section>
              )}

              {Array.isArray(order.images) && order.images.length > 0 && (
                <Section title="Images">
                  <div className="flex flex-wrap gap-2">
                    {order.images.map((img, i) => {
                      const src =
                        typeof img === "string"
                          ? img
                          : img &&
                              typeof img === "object" &&
                              img !== null &&
                              "url" in img &&
                              typeof (img as { url?: unknown }).url === "string"
                            ? (img as { url: string }).url
                            : null;
                      if (!src) return null;
                      return (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-lg border border-(--table-border)"
                        >
                          <img
                            src={src}
                            alt=""
                            className="h-24 w-24 object-cover"
                          />
                        </a>
                      );
                    })}
                  </div>
                </Section>
              )}

              {txRows.length > 0 && (
                <Section title="Transactions">
                  <div className="overflow-x-auto rounded-xl border border-(--table-border)">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-(--background) text-(--muted)">
                        <tr>
                          <th className="p-2 font-medium">When</th>
                          <th className="p-2 font-medium">Amount</th>
                          <th className="p-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txRows.map((row, i) => {
                          const r =
                            row &&
                            typeof row === "object" &&
                            row !== null
                              ? (row as Record<string, unknown>)
                              : {};
                          return (
                            <tr
                              key={String(r.id ?? i)}
                              className="border-t border-(--table-border)"
                            >
                              <td className="p-2 align-top">
                                {formatDate(r.createdAt)}
                              </td>
                              <td className="p-2 align-top">
                                {displayScalar(r.amount)}{" "}
                                {displayScalar(r.currency)}
                              </td>
                              <td className="p-2 align-top lowercase">
                                {displayScalar(r.status)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
