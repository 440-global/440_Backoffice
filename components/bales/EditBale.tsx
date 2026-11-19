"use client";

import React, { useState } from "react";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import { useGetSingleBale, useUpdateBale } from "@/api/bales";
import { getApiError, issuesByField } from "@/lib/api-error";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/format";
import type { SingleBale, UpdateBale } from "@/types/types";
import { AmountInput, Button, Input } from "../ui";

type Props = {
  baleId: number;
  onSuccess: () => void;
};

type FormValues = {
  slot: number;
  quantity: number;
  filledSlot: number;
  price: number;
  oldPrice: number;
  originalPrice: number;
  endIn: string;
};

const toFormValues = (b: SingleBale): FormValues => ({
  slot: b.slot,
  quantity: b.quantity,
  filledSlot: b.filledSlot,
  price: b.price,
  oldPrice: b.oldPrice,
  originalPrice: b.originalPrice ?? 0,
  endIn: toLocalInputValue(b.endIn),
});

/**
 * Edits a bale's size, prices and end date. Built once the bale has loaded (keyed by its id) so a background
 * refetch cannot reset what is being typed. Only what changed is sent. Prices here are in naira, as the
 * admin bale endpoint returns them.
 */
const EditBaleForm = ({ bale, onSuccess }: { bale: SingleBale; onSuccess: () => void }) => {
  const [initial] = useState<FormValues>(() => toFormValues(bale));
  const [values, setValues] = useState<FormValues>(initial);
  const [nothingChanged, setNothingChanged] = useState(false);
  const { mutate, isPending, error } = useUpdateBale(bale.id);
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setNothingChanged(false);
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const filledTooMany = values.filledSlot > values.slot;
  const canSubmit = values.slot >= 1 && values.price > 0 && !filledTooMany;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const body: UpdateBale = {};
    if (values.slot !== initial.slot) body.slot = values.slot;
    if (values.quantity !== initial.quantity && values.quantity > 0) body.quantity = values.quantity;
    if (values.filledSlot !== initial.filledSlot) body.filledSlot = values.filledSlot;
    if (values.price !== initial.price) body.price = values.price;
    if (values.oldPrice !== initial.oldPrice && values.oldPrice > 0) body.oldPrice = values.oldPrice;
    if (values.originalPrice !== initial.originalPrice && values.originalPrice > 0) body.originalPrice = values.originalPrice;
    if (values.endIn !== initial.endIn && values.endIn) body.endIn = fromLocalInputValue(values.endIn);
    if (Object.keys(body).length === 0) {
      setNothingChanged(true);
      return;
    }
    mutate(body, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-2 text-sm text-(--muted)">
        {bale.product.name} · bale {bale.baleId ?? `#${bale.id}`}
      </p>
      <AmountInput name="slot" tag="Number of slots" value={values.slot} onChange={(n) => set("slot", n)} integer min={1} required error={fieldErrors.slot} />
      <AmountInput name="quantity" tag="Units in the bale" value={values.quantity} onChange={(n) => set("quantity", n)} integer optional error={fieldErrors.quantity} />
      <AmountInput
        name="filledSlot"
        tag="Slots taken"
        value={values.filledSlot}
        onChange={(n) => set("filledSlot", n)}
        integer
        allowZero
        helperText="Slots paid for by customers. Change it only to correct a mistake."
        optional
        error={fieldErrors.filledSlot ?? (filledTooMany ? "More than the number of slots." : undefined)}
      />
      <AmountInput name="price" tag="Price (NGN)" value={values.price} onChange={(n) => set("price", n)} required error={fieldErrors.price} />
      <AmountInput name="oldPrice" tag="Old price (NGN)" value={values.oldPrice} onChange={(n) => set("oldPrice", n)} optional error={fieldErrors.oldPrice} />
      <AmountInput name="originalPrice" tag="Original price / cost (NGN)" value={values.originalPrice} onChange={(n) => set("originalPrice", n)} optional error={fieldErrors.originalPrice} />
      <Input element="input" input_type="datetime-local" name="endIn" value={values.endIn} handler={(e) => set("endIn", e.target.value)} tag="Pool ends" optional error={fieldErrors.endIn} />

      {nothingChanged && <p className="mb-3 text-sm text-(--muted)">Nothing has changed yet.</p>}
      {parsed && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {parsed.message}
          {parsed.issues.length > 0 && Object.keys(fieldErrors).length === 0 ? ": " + parsed.issues.map((i) => i.message).join("; ") : ""}
        </p>
      )}
      <Button type="submit" primary isFullWidth isLoading={isPending} disabled={!canSubmit}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
};

const EditBale = ({ baleId, onSuccess }: Props) => {
  const { data: bale, isPending, error } = useGetSingleBale(String(baleId));

  if (isPending) {
    return (
      <div className="h-full flex justify-center items-center">
        <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
      </div>
    );
  }
  if (error || !bale) {
    return (
      <div className="h-full flex flex-col gap-2 justify-center items-center">
        <RiErrorWarningFill className="text-red-500" size={60} />
        <p>Error occurred while fetching bale data.</p>
      </div>
    );
  }
  return <EditBaleForm key={bale.id} bale={bale} onSuccess={onSuccess} />;
};

export default EditBale;
