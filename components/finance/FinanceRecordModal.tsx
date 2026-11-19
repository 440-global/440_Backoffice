"use client";

import { FinanceRecord } from "@/types/types";
import { Badge } from "@/components/ui";
import Link from "next/link";

const fmt = (n: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);

const STATUS_BADGE: Record<
  string,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "danger",
  REFUNDED: "secondary",
  PARTIALLY_REFUNDED: "warning",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-(--table-border) last:border-0">
      <p className="text-xs uppercase text-(--muted) mb-0.5">{label}</p>
      <p className="text-sm font-semibold break-all">{value ?? "—"}</p>
    </div>
  );
}

type Props = {
  record: FinanceRecord;
};

export default function FinanceRecordModal({ record }: Props) {
  return (
    <div className="space-y-6">
      {/* Amount & Status header */}
      <div className="bg-(--background) rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-(--muted) mb-1">Amount</p>
          <p className="text-3xl font-bold">
            {fmt(record.amount, record.currency)}
          </p>
          <p className="text-sm text-(--muted) mt-1">{record.currency}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Badge variant={STATUS_BADGE[record.status] ?? "primary"}>
            {record.status.replace("_", " ")}
          </Badge>
          <span className="text-xs bg-(--primary)/10 text-(--primary) px-2 py-1 rounded-full font-semibold">
            {record.category.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Transaction details */}
      <div>
        <h4 className="font-bold text-sm uppercase mb-2">Transaction Details</h4>
        <div className="bg-(--background) rounded-xl px-4">
          <Row label="Record ID" value={`#${record.id}`} />
          <Row label="Description" value={record.description} />
          <Row label="Reference" value={record.reference} />
          <Row label="Transaction ID" value={record.transactionId ?? "—"} />
          <Row label="Payment Method" value={record.paymentMethod} />
          <Row
            label="Payment Purpose"
            value={record.paymentPurpose?.replace("_", " ") ?? "—"}
          />
          <Row label="Flow Direction" value={record.flowDirection} />
          <Row label="Flow Type" value={record.flowType} />
          <Row label="Source Type" value={record.sourceType} />
          <Row label="Source ID" value={record.sourceId} />
          <Row
            label="Date"
            value={new Date(record.createdAt).toLocaleString("en-NG", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        </div>
      </div>

      {/* Customer */}
      {record.customer && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm uppercase">Customer</h4>
            <Link
              href={`/dashboard/finance/customers/statement?customerId=${record.customer.id}`}
              className="text-xs text-(--primary) font-semibold hover:underline"
            >
              View Statement →
            </Link>
          </div>
          <div className="bg-(--background) rounded-xl px-4">
            <Row label="Name" value={record.customer.name} />
            <Row label="Email" value={record.customer.email} />
            <Row label="Phone" value={record.customer.phone} />
            <Row label="Shop" value={record.customer.shop_name} />
          </div>
        </div>
      )}
    </div>
  );
}
