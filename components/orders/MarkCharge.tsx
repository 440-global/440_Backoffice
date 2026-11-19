"use client";

import React from "react";
import { useNestedForm } from "@/hooks/use-nested-form";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { useMarkPaidOrderShippingCharge } from "@/api/shipping";
import { getApiError, issuesByField } from "@/lib/api-error";
import { fromLocalInputValue, fmtNgn } from "@/lib/format";
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from "@/lib/enums";
import type { MarkPaidChargePayload } from "@/types/shipping";
import { Button, Input } from "../ui";

type Props = {
  orderId: number;
  chargeId: number;
  /** What the customer owes on this charge, shown so the admin knows what they are recording. */
  totalNgn?: number;
  onSuccess: () => void;
};

type FormValues = {
  method: PaymentMethod;
  bankReference: string;
  paidAt: string;
  note: string;
};

const defaultValues: FormValues = { method: "bank_transfer", bankReference: "", paidAt: "", note: "" };

const MarkCharge = ({ orderId, chargeId, totalNgn, onSuccess }: Props) => {
  const { formValues, handleChange } = useNestedForm<FormValues>(defaultValues);
  const keyFor = useIdempotencyKey();
  const { mutate, isPending, error } = useMarkPaidOrderShippingCharge(orderId);
  const fieldErrors = error ? issuesByField(getApiError(error)) : {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Everything is optional on the backend: the amount is the charge total, so none is sent.
    const payload: MarkPaidChargePayload = {
      method: formValues.method,
      ...(formValues.bankReference.trim() && { bankReference: formValues.bankReference.trim() }),
      ...(formValues.paidAt && { paidAt: fromLocalInputValue(formValues.paidAt) }),
      ...(formValues.note.trim() && { note: formValues.note.trim() }),
    };
    mutate({ chargeId, payload, idempotencyKey: keyFor({ chargeId, payload }) }, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm text-(--muted)">
        Record that the customer paid this charge outside the app
        {totalNgn != null && <> ({fmtNgn(totalNgn)})</>}. It will show as paid straight away.
      </p>
      <Input
        element="select"
        name="method"
        value={formValues.method}
        handler={handleChange}
        tag="Payment method"
        placeholder="Select how it was paid"
        selectOptions={PAYMENT_METHOD_OPTIONS}
        required
        error={fieldErrors.method}
      />
      <Input
        element="input"
        name="bankReference"
        value={formValues.bankReference}
        handler={handleChange}
        tag="Bank reference"
        placeholder="Transfer reference or receipt number"
        optional
        maxLength={100}
        error={fieldErrors.bankReference}
      />
      <Input
        element="input"
        input_type="datetime-local"
        name="paidAt"
        value={formValues.paidAt}
        handler={handleChange}
        tag="Paid at"
        helperText="Leave empty to use the time you save this."
        optional
        error={fieldErrors.paidAt}
      />
      <Input
        element="textarea"
        name="note"
        value={formValues.note}
        handler={handleChange}
        tag="Note"
        placeholder="Anything the team should know"
        optional
        maxLength={500}
        error={fieldErrors.note}
      />
      {!!error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {getApiError(error).message}
        </p>
      )}
      <Button type="submit" primary isFullWidth isLoading={isPending}>
        {isPending ? "Saving..." : "Mark as paid"}
      </Button>
    </form>
  );
};

export default MarkCharge;
