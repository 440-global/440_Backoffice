"use client";

import React, { useState } from "react";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import { useAddShipmentEvent, useGetShipment } from "@/api/shipment";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { getApiError, issuesByField } from "@/lib/api-error";
import { EVENT_VISIBILITIES, stageOptions, type EventVisibility, type ShipmentStage } from "@/lib/enums";
import { fromLocalInputValue } from "@/lib/format";
import type { AddShipmentEventPayload, SingleShipment } from "@/types/types";
import { Button, Input } from "../ui";

type Props = {
  shipmentId: number;
  onSuccess: () => void;
};

type Notify = "auto" | "yes" | "no";

const VISIBILITY_OPTIONS = EVENT_VISIBILITIES.map((value) => ({
  value,
  label: value === "PUBLIC" ? "Public (customers see it)" : "Internal (team only)",
}));

const NOTIFY_OPTIONS = [
  { value: "auto", label: "Automatic: email customers for important stages" },
  { value: "yes", label: "Yes, email customers" },
  { value: "no", label: "No email" },
];

const EventForm = ({ shipment, onSuccess }: { shipment: SingleShipment; onSuccess: () => void }) => {
  const [stage, setStage] = useState<ShipmentStage | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [visibility, setVisibility] = useState<EventVisibility>("PUBLIC");
  const [eta, setEta] = useState("");
  const [isDelayed, setIsDelayed] = useState(shipment.isDelayed ?? false);
  const [notify, setNotify] = useState<Notify>("auto");
  const [version] = useState(shipment.version ?? 0);

  const keyFor = useIdempotencyKey();
  const { mutate, isPending, error } = useAddShipmentEvent(shipment.id);
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  // The backend wants one of these three; an update with none of them says nothing.
  const hasContent = !!stage || !!eta || title.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent) return;
    const text = (v: string) => v.trim() || undefined;
    const body: AddShipmentEventPayload = {
      stage: stage || undefined,
      title: text(title),
      description: text(description),
      location: text(location),
      occurredAt: fromLocalInputValue(occurredAt),
      visibility,
      eta: eta || undefined,
      isDelayed,
      ...(notify !== "auto" && { notify: notify === "yes" }),
      expectedVersion: version,
    };
    mutate({ body, idempotencyKey: keyFor(body) }, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-2 text-sm text-(--muted)">
        Add a tracking update for this {shipment.mode === "AIR" ? "air" : "sea"} shipment. Give a stage, a new ETA, or a title (at least one).
      </p>
      <Input
        element="select"
        name="stage"
        value={stage}
        handler={(e) => setStage(e.target.value as ShipmentStage | "")}
        tag="Stage"
        placeholder="No stage change"
        selectOptions={[{ value: "", label: "No stage change" }, ...stageOptions(shipment.mode)]}
        helperText={`Only stages that exist for ${shipment.mode === "AIR" ? "air" : "sea"} freight are listed.`}
        optional
        error={fieldErrors.stage}
      />
      <Input element="input" name="title" value={title} handler={(e) => setTitle(e.target.value)} tag="Title" placeholder="A short headline for the update" optional maxLength={160} error={fieldErrors.title} />
      <Input element="textarea" name="description" value={description} handler={(e) => setDescription(e.target.value)} tag="Description" placeholder="More detail" optional maxLength={500} error={fieldErrors.description} />
      <Input element="input" name="location" value={location} handler={(e) => setLocation(e.target.value)} tag="Location" placeholder="Where the goods are" optional maxLength={120} error={fieldErrors.location} />
      <Input element="input" input_type="datetime-local" name="occurredAt" value={occurredAt} handler={(e) => setOccurredAt(e.target.value)} tag="When it happened" helperText="Leave empty to use the time you save this." optional error={fieldErrors.occurredAt} />
      <Input element="input" input_type="date" name="eta" value={eta} handler={(e) => setEta(e.target.value)} tag="New ETA" helperText="Only fill this in if the arrival date has changed." optional error={fieldErrors.eta} />
      <Input element="select" name="visibility" value={visibility} handler={(e) => setVisibility(e.target.value as EventVisibility)} tag="Who can see it" selectOptions={VISIBILITY_OPTIONS} optional error={fieldErrors.visibility} />
      <Input element="select" name="notify" value={notify} handler={(e) => setNotify(e.target.value as Notify)} tag="Email customers" selectOptions={NOTIFY_OPTIONS} optional />

      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDelayed} onChange={(e) => setIsDelayed(e.target.checked)} />
        Mark this shipment as delayed
      </label>

      {parsed && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {parsed.status === 409 ? "Someone else changed this shipment while you were editing. Close this and open it again." : parsed.message}
        </p>
      )}

      <Button type="submit" primary isFullWidth isLoading={isPending} disabled={!hasContent}>
        {isPending ? "Adding update..." : "Add update"}
      </Button>
    </form>
  );
};

const AddShipmentEvent = ({ shipmentId, onSuccess }: Props) => {
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

  return <EventForm key={data.shipment.id} shipment={data.shipment} onSuccess={onSuccess} />;
};

export default AddShipmentEvent;
