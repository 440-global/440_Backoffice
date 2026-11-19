"use client";
import { UpdateInspectRate } from "@/types/types";
import React, { FormEvent, useState } from "react";
import { Button, Input } from "../ui";
import { useUpdateTierRate } from "@/api/rates";
import { useToast } from "../ui/toast/ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

type Props = {
  onSuccess: () => void;
};

const UpdateInspectionRate = ({ onSuccess }: Props) => {
  const [formValues, setFormValues] = useState<UpdateInspectRate>({
    tier: "BASIC",
    feeKobo: 0,
  });
  const { mutateAsync: updateRate, isPending, error } = useUpdateTierRate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    setFormValues((prevData) => ({
      ...prevData,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const feeNaira = Number(formValues.feeKobo);
    if (Number.isNaN(feeNaira)) {
      toast({
        variant: "danger",
        title: "Error",
        description: "Enter a valid fee",
        duration: 2000,
      });
      return;
    }

    const payload: UpdateInspectRate = {
      tier: formValues.tier,
      feeKobo: feeNaira * 100,
    };

    try {
      const res = await updateRate(payload);

      if (res.status == 200 || res.status == 201) {
        toast({
          variant: "success",
          title: "Success",
          description: "Rate updated",
          duration: 2000,
        });
        queryClient.invalidateQueries({ queryKey: ["inspection-rates"] });
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
  };

  const selectOptions = [
    {
      label: "Basic",
      value: "BASIC",
    },
    {
      label: "Standard",
      value: "STANDARD",
    },
    {
      label: "Comprehensive",
      value: "COMPREHENSIVE",
    },
  ];

  return (
    <div className="pb-2">
      <form onSubmit={handleSubmit}>
        <Input
          element="select"
          // input_type="radio"
          placeholder="Choose tier"
          tag="Inspection Tier"
          name="tier"
          value={formValues.tier}
          selectOptions={selectOptions}
          handler={handleChange}
        />

        <Input
          element="input"
          input_type="number"
          name="feeKobo"
          value={formValues.feeKobo}
          handler={handleChange}
          placeholder="Enter fee"
          tag="Fee"
        />

        <Button 
          primary
          disabled={isPending}
        >
          Update
        </Button>
      </form>
    </div>
  );
};

export default UpdateInspectionRate;
