"use client";

import React, { useState } from "react";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import { useGetShipment, useUpdateShipmentStatus } from "@/api/shipment";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { getApiError } from "@/lib/api-error";
import { SHIPMENT_TRANSITIONS, labelize, type ShipmentStatus } from "@/lib/enums";
import type { SingleShipment, UpdateShipmentPayload } from "@/types/types";
import { Button, Input } from "../ui";

type Props = {
  shipmentId: number;
  onSuccess: () => void;
};

const StatusForm = ({ shipment, onSuccess }: { shipment: SingleShipment; onSuccess: () => void }) => {
  const allowed = SHIPMENT_TRANSITIONS[shipment.status];
  const [status, setStatus] = useState<ShipmentStatus | "">("");
  const [note, setNote] = useState("");
  const [version] = useState(shipment.version ?? 0);
  const keyFor = useIdempotencyKey();
  const { mutate, isPending, error } = useUpdateShipmentStatus(shipment.id);
  const parsed = error ? getApiError(error) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    const body: UpdateShipmentPayload = { status, expectedVersion: version, ...(note.trim() && { note: note.trim() }) };
    mutate({ body, idempotencyKey: keyFor(body) }, { onSuccess });
  };

  // Delivered, lost and cancelled are final: there is nothing to move to.
  if (allowed.length === 0) {
    return (
      <p className="text-sm text-(--muted)">
        This shipment is {labelize(shipment.status).toLowerCase()}. A shipment in that status cannot move to another.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input element="input" name="fromStatus" value={labelize(shipment.status)} handler={() => {}} disabled tag="Current status" />
      <Input
        element="select"
        name="status"
        value={status}
        handler={(e) => setStatus(e.target.value as ShipmentStatus)}
        tag="Move to"
        placeholder="Select the new status"
        selectOptions={allowed.map((value) => ({ value, label: labelize(value) }))}
        required
      />
      <Input element="textarea" name="note" value={note} handler={(e) => setNote(e.target.value)} tag="Note" placeholder="Why the status is changing" optional maxLength={500} />
      {parsed && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {parsed.status === 409 ? "Someone else changed this shipment while you were editing. Close this and open it again." : parsed.message}
        </p>
      )}
      <Button type="submit" primary isFullWidth isLoading={isPending} disabled={!status}>
        {isPending ? "Updating..." : "Update status"}
      </Button>
    </form>
  );
};

const UpdateShipment = ({ shipmentId, onSuccess }: Props) => {
  const { data, isPending, error } = useGetShipment(shipmentId);

  if (isPending) {
    return (
      <div className="h-full flex justify-center items-center">
        <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="h-full flex flex-col gap-2 justify-center items-center">
        <RiErrorWarningFill className="text-red-500" size={60} />
        <p>Error occurred while fetching shipment data.</p>
      </div>
    );
  }

  return <StatusForm key={data.shipment.id} shipment={data.shipment} onSuccess={onSuccess} />;
};

export default UpdateShipment;
