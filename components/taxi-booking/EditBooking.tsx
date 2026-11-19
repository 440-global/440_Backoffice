"use client";

import { useGetTaxiBooking, useUpdateTaxiBookingStatus } from '@/api/taxi-booking';
import { TaxiBookingStatus } from '@/types/types';
import React, { useState } from 'react'
import { useToast } from '../ui/toast/ToastContext';
import { RiErrorWarningFill, RiLoader5Line } from 'react-icons/ri';
import { Button, Input } from '../ui';

type Props = {
  bookingId: number;
};

type UpdatePayload = {
  toStatus: TaxiBookingStatus;
  note?: string;
  availabilityNote?: string;
  driverDetails?: any;
  refundReason?: string;
};

const EditBooking = ({ bookingId }: Props) => {
  const [form, setForm] = useState<UpdatePayload>({
    toStatus: "SUBMITTED",
  });
  const { toast } = useToast();

  const { data: booking, isPending: isBookingPending, error: bookingError } = useGetTaxiBooking(bookingId);
  const { mutateAsync: updateBookingStatus, isPending: isUpdatePending, error: updateError } = useUpdateTaxiBookingStatus();

  let ALLOWED_TO_STATUS_VALUES: TaxiBookingStatus[] = [];

  if(booking?.status === "SUBMITTED") {
    ALLOWED_TO_STATUS_VALUES = ["AVAILABILITY_CHECK", "CANCELLED"];
  }

  if(booking?.status === "AVAILABILITY_CHECK") {
    ALLOWED_TO_STATUS_VALUES = ["CONFIRMED", "DECLINED", "CANCELLED"];
  }

  if(booking?.status === "CONFIRMED") {
    ALLOWED_TO_STATUS_VALUES = ["DRIVER_ASSIGNED", "CANCELLED"];
  }

  if(booking?.status === "DRIVER_ASSIGNED") {
    ALLOWED_TO_STATUS_VALUES = ["IN_TRANSIT"];
  }

  if(booking?.status === "IN_TRANSIT") {
    ALLOWED_TO_STATUS_VALUES = ["COMPLETED"];
  }

  if(booking?.status === "CANCELLED") {
    ALLOWED_TO_STATUS_VALUES = ["REFUND_PENDING"];
  }

  if(booking?.status === "REFUND_PENDING" || booking?.status === "COMPLETED") {
    ALLOWED_TO_STATUS_VALUES = [];
  }

  const buildPayload = (form: UpdatePayload) => {
    const base: UpdatePayload = {
      toStatus: form.toStatus,
    };

    if (form.note) {
      base.note = form.note;
    }

    if (form.toStatus === "REFUND_PENDING") {
      base.refundReason = form.refundReason;
    }

    if (form.toStatus === "DECLINED") {
      base.availabilityNote = form.availabilityNote;
    }

    if (form.toStatus === "DRIVER_ASSIGNED") {
      base.note = form.note;
      base.driverDetails = {
        name: form.driverDetails?.name,
        phone: form.driverDetails?.phone,
        vehicleDetails: form.driverDetails?.vehicleDetails,
      };
    }

    return base;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = buildPayload(form);
    try {
      const res = await updateBookingStatus({
        id: bookingId,
        body: payload,
      });

      if (res.success) {
        toast({
          title: "Booking updated",
          description: "The booking status has been updated successfully.",
          variant: "success",
        });
        setForm({
          toStatus: "SUBMITTED",
        });
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error updating booking",
        description: "An error occurred while updating the booking status.",
        variant: "danger",
      });
    }
  };

  return (
    <>
      {isBookingPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : bookingError ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="text-red-500" size={60} />
          <p className="text-red-500">Error loading booking details</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold">Edit Booking {bookingId}</h2>
          <Input
            element="input"
            input_type="text"
            name="fromStatus"
            value={booking?.status ?? ""}
            handler={() => {}}
            disabled
            tag="From Status"
            placeholder="From Status"
          />
          <Input
            element="select"
            input_type="text"
            name="toStatus"
            value={form.toStatus}
            handler={(e) =>
              setForm({
                ...form,
                toStatus: e.target.value as TaxiBookingStatus,
              })
            }
            tag="To Status"
            placeholder="New Status"
            selectOptions={ALLOWED_TO_STATUS_VALUES.map((allowed) => {
              return {
                label: allowed.replace(/_/g, " "),
                value: allowed,
              };
            })}
          />
          {["AVAILABILITY_CHECK", "CONFIRMED", "COMPLETED"].includes(
            form.toStatus,
          ) && (
            <Input
              element="textarea"
              name="note"
              tag="Note"
              value={form.note || ""}
              handler={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Enter note"
            />
          )}
          {form.toStatus === "DECLINED" && (
            <Input
              element="textarea"
              name="availabilityNote"
              tag="Availability note"
              value={form.availabilityNote || ""}
              handler={(e) =>
                setForm((f) => ({ ...f, availabilityNote: e.target.value }))
              }
              placeholder="Enter availability note"
            />
          )}
          {form.toStatus === "REFUND_PENDING" && (
            <Input
              element="textarea"
              name="refundReason"
              tag="Refund reason"
              value={form.refundReason || ""}
              handler={(e) =>
                setForm((f) => ({ ...f, refundReason: e.target.value }))
              }
              placeholder="Enter refund reason"
            />
          )}
          {form.toStatus === "DRIVER_ASSIGNED" && (
            <>
              <Input
                element="input"
                name="documentationScore"
                value={form.driverDetails?.name || ""}
                tag="Driver Name"
                placeholder="Driver Name"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    driverDetails: {
                      ...f.driverDetails,
                      name: e.target.value,
                    },
                  }))
                }
              />
              <Input
                element="input"
                name="documentationScore"
                value={form.driverDetails?.phone || ""}
                tag="Driver Phone"
                placeholder="Driver Phone"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    driverDetails: {
                      ...f.driverDetails,
                      phone: e.target.value,
                    },
                  }))
                }
              />
              <Input
                element="input"
                name="documentationScore"
                value={form.driverDetails?.vehicleDetails || ""}
                tag="Vehicle Details"
                placeholder="Vehicle Details"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    driverDetails: {
                      ...f.driverDetails,
                      vehicleDetails: e.target.value,
                    },
                  }))
                }
              />
              <Input
                element="textarea"
                name="note"
                tag="Note"
                value={form.note || ""}
                handler={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
                placeholder="Enter note"
              />
            </>
          )}
          <Button
            type="submit"
            primary
            className="mt-4"
            disabled={isUpdatePending}
          >
            {isUpdatePending ? "Updating..." : "Edit Booking"}
          </Button>
        </form>
      )}
    </>
  );
}

export default EditBooking