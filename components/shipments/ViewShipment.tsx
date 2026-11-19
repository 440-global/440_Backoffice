"use client";

import { useDeleteShipmentOrders, useGetShipment, useVoidShipmentEvent } from "@/api/shipment";
import React, { useState } from "react";
import {
  RiErrorWarningFill,
  RiLoader5Line,
  RiMapPinLine,
  RiImageLine,
  RiDeleteBack2Fill,
  RiDeleteBinFill,
  RiDeleteBinLine,
  RiCloseLine,
} from "react-icons/ri";
import { cn } from "@/components/ui/utils";
import { formatCompactNgn } from "@/lib/dashboard-ui";
import {
  logisticStatusPillClass,
  paymentOptionPillClass,
  servicePaymentStatusPillClass,
} from "@/lib/order-badges";
import { ActionDropdown, Button } from "../ui";
import { ShipmentEvent } from "@/types/types";
import ReasonDialog from "../ui/reason-dialog";
import { useCan } from "@/hooks/use-can";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { getApiError } from "@/lib/api-error";
import { labelize, stageLabel } from "@/lib/enums";
import MyModal from "../dashboard/Modal";
import UpdateEvent from "./UpdateEvent";
import { useToast } from "../ui/toast/ToastContext";
import { useConfirm } from "../ui/confirm";

type Props = {
  shipmentId: number;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-(--table-border) last:border-0 gap-4">
      <span className="text-sm text-(--muted)">{label}</span>
      <span className="text-sm font-medium text-right wrap-break-word max-w-[75%]">
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  button,
  children,
}: {
  title: string;
  button?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-(--surface) border border-(--table-border) rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {button}
      </div>
      <div>{children}</div>
    </div>
  );
}

const ViewShipment = ({ shipmentId }: Props) => {
  const { data, isPending, error } = useGetShipment(shipmentId);
  const shipment = data?.shipment;

  const { mutate: voidEvent, isPending: voidPending, error: voidError } = useVoidShipmentEvent(shipmentId);
  const { mutateAsync: deleteOrders, isPending: deletePending, error: deleteError } = useDeleteShipmentOrders(shipmentId);
  const canWrite = useCan("shipment.write");
  const canUpdate = useCan("shipment.update");
  const keyFor = useIdempotencyKey();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [selectedEvent, setSelectedEvent] = useState<ShipmentEvent | null>(
    null,
  );
  const [modalType, setModalType] = useState<"void" | "edit" | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [orderIds, setOrderIds] = useState<number[]>([]);

  const handleDeleteOrders = async () => {
    if (orderIds.length === 0) return;

    const ok = await confirm("Are you sure you want to delete the selected order(s)?");
    if (!ok) return;

    try {
      await deleteOrders(
        { orderIds }, 
        { 
          onSuccess: () => {
            setIsDeleteMode(false);
            setOrderIds([]);
          } 
        }
      );
      setOrderIds([]);
    } catch (error) {
      console.error("Error deleting orders:", error);
      toast({
        title: "Error deleting orders",
        description: "An error occurred while deleting the orders.",
        variant: "danger",
      });
    }
  };

  // A shipment booked without mode details has none; every field below reads from this safe copy.
  const details = (shipment?.modeDetails ?? {}) as Record<string, string | number | undefined>;

  return (
    <>
      {isPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : error || !shipment ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="text-red-500" size={60} />
          <p>Error occurred while fetching shipment data.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-(--table-border)">
            <div>
              <p className="text-xs text-(--muted)">Shipment</p>

              <h2 className="text-lg font-bold">
                {shipment.trackingNumber ?? shipment.id}
              </h2>

              <p className="text-xs text-(--muted) mt-1">
                {shipment.carrier ?? "No carrier"}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-xs",
                  logisticStatusPillClass(shipment.status),
                )}
              >
                {shipment.status.replace(/_/g, " ")}
              </span>

              <span className="text-lg font-bold">
                {shipment.totalCost != null
                  ? formatCompactNgn(Number(shipment.totalCost))
                  : "—"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Shipment Information */}
            <Section title="Shipment">
              <DetailRow
                label="Tracking number"
                value={shipment.trackingNumber ?? "—"}
              />

              <DetailRow label="Carrier" value={shipment.carrier ?? "—"} />

              <DetailRow
                label="Shipping method"
                value={
                  <span className="inline-flex rounded-full px-2.5 py-1 text-xs bg-(--background)">
                    {labelize(shipment.shippingMethod ?? shipment.mode)}
                  </span>
                }
              />

              <DetailRow label="Provider" value={shipment.provider} />

              <DetailRow label="Stage" value={stageLabel(shipment.stage)} />

              <DetailRow
                label="Container number"
                value={shipment.containerNumber ?? "—"}
              />

              <DetailRow
                label="Status"
                value={
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs",
                      logisticStatusPillClass(shipment.status),
                    )}
                  >
                    {shipment.status.replace(/_/g, " ")}
                  </span>
                }
              />
            </Section>

            {/* Shipping */}
            <Section title="Shipping">
              <DetailRow
                label="From"
                value={
                  <span className="inline-flex items-center gap-1">
                    <RiMapPinLine className="text-(--muted)" size={14} />
                    {shipment.originPort ?? "—"}
                  </span>
                }
              />

              <DetailRow
                label="To"
                value={
                  <span className="inline-flex items-center gap-1">
                    <RiMapPinLine className="text-(--muted)" size={14} />
                    {shipment.destinationPort ?? "—"}
                  </span>
                }
              />

              <DetailRow
                label="Delivery location"
                value={shipment.deliveryLocation ?? "—"}
              />

              <DetailRow label="ETD" value={formatDate(shipment.etd)} />

              <DetailRow
                label="Estimated delivery"
                value={formatDate(shipment.estimatedDelivery)}
              />

              <DetailRow
                label="Latest ETA"
                value={formatDate(shipment.etaLatest)}
              />

              <DetailRow
                label="Actual delivery"
                value={formatDate(shipment.actualDelivery)}
              />

              <DetailRow
                label="Shipped at"
                value={formatDate(shipment.shippedAt)}
              />

              <DetailRow
                label="Delayed"
                value={shipment.isDelayed ? "Yes" : "No"}
              />
            </Section>

            {/* Mode Details */}
            <Section
              title={
                shipment.mode === "AIR"
                  ? "Air freight details"
                  : "Sea freight details"
              }
            >
              {shipment.mode === "SEA" ? (
                <>
                  <DetailRow
                    label="Vessel name"
                    value={details.vesselName ?? "—"}
                  />
                  <DetailRow label="Voyage" value={details.voyage ?? "—"} />
                  <DetailRow
                    label="Bill of lading"
                    value={details.billOfLading ?? "—"}
                  />
                  <DetailRow
                    label="Volume"
                    value={details.cbm != null ? `${details.cbm} CBM` : "—"}
                  />
                </>
              ) : (
                <>
                  <DetailRow label="AWB" value={details.awb ?? "—"} />
                  <DetailRow
                    label="Flight number"
                    value={details.flightNumber ?? "—"}
                  />
                  <DetailRow
                    label="Origin airport"
                    value={details.originAirport ?? "—"}
                  />
                  <DetailRow
                    label="Destination airport"
                    value={details.destinationAirport ?? "—"}
                  />
                  <DetailRow
                    label="Chargeable weight"
                    value={
                      details.chargeableWeightKg != null
                        ? `${details.chargeableWeightKg} kg`
                        : "—"
                    }
                  />
                </>
              )}
            </Section>

            {/* Cost */}
            <Section title="Cost & Weight">
              <DetailRow
                label="Total weight"
                value={
                  shipment.totalWeight != null
                    ? `${shipment.totalWeight.toLocaleString()} kg`
                    : "—"
                }
              />

              <DetailRow
                label="Total cost"
                value={
                  shipment.totalCost != null
                    ? formatCompactNgn(shipment.totalCost)
                    : "—"
                }
              />
            </Section>

            {/* Notes */}
            <Section title="Notes">
              <DetailRow label="Internal notes" value={shipment.notes ?? "—"} />
            </Section>

            {/* Record */}
            <Section title="Record">
              <DetailRow
                label="Created"
                value={formatDate(shipment.createdAt)}
              />

              <DetailRow
                label="Updated"
                value={formatDate(shipment.updatedAt)}
              />

              <DetailRow
                label="Last event"
                value={formatDate(shipment.lastEventAt)}
              />

              <DetailRow
                label="Stage updated"
                value={formatDate(shipment.stageUpdatedAt)}
              />

              <DetailRow label="Version" value={shipment.version} />
            </Section>

            {/* Metrics */}
            <Section title="Summary">
              <DetailRow label="Total bales" value={data.metrics.totalBales} />

              <DetailRow
                label="Total orders"
                value={data.metrics.totalOrders}
              />
            </Section>
          </div>

          {/* Bales */}
          {data.bales.length > 0 && (
            <Section title={`Bales (${data.bales.length})`}>
              <div className="space-y-3">
                {data.bales.map((bale) => (
                  <div
                    key={bale.id}
                    className="border border-(--table-border) rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">
                          {bale.product.name}
                        </p>

                        <p className="text-xs text-(--muted) mt-1">
                          Bale ID: {bale.baleId}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs",
                          logisticStatusPillClass(bale.status),
                        )}
                      >
                        {bale.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 mt-3">
                      <DetailRow
                        label="Quantity"
                        value={bale.quantity.toLocaleString()}
                      />

                      <DetailRow
                        label="Price"
                        value={`${bale.currency}${bale.price.toLocaleString()}`}
                      />

                      <DetailRow label="Slot" value={bale.slot} />

                      <DetailRow label="Filled slot" value={bale.filledSlot} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Orders */}
          {data.orders.length > 0 && (
            <Section
              title={`Orders (${data.orders.length})`}
              button={
                <div
                  className={`${!canWrite && !canUpdate ? "hidden" : "flex"} items-center gap-2`}
                >
                  <Button
                    onClick={() => setIsDeleteMode(true)}
                    disabled={!canWrite && isDeleteMode == true}
                    className={`${isDeleteMode ? "hidden" : "text-sm py-1! px-2! gap-1! rounded! bg-transparent text-red-500! hover:bg-red-50/10"}`}
                  >
                    <RiDeleteBinLine size={16} />
                    <span className="mt-0.5">Delete Orders</span>
                  </Button>
                  <Button
                    primary
                    onClick={() => {
                      setIsDeleteMode(false);
                      setOrderIds([]);
                    }}
                    disabled={!canWrite && isDeleteMode == true}
                    className={`${!isDeleteMode ? "hidden" : "text-sm py-1! px-2! gap-1! rounded!"}`}
                  >
                    <RiCloseLine size={16} />
                    Cancel
                  </Button>
                </div>
              }
            >
              <div className="space-y-3">
                {data.orders.map((order) => (
                  <div
                    key={order.id}
                    className={`border ${orderIds.includes(order.id) ? 'border-red-300 bg-red-100/15' : 'border-(--table-border) bg-transparent'} rounded-lg p-3`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{order.reference}</p>

                        <p className="text-xs text-(--muted) mt-1">
                          Order #{order.id}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs",
                            servicePaymentStatusPillClass(order.paymentStatus),
                          )}
                        >
                          {order.paymentStatus.replace(/_/g, " ")}
                        </span>
                        {
                          isDeleteMode && canWrite && canUpdate && (
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={orderIds.includes(order.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setOrderIds([...orderIds, order.id]);
                                } else {
                                  setOrderIds(orderIds.filter((id) => id !== order.id));
                                }
                              }}
                            />
                          )
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 mt-3">
                      <DetailRow
                        label="Customer"
                        value={order.checkout.merchant.name}
                      />

                      <DetailRow
                        label="Email"
                        value={order.checkout.merchant.email}
                      />

                      <DetailRow
                        label="Phone"
                        value={order.checkout.merchant.phone}
                      />

                      <DetailRow
                        label="Payment option"
                        value={
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs",
                              paymentOptionPillClass(order.paymentOption),
                            )}
                          >
                            {order.paymentOption.replace(/_/g, " ")}
                          </span>
                        }
                      />

                      <DetailRow
                        label="Total amount"
                        value={formatCompactNgn(order.totalAmount)}
                      />

                      <DetailRow
                        label="Amount paid"
                        value={formatCompactNgn(order.amountPaid)}
                      />

                      <DetailRow
                        label="Checkout"
                        value={order.checkout.serialNumber}
                      />

                      <DetailRow
                        label="Created"
                        value={formatDate(order.createdAt)}
                      />
                    </div>
                  </div>
                ))}
                {isDeleteMode && canWrite && canUpdate && (
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white text-sm py-2! px-3! gap-1! rounded-xl!"
                    disabled={orderIds.length === 0 || deletePending}
                    onClick={handleDeleteOrders}
                  >
                    <RiDeleteBinLine size={16} />
                    <span className="mt-0.5">
                      Delete ({orderIds.length} selected)
                    </span>
                  </Button>
                )}
              </div>
            </Section>
          )}

          {/* Events */}
          {data.events.length > 0 && (
            <Section title="Shipment Timeline">
              <div className="space-y-4">
                {data.events.map((event, index) => {
                  const actions = [
                    ...(canUpdate
                      ? [
                          {
                            label: "Edit event",
                            onClick: () => {
                              setModalType("edit");
                              setSelectedEvent(event);
                            },
                          },
                        ]
                      : []),
                    ...(canWrite && event.source !== "SYSTEM" && !event.voidedAt
                      ? [
                          {
                            label: "Void update",
                            danger: true,
                            onClick: () => {
                              setModalType("void");
                              setSelectedEvent(event);
                            },
                          },
                        ]
                      : []),
                  ];
                  return (
                    <div key={event.id} className="relative flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-(--primary) mt-1.5" />

                        {index !== data.events.length - 1 && (
                          <div className="w-px flex-1 bg-(--table-border) mt-1" />
                        )}
                      </div>

                      <div className="flex flex-1 items-start gap-2">
                        <div className="pb-3 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                event.voidedAt && "line-through text-(--muted)",
                              )}
                            >
                              {event.title || stageLabel(event.stage)}
                            </p>

                            <span className="text-xs text-(--muted)">
                              {formatDate(event.occurredAt)}
                            </span>
                          </div>

                          <p className="text-xs text-(--muted) mt-1">
                            {event.stage ? `${stageLabel(event.stage)} · ` : ""}
                            {labelize(event.status)}
                            {event.visibility === "INTERNAL"
                              ? " · team only"
                              : ""}
                          </p>
                          {event.voidedAt && (
                            <p className="text-xs text-red-500 mt-1">
                              Voided {formatDate(event.voidedAt)}
                              {event.voidReason ? `: ${event.voidReason}` : ""}
                            </p>
                          )}

                          {event.description && (
                            <p className="text-sm mt-2">{event.description}</p>
                          )}

                          {event.location && (
                            <p className="text-xs text-(--muted) mt-1">
                              <RiMapPinLine className="inline mr-1" size={13} />
                              {event.location}
                            </p>
                          )}
                        </div>
                        {/* The system's own events and ones already voided are refused by the backend. */}
                        {actions.length > 0 && (
                          <ActionDropdown actions={actions} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      )}

      {selectedEvent && modalType === "void" && (
        <ReasonDialog
          open
          title="Void shipment update"
          description={`You are about to void "${selectedEvent.title || stageLabel(selectedEvent.stage)}". Customers will no longer see it. Say why.`}
          reasonLabel="Reason for voiding"
          placeholder="Enter the reason for voiding this update"
          confirmLabel="Confirm void"
          minLength={3}
          maxLength={255}
          isPending={voidPending}
          error={voidError ? getApiError(voidError).message : undefined}
          onConfirm={(reason) => {
            const body = { reason };
            voidEvent(
              {
                eventId: selectedEvent.id,
                body,
                idempotencyKey: keyFor({ eventId: selectedEvent.id, body }),
              },
              { onSuccess: () => setSelectedEvent(null) },
            );
          }}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {selectedEvent && modalType === "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          title="Edit Shipment Event"
        >
          <UpdateEvent
            shipmentId={shipmentId}
            shipmentVersion={shipment?.version ?? 0}
            event={selectedEvent}
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      )}
    </>
  );
};

export default ViewShipment;
