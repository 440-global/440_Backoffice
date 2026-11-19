"use client";

import { PayMerchantStatus } from "@/types/types";
import React, { useState } from "react";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import { Button, Input } from "../ui";
import { useToast } from "../ui/toast/ToastContext";
import { useGetTransaction, useUpdateTransactionStatus } from "@/api/pay-merchant";

type Props = {
  transactionId: number;
};

type UpdatePayload = {
  toStatus: PayMerchantStatus;
  note?: string;
  patch?: any;
  adminNotes?: string;
};

const EditTransaction = ({ transactionId }: Props) => {
  const [form, setForm] = useState<UpdatePayload>({
    toStatus: "SUBMITTED",
  });
  const { toast } = useToast();

  const {
    data: transactionData,
    isPending: isTransactionPending,
    error: transactionError,
  } = useGetTransaction(transactionId);
  const {
    mutateAsync: updateTransactionStatus,
    isPending: isUpdatePending,
    error: updateError,
  } = useUpdateTransactionStatus();

  let ALLOWED_TO_STATUS_VALUES: PayMerchantStatus[] = [];

  if (transactionData?.status === "SUBMITTED") {
    ALLOWED_TO_STATUS_VALUES = ["UNDER_REVIEW", "REJECTED", "CANCELLED"];
  }

  if (transactionData?.status === "UNDER_REVIEW") {
    ALLOWED_TO_STATUS_VALUES = ["APPROVED", "REJECTED", "CANCELLED"];
  }

  if (transactionData?.status === "APPROVED") {
    ALLOWED_TO_STATUS_VALUES = ["PROCESSING", "REJECTED"];
  }

  if (transactionData?.status === "PROCESSING") {
    ALLOWED_TO_STATUS_VALUES = ["COMPLETED", "FAILED"];
  }

  if (transactionData?.status === "COMPLETED" || transactionData?.status === "REJECTED" || transactionData?.status === "REFUNDED") {
    ALLOWED_TO_STATUS_VALUES = [];
  }

  const buildPayload = (form: UpdatePayload) => {
    const base: UpdatePayload = {
      toStatus: form.toStatus,
      note: form.note
    };

    return base;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = buildPayload(form);
    try {
      const res = await updateTransactionStatus({
        id: transactionId,
        body: payload,
      });

      if (res.success) {
        toast({
          title: "Transaction updated",
          description: "The transaction status has been updated successfully.",
          variant: "success",
        });
        setForm({
          toStatus: "SUBMITTED",
        });
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast({
        title: "Error updating transaction status",
        description:
          "An error occurred while updating the transaction status.",
        variant: "danger",
      });
    }
  };

  return (
    <>
      {isTransactionPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : transactionError ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="animate-spin text-red-500" size={60} />
          <p>Error occurred while fetching inspection data.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold">
            Edit Transaction {transactionId}
          </h2>
          <Input
            element="input"
            input_type="text"
            name="fromStatus"
            value={transactionData?.status ?? ""}
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
                toStatus: e.target.value as PayMerchantStatus,
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
          <Button
            type="submit"
            primary
            className="mt-4"
            disabled={isUpdatePending}
          >
            {isUpdatePending ? "Updating..." : "Edit Transaction"}
          </Button>
        </form>
      )}
    </>
  );
};

export default EditTransaction;
