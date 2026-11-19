"use client";

import React, { useState } from "react";
import MyModal from "../dashboard/Modal";
import { useCreateOfflinePayment } from "@/api/offline";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { getApiError, issuesByField } from "@/lib/api-error";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/enums";
import { fmtNgn, fromLocalInputValue } from "@/lib/format";
import type { OfflinePaymentPayload, OrderPaymentMethod } from "@/types/types";
import { AmountInput, Button, Input } from "../ui";

type Props = {
  orderId: number;
  /** What is still owed on the order. A payment above it is refused by the backend. */
  balanceDue?: number;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type FormValues = {
  amount: number;
  method: OrderPaymentMethod;
  bankReference: string;
  paidAt: string;
  note: string;
};

const defaultValues: FormValues = { amount: 0, method: "bank_transfer", bankReference: "", paidAt: "", note: "" };

const AddOfflinePayment = ({ orderId, balanceDue, setModalOpen }: Props) => {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const keyFor = useIdempotencyKey();
  const { mutate, isPending, error } = useCreateOfflinePayment(orderId);
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};
  const close = () => setModalOpen(false);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set(e.target.name as keyof FormValues, e.target.value as never);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: OfflinePaymentPayload = {
      amount: values.amount,
      method: values.method,
      ...(values.bankReference.trim() && { bankReference: values.bankReference.trim() }),
      ...(values.paidAt && { paidAt: fromLocalInputValue(values.paidAt) }),
      ...(values.note.trim() && { note: values.note.trim() }),
    };
    mutate({ body, idempotencyKey: keyFor(body) }, { onSuccess: close });
  };

  const overBalance = balanceDue != null && values.amount > balanceDue + 0.005;

  return (
    <MyModal isOpen onClose={() => {}} onXClose={close} title="Add offline payment">
      <p className="text-sm text-(--muted)">
        Record a payment the customer made outside the app.
        {balanceDue != null && <> Still owed: <strong>{fmtNgn(balanceDue)}</strong>.</>}
      </p>
      <form onSubmit={handleSubmit}>
        <AmountInput
          name="amount"
          tag="Amount (NGN)"
          placeholder="Enter amount"
          value={values.amount}
          onChange={(n) => set("amount", n)}
          required
          error={fieldErrors.amount ?? (overBalance ? `More than the ${fmtNgn(balanceDue)} still owed.` : undefined)}
        />
        <Input
          element="select"
          name="method"
          value={values.method}
          handler={handleChange}
          tag="Payment method"
          placeholder="Select payment method"
          selectOptions={PAYMENT_METHOD_OPTIONS}
          optional
          error={fieldErrors.method}
        />
        {values.method === "bank_transfer" && (
          <Input
            element="input"
            name="bankReference"
            value={values.bankReference}
            handler={handleChange}
            tag="Bank reference"
            placeholder="Transfer reference"
            optional
            maxLength={64}
            error={fieldErrors.bankReference}
          />
        )}
        <Input
          element="input"
          input_type="datetime-local"
          name="paidAt"
          value={values.paidAt}
          handler={handleChange}
          tag="Paid at"
          helperText="Leave empty to use the time you save this. It cannot be in the future."
          optional
          error={fieldErrors.paidAt}
        />
        <Input
          element="textarea"
          name="note"
          value={values.note}
          handler={handleChange}
          tag="Note"
          placeholder="Anything the team should know"
          optional
          maxLength={500}
          error={fieldErrors.note}
        />
        {parsed && !Object.keys(fieldErrors).length && (
          <p role="alert" className="mb-3 text-sm text-red-500">
            {parsed.message}
          </p>
        )}
        <Button type="submit" primary isFullWidth isLoading={isPending} disabled={values.amount <= 0 || overBalance}>
          {isPending ? "Adding payment..." : "Add payment"}
        </Button>
      </form>
    </MyModal>
  );
};

export default AddOfflinePayment;
