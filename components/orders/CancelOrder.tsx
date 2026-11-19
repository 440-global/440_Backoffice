"use client";

import ReasonDialog from "@/components/ui/reason-dialog";
import { getApiError } from "@/lib/api-error";
import { useCancelOrder } from "@/api/orders";

type Props = {
  orderId: number;
  onSuccess: () => void;
};

const CancelOrder = ({ orderId, onSuccess }: Props) => {
  const { mutate, isPending, error } = useCancelOrder(orderId);

  return (
    <ReasonDialog
      open
      title="Cancel order"
      description="The customer will no longer see this order. Say why it is being canceled."
      reasonLabel="Reason for canceling"
      placeholder="Enter the reason for canceling this order"
      confirmLabel="Confirm cancel"
      minLength={3}
      maxLength={255}
      toggle={{
        label: "Notify customer",
        description: "Let the customer know this order was canceled.",
        defaultChecked: true,
      }}
      isPending={isPending}
      error={error ? getApiError(error).message : undefined}
      onConfirm={(reason, notifyCustomer) =>
        mutate({ reason, notifyCustomer }, { onSuccess })
      }
      onClose={onSuccess}
    />
  );
};

export default CancelOrder;
