"use client";

import ReasonDialog from "@/components/ui/reason-dialog";
import { useVoidOrderShippingCharge } from "@/api/shipping";
import { getApiError } from "@/lib/api-error";

type Props = {
  orderId: number;
  chargeId: number;
  onSuccess: () => void;
};

const VoidCharge = ({ orderId, chargeId, onSuccess }: Props) => {
  const { mutate, isPending, error } = useVoidOrderShippingCharge(orderId);

  return (
    <ReasonDialog
      open
      title="Void shipping charge"
      description="The customer will no longer see this charge, and a new one can be added. Say why it is being voided."
      reasonLabel="Reason for voiding"
      placeholder="Enter the reason for voiding this charge"
      confirmLabel="Confirm void"
      minLength={3}
      maxLength={255}
      isPending={isPending}
      error={error ? getApiError(error).message : undefined}
      onConfirm={(reason) => mutate({ chargeId, payload: { reason } }, { onSuccess })}
      onClose={onSuccess}
    />
  );
};

export default VoidCharge;
