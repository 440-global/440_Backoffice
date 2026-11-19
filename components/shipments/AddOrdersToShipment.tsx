"use client";
import { useAddOrdersToShipment } from "@/api/shipment";
import { getApiError } from "@/lib/api-error";
import React, { FormEvent, useState } from "react";
import { useToast } from "../ui/toast/ToastContext";
import { Button, Input } from "../ui";

type Props = {
  onSuccess: () => void;
  shipmentId: number;
};

const AddOrdersToShipment = ({ shipmentId, onSuccess }: Props) => {
  const { mutateAsync: addOrders, isPending } =
    useAddOrdersToShipment(shipmentId);
  const { toast } = useToast();

  const [orderIds, setOrderIds] = useState<number[]>([]);
  const [id, setId] = useState("");
  const [inputKey, setInputKey] = useState(0); // bump to remount (and clear) the input

  const handleAddOrder = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Read what's actually in the field, falling back to state
    const raw = String(new FormData(e.currentTarget).get("id") ?? id);
    const parsed = Number(raw);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      toast({
        variant: "danger",
        title: "Invalid order ID",
        description: "Enter a valid order ID.",
        duration: 2000,
      });
      return;
    }

    setOrderIds((prev) => (prev.includes(parsed) ? prev : [...prev, parsed]));
    setId("");
    setInputKey((k) => k + 1);
  };

  const handleRemoveOrder = (orderId: number) => {
    setOrderIds((prev) => prev.filter((o) => o !== orderId));
  };

  const handleSubmit = async () => {
    try {
      await addOrders({ orderIds });
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
    <div>
      <form onSubmit={handleAddOrder}>
        <Input
          key={inputKey}
          element="input"
          input_type="number"
          handler={(e) => setId(e.target.value)}
          name="id"
          value={id}
          placeholder="Enter order ID"
          helperText="Enter the id of the order to be added. Press the Enter key to save an order"
          tag="Order ID"
        />
      </form>

      {orderIds.length > 0 && (
        <ul className="mb-3 flex gap-2 flex-wrap">
          {orderIds.map((orderId) => (
            <li
              key={orderId}
              className="p-1 bg-(--muted)/10 rounded flex gap-2 w-fit items-center text-sm"
            >
              #{orderId}{" "}
              <button
                type="button"
                onClick={() => handleRemoveOrder(orderId)}
                aria-label={`Remove order ${orderId}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        primary
        onClick={handleSubmit}
        disabled={isPending || orderIds.length === 0}
      >
        {isPending ? "Adding..." : "Add to shipment"}
      </Button>
    </div>
  );
};

export default AddOrdersToShipment;
