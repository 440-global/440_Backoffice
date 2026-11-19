"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCreateManualFinanceEntry } from "@/api/finance";
import { useGetAdminOrder, useGetAdminOrders } from "@/api/orders";
import { useGetSupplier, useGetSuppliers } from "@/api/supplier";
import { Button, Card } from "@/components/ui";
import type {
  AdminOrderDetail,
  AdminOrderListItem,
  ManualFinanceEntryBody,
  ManualEntryDirection,
  SupplierDetails,
} from "@/types/types";
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiCloseLine,
  RiInformationLine,
  RiLoader4Fill,
  RiSearchLine,
} from "react-icons/ri";

const FLOW_OVERRIDE_INFLOW = [
  "",
  "INTER_COMPANY",
  "MANUAL_INFLOW",
  "POST_DEPOSIT_PAYMENT",
  "DEPOSIT_FROM_CUSTOMER",
] as const;

const PAYMENT_METHODS = ["", "bank_transfer", "cash", "card"];

function toIsoFromDateOnly(v: string): string {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return "";
  return `${v}T00:00:00.000Z`;
}

function checkoutTypeOf(o: AdminOrderListItem): string {
  return (o.checkout?.checkoutType ?? o.checkoutType ?? "").toUpperCase();
}

function supplierIdFromOrderRow(o: AdminOrderListItem): number | undefined {
  const direct = o.supplierId;
  if (direct != null && Number.isFinite(Number(direct)) && Number(direct) > 0) {
    return Number(direct);
  }
  const merchantId = o.checkout?.merchant?.id;
  if (merchantId != null && Number.isFinite(Number(merchantId))) {
    return Number(merchantId);
  }
  return undefined;
}

function linkFieldsFromOrder(o: AdminOrderListItem) {
  const supplierId = supplierIdFromOrderRow(o);
  const customerRaw = o.checkout?.customerId ?? o.customerId;
  const customerId =
    customerRaw != null && Number.isFinite(Number(customerRaw))
      ? Number(customerRaw)
      : undefined;

  if (checkoutTypeOf(o) === "BALE") {
    const baleId =
      o.baleId != null && Number.isFinite(Number(o.baleId)) ? Number(o.baleId) : undefined;
    const baleCycleRaw = o.checkout?.baleCycle ?? o.baleCycle;
    const baleCycle =
      baleCycleRaw !== undefined && baleCycleRaw !== null && String(baleCycleRaw).trim() !== ""
        ? String(baleCycleRaw).trim()
        : undefined;
    const checkoutRaw = o.checkoutId ?? o.checkout?.id;
    const checkoutId =
      checkoutRaw != null && Number.isFinite(Number(checkoutRaw)) ? Number(checkoutRaw) : undefined;
    return {
      customerId,
      supplierId,
      baleId,
      baleCycle,
      orderId: undefined as number | undefined,
      checkoutId,
    };
  }

  const checkoutRaw = o.checkoutId ?? o.checkout?.id;
  const checkoutId =
    checkoutRaw != null && Number.isFinite(Number(checkoutRaw)) ? Number(checkoutRaw) : undefined;
  const orderId =
    o.id != null && Number.isFinite(Number(o.id)) && Number(o.id) > 0 ? Number(o.id) : undefined;

  return {
    customerId,
    supplierId,
    baleId: undefined as number | undefined,
    baleCycle: undefined as string | undefined,
    orderId,
    checkoutId,
  };
}

function computePostedIdentity(
  linkedOrder: AdminOrderListItem | null,
  orderDetail: AdminOrderDetail | undefined,
  supplierRecord: SupplierDetails | null | undefined,
  manualSupplierId: number | null,
  manualFullName: string,
  manualEmail: string
): { supplierId?: number; fullName?: string; email?: string } {
  const t = (s: string) => (s.trim() ? s.trim() : undefined);
  if (linkedOrder) {
    let supplierId: number | undefined;
    const orderSid = orderDetail?.supplierId ?? linkedOrder.supplierId;
    if (orderSid != null && Number.isFinite(Number(orderSid)) && Number(orderSid) > 0) {
      supplierId = Number(orderSid);
    }
    if (supplierId === undefined) {
      const items = orderDetail?.orderItems ?? [];
      for (const line of items) {
        const p = line.product;
        const sid =
          p &&
          typeof p === "object" &&
          "supplierId" in p &&
          (p as { supplierId?: number }).supplierId != null
            ? Number((p as { supplierId?: number }).supplierId)
            : NaN;
        if (Number.isFinite(sid) && sid > 0) {
          supplierId = sid;
          break;
        }
      }
    }
    if (supplierId === undefined) {
      const b = linkFieldsFromOrder(linkedOrder);
      if (b.supplierId != null && b.supplierId > 0) supplierId = b.supplierId;
    }
    const merchant = linkedOrder.checkout?.merchant;
    const fullName =
      supplierRecord?.name?.trim() ||
      merchant?.name?.trim() ||
      (merchant as { shop_name?: string } | undefined)?.shop_name?.trim() ||
      t(manualFullName);
    const email = merchant?.email?.trim() || t(manualEmail);
    return {
      ...(supplierId != null ? { supplierId } : {}),
      ...(fullName ? { fullName } : {}),
      ...(email ? { email } : {}),
    };
  }
  if (manualSupplierId && manualSupplierId > 0) {
    return {
      supplierId: manualSupplierId,
      ...(supplierRecord?.name?.trim()
        ? { fullName: supplierRecord.name.trim() }
        : t(manualFullName)
          ? { fullName: manualFullName.trim() }
          : {}),
      ...(t(manualEmail) ? { email: manualEmail.trim() } : {}),
    };
  }
  return {
    ...(t(manualFullName) ? { fullName: manualFullName.trim() } : {}),
    ...(t(manualEmail) ? { email: manualEmail.trim() } : {}),
  };
}

function orderRowLabel(o: AdminOrderListItem) {
  const serial = o.checkout?.serialNumber != null ? `#${o.checkout.serialNumber}` : "";
  const ct = o.checkout?.checkoutType ?? o.checkoutType ?? "—";
  const buyer =
    o.checkout?.merchant?.name ??
    o.customer?.name ??
    (o.customerId != null ? `Cust ${o.customerId}` : "—");
  return `Order ${o.id} · ${ct}${serial ? ` ${serial}` : ""} · ${buyer}`;
}

function fmtPreviewAmount(o: AdminOrderListItem) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(o.totalAmount ?? 0);
}

type Props = {
  compact?: boolean;
};

function OrderSearchPicker({
  selected,
  onSelect,
  onClear,
}: {
  selected: AdminOrderListItem | null;
  onSelect: (o: AdminOrderListItem) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data, isPending, isError } = useGetAdminOrders({
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const rows = data?.rows ?? [];

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const scored = rows.filter((o) => {
      if (!t) return true;
      const id = String(o.id);
      const serial = String(o.checkout?.serialNumber ?? "");
      const buyer = (
        o.checkout?.merchant?.name ??
        o.customer?.name ??
        ""
      ).toLowerCase();
      const email = (o.checkout?.merchant?.email ?? o.customer?.email ?? "").toLowerCase();
      const ct = (o.checkout?.checkoutType ?? o.checkoutType ?? "").toLowerCase();
      return (
        id.includes(t) ||
        serial.toLowerCase().includes(t) ||
        buyer.includes(t) ||
        email.includes(t) ||
        ct.includes(t) ||
        (o.baleId != null && String(o.baleId).includes(t))
      );
    });
    return !t ? scored.slice(0, 35) : scored.slice(0, 50);
  }, [rows, q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const linkPreview = selected ? linkFieldsFromOrder(selected) : null;
  const isBale = selected ? checkoutTypeOf(selected) === "BALE" : false;

  return (
    <div ref={rootRef} className="space-y-2">
      <span className="text-xs font-semibold text-(--muted) uppercase">
        Link to order <span className="font-normal normal-case text-(--muted)">(optional)</span>
      </span>
      <div className="relative">
        <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
        <input
          type="text"
          value={open ? q : selected ? orderRowLabel(selected) : q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (selected) setQ("");
          }}
          placeholder="Search by order id, checkout #, merchant, email, type…"
          className="w-full rounded-lg border border-(--table-border) bg-(--background) py-2 pr-10 pl-9 text-sm"
          autoComplete="off"
        />
        {selected && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setQ("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-(--muted) hover:bg-(--muted)/15 hover:text-(--text)"
            aria-label="Clear linked order"
          >
            <RiCloseLine className="h-4 w-4" />
          </button>
        )}
        {open && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-(--table-border) bg-(--card) py-1 shadow-lg">
            {isPending && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-(--muted)">
                <RiLoader4Fill className="h-4 w-4 animate-spin" />
                Loading orders…
              </div>
            )}
            {isError && (
              <p className="px-3 py-2 text-sm text-red-600">Could not load orders.</p>
            )}
            {!isPending && !isError && filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-(--muted)">No matching orders.</p>
            )}
            {!isPending &&
              !isError &&
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-(--muted)/10"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(o);
                    setQ("");
                    setOpen(false);
                  }}
                >
                  <div className="font-medium">{orderRowLabel(o)}</div>
                  <div className="text-xs text-(--muted)">
                    {fmtPreviewAmount(o)} · {checkoutTypeOf(o) === "BALE" ? "Bale" : "Direct"} link
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {selected && linkPreview && (
        <div className="rounded-lg border border-(--table-border) bg-(--background)/50 px-3 py-2 text-xs text-(--muted) space-y-1">
          <p className="font-semibold text-(--text)">Will send to API</p>
          {isBale && linkPreview.baleId == null && (
            <p className="text-amber-700 dark:text-amber-300">
              This row is BALE but has no baleId — link fields may be incomplete.
            </p>
          )}
          {isBale ? (
            <ul className="list-inside list-disc space-y-0.5">
              {linkPreview.baleId != null && <li>baleId: {linkPreview.baleId}</li>}
              {linkPreview.baleCycle && <li>baleCycle: {linkPreview.baleCycle}</li>}
              {linkPreview.checkoutId != null && <li>checkoutId: {linkPreview.checkoutId}</li>}
              {linkPreview.customerId != null && <li>customerId: {linkPreview.customerId}</li>}
              {linkPreview.supplierId != null && (
                <li>
                  supplierId: {linkPreview.supplierId}
                  {selected?.supplierId != null && selected.supplierId === linkPreview.supplierId
                    ? " (from order)"
                    : " (fallback)"}
                </li>
              )}
            </ul>
          ) : (
            <ul className="list-inside list-disc space-y-0.5">
              {linkPreview.orderId != null && <li>orderId: {linkPreview.orderId}</li>}
              {linkPreview.checkoutId != null && <li>checkoutId: {linkPreview.checkoutId}</li>}
              {linkPreview.customerId != null && <li>customerId: {linkPreview.customerId}</li>}
              {linkPreview.supplierId != null && (
                <li>
                  supplierId: {linkPreview.supplierId}
                  {selected?.supplierId != null && selected.supplierId === linkPreview.supplierId
                    ? " (from order)"
                    : " (fallback)"}
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function ManualFinanceEntryForm({ compact }: Props) {
  const [direction, setDirection] = useState<ManualEntryDirection>("OUTFLOW");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [narration, setNarration] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [linkedOrder, setLinkedOrder] = useState<AdminOrderListItem | null>(null);
  const [manualSupplierId, setManualSupplierId] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [entryType, setEntryType] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [flowTypeOverride, setFlowTypeOverride] = useState<string>("");

  const [expenseType, setExpenseType] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const { data: orderDetail } = useGetAdminOrder(linkedOrder?.id ?? null);

  const resolvedSupplierId = useMemo(() => {
    if (!linkedOrder) {
      return manualSupplierId && manualSupplierId > 0 ? manualSupplierId : 0;
    }
    const orderSid = orderDetail?.supplierId ?? linkedOrder.supplierId;
    if (orderSid != null && Number.isFinite(Number(orderSid)) && Number(orderSid) > 0) {
      return Number(orderSid);
    }
    const items = orderDetail?.orderItems ?? [];
    for (const line of items) {
      const p = line.product;
      const sid =
        p &&
        typeof p === "object" &&
        "supplierId" in p &&
        (p as { supplierId?: number }).supplierId != null
          ? Number((p as { supplierId?: number }).supplierId)
          : NaN;
      if (Number.isFinite(sid) && sid > 0) return sid;
    }
    const base = linkFieldsFromOrder(linkedOrder);
    return base.supplierId && base.supplierId > 0 ? base.supplierId : 0;
  }, [linkedOrder, orderDetail, manualSupplierId]);

  const { data: supplierRecord } = useGetSupplier(resolvedSupplierId > 0 ? resolvedSupplierId : 0);
  const { data: suppliers } = useGetSuppliers();

  const { mutateAsync, isPending } = useCreateManualFinanceEntry();

  const resetSuccess = () => setCreatedId(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreatedId(null);

    const raw = Number.parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(raw) || raw === 0) {
      setFormError("Enter a non-zero amount. A minus sign is ignored; direction sets in/out.");
      return;
    }
    const magnitude = Math.abs(raw);

    const paidDate = toIsoFromDateOnly(paidAt);
    if (!paidDate) {
      setFormError("Choose a valid paid date.");
      return;
    }
    const narr = narration.trim();
    if (!narr) {
      setFormError("Narration is required.");
      return;
    }

    const link = linkedOrder ? linkFieldsFromOrder(linkedOrder) : null;
    const postedId = computePostedIdentity(
      linkedOrder,
      orderDetail ?? undefined,
      supplierRecord as SupplierDetails | undefined,
      manualSupplierId,
      fullName,
      email
    );

    let body: ManualFinanceEntryBody;

    if (direction === "INFLOW") {
      const et = entryType.trim();
      if (!et) {
        setFormError("Entry type is required for inflow (e.g. THIRD_PARTY_COLLECTION).");
        return;
      }
      body = {
        direction: "INFLOW",
        amount: magnitude,
        currency: currency.trim() || "NGN",
        narration: narr,
        paidDate,
        ...(link?.customerId !== undefined ? { customerId: link.customerId } : {}),
        ...(postedId.supplierId !== undefined ? { supplierId: postedId.supplierId } : {}),
        ...(link?.baleId !== undefined ? { baleId: link.baleId } : {}),
        ...(link?.baleCycle ? { baleCycle: link.baleCycle } : {}),
        ...(link?.orderId !== undefined ? { orderId: link.orderId } : {}),
        ...(link?.checkoutId !== undefined ? { checkoutId: link.checkoutId } : {}),
        ...(postedId.fullName ? { fullName: postedId.fullName } : {}),
        ...(postedId.email ? { email: postedId.email } : {}),
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
        entryType: et,
        ...(counterpartyName.trim() ? { counterpartyName: counterpartyName.trim() } : {}),
        ...(flowTypeOverride
          ? {
              flowTypeOverride: flowTypeOverride as NonNullable<
                Extract<ManualFinanceEntryBody, { direction: "INFLOW" }>["flowTypeOverride"]
              >,
            }
          : {}),
      };
    } else {
      const ex = expenseType.trim();
      if (!ex) {
        setFormError("Expense type is required for outflow (e.g. RENT).");
        return;
      }
      body = {
        direction: "OUTFLOW",
        amount: magnitude,
        currency: currency.trim() || "NGN",
        narration: narr,
        paidDate,
        ...(link?.customerId !== undefined ? { customerId: link.customerId } : {}),
        ...(postedId.supplierId !== undefined ? { supplierId: postedId.supplierId } : {}),
        ...(link?.baleId !== undefined ? { baleId: link.baleId } : {}),
        ...(link?.baleCycle ? { baleCycle: link.baleCycle } : {}),
        ...(link?.orderId !== undefined ? { orderId: link.orderId } : {}),
        ...(link?.checkoutId !== undefined ? { checkoutId: link.checkoutId } : {}),
        ...(postedId.fullName ? { fullName: postedId.fullName } : {}),
        ...(postedId.email ? { email: postedId.email } : {}),
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
        expenseType: ex,
      };
    }

    try {
      const record = await mutateAsync(body);
      setCreatedId(record.id);
      setAmount("");
      setNarration("");
      setLinkedOrder(null);
      setManualSupplierId(null);
      setFullName("");
      setEmail("");
      setReference("");
      setEntryType("");
      setCounterpartyName("");
      setExpenseType("");
      setFlowTypeOverride("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(typeof msg === "string" ? msg : "Could not create entry.");
    }
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {!compact && (
        <Card className="shadow-none! mb-6 border border-(--table-border)">
          <div className="flex gap-3">
            <RiInformationLine className="text-(--primary) shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-(--muted) space-y-2">
              <p>
                Link an admin order to set ids automatically (BALE → bale fields; DIRECT →{" "}
                <code className="text-xs">orderId</code> + <code className="text-xs">checkoutId</code> +
                customer). <code className="text-xs">supplierId</code> uses the order&apos;s{" "}
                <code className="text-xs">supplierId</code> when the API sends it; otherwise line-item
                product, then checkout merchant.{" "}
                <code className="text-xs">fullName</code> / <code className="text-xs">email</code> default
                from merchant or supplier. Amount is always sent as a positive magnitude; a leading minus is
                ignored.
              </p>
            </div>
          </div>
        </Card>
      )}

      {compact && (
        <div className="flex gap-2 text-xs text-(--muted) pb-1 border-b border-(--table-border)">
          <RiInformationLine className="text-(--primary) shrink-0 mt-0.5" size={16} />
          <p>Optional: pick an order or a supplier — identity fields fill automatically when possible.</p>
        </div>
      )}

      {createdId !== null && (
        <Card className="shadow-none! border border-green-200 bg-green-50/80 dark:bg-green-950/20">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
            Entry #{createdId} created successfully.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              href="/dashboard/finance/records"
              className="text-sm text-(--primary) font-semibold hover:underline"
              onClick={resetSuccess}
            >
              View records →
            </Link>
            <button
              type="button"
              className="text-sm text-(--muted) hover:underline"
              onClick={() => setCreatedId(null)}
            >
              Dismiss
            </button>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-wrap gap-2 p-1 bg-(--card) border border-(--table-border) rounded-xl w-fit">
          <button
            type="button"
            onClick={() => {
              setDirection("INFLOW");
              setFormError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              direction === "INFLOW"
                ? "bg-green-600 text-white"
                : "text-(--muted) hover:text-(--text)"
            }`}
          >
            <RiArrowUpLine /> Inflow
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection("OUTFLOW");
              setFormError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              direction === "OUTFLOW"
                ? "bg-red-600 text-white"
                : "text-(--muted) hover:text-(--text)"
            }`}
          >
            <RiArrowDownLine /> Outflow (expense)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-(--muted) uppercase">Amount *</span>
            <input
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="150000 (minus ignored)"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-(--muted) uppercase">Currency</span>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="NGN"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-(--muted) uppercase">Narration *</span>
          <textarea
            required
            rows={compact ? 2 : 3}
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            maxLength={512}
            placeholder="Office rent — March"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-(--muted) uppercase">Paid date *</span>
          <input
            type="date"
            required
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="mt-1 w-full max-w-md px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
          />
        </label>

        <OrderSearchPicker
          selected={linkedOrder}
          onSelect={(o) => {
            setManualSupplierId(null);
            setLinkedOrder(o);
          }}
          onClear={() => setLinkedOrder(null)}
        />

        <label className="block">
          <span className="text-xs font-semibold text-(--muted) uppercase">
            Supplier (if no order)
          </span>
          <select
            value={manualSupplierId ?? ""}
            disabled={!!linkedOrder}
            onChange={(e) => {
              const v = e.target.value;
              setManualSupplierId(v ? Number(v) : null);
              if (v) setLinkedOrder(null);
            }}
            className="mt-1 w-full max-w-md px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm disabled:opacity-50"
          >
            <option value="">(none)</option>
            {(suppliers as SupplierDetails[] | undefined)?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.clubCode ? `${s.name} (${s.clubCode})` : s.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-(--muted) uppercase">Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Optional — filled from merchant/supplier when linked"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-(--muted) uppercase">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-(--muted) uppercase">Reference</span>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Bank ref, receipt id"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-(--muted) uppercase">Payment method</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m || "none"} value={m}>
                  {m ? m.replace(/_/g, " ") : "(none)"}
                </option>
              ))}
            </select>
          </label>
        </div>

        {direction === "INFLOW" ? (
          <div className="space-y-3 p-3 rounded-xl border border-(--table-border) bg-(--background)/50">
            <p className="text-sm font-semibold">Inflow details</p>
            <label className="block">
              <span className="text-xs font-semibold text-(--muted) uppercase">Entry type *</span>
              <input
                type="text"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                placeholder="e.g. THIRD_PARTY_COLLECTION, INTER_COMPANY_IN, CASH_DEPOSIT"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-(--muted) uppercase">Counterparty name</span>
              <input
                type="text"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                placeholder="Partner Co Ltd"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
              />
            </label>
            <label className="block max-w-md">
              <span className="text-xs font-semibold text-(--muted) uppercase">Flow type override</span>
              <select
                value={flowTypeOverride}
                onChange={(e) => setFlowTypeOverride(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
              >
                <option value="">(default — MANUAL_INFLOW)</option>
                {FLOW_OVERRIDE_INFLOW.filter(Boolean).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="space-y-3 p-3 rounded-xl border border-(--table-border) bg-(--background)/50">
            <p className="text-sm font-semibold">Outflow details</p>
            <label className="block">
              <span className="text-xs font-semibold text-(--muted) uppercase">Expense type *</span>
              <input
                type="text"
                required
                list="expense-type-presets"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                placeholder="RENT, LOGISTICS, PAYROLL, UTILITIES…"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm"
              />
              <datalist id="expense-type-presets">
                <option value="RENT" />
                <option value="LOGISTICS" />
                <option value="PAYROLL" />
                <option value="UTILITIES" />
                <option value="SUPPLIES" />
              </datalist>
            </label>
          </div>
        )}

        {formError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {formError}
          </p>
        )}

        <Button
          primary
          type="submit"
          disabled={isPending}
          className="py-3! px-6! rounded-xl! inline-flex items-center gap-2 w-full sm:w-auto"
        >
          {isPending && <RiLoader4Fill className="animate-spin" size={18} />}
          {isPending ? "Submitting…" : "Create ledger line"}
        </Button>
      </form>
    </div>
  );
}
