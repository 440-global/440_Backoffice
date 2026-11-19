"use client";

import { useGetSupplierVerification, useUpdateSupplierVerificationStatus } from '@/api/verification';
import { SupplierVerificationStatus } from '@/types/types';
import React, { useState } from 'react'
import { RiErrorWarningFill, RiLoader5Line } from 'react-icons/ri';
import { Button, Input } from '../ui';
import { useToast } from '../ui/toast/ToastContext';

type Props = {
  verificationId: number;
  onSuccess: () => void;
};

type UpdatePayload = {
  toStatus: SupplierVerificationStatus;
  note?: string;
  patch?: any;
};

const EditVerification = ({ verificationId, onSuccess }: Props) => {
  const [form, setForm] = useState<UpdatePayload>({
    toStatus: "SUBMITTED",
  });
  const { toast } = useToast();

  const { data: verificationData, isPending: isVerificationPending, error: verificationError } = useGetSupplierVerification(verificationId);
  const { mutateAsync: updateVerificationStatus, isPending: isUpdatePending, error: updateError } = useUpdateSupplierVerificationStatus();

  let ALLOWED_TO_STATUS_VALUES: SupplierVerificationStatus[] = [];

  if (verificationData?.status === "SUBMITTED") {
    ALLOWED_TO_STATUS_VALUES = ["INTAKE_REVIEW", "REJECTED", "CANCELLED"];
  }

  if (verificationData?.status === "INTAKE_REVIEW") {
    ALLOWED_TO_STATUS_VALUES = ["ONLINE_CHECK", "REJECTED", "CANCELLED"];
  }

  if (verificationData?.status === "ONLINE_CHECK") {
    ALLOWED_TO_STATUS_VALUES = ["SUPPLIER_ENGAGED", "REJECTED"];
  }

  if (verificationData?.status === "SUPPLIER_ENGAGED") {
    ALLOWED_TO_STATUS_VALUES = ["DOC_REVIEW", "REJECTED"];
  }

  if (verificationData?.status === "DOC_REVIEW") {
    ALLOWED_TO_STATUS_VALUES = ["SCORED", "REJECTED"];
  }

  if (verificationData?.status === "SCORED") {
    ALLOWED_TO_STATUS_VALUES = ["REPORT_READY", "REJECTED"];
  }

  if (verificationData?.status === "REPORT_READY") {
    ALLOWED_TO_STATUS_VALUES = ["COMPLETED"];
  }

  if (verificationData?.status === "REJECTED") {
    ALLOWED_TO_STATUS_VALUES = ["REFUNDED"];
  }

  if (verificationData?.status === "COMPLETED" || verificationData?.status === "CANCELLED" || verificationData?.status === "REFUNDED") {
    ALLOWED_TO_STATUS_VALUES = [];
  }

  const buildPayload = (form: UpdatePayload) => {
    const base: UpdatePayload = {
      toStatus: form.toStatus,
    };

    if (form.note) {
      base.note = form.note;
    }

    if (form.toStatus === "SCORED") {
      base.patch = {
        scores: form.patch?.scores,
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
      const res = await updateVerificationStatus({
        id: verificationId,
        body: payload,
      });

      if(res.success) {
        toast({
          title: "Verification updated",
          description: "The verification status has been updated successfully.",
          variant: "success",
        });
        setForm({
          toStatus: "SUBMITTED",
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast({
        title: "Error updating verification",
        description: "An error occurred while updating the verification status.",
        variant: "danger",
      });
    }
  };

  return (
    <>
      {isVerificationPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : verificationError ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="text-red-500" size={60} />
          <p>Error occurred while fetching verification data.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold">
            Edit Verification {verificationId}
          </h2>
          <Input
            element="input"
            input_type="text"
            name="fromStatus"
            value={verificationData?.status ?? ""}
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
                toStatus: e.target.value as SupplierVerificationStatus,
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
          {form.toStatus === "ONLINE_CHECK" && (
            <Input
              element="textarea"
              name="note"
              tag="Online check note"
              value={form.note || ""}
              handler={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Enter note"
            />
          )}
          {form.toStatus === "SCORED" && (
            <>
              <Input
                element="input"
                name="identityScore"
                value={form.patch?.scores?.identity || ""}
                tag="Identity Score"
                placeholder="Identity score"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    patch: {
                      ...f.patch,
                      scores: {
                        ...f.patch?.scores,
                        identity: Number(e.target.value),
                      },
                    },
                  }))
                }
              />
              <Input
                element="input"
                name="communicationScore"
                value={form.patch?.scores?.communication || ""}
                tag="Communication Score"
                placeholder="Communication score"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    patch: {
                      ...f.patch,
                      scores: {
                        ...f.patch?.scores,
                        communication: Number(e.target.value),
                      },
                    },
                  }))
                }
              />
              <Input
                element="input"
                name="documentationScore"
                value={form.patch?.scores?.documentation || ""}
                tag="Documentation Score"
                placeholder="Documentation score"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    patch: {
                      ...f.patch,
                      scores: {
                        ...f.patch?.scores,
                        documentation: Number(e.target.value),
                      },
                    },
                  }))
                }
              />
              <Input
                element="input"
                name="documentationScore"
                value={form.patch?.scores?.physical || ""}
                tag="Physical Score"
                placeholder="Physical score"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    patch: {
                      ...f.patch,
                      scores: {
                        ...f.patch?.scores,
                        physical: Number(e.target.value),
                      },
                    },
                  }))
                }
              />
            </>
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
              <Input
                element="input"
                name="report"
                value={form.patch?.report?.recommendation || ""}
                tag="Report Recommendation"
                placeholder="Report recommendation"
                handler={(e) =>
                  setForm((f) => ({
                    ...f,
                    patch: {
                      ...f.patch,
                      report: {
                        ...f.patch?.report,
                        recommendation: e.target.value,
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
                name="reason"
                tag="Reason"
                placeholder="Reason"
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
          <Button type="submit" primary className="mt-4" disabled={isUpdatePending}>
            { isUpdatePending ? "Updating..." : "Edit Verification" }
          </Button>
        </form>
      )}
    </>
  );
}

export default EditVerification