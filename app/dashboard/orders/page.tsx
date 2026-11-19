"use client";

import { useMemo, useState } from "react";
import { useGetAdminOrder, useGetAdminOrders } from "@/api/orders";
import MyModal from "@/components/dashboard/Modal";
import { AdminOrderDetailPanel } from "@/components/orders/AdminOrderDetailPanel";
import { ActionDropdown, Button, Card } from "@/components/ui";
import { cn } from "@/components/ui/utils";
import { adminOrderStatusPillClass, orderTypePillClass } from "@/lib/order-badges";
import { formatOrderTypeLabel, getOrderType } from "@/lib/order-type";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import type {
  AdminOrderCheckoutType,
  AdminOrderPaymentState,
  AdminOrdersListView,
  AdminOrdersSortBy,
  AdminSortOrder,
} from "@/types/types";
import { RiArchiveDrawerFill, RiCloseLine, RiFilterLine } from "react-icons/ri";
import AddShipment from "@/components/shipments/AddShipment";
import CopyButton from "@/components/ui/copy_button";
import AddShipmentCharge from "../../../components/orders/AddShipmentCharge";
import { useCan } from "@/hooks/use-can";
import { isClosedOrder } from "@/lib/enums";
import UpdateDate from "@/components/orders/UpdateDate";

const fmt = (n: number | undefined | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n ?? 0);

const ORDER_STATUS_OPTIONS = [
  "",
  "CREATED",
  "LOCKED",
  "AWAITING_BALANCE",
  "PARTIALLY_PAID",
  "PAID_IN_FULL",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "DEFAULTED",
  "DISPUTE_RAISED",
];

type DraftFilters = {
  status: string;
  checkoutType: AdminOrderCheckoutType | "";
  paymentState: AdminOrderPaymentState | "";
  view: AdminOrdersListView | "";
  baleId: string;
  baleCycle: string;
  customerId: string;
  sortBy: AdminOrdersSortBy;
  sortOrder: AdminSortOrder;
};

const defaultDraft: DraftFilters = {
  status: "",
  checkoutType: "",
  paymentState: "",
  view: "",
  baleId: "",
  baleCycle: "",
  customerId: "",
  sortBy: "createdAt",
  sortOrder: "DESC",
};

function parseOptionalPositiveInt(raw: string, label: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return n;
}

function optionalPositiveInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

export default function OrdersPage() {
  const canWriteShipment = useCan("shipment.write");
  const canWriteCharge = useCan("shippingCharge.write");
  const [draft, setDraft] = useState<DraftFilters>(defaultDraft);
  const [applied, setApplied] = useState<DraftFilters>(defaultDraft);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [paramError, setParamError] = useState<string | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<'add' | 'view' | 'shipping' | 'edit-date' | null>(null);

  const queryParams = useMemo(() => {
    const baleId = optionalPositiveInt(applied.baleId);
    const baleCycle = optionalPositiveInt(applied.baleCycle);
    const customerId = optionalPositiveInt(applied.customerId);

    return {
      ...(applied.status ? { status: applied.status } : {}),
      ...(applied.checkoutType ? { checkoutType: applied.checkoutType } : {}),
      ...(applied.paymentState ? { paymentState: applied.paymentState } : {}),
      ...(applied.view ? { view: applied.view } : {}),
      ...(baleId !== undefined ? { baleId } : {}),
      ...(baleCycle !== undefined ? { baleCycle } : {}),
      ...(customerId !== undefined ? { customerId } : {}),
      sortBy: applied.sortBy,
      sortOrder: applied.sortOrder,
      page,
      limit,
    };
  }, [applied, page, limit]);

  const { data, isPending, isError, error } = useGetAdminOrders(queryParams);
  const {
    data: detailOrder,
    isPending: detailPending,
    isError: detailIsError,
    error: detailError,
  } = useGetAdminOrder(detailOrderId);

  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;
  const startIndex = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalItems);

  const handleApply = () => {
    setParamError(null);
    try {
      parseOptionalPositiveInt(draft.baleId, "Bale ID");
      parseOptionalPositiveInt(draft.baleCycle, "Bale cycle");
      parseOptionalPositiveInt(draft.customerId, "Customer ID");
    } catch (e) {
      setParamError(e instanceof Error ? e.message : "Invalid filter.");
      return;
    }
    setApplied(draft);
    setPage(1);
  };

  const handleClear = () => {
    setDraft(defaultDraft);
    setApplied(defaultDraft);
    setPage(1);
    setParamError(null);
  };

  const isFiltered =
    !!draft.status ||
    !!draft.checkoutType ||
    !!draft.paymentState ||
    !!draft.view ||
    !!draft.baleId.trim() ||
    !!draft.baleCycle.trim() ||
    !!draft.customerId.trim();

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-(--muted) text-sm mt-1">
            <code className="text-xs">GET /admin/orders</code> — B2B checkout
            orders (filters match API query params).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          className={`shadow-none ${isPending ? "bg-(--elevated) animate-pulse" : "bg-(--primary)"} text-white py-6!`}
        >
          <div
            className={`p-3 w-fit rounded-xl ${isPending ? "bg-(--primary)/50" : "bg-white/50"} mb-2`}
          >
            <RiArchiveDrawerFill />
          </div>
          <h1
            className={`text-sm font-medium ${
              isPending ? "text-(--muted)" : "text-white/90"
            }`}
          >
            Total Orders
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isPending ? "—" : totalItems}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-(--primary)/20 mb-2`}>
            <RiArchiveDrawerFill className="text-(--primary)" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>Bale Orders</h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isPending
              ? "—"
              : (
                  rows.filter((order: any) => getOrderType(order) == "bale")
                    .length ?? 0
                ).toLocaleString()}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-red-200 mb-2`}>
            <RiArchiveDrawerFill className="text-red-500" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>
            Direct Orders
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isPending
              ? "—"
              : (
                  rows.filter((order: any) => getOrderType(order) == "direct")
                    .length ?? 0
                ).toLocaleString()}
          </p>
        </Card>
      </div>

      <Card className="shadow-none! border border-(--table-border) mb-4 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft((d) => ({ ...d, status: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
          >
            <option value="">All statuses</option>
            {ORDER_STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            value={draft.checkoutType}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                checkoutType: e.target.value as AdminOrderCheckoutType | "",
              }))
            }
            className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
          >
            <option value="">All checkout types</option>
            <option value="BALE">BALE</option>
            <option value="DIRECT">DIRECT</option>
          </select>
          <select
            value={draft.paymentState}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                paymentState: e.target.value as AdminOrderPaymentState | "",
              }))
            }
            className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
          >
            <option value="">All payment states</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PENDING">PENDING</option>
          </select>
          {/* <select
            value={draft.view}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                view: e.target.value as AdminOrdersListView | "",
              }))
            }
            className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
          >
            <option value="">View: orders (default)</option>
            <option value="orders">orders</option>
            <option value="pool_checkout">pool_checkout</option>
          </select> */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="number"
            min={1}
            placeholder="Bale ID"
            value={draft.baleId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, baleId: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
          />
          {/* <input
            type="number"
            min={1}
            placeholder="Bale cycle"
            value={draft.baleCycle}
            onChange={(e) =>
              setDraft((d) => ({ ...d, baleCycle: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
          /> */}
          <input
            type="number"
            min={1}
            placeholder="Customer ID"
            value={draft.customerId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, customerId: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
          />
          <div className="flex gap-2 relative">
            <select
              value={draft.sortBy}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  sortBy: e.target.value as AdminOrdersSortBy,
                }))
              }
              className="flex-1 px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm pl-14"
            >
              <option value="id">ID</option>
              <option value="status">Status</option>
              <option value="totalAmount">Total Amount</option>
              <option value="amountPaid">Amount Paid</option>
              <option value="createdAt">Created At</option>
              <option value="updatedAt">Updated At</option>
            </select>
            <span className="absolute top-3 left-2 font-bold text-xs">
              Sort By:
            </span>
            <select
              value={draft.sortOrder}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  sortOrder: e.target.value as AdminSortOrder,
                }))
              }
              className="w-24 px-2 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
            >
              <option value="DESC">DESC</option>
              <option value="ASC">ASC</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {isFiltered && (
              <Button
                onClick={handleClear}
                className="flex items-center gap-1 py-2! px-4! rounded-lg! bg-(--card)! text-(--text)! border border-(--table-border)"
              >
                <RiCloseLine />
                Clear
              </Button>
            )}
            <Button
              primary
              onClick={handleApply}
              className="flex items-center gap-1 py-2! px-4! rounded-lg!"
            >
              <RiFilterLine />
              Apply filters
            </Button>
          </div>
        </div>
        {paramError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {paramError}
          </p>
        )}
        {isError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {(error as { message?: string })?.message ??
              "Failed to load orders."}
          </p>
        )}
      </Card>

      <Table
        aria-label="Admin orders"
        pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={(s) => {
          setLimit(s);
          setPage(1);
        }}
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Checkout ID</TableColumn>
            <TableColumn>Customer</TableColumn>
            <TableColumn>Bale</TableColumn>
            <TableColumn>Total</TableColumn>
            <TableColumn>Paid</TableColumn>
            <TableColumn>Order type</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Created</TableColumn>
            <TableColumn></TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isPending && !data}>
          {!isPending && !isError && rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="text-center py-10 text-(--muted)"
              >
                No orders for this filter.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((order) => {
              const buyer =
                order.checkout?.merchant?.name ??
                order.customer?.name ??
                (order.checkout?.customerId != null
                  ? `Customer #${order.checkout.customerId}`
                  : order.customerId != null
                    ? `Customer #${order.customerId}`
                    : "—");
              const buyerEmail =
                order.checkout?.merchant?.email ?? order.customer?.email ?? "—";
              const checkoutLabel =
                order.checkout?.serialNumber != null
                  ? `#${order.checkout.serialNumber}`
                  : order.checkoutId != null
                    ? `Checkout ${order.checkoutId}`
                    : "—";
              const checkoutType =
                order.checkout?.checkoutType ?? order.checkoutType ?? "—";
              const baleCycle = order.checkout?.baleCycle ?? order.baleCycle;
              const orderType = getOrderType(order);
              return (
                <TableRow key={order.id} className="bg-(--card)">
                  <TableCell className="font-semibold text-(--primary)">
                    #{order.id}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{checkoutLabel}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{buyer}</div>
                    <div className="text-xs text-(--muted)">{buyerEmail}</div>
                  </TableCell>
                  <TableCell className="text-sm text-(--muted)">
                    {order.baleId != null ? (
                      <>
                        #{order.baleId}
                        {baleCycle != null && baleCycle !== ""
                          ? ` · ${String(baleCycle)}`
                          : ""}
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">
                    {fmt(order.totalAmount)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {fmt(order.amountPaid)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {orderType ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs",
                          orderTypePillClass(orderType),
                        )}
                      >
                        {formatOrderTypeLabel(order)}
                      </span>
                    ) : (
                      <span className="text-(--muted)">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs",
                        adminOrderStatusPillClass(order.status),
                      )}
                    >
                      {(order.status ?? "—").replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-(--muted) whitespace-nowrap">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-NG", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <ActionDropdown
                      actions={[
                        {
                          label: "View",
                          onClick: () => {
                            setDetailOrderId(order.id);
                            setModalType("view");
                          },
                        },
                        {
                          label: "Edit order date",
                          onClick: () => {
                            setDetailOrderId(order.id);
                            setModalType("edit-date");
                          },
                        },
                        // The backend refuses a shipment for an order that is in a bale or already on a shipment.
                        ...(canWriteShipment && order.baleId == null && order.shipmentId == null && !isClosedOrder(order.status)
                          ? [
                              {
                                label: "Add shipment",
                                onClick: () => {
                                  setDetailOrderId(order.id);
                                  setModalType("add");
                                },
                              },
                            ]
                          : []),
                        ...(canWriteCharge && !isClosedOrder(order.status)
                          ? [
                              {
                                label: "Shipping charge",
                                onClick: () => {
                                  setDetailOrderId(order.id);
                                  setModalType("shipping");
                                },
                              },
                            ]
                          : []),
                      ]}
                    >
                      <CopyButton
                        type="link"
                        value={`https://shop.4401.live/track/${order.publicToken}`}
                        label="Copy tracking link"
                        showLabel
                      />
                    </ActionDropdown>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="orders"
      />

      {detailOrderId && modalType == "view" && (
        <MyModal
          isOpen={detailOrderId !== null}
          onClose={() => setDetailOrderId(null)}
          title={detailOrderId != null ? `Order #${detailOrderId}` : "Order"}
        >
          <AdminOrderDetailPanel
            order={detailOrder}
            isPending={detailPending}
            isError={detailIsError}
            errorMessage={
              (detailError as { message?: string } | undefined)?.message ??
              undefined
            }
          />
        </MyModal>
      )}

      {detailOrderId && modalType == "add" && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          title="Add shipment"
        >
          <AddShipment
            onSuccess={() => setModalType(null)}
            orderId={detailOrderId}
          />
        </MyModal>
      )}

      {detailOrderId && modalType == "shipping" && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          title="Shipping charge"
        >
          <AddShipmentCharge
            onSuccess={() => setModalType(null)}
            orderId={detailOrderId}
          />
        </MyModal>
      )}

      {detailOrderId && modalType == "edit-date" && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          title="Edit order date"
        >
          <UpdateDate
            orderId={detailOrderId}
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      )}
    </>
  );
}
