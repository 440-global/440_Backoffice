"use client"
import { UpdateRatePayload } from '@/types/types'
import React, { FormEvent, useState } from 'react'
import { Button, Input } from '../ui'
import { currenciesShort } from '@/lib/currencies'
import { useUpdateLogisticsRate } from '@/api/rates'
import { useToast } from '../ui/toast/ToastContext'
import { useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

type Props = {
  onSuccess: () => void;
};

const defaultValues: UpdateRatePayload = {
  method: "SEA",
  currency: '',
  ratePerCbm: 1
} 

const UpdateLogisticsRate = ({ onSuccess }: Props) => {
  const [formValues, setFormValues] = useState(defaultValues);
  const { mutateAsync: updateRate, isPending, error } = useUpdateLogisticsRate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormValues((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload: UpdateRatePayload = {
      method: formValues.method,
      currency: formValues.currency,
      ratePerCbm: formValues.ratePerCbm
    }

    try {
      const res = await updateRate(payload);

      if (res.status == 200 || res.status == 201) {
        toast({
          variant: "success",
          title: "Success",
          description: "Rate updated",
          duration: 2000,
        });
        queryClient.invalidateQueries({ queryKey: ["logistics-rates"] });
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
  }

  return (
    <div className="pb-2">
      <form onSubmit={handleSubmit}>
        <Input
          element="input"
          input_type="radio"
          // placeholder="Enter description"
          tag="Mode of Transport"
          name="method"
          value={formValues.method}
          radioOptions={["SEA", "AIR"]}
          handler={handleChange}
        />

        <Input
          element="select"
          placeholder="Enter currency"
          tag="Currency"
          name="currency"
          value={formValues.currency}
          handler={handleChange}
          selectOptions={currenciesShort}
        />

        <Input 
          element='input'
          input_type='number'
          name='ratePerCbm'
          value={formValues.ratePerCbm}
          handler={handleChange}
          placeholder='Enter rate per CBM'
          tag='Rate Per CBM'
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
}

export default UpdateLogisticsRate