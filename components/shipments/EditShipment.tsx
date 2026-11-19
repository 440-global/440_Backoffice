"use client";

import React, { useState } from "react";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import { useGetShipment, useUpdateShipment } from "@/api/shipment";
import { getApiError, issuesByField } from "@/lib/api-error";
import type { AirModeDetails, EditShipmentPayload, SeaModeDetails, SingleShipment } from "@/types/types";
import { Button, Input } from "../ui";
import ModeDetailsFields, { cleanModeDetails } from "./ModeDetailsFields";

type Props = {
  shipmentId: number;
  onSuccess: () => void;
};

type FormValues = {
  carrier: string;
  trackingNumber: string;
  containerNumber: string;
  estimatedDelivery: string;
  etd: string;
  originPort: string;
  destinationPort: string;
  notes: string;
  modeDetails: Partial<SeaModeDetails> | Partial<AirModeDetails>;
  notify: boolean;
};

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

const toFormValues = (s: SingleShipment): FormValues => ({
  carrier: s.carrier ?? "",
  trackingNumber: s.trackingNumber ?? "",
  containerNumber: s.containerNumber ?? "",
  estimatedDelivery: day(s.estimatedDelivery),
  etd: day(s.etd),
  originPort: s.originPort ?? "",
  destinationPort: s.destinationPort ?? "",
  notes: s.notes ?? "",
  modeDetails: s.modeDetails ?? {},
  notify: true,
});

/**
 * The form is built once per shipment (it is keyed by the shipment id). A background refetch therefore
 * cannot wipe what the admin is typing, and `expectedVersion` stays the one they started from, so if someone
 * else saved in the meantime the backend says so instead of being overwritten.
 */
const EditShipmentForm = ({ shipment, onSuccess }: { shipment: SingleShipment; onSuccess: () => void }) => {
  const [values, setValues] = useState<FormValues>(() => toFormValues(shipment));
  const [initial] = useState<FormValues>(() => toFormValues(shipment));
  const [version] = useState(shipment.version ?? 0);
  const [nothingChanged, setNothingChanged] = useState(false);
  const { mutate, isPending, error } = useUpdateShipment(shipment.id);
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const handleText = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNothingChanged(false);
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: EditShipmentPayload = { expectedVersion: version };
    // `null` clears a field; a field the admin did not touch is left out so nothing is rewritten.
    const nullable = (key: "trackingNumber" | "containerNumber" | "originPort" | "destinationPort" | "notes") => {
      if (values[key] !== initial[key]) payload[key] = values[key].trim() || null;
    };
    nullable("trackingNumber");
    nullable("containerNumber");
    nullable("originPort");
    nullable("destinationPort");
    nullable("notes");
    // The carrier can be changed but not removed.
    if (values.carrier !== initial.carrier && values.carrier.trim()) payload.carrier = values.carrier.trim();
    if (values.estimatedDelivery !== initial.estimatedDelivery && values.estimatedDelivery) {
      payload.estimatedDelivery = values.estimatedDelivery;
    }
    if (values.etd !== initial.etd) payload.etd = values.etd || null;
    if (JSON.stringify(values.modeDetails) !== JSON.stringify(initial.modeDetails)) {
      payload.modeDetails = cleanModeDetails(values.modeDetails) ?? null;
    }

    if (Object.keys(payload).length === 1) {
      setNothingChanged(true);
      return;
    }
    payload.notify = values.notify;
    mutate(payload, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-2 text-sm text-(--muted)">
        {shipment.mode === "AIR" ? "Air" : "Sea"} shipment #{shipment.id}. Clear a box to remove what was saved.
      </p>

      <ModeDetailsFields
        mode={shipment.mode}
        value={values.modeDetails}
        onChange={(key, value) => {
          setNothingChanged(false);
          setValues((prev) => ({ ...prev, modeDetails: { ...prev.modeDetails, [key]: value } }));
        }}
        errors={fieldErrors}
      />

      <Input element="input" name="carrier" value={values.carrier} handler={handleText} tag="Carrier" placeholder="Enter carrier name" helperText="Can be changed, not removed." optional maxLength={80} error={fieldErrors.carrier} />
      <Input element="input" name="trackingNumber" value={values.trackingNumber} handler={handleText} tag="Tracking number" placeholder="Enter tracking number" optional maxLength={60} error={fieldErrors.trackingNumber} />
      {shipment.mode === "SEA" && (
        <Input element="input" name="containerNumber" value={values.containerNumber} handler={handleText} tag="Container number" placeholder="Enter container number" optional maxLength={60} error={fieldErrors.containerNumber} />
      )}
      <Input element="input" input_type="date" name="estimatedDelivery" value={values.estimatedDelivery} handler={handleText} tag="Estimated arrival (ETA)" required error={fieldErrors.estimatedDelivery} />
      <Input element="input" input_type="date" name="etd" value={values.etd} handler={handleText} tag="Estimated departure (ETD)" optional error={fieldErrors.etd} />
      <Input element="input" name="originPort" value={values.originPort} handler={handleText} tag={shipment.mode === "AIR" ? "Origin airport / city" : "Origin port"} placeholder="Enter origin" optional maxLength={80} error={fieldErrors.originPort} />
      <Input element="input" name="destinationPort" value={values.destinationPort} handler={handleText} tag={shipment.mode === "AIR" ? "Destination airport / city" : "Destination port"} placeholder="Enter destination" optional maxLength={80} error={fieldErrors.destinationPort} />
      <Input element="textarea" name="notes" value={values.notes} handler={handleText} tag="Internal notes" placeholder="Visible to the team only" optional maxLength={2000} error={fieldErrors.notes} />

      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={values.notify} onChange={(e) => setValues((prev) => ({ ...prev, notify: e.target.checked }))} />
        Tell customers about this change
      </label>

      {nothingChanged && <p className="mb-3 text-sm text-(--muted)">Nothing has changed yet.</p>}
      {parsed && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {parsed.status === 409 ? "Someone else changed this shipment while you were editing. Close this and open it again." : parsed.message}
          {parsed.status !== 409 && parsed.issues.length > 0 && Object.keys(fieldErrors).length === 0 ? ": " + parsed.issues.map((i) => i.message).join("; ") : ""}
        </p>
      )}

      <Button type="submit" primary isFullWidth isLoading={isPending} disabled={!values.estimatedDelivery}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
};

const EditShipment = ({ shipmentId, onSuccess }: Props) => {
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
        <p>Error occurred while fetching shipment.</p>
      </div>
    );
  }

  return <EditShipmentForm key={data.shipment.id} shipment={data.shipment} onSuccess={onSuccess} />;
};

export default EditShipment;
