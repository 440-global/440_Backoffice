"use client"
import { AddMarketForm } from "@/types/types"
import { FormEvent, useState } from "react"
import { Button, FileUpload, Input } from "../ui"
import { useCreateMarket } from "@/api/market"
import { useToast } from "../ui/toast/ToastContext"
import { AxiosError } from "axios"

type Props = {
  onSuccess: () => void;
};

const AddMarket = ({ onSuccess }: Props) => {
  const [formValues, setFormValues] = useState<AddMarketForm>({
    name: '',
    address: '',
    city: '',
    country: '',
    description: '',
    image: null,
    profile_picture: null,
    appleMap: '',
    amap: ''
  });

  const { mutateAsync: addMarket, isPending: isMarketPending } = useCreateMarket();
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormValues(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormValues(prev => ({ ...prev, image: e.target.files?.[0] }));
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { name, address, image, description, profile_picture, country, city, appleMap, amap } = formValues;

    if(name !== '' || address !== '' || country !== '' || description !== '' || appleMap !== '' || amap !== '') {
      const formData = {
        name: name,
        address: address,
        country: country,
        city: city,
        description: description,
        image: 'https://picsum.photos/seed/123/300/200',
        profile_picture: 'https://picsum.photos/seed/123/300/200',
        appleMap: appleMap,
        amap: amap
      }

      try {
        const res = await addMarket(formData);

        if (res.status == 200 || res.status == 201) {
          toast({
            variant: "success",
            title: "Success",
            description: "Market added",
            duration: 2000
          });

          setFormValues({
            name: '',
            address: '',
            country: '',
            city: '',
            description: '',
            image: null,
            profile_picture: null,
            appleMap: '',
            amap: ''
          });
          onSuccess();
        } else {
          toast({
            variant: "warning",
            title: "Warning",
            description: "Something went wrong",
            duration: 2000
          });
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
        variant: "warning",
        title: "Empty fields",
        description: "Please fill in all fields",
        duration: 2000
      });
    }
  }

  return (
    <div className="pb-2">
      <form onSubmit={handleSubmit}>
        <Input
          input_type="text"
          element="input"
          placeholder="Enter market name"
          tag="Market Name"
          name="name"
          value={formValues.name}
          handler={handleChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter market address"
          tag="Market Address"
          name="address"
          value={formValues.address}
          handler={handleChange}
          required
        />
        <FileUpload
          label="Image"
          name="image"
          fileType="image"
          maxSizeMB={3}
          onFilesChange={(files) => setFormValues({ ...formValues, image: files[0] })}
        />
        <FileUpload
          label="Profile Picture"
          name="profile_picture"
          fileType="image"
          maxSizeMB={3}
          onFilesChange={(files) => setFormValues({ ...formValues, profile_picture: files[0] })}
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter city"
          tag="City"
          name="city"
          value={formValues.city}
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
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Amape or Google map link"
          tag="Map Link"
          name="amap"
          value={formValues.amap!}
          handler={handleChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Apple map link"
          tag="Apple Map Link"
          name="appleMap"
          value={formValues.appleMap!}
          handler={handleChange}
          required
        />
        <Input
          element="textarea"
          tag="Description"
          placeholder="Enter market description"
          name="description"
          value={formValues.description}
          handler={handleChange}
        />
        <Button primary isFullWidth disabled={isMarketPending} className="rounded-xl!">
          {isMarketPending ? 'Adding Market...' : 'Add Market' }
        </Button>
      </form>
    </div>
  )
}

export default AddMarket
