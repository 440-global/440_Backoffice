"use client";

import React from "react";
import ReasonDialog from "@/components/ui/reason-dialog";
import { useVoidOfflinePayment } from "@/api/offline";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { getApiError } from "@/lib/api-error";

type Props = {
  orderId: number;
  paymentId: number;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const VoidPayment = ({ orderId, paymentId, setModalOpen }: Props) => {
  const { mutate, isPending, error } = useVoidOfflinePayment(orderId);
  const keyFor = useIdempotencyKey();
  const close = () => setModalOpen(false);

  return (
    <ReasonDialog
      open
      title="Void payment"
      description="This removes a payment an admin recorded by hand, and the order goes back to what it owed before. Say why it is being voided."
      reasonLabel="Reason for voiding"
      placeholder="Enter the reason for voiding this payment"
      confirmLabel="Void payment"
      minLength={5}
      maxLength={500}
      isPending={isPending}
      error={error ? getApiError(error).message : undefined}
      onConfirm={(reason) =>
        mutate({ paymentId, reason, idempotencyKey: keyFor({ paymentId, reason }) }, { onSuccess: close })
      }
      onClose={close}
    />
  );
};

export default VoidPayment;
