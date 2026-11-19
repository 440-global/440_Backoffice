"use client";

import React, { useState } from "react";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import { useAddOrderShippingCharges, useEditOrderShippingCharges, useGetOrderShippingCharges } from "@/api/shipping";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { useToast } from "../ui/toast/ToastContext";
import { getApiError, issuesByField } from "@/lib/api-error";
import {
  GOODS_TYPE_OPTIONS,
  SHIPPING_SERVICE_OPTIONS,
  UNIT_INPUT,
  UNIT_OF_SERVICE,
  type GoodsType,
  type ShippingService,
} from "@/lib/enums";
import { fmtNgn } from "@/lib/format";
import type { AddOrderShippingChargesPayload, ChargeOverrides, ShippingCharge } from "@/types/shipping";
import { AmountInput, Button, Input } from "../ui";

type Props = {
  onSuccess: () => void;
  orderId: number;
  charge?: ShippingCharge;
};

/** A rate the admin has not typed is `null`, so "left blank" (use the rate card) differs from a typed 0. */
type Rates = { freightRateUsd: number | null; clearingRateNgn: number | null; miscNgn: number | null };

type FormValues = {
  service: ShippingService;
  goodsType: GoodsType;
  measuredValue: number;
  rates: Rates;
  doorstepNgn: number;
  note: string;
};

const blankRates: Rates = { freightRateUsd: null, clearingRateNgn: null, miscNgn: null };

/**
 * Creating starts from the rate card (no rates typed). Editing keeps the rates the saved charge used, so
 * changing only the weight or the note does not quietly re-price it; they are cleared if the service or
 * goods type changes, because those rates belonged to the old card.
 */
const toFormValues = (charge?: ShippingCharge): FormValues =>
  charge
    ? {
        service: charge.service,
        goodsType: charge.goodsType,
        measuredValue: charge.measuredValue,
        rates: {
          freightRateUsd: charge.freightRateUsd,
          clearingRateNgn: charge.clearingRateNgn,
          miscNgn: charge.service === "CONTAINER" ? charge.miscNgn : null,
        },
        doorstepNgn: charge.doorstepNgn,
        note: charge.note ?? "",
      }
    : {
        service: "GENERAL_SEA",
        goodsType: "NORMAL",
        measuredValue: 0,
        rates: blankRates,
        doorstepNgn: 0,
        note: "",
      };

const AddShipmentCharge = ({ onSuccess, orderId, charge }: Props) => {
  const isEdit = charge != null;
  const [values, setValues] = useState<FormValues>(() => toFormValues(charge));
  const keyFor = useIdempotencyKey();
  const { toast } = useToast();

  // The order panel already loads this; it carries the delivery method, so no second order fetch is needed.
  const { data, isPending: loading, error: loadError } = useGetOrderShippingCharges(orderId);
  const add = useAddOrderShippingCharges(orderId);
  const edit = useEditOrderShippingCharges(orderId);
  const saving = add.isPending || edit.isPending;
  const saveError = add.error ?? edit.error;
  const parsedError = saveError ? getApiError(saveError) : null;
  const fieldErrors = parsedError ? issuesByField(parsedError) : {};

  if (loading) {
    return (
      <div className="h-full flex justify-center items-center">
        <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
      </div>
    );
  }
  if (loadError || !data) {
    return (
      <div className="h-full flex flex-col gap-2 justify-center items-center">
        <RiErrorWarningFill className="text-red-500" size={60} />
        <p>Error occurred while fetching order.</p>
      </div>
    );
  }

  const { order } = data.data;
  const liveCharge = data.data.charges.find((c) => c.status !== "VOID");
  // One live charge per order: a second would be refused, so say where it stands instead of showing a form.
  if (!isEdit && liveCharge) {
    return (
      <div className="space-y-2 text-sm">
        <p>
          This order already has a shipping charge of <strong>{fmtNgn(liveCharge.totalNgn)}</strong> (
          {liveCharge.status === "PAID" ? "paid" : "unpaid"}).
        </p>
        <p className="text-(--muted)">
          {liveCharge.status === "OPEN"
            ? "Open the order to edit it, or void it to add a new one."
            : "A paid charge cannot be changed."}
        </p>
        <Button type="button" onClick={onSuccess}>
          Close
        </Button>
      </div>
    );
  }
  const isDoorstep = order.deliveryMethod === "DOORSTEP";
  const isContainer = values.service === "CONTAINER";
  const unit = UNIT_OF_SERVICE[values.service];
  const unitInput = UNIT_INPUT[unit];

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const setRate = (key: keyof Rates) => (value: number, typed: boolean) =>
    setValues((prev) => ({ ...prev, rates: { ...prev.rates, [key]: typed ? value : null } }));

  // The old charge's rates belonged to the old card, so a different service or goods type starts clean.
  const changeCard = (patch: Partial<Pick<FormValues, "service" | "goodsType">>) =>
    setValues((prev) => ({ ...prev, ...patch, rates: blankRates, measuredValue: patch.service ? 0 : prev.measuredValue }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const overrides: ChargeOverrides = {};
    if (values.rates.freightRateUsd !== null) overrides.freightRateUsd = values.rates.freightRateUsd;
    if (values.rates.clearingRateNgn !== null) overrides.clearingRateNgn = values.rates.clearingRateNgn;
    // Misc only exists for containers; the backend refuses a typed amount for anything else.
    if (isContainer && values.rates.miscNgn !== null) overrides.miscNgn = values.rates.miscNgn;

    const payload: AddOrderShippingChargesPayload = {
      service: values.service,
      goodsType: values.goodsType,
      measuredValue: values.measuredValue,
      ...(Object.keys(overrides).length > 0 && { overrides }),
      // The backend wants a doorstep fee (0 allowed) for doorstep orders and none for the rest.
      ...(isDoorstep && { doorstepNgn: values.doorstepNgn }),
      ...(values.note.trim() && { note: values.note.trim() }),
    };

    const idempotencyKey = keyFor({ chargeId: charge?.id, payload });
    const done = (res: { data: { warnings: string[] } }) => {
      if (res.data.warnings.length > 0) {
        toast({ title: "Heads up", description: res.data.warnings.join("\n"), variant: "warning", duration: 10000 });
      }
      onSuccess();
    };

    if (isEdit) edit.mutate({ chargeId: charge.id, payload, idempotencyKey }, { onSuccess: done });
    else add.mutate({ payload, idempotencyKey }, { onSuccess: done });
  };

  return (
    <form onSubmit={handleSubmit}>
      {order.shippingCollectedAtCheckout > 0 && (
        <p className="mb-3 rounded-lg bg-yellow-500/10 p-3 text-sm">
          {fmtNgn(order.shippingCollectedAtCheckout)} of shipping was already collected at checkout for this order.
        </p>
      )}
      {order.paymentStatus === "UNPAID" && (
        <p className="mb-3 rounded-lg bg-yellow-500/10 p-3 text-sm">The goods on this order are not paid yet.</p>
      )}

      <Input
        element="select"
        name="service"
        value={values.service}
        handler={(e) => changeCard({ service: e.target.value as ShippingService })}
        tag="Shipping service"
        placeholder="Select shipping service"
        selectOptions={SHIPPING_SERVICE_OPTIONS}
        required
        error={fieldErrors.service}
      />
      <Input
        element="select"
        name="goodsType"
        value={values.goodsType}
        handler={(e) => changeCard({ goodsType: e.target.value as GoodsType })}
        tag="Type of goods"
        placeholder="Select goods type"
        selectOptions={GOODS_TYPE_OPTIONS}
        required
        error={fieldErrors.goodsType}
      />
      <AmountInput
        name="measuredValue"
        tag={`${unitInput.label} (${unitInput.suffix})`}
        placeholder={`Enter ${unitInput.label.toLowerCase()}`}
        value={values.measuredValue}
        onChange={(n) => set("measuredValue", n)}
        integer={unitInput.integer}
        min={unitInput.integer ? 1 : undefined}
        max={unitInput.max}
        helperText={`Up to ${unitInput.max.toLocaleString("en-US")} ${unitInput.suffix}.`}
        required
        error={fieldErrors.measuredValue}
      />

      <fieldset className="border border-(--table-border) px-4 rounded-md pb-3">
        <legend className="text-sm font-medium text-(--muted)">Rates (optional)</legend>
        <p className="mt-2 text-xs text-(--muted)">
          {isEdit
            ? "These are the rates saved on this charge. Clear one to use the current rate card instead."
            : "Leave a rate empty to use the rate card. Type one to replace it for this order."}
          {isContainer && " Container clearing and miscellaneous are left to be advised on the card, so enter them here."}
        </p>
        <AmountInput
          name="rates.freightRateUsd"
          tag={`Freight rate (USD per ${unitInput.suffix === "containers" ? "container" : unitInput.suffix})`}
          placeholder="From the rate card"
          value={values.rates.freightRateUsd ?? 0}
          onChange={setRate("freightRateUsd")}
          allowZero
          optional
          error={fieldErrors.freightRateUsd}
        />
        <AmountInput
          name="rates.clearingRateNgn"
          tag={`Clearing rate (NGN per ${unitInput.suffix === "containers" ? "container" : unitInput.suffix})`}
          placeholder="From the rate card"
          value={values.rates.clearingRateNgn ?? 0}
          onChange={setRate("clearingRateNgn")}
          allowZero
          required={isContainer}
          optional={!isContainer}
          error={fieldErrors.clearingRateNgn}
        />
        {isContainer && (
          <AmountInput
            name="rates.miscNgn"
            tag="Miscellaneous expenses (NGN, flat)"
            placeholder="Enter amount"
            value={values.rates.miscNgn ?? 0}
            onChange={setRate("miscNgn")}
            allowZero
            required
            error={fieldErrors.miscNgn}
          />
        )}
      </fieldset>

      {isDoorstep && (
        <AmountInput
          name="doorstepNgn"
          tag="Doorstep delivery fee (NGN)"
          placeholder="0"
          value={values.doorstepNgn}
          onChange={(n) => set("doorstepNgn", n)}
          allowZero
          required
          helperText={`The customer chose doorstep delivery${order.deliveryAddress ? ` to ${order.deliveryAddress}` : ""}. Enter 0 if it is free.`}
          error={fieldErrors.doorstepNgn}
        />
      )}

      <Input
        element="textarea"
        name="note"
        value={values.note}
        handler={(e) => set("note", e.target.value)}
        tag="Note for the customer"
        placeholder="Visible to the customer"
        optional
        maxLength={500}
        error={fieldErrors.note}
      />

      {parsedError && !Object.keys(fieldErrors).length && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {parsedError.message}
        </p>
      )}
      {parsedError && Object.keys(fieldErrors).length > 0 && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {parsedError.message}. Check the highlighted fields.
        </p>
      )}

      <Button type="submit" primary isFullWidth isLoading={saving} disabled={values.measuredValue <= 0}>
        {saving ? (isEdit ? "Saving..." : "Adding charge...") : isEdit ? "Save changes" : "Add charge"}
      </Button>
    </form>
  );
};

export default AddShipmentCharge;
