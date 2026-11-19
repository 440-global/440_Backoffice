"use client";

import ReasonDialog from "@/components/ui/reason-dialog";
import { useReverseShippingPayment } from "@/api/shipping";
import { getApiError } from "@/lib/api-error";

type Props = {
  orderId: number;
  chargeId: number;
  /** Called when the dialog should go away, after a reversal or after Cancel. */
  onSuccess: () => void;
};

const ReverseCharge = ({ orderId, chargeId, onSuccess }: Props) => {
  const { mutate, isPending, error } = useReverseShippingPayment(orderId);

  return (
    <ReasonDialog
      open
      title="Reverse payment"
      description="Only a payment recorded by an admin can be reversed. The charge goes back to unpaid. Say why it is being reversed."
      reasonLabel="Reason for reversing"
      placeholder="Enter the reason for reversing this payment"
      confirmLabel="Confirm reversal"
      minLength={3}
      maxLength={255}
      isPending={isPending}
      error={error ? getApiError(error).message : undefined}
      onConfirm={(reason) => mutate({ chargeId, payload: { reason } }, { onSuccess })}
      onClose={onSuccess}
    />
  );
};

export default ReverseCharge;
