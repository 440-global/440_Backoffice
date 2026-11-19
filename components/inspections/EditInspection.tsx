"use client";

import { InspectionStatus, SupplierVerificationStatus } from "@/types/types";
import React, { useState } from "react";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import { Button, Input } from "../ui";
import { useToast } from "../ui/toast/ToastContext";
import { useGetInspection, useUpdateInspectionStatus } from "@/api/inspection";

type Props = {
  inspectionId: number;
  onSuccess: () => void;
};

type UpdatePayload = {
  toStatus: InspectionStatus;
  note?: string;
  patch?: any;
};

const EditInspection = ({ inspectionId, onSuccess }: Props) => {
  const [form, setForm] = useState<UpdatePayload>({
    toStatus: "SUBMITTED",
  });
  const { toast } = useToast();

  const {
    data: inspectionData,
    isPending: isInspectionPending,
    error: inspectionError,
  } = useGetInspection(inspectionId);
  const {
    mutateAsync: updateInspectionStatus,
    isPending: isUpdatePending,
    error: updateError,
  } = useUpdateInspectionStatus();

  let ALLOWED_TO_STATUS_VALUES: InspectionStatus[] = [];

  if (inspectionData?.status === "SUBMITTED") {
    ALLOWED_TO_STATUS_VALUES = ["SCHEDULED", "REJECTED", "CANCELLED"];
  }

  if (inspectionData?.status === "SCHEDULED") {
    ALLOWED_TO_STATUS_VALUES = ["IN_PROGRESS", "REJECTED", "CANCELLED"];
  }

  if (inspectionData?.status === "IN_PROGRESS") {
    ALLOWED_TO_STATUS_VALUES = ["REPORT_READY", "REJECTED"];
  }

  if (inspectionData?.status === "REPORT_READY") {
    ALLOWED_TO_STATUS_VALUES = ["COMPLETED"];
  }

  if (inspectionData?.status === "REJECTED") {
    ALLOWED_TO_STATUS_VALUES = ["REFUNDED"];
  }

  if (inspectionData?.status === "COMPLETED" || inspectionData?.status === "CANCELLED" || inspectionData?.status === "REFUNDED") {
    ALLOWED_TO_STATUS_VALUES = [];
  }

  const buildPayload = (form: UpdatePayload) => {
    const base: UpdatePayload = {
      toStatus: form.toStatus,
    };

    if (form.note) {
      base.note = form.note;
    }

    if (form.toStatus === "SCHEDULED") {
      base.note = form.note;
      base.patch = {
        assignedAdminId: form.patch?.assignedAdminId,
      };
    }

    if (form.toStatus === "REPORT_READY") {
      base.patch = {
        report: form.patch?.report,
      };
    }

    if (form.toStatus === "REJECTED") {
      base.note = form.note;
      base.patch = {
        refund: form.patch?.refund ?? false,
      };
    }

    return base;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = buildPayload(form);
    try {
      const res = await updateInspectionStatus({
        id: inspectionId,
        body: payload,
      });

      if (res.success) {
        toast({
          title: "Inspection updated",
          description: "The inspection status has been updated successfully.",
          variant: "success",
        });
        setForm({
          toStatus: "SUBMITTED",
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating inspection status:", error);
      toast({
        title: "Error updating inspection status",
        description:
          "An error occurred while updating the inspection status.",
        variant: "danger",
      });
    }
  };

  return (
    <>
      {isInspectionPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : inspectionError ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="animate-spin text-red-500" size={60} />
          <p>Error occurred while fetching inspection data.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold">
            Edit Inspection {inspectionId}
          </h2>
          <Input
            element="input"
            input_type="text"
            name="fromStatus"
            value={inspectionData?.status ?? ""}
            handler={() => {}}
            disabled
            tag="From Status"
            placeholder="From Status"
            required
          />
          <Input
            element="select"
            input_type="text"
            name="toStatus"
            value={form.toStatus}
            handler={(e) =>
              setForm({
                ...form,
                toStatus: e.target.value as InspectionStatus,
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
            required
          />
          {form.toStatus === "SCHEDULED" && (
            <Input
              element="input"
              name="note"
              tag="Note"
              placeholder="Note for scheduling (optional)"
              value={form.note || ""}
              handler={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
              }
            />
          )}
          {form.toStatus === "REPORT_READY" && (
            <>
              <Input
                element="input"
                name="report"
                value={form.patch?.report?.url || ""}
                tag="Report URL"
                placeholder="Report URL"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    patch: {
                      ...f.patch,
                      report: {
                        ...f.patch?.report,
                        url: e.target.value,
                      },
                    },
                  }))
                }
              />
              <Input
                element="textarea"
                name="report"
                value={form.patch?.report?.summary || ""}
                tag="Report Summary"
                placeholder="Report summary"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    patch: {
                      ...f.patch,
                      report: {
                        ...f.patch?.report,
                        summary: e.target.value,
                      },
                    },
                  }))
                }
              />
            </>
          )}
          {form.toStatus === "REJECTED" && (
            <>
              <Input
                element="input"
                name="note"
                tag="Note"
                placeholder="Note for rejection (optional)"
                value={form.note || ""}
                handler={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
              />
              <label>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      patch: { refund: e.target.checked },
                    }))
                  }
                />
                Refund
              </label>
            </>
          )}
          <Button
            type="submit"
            primary
            className="mt-4"
            disabled={isUpdatePending}
          >
            {isUpdatePending ? "Updating..." : "Edit Inspection"}
          </Button>
        </form>
      )}
    </>
  );
};

export default EditInspection;
