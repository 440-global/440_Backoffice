"use client"

import { AddCityPayload } from '@/types/types'
import React, { FormEvent, useEffect, useState } from 'react'
import { Button, Input } from '../ui'
import { useGetCity, useUpdateCity } from '@/api/cities'
import { useToast } from '../ui/toast/ToastContext'
import { AxiosError } from 'axios'

type Props = {
  cityId: number;
  onSuccess: () => void;
};

const EditCity = ({ cityId, onSuccess }: Props) => {
  const { data: city, isPending: isCityPending, error: cityError } = useGetCity(cityId);
  const {
    mutateAsync: updateCity,
    isPending: isUpdatePending,
    error: updateError,
  } = useUpdateCity(cityId);
  const { toast } = useToast();

  const defaultValues: AddCityPayload = {
    name: "",
    province: "",
    country: "",
  };
  const [formValues, setFormValues] = useState<AddCityPayload>(defaultValues);
  useEffect(() => {
    if(city) {
      setFormValues({
        name: city?.name ?? "",
        province: city?.province ?? "",
        country: city?.country ?? "",
      });
    }
  }, [city]);
  

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

    const { name, province, country } = formValues;
    if(name != '' && province != '' && country != '') {
      const payload: AddCityPayload = {
        name,
        province,
        country
      }

      try {
        const res = await updateCity(payload);
        if(res.status == 200 || res.status == 201) {
          toast({
            title: "Success",
            description:
              "City updated successfully",
            variant: "success",
          });
          onSuccess();
        } else {
            toast({
              title: "Warning",
              description: "Something went wrong",
              variant: "warning",
            });
        }
      } catch (error) {
        const err = error as AxiosError;

        toast({
          variant: "danger",
          title: "Error",
          description: err.message || "Something went wrong",
          duration: 2000,
        });
      }
    }
  }


  return (
    <div className="pb-20">
      <form onSubmit={handleSubmit}>
        <Input
          input_type="text"
          element="input"
          placeholder="Enter City name"
          tag="City Name"
          name="name"
          value={formValues.name}
          handler={handleChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Province"
          tag="Province"
          name="province"
          value={formValues.province}
          handler={handleChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter country"
          tag="Country"
          name="country"
          value={formValues.country}
          handler={handleChange}
          required
        />
        <Button
          primary
          isFullWidth
          className="rounded-xl!"
          disabled={isUpdatePending}
        >
          {isUpdatePending ? "Updating City..." : "Update City"}
        </Button>
      </form>
    </div>
  );
}

export default EditCity