"use client";

import React, { FormEvent, useState } from "react";
import { useToast } from "../ui/toast/ToastContext";
import { Button, Input } from "../ui";
import { getApiError, issuesByField } from "@/lib/api-error";
import { useUpdateOrderDate } from "@/api/orders";
import { useUpdateOfflinePaymentDate } from "@/api/offline";

type Props = {
  orderId: number;
  paymentId?: number;
  onSuccess: () => void;
};

const UpdateDate = ({ orderId, paymentId, onSuccess }: Props) => {
  const {
    mutateAsync: updateDate,
    isPending,
    error,
  } = useUpdateOrderDate(orderId);
  const {
    mutateAsync: paymentDate,
    isPending: isPaymentPending,
    error: paymentError,
  } = useUpdateOfflinePaymentDate(orderId);
  const { toast } = useToast();
  const [placedAt, setPlacedAt] = useState<string>("");
  const [paidAt, setPaidAt] = useState<string>("");

  const saveError = error || paymentError;
  const parsedError = saveError ? getApiError(saveError) : null;
  const fieldErrors = parsedError ? issuesByField(parsedError) : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (paymentId !== undefined) {
        await paymentDate({ paymentId, body: { paidAt: paidAt } });
        toast({
          variant: "success",
          title: "Success",
          description: "Payment date updated successfully.",
          duration: 2000,
        });
      } else {
        await updateDate({ placedAt: placedAt });
        toast({
          variant: "success",
          title: "Success",
          description: "Order date updated successfully.",
          duration: 2000,
        });
      }
      onSuccess();
    } catch (err) {
      toast({
        variant: "danger",
        title: "Error",
        description: getApiError(err).message,
        duration: 2000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {paymentId !== undefined ? (
        <Input
          element="input"
          input_type="date"
          name="paidAt"
          value={paidAt}
          handler={(e) => setPaidAt(e.target.value)}
          tag="Paid At"
          placeholder="Select paid date"
          required
          helperText="Select the date when the payment was paid."
          error={fieldErrors.paidAt}
        />
      ) : (
        <Input
          element="input"
          input_type="date"
          name="placedAt"
          value={placedAt}
          handler={(e) => setPlacedAt(e.target.value)}
          tag="Placed At"
          placeholder="Select placed date"
          required
          helperText="Select the date when the order was placed."
          error={fieldErrors.placedAt}
        />
      )}
      <Button primary type="submit" disabled={isPending || isPaymentPending}>
        {isPending || isPaymentPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};

export default UpdateDate;
