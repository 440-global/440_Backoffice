"use client";
import {
  useGetSingleLogisticOrder,
  useUpdateSingleLogisticOrder,
} from "@/api/logistics";
import { LogisticStatus } from "@/types/types";
import React, { FormEvent, useState } from "react";
import { useToast } from "../ui/toast/ToastContext";
import { AxiosError } from "axios";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import { Button, Input } from "../ui";

type Props = {
  orderId: string;
  onSuccess: () => void;
};

const UpdateLogisticOrder = ({ orderId, onSuccess }: Props) => {
  const [status, setStatus] = useState<LogisticStatus | null>(null);
  const {
    data: logistic,
    isPending,
    error,
  } = useGetSingleLogisticOrder(orderId);
  const {
    mutateAsync: updateStatus,
    isPending: isUpdatePending,
    error: updateError,
  } = useUpdateSingleLogisticOrder();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (status != null) {
      console.log(status);
      try {
        const res = await updateStatus({ orderId, status });

        if (res.status == 200 || res.status == 201) {
          toast({
            variant: "success",
            title: "Success",
            description: "Rate updated",
            duration: 2000,
          });
          onSuccess();
        }
      } catch (error: unknown) {
  const err = error as AxiosError<{ message: string }>;

  toast({
    variant: "danger",
    title: "Error",
    description:
      err.response?.data?.message || err.message || "Something went wrong",
    duration: 3000,
  });
}
    } else {
      toast({
        variant: "danger",
        title: "Error",
        description: "Update the status first before submitting",
        duration: 2000,
      });
    }
  };

  const STATUS_OPTIONS = [
    { label: "None", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Accepted", value: "accepted" },
    { label: "Processing", value: "processing" },
    { label: "Rejected", value: "rejected" },
    { label: "Canceled", value: "canceled" },
    { label: "Complete", value: "complete" },
    { label: "Close", value: "Close" },
  ];

  return (
    <>
      {isPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : error ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="text-red-500" size={60} />
          <p>Error occurred while fetching logistic data.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleSubmit}>
            <Input
              element="input"
              name=""
              value={logistic.status}
              handler={() => {}}
              tag="Previous Status"
              disabled
              required
            />
            <Input
              element="select"
              input_type="text"
              value={status!}
              name="status"
              handler={(e) => setStatus(e.target.value)}
              tag="New Status"
              placeholder="Select status"
              selectOptions={STATUS_OPTIONS}
              required
            />
            <Button primary disabled={isUpdatePending}>
              Update Status
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default UpdateLogisticOrder;
