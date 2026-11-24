"use client";

import { ActionDropdown, Button, Card } from "@/components/ui";
import { cn } from "@/components/ui/utils";
import { truncateText } from "@/lib/funcs";
import { fmtNgn as fmt, fmtDateTime } from "@/lib/format";
import {
  SHIPPING_SERVICE_OPTIONS,
  UNIT_INPUT,
  isClosedOrder,
  labelize,
  orderSourceLabel,
} from "@/lib/enums";
import { useCan, useCanCreate, useCanDelete, useCanManage, useCanUpdate } from "@/hooks/use-can";
import {
  adminOrderStatusPillClass,
  orderTypePillClass,
  paymentStatusPillClass,
} from "@/lib/order-badges";
import { formatOrderTypeLabel, getOrderType } from "@/lib/order-type";
import type { AdminOrderDetail } from "@/types/types";
import { useState } from "react";
import {
  RiBillLine,
  RiCalendarScheduleLine,
  RiExternalLinkLine,
  RiHandCoinLine,
  RiHistoryLine,
  RiInfoCardLine,
  RiListCheck,
  RiListCheck2,
  RiPercentLine,
  RiTimeLine,
  RiTruckLine,
} from "react-icons/ri";
import AddOfflinePayment from "./AddOfflinePayment";
import VoidPayment from "./VoidPayment";
import { useGetOrderShippingCharges } from "@/api/shipping";
import AddShipmentCharge from "./AddShipmentCharge";
import MyModal from "../dashboard/Modal";
import type { ShippingCharge } from "@/types/shipping";
import VoidCharge from "./VoidCharge";
import MarkCharge from "./MarkCharge";
import ReverseCharge from "./ReverseCharge";
import UpdateDate from "./UpdateDate";
import CancelOrder from "./CancelOrder";

export function AdminOrderDetailPanel({
  order,
  isPending,
  isError,
  errorMessage,
}: {
  order: AdminOrderDetail | undefined;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [chargeId, setChargeId] = useState<number | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);
  const [charge, setCharge] = useState<ShippingCharge | null>(null);

  const [modalType, setModalType] = useState<'charge' | 'void-charge' | 'patch-charge' | 'mark' | 'reverse' | 'update-payment' | 'update-event' | 'cancel-order' | null>(null);

  const { data: charges, isPending: chargePending, error: chargeError } = useGetOrderShippingCharges(order?.id);
  const canRecordPayment = useCanManage("payments");
  const canVoidPayment = useCanDelete("payments");
  const canVoidShipping = useCanDelete("shipping");
  const canWriteCharge = useCanCreate("shipping");
  const canEditCharge = useCanUpdate("shipping");
  const canMarkPaid = useCanManage("shipping");
  const canReverse = useCanManage("shipping");
  const canUpdateShipment = useCanUpdate("shipments");
  const canUpdatePayment = useCanUpdate("payments");
  const canManageOrders = useCanManage("orders");

  if (isPending) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-(--muted)">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent text-(--primary)" />
        <p className="text-sm">Loading order…</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
        {errorMessage ?? "Could not load this order."}
      </div>
    );
  }

  const checkout = order.checkout;
  const merchant = checkout?.merchant;
  const total = order.totalAmount ?? 0;
  const paid = order.amountPaid ?? 0;
  const items = order.orderItems ?? [];
  const payments = order.btobPayments ?? [];
  const histories = order.orderHistories ?? [];
  const shipmentEvents = order.shipmentEvents ?? [];
  const timeline = order.timeline ?? [];
  const instList = order.btobOrderInstallments ?? [];
  const ps = order.paymentSummary;
  const is = order.installmentSummary;
  const orderType = getOrderType(order);
  const trackingToken = order.trackingToken;

  const visibleItems = open ? items : items.slice(0, 3);

  const shippingCharges = charges?.data.charges ?? [];
  const hasActiveCharge = shippingCharges.some((c) => c.status !== "VOID");
  const orderClosed = isClosedOrder(order.status);
  // One live charge per order, and none on an order the backend no longer charges.
  const canAddCharge = canWriteCharge && !chargePending && !chargeError && !hasActiveCharge && !orderClosed;

  // Payments can only be recorded by hand on orders an admin created, while the order is open and unpaid.
  const isAdminOrder = order.source === "ADMIN_OFFLINE";
  const canAddPayment = canRecordPayment && isAdminOrder && !orderClosed && paid < total;

  return (
    <div className="space-y-5 pb-2">
      {/* Order summary */}
      <div className="mb-4">
        <div className="flex gap-1 items-center mb-2">
          <RiListCheck size={12} />
          <h2 className="font-semibold text-sm">Order Summary</h2>
        </div>
        <Card className="shadow-none py-2! px-4! rounded-xl">
          <ul>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Order Status</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                  adminOrderStatusPillClass(order.status),
                )}
              >
                {order.status}
              </span>
            </li>
            {orderType && (
              <li className="py-1.5 flex justify-between items-center">
                <span className="text-(--muted)">Order Type</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs uppercase",
                    orderTypePillClass(orderType),
                  )}
                >
                  {formatOrderTypeLabel(order)}
                </span>
              </li>
            )}
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Order ID</span>
              <span>#{order.id}</span>
            </li>
            {checkout?.serialNumber && (
              <li className="py-1.5 flex justify-between items-center">
                <span className="text-(--muted)">Checkout ID</span>
                <span>#{checkout.serialNumber}</span>
              </li>
            )}
            {checkout?.status && (
              <li className="py-1.5 flex justify-between items-center">
                <span className="text-(--muted)">Checkout Status</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                    adminOrderStatusPillClass(checkout.status),
                  )}
                >
                  {checkout.status}
                </span>
              </li>
            )}
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Tracking Token</span>
              <span className="">{trackingToken}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Order Reference</span>
              <span className="">{order.reference}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Created by</span>
              <span>
                {orderSourceLabel(order.source)}
                {order.createdByAdminId != null
                  ? ` (admin #${order.createdByAdminId})`
                  : ""}
              </span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Payment</span>
              <span>
                {labelize(order.paymentStatus ?? undefined)}
                {order.paymentOption === "split" && order.upfrontPercent != null
                  ? ` · split, ${order.upfrontPercent}% upfront`
                  : order.paymentOption === "full"
                    ? " · in full"
                    : ""}
              </span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Delivery</span>
              <span>
                {order.deliveryMethod === "DOORSTEP" ? "Doorstep" : "Pickup"}
              </span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Order Placed On</span>
              <span className="">{fmtDateTime(order.placedAt)}</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1 items-center">
            <RiListCheck2 size={12} />
            <h2 className="font-semibold text-sm">Items ({items.length})</h2>
          </div>
          {items.length > 3 && (
            <span
              className="text-xs text-(--primary) font-bold cursor-pointer"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? "See Less" : `See More (${items.length - 3})`}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-(--muted)">No line items.</p>
          ) : (
            visibleItems.map((line) => {
              const img = line.product?.images?.[0];
              return (
                <Card
                  key={line.id}
                  className="flex justify-between items-center py-3! px-3! gap-3 border p-3 sm:gap-4 shadow-none rounded-xl!"
                >
                  <div className="flex gap-1.5">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-(--muted)">
                          No img
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {line.product?.name
                          ? truncateText(line.product.name, 20)
                          : `Product #${line.productId}`}
                      </p>
                      {line.colorId != null && (
                        <span className="text-xs text-(--medium-grey) p-1 bg-(--muted)/15 rounded">
                          Color #{line.colorId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-xs text-(--medium-grey) p-1 bg-(--muted)/15 rounded">
                      Qty ×{line.quantity}
                    </span>
                    <span className="font-semibold">
                      {fmt(line.totalPrice)}
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="mb-4">
        <div className="flex gap-1 items-center mb-2">
          <RiBillLine size={12} />
          <h2 className="font-semibold text-sm">Payment Summary</h2>
        </div>
        <Card className="shadow-none py-2! px-4! rounded-xl">
          <ul>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Successful Amt.</span>
              <span>{fmt(ps?.successfulPaymentAmount)}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Total Payments</span>
              <span>{ps?.totalPayments ?? 0}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Successful Payments</span>
              <span>{ps?.successfulPayments ?? 0}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Failed Payments</span>
              <span>{ps?.failedPayments ?? 0}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Total Amount Paid</span>
              <span>{fmt(paid)}</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Installment Summary */}
      <div className={`mb-4 ${instList.length === 0 ? "hidden" : "block"}`}>
        <div className="flex gap-1 items-center mb-2">
          <RiBillLine size={12} />
          <h2 className="font-semibold text-sm">Installment Summary</h2>
        </div>
        <Card className="shadow-none py-2! px-4! rounded-xl">
          <ul>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Total Installments</span>
              <span>{is?.totalInstallments ?? 0}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Paid Installments</span>
              <span>{is?.paidInstallments ?? 0}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Pending Installments</span>
              <span>{is?.pendingInstallments ?? 0}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Overdue Installments</span>
              <span>{is?.overdueInstallments ?? 0}</span>
            </li>
            <li className="py-1.5 flex justify-between items-center">
              <span className="text-(--muted)">Total Amount</span>
              <span>{fmt(is?.totalInstallmentAmount)}</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Merchant Info */}
      <div className="mb-4">
        <div className="flex items-center gap-1 mb-2">
          <RiInfoCardLine size={12} />
          <h2 className="font-semibold text-sm">Merchant Info</h2>
        </div>
        <Card className="py-2! px-4! rounded-xl shadow-none">
          {merchant ? (
            <ul>
              <li className="py-1.5 flex justify-between items-center">
                <span className="text-(--muted)">Shop</span>
                <span className="capitalize">
                  {merchant.shop_name ?? merchant.name ?? "—"}
                </span>
              </li>
              <li className="py-1.5 flex justify-between items-center">
                <span className="text-(--muted)">Contact</span>
                <span className="capitalize">
                  <dd>{merchant.name ?? "—"}</dd>
                </span>
              </li>
              <li className="py-1.5 flex justify-between items-center">
                <span className="text-(--muted)">Email</span>
                <span>{merchant.email ?? "—"}</span>
              </li>
              <li className="py-1.5 flex justify-between items-center">
                <span className="text-(--muted)">Phone</span>
                <span className="capitalize">{merchant.phone ?? "—"}</span>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-(--muted)">No merchant on record.</p>
          )}
        </Card>
      </div>

      {/* Payments */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1">
            <RiHandCoinLine size={12} />
            <h3 className="text-sm font-semibold">
              Payments ({payments.length})
            </h3>
          </div>
          {canAddPayment && (
            <Button
              primary
              className="py-1! px-3! rounded-lg! text-sm!"
              onClick={() => setPaymentModalOpen(true)}
            >
              Add Payment
            </Button>
          )}
        </div>
        {!isAdminOrder && (
          <p className="mb-2 text-xs text-(--muted)">
            This is a customer order: payments are taken online, so none can be
            added by hand.
          </p>
        )}
        {payments.length === 0 ? (
          <p className="text-sm text-(--muted)">No payment records.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-(--muted)/30">
            <table className="w-full min-w-130 text-sm">
              <thead>
                <tr className="border-b border-(--muted)/30 bg-muted/50 text-left text-xs text-(--muted)">
                  <th className="p-2 font-medium">Ref</th>
                  <th className="p-2 font-medium">Amount</th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2 font-medium">Purpose</th>
                  <th className="p-2 font-medium">Provider</th>
                  <th className="p-2 font-medium">Link</th>
                  <th className="p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const paymentActions = [
                    ...(canUpdatePayment
                      ? [
                          {
                            label: "Edit payment date",
                            onClick: () => {
                              setModalType("update-payment");
                              setSelectedPaymentId(p.id);
                            },
                          },
                        ]
                      : []),
                    ...(canVoidPayment &&
                    p.provider === "OFFLINE" &&
                    p.status === "SUCCESS"
                      ? [
                          {
                            label: "Void payment",
                            onClick: () => {
                              setVoidModalOpen(true);
                              setSelectedPaymentId(p.id);
                            },
                            danger: true,
                          },
                        ]
                      : []),
                  ];
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-(--muted)/30 last:border-0"
                    >
                      <td className="max-w-35 truncate p-2 font-mono text-xs">
                        {p.reference ?? p.id}
                      </td>
                      <td className="p-2 tabular-nums">
                        {fmt(p.amount)} {p.currency ? ` ${p.currency}` : ""}
                      </td>
                      <td className="p-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                            paymentStatusPillClass(p.status),
                          )}
                        >
                          {p.status ?? "—"}
                        </span>
                      </td>
                      <td className="p-2">{p.purpose ?? "—"}</td>
                      <td className="p-2 capitalize">{p.provider ?? "—"}</td>
                      <td className="p-2">
                        {p.paymentLink ? (
                          <a
                            href={p.paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:underline"
                          >
                            Pay
                            <RiExternalLinkLine className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2">
                        {paymentActions.length > 0 && (
                          <ActionDropdown actions={paymentActions} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shipping Charges */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1">
            <RiPercentLine size={12} />
            <h3 className="text-sm font-semibold">Shipping Charges</h3>
          </div>
          {canWriteCharge && (
            <Button
              primary
              className="py-1! px-3! rounded-lg! text-sm!"
              onClick={() => setModalType("charge")}
              disabled={!canAddCharge}
              title={
                orderClosed
                  ? `A ${labelize(order.status).toLowerCase()} order cannot be charged shipping`
                  : hasActiveCharge
                    ? "This order already has a shipping charge. Edit or void it first."
                    : undefined
              }
            >
              Add charge
            </Button>
          )}
        </div>

        {chargePending ? (
          <div className="flex flex-col items-center justify-center gap-3 py-4 text-(--muted)">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Loading charges…</p>
          </div>
        ) : chargeError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Could not load shipping charges.
          </div>
        ) : shippingCharges.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-4 text-center text-sm text-(--muted)">
            No shipping charges for this order
            {charges?.data.order.deliveryMethod === "PICKUP"
              ? " (pickup order)."
              : "."}
          </p>
        ) : (
          <div className="space-y-3">
            {shippingCharges.map((c) => {
              const isVoided = c.status === "VOID";
              const isPaid = c.status === "PAID";
              const isOpen = c.status === "OPEN";

              const actions = [
                ...(isOpen && canEditCharge
                  ? [
                      {
                        label: "Edit charge",
                        onClick: () => {
                          setModalType("patch-charge");
                          setCharge(c);
                        },
                      },
                    ]
                  : []),
                ...(isOpen && canMarkPaid
                  ? [
                      {
                        label: "Mark as paid",
                        onClick: () => {
                          setModalType("mark");
                          setChargeId(c.id);
                          setCharge(c);
                        },
                      },
                    ]
                  : []),
                ...(isOpen && canVoidShipping
                  ? [
                      {
                        label: "Void charge",
                        onClick: () => {
                          setModalType("void-charge");
                          setChargeId(c.id);
                        },
                        danger: true,
                      },
                    ]
                  : []),
                // A wallet or card payment cannot be undone here; only one an admin recorded by hand.
                ...(isPaid && c.paidVia === "OFFLINE" && canReverse
                  ? [
                      {
                        label: "Reverse payment",
                        onClick: () => {
                          setModalType("reverse");
                          setChargeId(c.id);
                        },
                        danger: true,
                      },
                    ]
                  : []),
              ];

              return (
                <Card key={c.id} className="p-0! shadow-none">
                  <div className="flex justify-between items-center bg-(--elevated) rounded-t-2xl p-3">
                    <div>
                      <p className="font-bold">
                        {SHIPPING_SERVICE_OPTIONS.find(
                          (o) => o.value === c.service,
                        )?.label ?? labelize(c.service)}{" "}
                        · {labelize(c.goodsType)}
                      </p>
                      <p className="text-xs text-(--muted)">
                        {c.measuredValue} {UNIT_INPUT[c.unit].suffix} ·{" "}
                        {fmtDateTime(c.createdAt)}
                      </p>
                    </div>
                    {actions.length > 0 && <ActionDropdown actions={actions} />}
                  </div>
                  <div className="p-3">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <dt className="text-(--muted)">Status</dt>
                      <dd className="text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isVoided
                              ? "bg-red-100/50 text-red-500"
                              : isPaid
                                ? "bg-green-500/10 text-green-600"
                                : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {isVoided ? "VOIDED" : isPaid ? "PAID" : "UNPAID"}
                        </span>
                      </dd>

                      <dt className="text-(--muted)">Delivery Type</dt>
                      <dd className="text-right">
                        <p className="">
                          {c.deliveryMethod === "DOORSTEP"
                            ? `Doorstep: ${c.deliveryAddress}`
                            : "Pickup"}
                        </p>
                      </dd>

                      <dt className="text-(--muted)">
                        Freight (${c.freightUsd.toLocaleString()} @ ₦{c.fxRate})
                      </dt>
                      <dd className="text-right">{fmt(c.freightNgn)}</dd>

                      <dt className="text-(--muted)">Clearing</dt>
                      <dd className="text-right">{fmt(c.clearingNgn)}</dd>

                      {c.doorstepNgn > 0 && (
                        <>
                          <dt className="text-(--muted)">Doorstep</dt>
                          <dd className="text-right">{fmt(c.doorstepNgn)}</dd>
                        </>
                      )}

                      {c.miscNgn > 0 && (
                        <>
                          <dt className="text-(--muted)">Misc</dt>
                          <dd className="text-right">{fmt(c.miscNgn)}</dd>
                        </>
                      )}

                      <dt className="border-t pt-1 font-semibold">Total</dt>
                      <dd className="border-t pt-1 text-right font-semibold">
                        {fmt(c.totalNgn)}
                      </dd>
                    </dl>

                    {c.note && (
                      <p className="mt-2 text-xs">
                        <span className="font-bold">Note:-</span>
                        <span>{c.note}</span>
                      </p>
                    )}

                    {isPaid && (
                      <p className="mt-1 text-xs text-(--muted)">
                        Paid {fmtDateTime(c.paidAt ?? undefined)}
                        {c.paidVia
                          ? ` via ${labelize(c.paidVia).toLowerCase()}`
                          : ""}
                      </p>
                    )}

                    {isVoided && (
                      <p className="mt-1 text-xs text-destructive">
                        Voided {fmtDateTime(c.voidedAt ?? undefined)}
                        {c.voidReason ? `: ${c.voidReason}` : ""}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Installments */}
      <div className="mb-4">
        <div className="flex items-center gap-1 mb-2">
          <RiCalendarScheduleLine size={12} />
          <h3 className="text-sm font-semibold">
            Installments ({instList.length})
          </h3>
        </div>
        {instList.length === 0 ? (
          <p className="text-sm text-(--muted)">
            No installments for this order.
          </p>
        ) : (
          <div className="space-y-3">
            {instList.map((row, idx) => {
              const key =
                row !== null &&
                typeof row === "object" &&
                "id" in row &&
                typeof (row as { id: unknown }).id === "number"
                  ? `inst-${(row as { id: number }).id}`
                  : `inst-${idx}`;
              if (
                row !== null &&
                typeof row === "object" &&
                !Array.isArray(row)
              ) {
                const o = row as Record<string, unknown>;
                const entries = Object.entries(o).filter(
                  ([k]) => k !== "__proto__" && k !== "constructor",
                );
                return (
                  <Card key={key} className="border p-3">
                    <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      {entries.map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-xs font-medium uppercase tracking-wide text-(--muted)">
                            {k}
                          </dt>
                          <dd className="break-all text-xs">
                            {v === null || v === undefined
                              ? "—"
                              : typeof v === "object"
                                ? JSON.stringify(v)
                                : String(v)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Card>
                );
              }
              return (
                <Card key={key} className="border p-3 text-sm">
                  {String(row)}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Order status */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1 text-sm font-semibold">
          <RiHistoryLine size={12} />
          Status history
        </div>
        {histories.length === 0 ? (
          <p className="text-sm text-(--muted)">No history entries.</p>
        ) : (
          <div>
            <ul className="relative space-y-0 border-l-2 border-(--muted)/30 pl-4">
              {histories.map((h) => (
                <li key={h.id} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[23.5px] top-1.5 h-3 w-3 rounded-full bg-(--primary)" />
                  <div className="rounded-lg border border-(--muted)/30 bg-card p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                          adminOrderStatusPillClass(h.fromStatus),
                        )}
                      >
                        From {h.fromStatus}
                      </span>{" "}
                      →
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                          adminOrderStatusPillClass(h.toStatus),
                        )}
                      >
                        To {h.toStatus}
                      </span>
                      <span className="text-xs text-(--muted)">
                        Change made by: {h.actor ?? "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-(--muted)">
                      {fmtDateTime(h.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1 text-sm font-semibold">
          <RiTimeLine size={12} />
          Order timeline
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-(--muted)">No timeline entries.</p>
        ) : (
          <ul className="relative space-y-0 border-l-2 border-(--muted)/30 pl-4">
            {timeline.map((t, idx) => (
              <li key={`${t.at}-${idx}`} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[23.5px] top-1.5 h-3 w-3 rounded-full bg-(--primary)" />
                <div className="rounded-lg border border-(--muted)/30 bg-card p-3 text-sm">
                  <p className="font-medium">{t.title}</p>
                  {t.location && (
                    <p className="text-xs text-(--muted)">{t.location}</p>
                  )}
                  {t.description && (
                    <p className="mt-1 text-xs">{t.description}</p>
                  )}
                  <p className="mt-1 text-xs text-(--muted)">
                    {fmtDateTime(t.at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Shipment Events */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1 text-sm font-semibold">
          <RiTruckLine size={12} />
          Shipment events ({shipmentEvents.length})
        </div>
        {shipmentEvents.length === 0 ? (
          <p className="text-sm text-(--muted)">No shipment events yet.</p>
        ) : (
          <ul className="relative space-y-0 border-l-2 border-(--muted)/30 pl-4">
            {shipmentEvents.map((e) => {
              const voided = e.voidedAt != null;

              const shipmentActions = [
                ...(canUpdateShipment
                  ? [
                      {
                        label: "Edit event date",
                        onClick: () => {
                          setModalType("update-event");
                          setEventId(e.id);
                        },
                        danger: true,
                      },
                    ]
                  : []),
              ];
              return (
                <li key={e.id} className="relative pb-6 last:pb-0">
                  <span
                    className={cn(
                      "absolute -left-[23.5px] top-1.5 h-3 w-3 rounded-full",
                      voided ? "bg-(--muted)" : "bg-(--primary)",
                    )}
                  />
                  <div className="rounded-lg border border-(--muted)/30 bg-card p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "font-medium",
                          voided && "line-through text-(--muted)",
                        )}
                      >
                        {e.title}
                      </span>
                      {e.stage && (
                        <span className="inline-flex items-center rounded-full bg-(--muted)/15 px-2 py-0.5 text-xs">
                          {labelize(e.stage)}
                        </span>
                      )}
                      {voided && (
                        <span className="inline-flex items-center rounded-full bg-red-100/50 px-2 py-0.5 text-xs text-red-500">
                          VOIDED
                        </span>
                      )}
                    </div>
                    {e.location && (
                      <p className="text-xs text-(--muted)">{e.location}</p>
                    )}
                    {e.description && (
                      <p className="mt-1 text-xs">{e.description}</p>
                    )}
                    {voided && e.voidReason && (
                      <p className="mt-1 text-xs text-destructive">
                        Reason: {e.voidReason}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-(--muted)">
                      {fmtDateTime(e.occurredAt)} · {labelize(e.source)}
                      {e.visibility !== "PUBLIC"
                        ? ` · ${labelize(e.visibility)}`
                        : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Cancel order */}
      {
        canManageOrders && 
        <Button
          className="bg-red-500"
          onClick={() => setModalType('cancel-order')}
        >
          Cancel Order
        </Button>
      }
      

      {paymentModalOpen && (
        <AddOfflinePayment
          orderId={order.id}
          balanceDue={Math.max(0, total - paid)}
          setModalOpen={setPaymentModalOpen}
        />
      )}

      {modalType == "charge" && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          title="Add shipping charge"
        >
          <AddShipmentCharge
            orderId={order.id}
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      )}

      {modalType == "patch-charge" && charge !== null && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => {
            setModalType(null);
            setCharge(null);
          }}
          title="Edit shipping charge"
        >
          <AddShipmentCharge
            orderId={order.id}
            onSuccess={() => setModalType(null)}
            charge={charge}
          />
        </MyModal>
      )}

      {modalType == "void-charge" && chargeId !== null && (
        <VoidCharge
          orderId={order.id}
          chargeId={chargeId}
          onSuccess={() => {
            setModalType(null);
            setChargeId(null);
          }}
        />
      )}

      {modalType == "cancel-order" && (
        <CancelOrder
          orderId={order.id}
          onSuccess={() => {
            setModalType(null);
          }}
        />
      )}

      {modalType == "reverse" && chargeId !== null && (
        <ReverseCharge
          orderId={order.id}
          chargeId={chargeId}
          onSuccess={() => {
            setModalType(null);
            setChargeId(null);
          }}
        />
      )}

      {modalType == "mark" && chargeId !== null && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => {
            setModalType(null);
            setCharge(null);
          }}
          title="Mark charge as paid"
        >
          <MarkCharge
            orderId={order.id}
            chargeId={chargeId}
            totalNgn={charge?.totalNgn}
            onSuccess={() => {
              setModalType(null);
              setChargeId(null);
            }}
          />
        </MyModal>
      )}

      {voidModalOpen && selectedPaymentId !== null && (
        <VoidPayment
          orderId={order.id}
          paymentId={selectedPaymentId}
          setModalOpen={setVoidModalOpen}
        />
      )}

      {modalType == "update-payment" && selectedPaymentId !== null && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => {
            setModalType(null);
            setCharge(null);
          }}
          title="Edit payment date"
        >
          <UpdateDate
            orderId={order.id}
            paymentId={selectedPaymentId}
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      )}
    </div>
  );
}
