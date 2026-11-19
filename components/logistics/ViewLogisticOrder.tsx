"use client";
import { useGetSingleLogisticOrder } from "@/api/logistics";
import React from "react";
import { RiErrorWarningFill, RiLoader5Line, RiMapPinLine, RiImageLine } from "react-icons/ri";
import { cn } from "@/components/ui/utils";
import {
  logisticStatusPillClass,
  paymentOptionPillClass,
  servicePaymentStatusPillClass,
} from "@/lib/order-badges";
import { formatCompactNgn } from "@/lib/dashboard-ui"; // adjust import path to wherever this actually lives

type Props = {
  orderId: string;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-(--table-border) last:border-0">
      <span className="text-sm text-(--muted)">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-(--surface) border border-(--table-border) rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

const ViewLogisticOrder = ({ orderId }: Props) => {
  const {
    data: logistic,
    isPending,
    error,
  } = useGetSingleLogisticOrder(orderId);

  return (
    <>
      {isPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : error ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="text-red-500" size={60} />
          <p>Error occurred while fetching logistic data.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-(--table-border)">
            <div>
              <p className="text-xs text-(--muted)">Order</p>
              <h2 className="text-lg font-bold">
                {logistic.referenceCode ?? logistic.id}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-xs",
                  logisticStatusPillClass(logistic.status),
                )}
              >
                {(logistic.status ?? "none").replace(/_/g, " ")}
              </span>
              <span className="text-lg font-bold">
                {formatCompactNgn(Number(logistic.amount))}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Customer */}
            <Section title="Customer">
              <DetailRow label="Name" value={logistic.fullName} />
              <DetailRow label="Email" value={logistic.email} />
              <DetailRow label="Phone" value={logistic.phone} />
              <DetailRow
                label="Account"
                value={logistic.user?.name ?? `User #${logistic.userId}`}
              />
            </Section>

            {/* Shipping */}
            <Section title="Shipping">
              <DetailRow label="Service type" value={logistic.serviceType} />
              <DetailRow
                label="From"
                value={
                  <span className="inline-flex items-center gap-1">
                    <RiMapPinLine className="text-(--muted)" size={14} />
                    {logistic.currentAddress}
                  </span>
                }
              />
              <DetailRow
                label="To"
                value={
                  <span className="inline-flex items-center gap-1">
                    <RiMapPinLine className="text-(--muted)" size={14} />
                    {logistic.destination}
                  </span>
                }
              />
              {(logistic.checkinDate || logistic.checkoutDate) && (
                <>
                  <DetailRow
                    label="Check-in"
                    value={formatDate(logistic.checkinDate)}
                  />
                  <DetailRow
                    label="Check-out"
                    value={formatDate(logistic.checkoutDate)}
                  />
                </>
              )}
              {(logistic.flightId || logistic.departureDate) && (
                <>
                  <DetailRow label="Flight" value={logistic.flightId ?? "—"} />
                  <DetailRow
                    label="Departure"
                    value={formatDate(logistic.departureDate)}
                  />
                </>
              )}
            </Section>

            {/* Payment */}
            <Section title="Payment">
              <DetailRow
                label="Option"
                value={
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs",
                      paymentOptionPillClass(logistic.paymentOption),
                    )}
                  >
                    {(logistic.paymentOption ?? "none").replace(/_/g, " ")}
                  </span>
                }
              />
              <DetailRow
                label="Status"
                value={
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs",
                      servicePaymentStatusPillClass(logistic.paymentStatus),
                    )}
                  >
                    {(logistic.paymentStatus ?? "none").replace(/_/g, " ")}
                  </span>
                }
              />
              {logistic.upfrontPercent != null && (
                <DetailRow
                  label="Upfront"
                  value={`${logistic.upfrontPercent}%`}
                />
              )}
              {logistic.amountPaid != null && (
                <DetailRow
                  label="Amount paid"
                  value={formatCompactNgn(logistic.amountPaid)}
                />
              )}
            </Section>

            {/* Meta */}
            <Section title="Record">
              <DetailRow label="Created" value={formatDate(logistic.createdAt)} />
              <DetailRow label="Updated" value={formatDate(logistic.updatedAt)} />
              <DetailRow
                label="Service"
                value={logistic.service ?? "Not included"}
              />
            </Section>
          </div>

          {/* Description */}
          <Section title="Description">
            <p className="text-sm">{logistic.description || "—"}</p>
          </Section>

          {/* Notes */}
          {logistic.notes && (
            <Section title="Notes">
              <p className="text-sm">{logistic.notes}</p>
            </Section>
          )}

          {/* Images */}
          {logistic.images.length > 0 && (
            <Section title="Images">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {logistic.images.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    referrerPolicy="no-referrer"
                    className="block aspect-square rounded-md overflow-hidden border border-(--table-border)"
                  >
                    <img
                      src={url}
                      alt={`Order image ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </>
  );
};

export default ViewLogisticOrder;