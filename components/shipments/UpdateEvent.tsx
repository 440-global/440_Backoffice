"use client";
import { useUpdateShipmentEvent } from "@/api/shipment";
import { useNestedForm } from "@/hooks/use-nested-form";
import { ShipmentEvent, ShipmentEventUpdatePayload } from "@/types/types";
import React, { FormEvent, useEffect } from "react";
import { useToast } from "../ui/toast/ToastContext";
import { getApiError, issuesByField } from "@/lib/api-error";
import { Button, Input } from "../ui";

type Props = {
  shipmentId: number;
  shipmentVersion: number;
  event: ShipmentEvent;
  onSuccess: () => void;
};

const defaultValues: ShipmentEventUpdatePayload = {
  occurredAt: "",
  title: "",
  description: "",
  location: "",
  expectedVersion: 0,
};

const UpdateEvent = ({
  shipmentId,
  shipmentVersion,
  event,
  onSuccess,
}: Props) => {
  const {
    mutateAsync: updateEvent,
    isPending,
    error,
  } = useUpdateShipmentEvent(shipmentId);
  const { formValues, setFormValues, handleChange } =
    useNestedForm<ShipmentEventUpdatePayload>(defaultValues);
  const { toast } = useToast();

  const saveError = error;
  const parsedError = saveError ? getApiError(saveError) : null;
  const fieldErrors = parsedError ? issuesByField(parsedError) : {};

  useEffect(() => {
    setFormValues({
      occurredAt: event.occurredAt,
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      expectedVersion: shipmentVersion,
    });
  }, [event, shipmentVersion]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateEvent({ eventId: event.id, body: { ...formValues } });
      toast({
        variant: "success",
        title: "Success",
        description: "Event updated successfully.",
        duration: 2000,
      });
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
      <Input
        element="input"
        name="occurredAt"
        tag="Occurred At"
        input_type="date"
        value={formValues.occurredAt}
        handler={handleChange}
        required
        helperText="Select the date when the event occurred."
        error={fieldErrors.occurredAt}
      />
      <Input
        element="input"
        name="title"
        tag="Title"
        value={formValues.title}
        handler={handleChange}
        placeholder="Enter a title for the event"
        required
        helperText="Enter a title for the event."
        error={fieldErrors.title}
      />
      <Input
        element="textarea"
        name="description"
        tag="Description"
        value={formValues.description}
        handler={handleChange}
        placeholder="Enter a description for the event"
        required
        helperText="Enter a description for the event."
        error={fieldErrors.description}
      />
      <Input
        element="input"
        name="location"
        tag="Location"
        value={formValues.location}
        handler={handleChange}
        placeholder="Enter the location of the event"
        required
        helperText="Enter the location where the event took place."
        error={fieldErrors.location}
      />
      <Button
        primary
        disabled={isPending}
        type="submit"
      >
        { isPending ? "Updating..." : "Update Event" }
      </Button>
    </form>
  );
};

export default UpdateEvent;
