"use client";

import React, { useState } from "react";
import { useAddShipment } from "@/api/shipment";
import { useToast } from "../ui/toast/ToastContext";
import { getApiError, issuesByField } from "@/lib/api-error";
import { SHIPMENT_MODES, SHIPMENT_PROVIDERS, type ShipmentMode, type ShipmentProvider } from "@/lib/enums";
import type { AddShipmentPayload, AirModeDetails, SeaModeDetails } from "@/types/types";
import { AmountInput, Button, Input } from "../ui";
import ModeDetailsFields, { cleanModeDetails } from "./ModeDetailsFields";

type Props = {
  onSuccess: () => void;
  /** Opened from an order row: that order is already on the list. */
  orderId?: number;
};

type FormValues = {
  mode: ShipmentMode;
  estimatedDelivery: string;
  etd: string;
  carrier: string;
  trackingNumber: string;
  containerNumber: string;
  originPort: string;
  destinationPort: string;
  deliveryLocation: string;
  totalWeight: number;
  totalCost: number;
  provider: ShipmentProvider;
  notes: string;
  modeDetails: Partial<SeaModeDetails> | Partial<AirModeDetails>;
};

const defaultValues: FormValues = {
  mode: "SEA",
  estimatedDelivery: "",
  etd: "",
  carrier: "",
  trackingNumber: "",
  containerNumber: "",
  originPort: "",
  destinationPort: "",
  deliveryLocation: "",
  totalWeight: 0,
  totalCost: 0,
  provider: "MANUAL",
  notes: "",
  modeDetails: {},
};

const MODE_OPTIONS = SHIPMENT_MODES.map((value) => ({ value, label: value === "SEA" ? "Sea" : "Air" }));
const PROVIDER_OPTIONS = SHIPMENT_PROVIDERS.map((value) => ({ value, label: value === "MANUAL" ? "Manual (entered by hand)" : "Skycargo" }));

const AddShipment = ({ onSuccess, orderId }: Props) => {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [orderIds, setOrderIds] = useState<number[]>(orderId ? [orderId] : []);
  const [orderInput, setOrderInput] = useState(0);
  const { toast } = useToast();
  const { mutate, isPending, error } = useAddShipment();
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));
  const handleText = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set(e.target.name as keyof FormValues, e.target.value as never);

  const addOrder = () => {
    if (orderInput > 0 && !orderIds.includes(orderInput)) setOrderIds((prev) => [...prev, orderInput]);
    setOrderInput(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Typing an order id and pressing Enter should add it, not leave it forgotten in the box.
    const ids = orderInput > 0 && !orderIds.includes(orderInput) ? [...orderIds, orderInput] : orderIds;
    const text = (v: string) => v.trim() || undefined;

    const payload: AddShipmentPayload = {
      mode: values.mode,
      estimatedDelivery: values.estimatedDelivery,
      orderIds: ids,
      carrier: text(values.carrier),
      trackingNumber: text(values.trackingNumber),
      containerNumber: text(values.containerNumber),
      etd: values.etd || undefined,
      originPort: text(values.originPort),
      destinationPort: text(values.destinationPort),
      deliveryLocation: text(values.deliveryLocation),
      totalWeight: values.totalWeight > 0 ? values.totalWeight : undefined,
      totalCost: values.totalCost > 0 ? values.totalCost : undefined,
      provider: values.provider,
      notes: text(values.notes),
      modeDetails: cleanModeDetails(values.modeDetails),
    };

    mutate(payload, {
      onSuccess: (res) => {
        const warnings = res.data.warnings ?? [];
        if (warnings.length > 0) {
          toast({ title: "Heads up", description: warnings.join("\n"), variant: "warning", duration: 10000 });
        }
        onSuccess();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        element="select"
        name="mode"
        value={values.mode}
        // A vessel and an airline have nothing in common, so changing the mode starts the details fresh.
        handler={(e) => setValues((prev) => ({ ...prev, mode: e.target.value as ShipmentMode, modeDetails: {} }))}
        tag="Shipping mode"
        placeholder="Select shipping mode"
        selectOptions={MODE_OPTIONS}
        required
        error={fieldErrors.mode}
      />

      <ModeDetailsFields
        mode={values.mode}
        value={values.modeDetails}
        onChange={(key, value) => setValues((prev) => ({ ...prev, modeDetails: { ...prev.modeDetails, [key]: value } }))}
        errors={fieldErrors}
      />

      <Input
        element="input"
        input_type="date"
        name="estimatedDelivery"
        value={values.estimatedDelivery}
        handler={handleText}
        tag="Estimated arrival (ETA)"
        helperText="The date customers see on their tracking page."
        required
        error={fieldErrors.estimatedDelivery}
      />
      <Input element="input" input_type="date" name="etd" value={values.etd} handler={handleText} tag="Estimated departure (ETD)" optional error={fieldErrors.etd} />

      <div className="mb-2">
        <p className="mb-1 font-semibold">
          Orders<span className="text-red-500 ml-1" aria-hidden="true">*</span>
        </p>
        <div className="flex gap-2 flex-wrap mb-2">
          {orderIds.map((id) => (
            <span key={id} className="p-1 px-2 bg-(--primary)/20 rounded flex gap-2 items-center text-sm">
              Order #{id}
              <button type="button" aria-label={`Remove order ${id}`} onClick={() => setOrderIds((prev) => prev.filter((o) => o !== id))}>
                ✕
              </button>
            </span>
          ))}
          {orderIds.length === 0 && <span className="text-sm text-(--muted)">No orders added yet.</span>}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <AmountInput
            name="orderInput"
            tag="Order ID"
            placeholder="Enter an order ID"
            value={orderInput}
            onChange={(n) => setOrderInput(n)}
            integer
            genStyle="my-0! flex-1"
            helperText="Only direct-purchase orders that are not already on a shipment."
            error={fieldErrors.orderIds ?? fieldErrors.baleIds}
          />
          <Button type="button" primary disabled={orderInput <= 0} onClick={addOrder} className="w-fit">
            Add order
          </Button>
        </div>
      </div>

      <Input element="input" name="carrier" value={values.carrier} handler={handleText} tag="Carrier" placeholder="Enter carrier name" optional maxLength={80} error={fieldErrors.carrier} />
      <Input element="input" name="trackingNumber" value={values.trackingNumber} handler={handleText} tag="Tracking number" placeholder="Enter tracking number" optional maxLength={60} error={fieldErrors.trackingNumber} />
      {values.mode === "SEA" && (
        <Input element="input" name="containerNumber" value={values.containerNumber} handler={handleText} tag="Container number" placeholder="Enter container number" optional maxLength={60} error={fieldErrors.containerNumber} />
      )}
      <Input element="input" name="originPort" value={values.originPort} handler={handleText} tag={values.mode === "AIR" ? "Origin airport / city" : "Origin port"} placeholder="Enter origin" optional maxLength={80} error={fieldErrors.originPort} />
      <Input element="input" name="destinationPort" value={values.destinationPort} handler={handleText} tag={values.mode === "AIR" ? "Destination airport / city" : "Destination port"} placeholder="Enter destination" optional maxLength={80} error={fieldErrors.destinationPort} />
      <Input element="input" name="deliveryLocation" value={values.deliveryLocation} handler={handleText} tag="Delivery location" placeholder="Enter delivery location" optional maxLength={255} error={fieldErrors.deliveryLocation} />

      <AmountInput name="totalWeight" tag="Total weight (kg)" placeholder="Enter total weight" value={values.totalWeight} onChange={(n) => set("totalWeight", n)} optional error={fieldErrors.totalWeight} />
      <AmountInput name="totalCost" tag="Total cost" placeholder="Enter total cost" value={values.totalCost} onChange={(n) => set("totalCost", n)} optional error={fieldErrors.totalCost} />

      <Input element="select" name="provider" value={values.provider} handler={handleText} tag="Booked through" placeholder="Select provider" selectOptions={PROVIDER_OPTIONS} optional error={fieldErrors.provider} />
      <Input element="textarea" name="notes" value={values.notes} handler={handleText} tag="Internal notes" placeholder="Visible to the team only" optional maxLength={2000} error={fieldErrors.notes} />

      {parsed && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {parsed.message}
          {parsed.issues.length > 0 && Object.keys(fieldErrors).length === 0 ? ": " + parsed.issues.map((i) => i.message).join("; ") : ""}
        </p>
      )}

      <Button type="submit" primary isFullWidth isLoading={isPending} disabled={!values.estimatedDelivery || (orderIds.length === 0 && orderInput <= 0)} className="mt-4">
        {isPending ? "Creating shipment..." : "Create shipment"}
      </Button>
    </form>
  );
};

export default AddShipment;
