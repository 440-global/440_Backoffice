"use client"

import { useUpdateCurrency } from "@/api/rates"
import { FormEvent, useState } from "react"
import { Button, Input } from "../ui"
import { useToast } from "../ui/toast/ToastContext"
import { useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"

type Props = {
  currencyId: number;
  onSuccess: () => void;
};

const EditRate = ({ currencyId, onSuccess }: Props) => {
  const [rate, setRate] = useState(1);
  const { mutateAsync: updateRate, isPending, error } = useUpdateCurrency(currencyId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      rate
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
        queryClient.invalidateQueries({ queryKey: ["rates"] });
        queryClient.invalidateQueries({ queryKey: ["rates", currencyId] });
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
    <div>
      <form onSubmit={handleSubmit}>
        <Input 
          element="input"
          name="rate"
          value={rate}
          handler={(e) => setRate(e.target.value)}
          tag="Rate"
          placeholder="Enter rate"
          required
        />
        <Button
          primary
          disabled={isPending}
        >
          Update Rate
        </Button>
      </form>
    </div>
  )
}

export default EditRate