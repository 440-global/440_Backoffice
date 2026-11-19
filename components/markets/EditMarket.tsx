"use client"
import { AddMarketForm, MarketDetails } from "@/types/types"
import { FormEvent, useState } from "react"
import { Button, FileUpload, Input } from "../ui"
import { useEditMarket } from "@/api/market"
import { AxiosError } from "axios"
import { useToast } from "../ui/toast/ToastContext"

type ViewMarketProps = {
  market: MarketDetails;
  onSuccess: () => void;
};

const EditMarket = ({ market, onSuccess }: ViewMarketProps) => {
  const [formValues, setFormValues] = useState<AddMarketForm>({
    name: market.name ?? "",
    address: market.address ?? "",
    city: "",
    country: market.country ?? "",
    description: market.description ?? "",
    image: null,
    profile_picture: null,
    appleMap: market.appleMap ?? "",
    amap: market.amap ?? "",
  });

  const { mutateAsync: editMarket, isPending: isEditPending } = useEditMarket();
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
  
      const { name, address, image, description, profile_picture, country, city, appleMap, amap } =
        formValues;

      if (name !== "" || address !== "" || country !== "" || description !== "") {
        const formData = {
          name: name,
          address: address,
          country: country,
          city: city,
          description: description,
          image: "https://picsum.photos/seed/123/300/200",
          profile_picture: "https://picsum.photos/seed/123/300/200",
          appleMap: appleMap,
          amap: amap,
          marketId: market.id,
        };
  
        try {
          const res = await editMarket(formData);
  
          if (res.status == 200 || res.status == 201) {
            toast({
              variant: "success",
              title: "Success",
              description: "Market edited",
              duration: 2000
            });
  
            setFormValues({
              name: "",
              address: "",
              city: "",
              country: "",
              description: "",
              image: null,
              profile_picture: null,
              appleMap: "",
              amap: "",
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
          const err = error as AxiosError;
  
          toast({
            variant: "danger",
            title: "Error",
            description: err.message || "Something went wrong",
            duration: 2000
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
    <div className="pb-20">
      <form onSubmit={handleSubmit}>
        <Input
          input_type="text"
          element="input"
          placeholder="Enter market name"
          tag="Market Name"
          name="name"
          value={formValues.name}
          required
          handler={handleChange}
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
          placeholder="Enter Amap or Google map link"
          tag="Map Link"
          name="amap"
          value={formValues.amap}
          handler={handleChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Apple map link"
          tag="Apple Map Link"
          name="appleMap"
          value={formValues.appleMap}
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
        <Button primary isFullWidth disabled={isEditPending} className="rounded-xl!">
          {isEditPending ? 'Editing market...' : 'Edit Market' }
        </Button>
      </form>
    </div>
  )
}

export default EditMarket
