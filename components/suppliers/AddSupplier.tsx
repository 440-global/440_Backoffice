"use client"
import { AddSupplierForm, MarketDetails } from "@/types/types"
import { FormEvent, useState } from "react"
import { Button, FileUpload, Input } from "../ui"
import { useGetMarkets } from "@/api/market"
import { useCreateSupplier } from "@/api/supplier"
import { useToast } from "../ui/toast/ToastContext"
import { AxiosError } from "axios"

const generateUsernameFromName = (name: string): string => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized.slice(0, 20);
};

type Props = {
  onSuccess: () => void;
};

const AddSupplier = ({ onSuccess }: Props) => {
  const [formValues, setFormValues] = useState<AddSupplierForm>({
    name: '',
    userName: '',
    location: '',
    marketId: 0,
    description: '',
    categories: [],
    clubCode: '',
    profile: null,
    image: null
  });
  const { data: markets = [], isPending: isMarketsPending } = useGetMarkets();
  const { mutateAsync: addSupplier, isPending: isSupplierPending } = useCreateSupplier();
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormValues(prevData => {
      if (name === "marketId") {
        return {
          ...prevData,
          marketId: Number(value),
        };
      }

      return {
        ...prevData,
        [name]: value,
      };
    });
  };

  const filterMarket = markets.map((market: MarketDetails) => ({
    label: market.name,
    value: String(market.id),
  }));
  
  const generatedUsername = generateUsernameFromName(formValues.name);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { name, location, description, categories, clubCode, profile, image, marketId } = formValues;

    if (
      name.trim() !== '' &&
      generatedUsername !== '' &&
      location.trim() !== '' &&
      description.trim() !== '' &&
      clubCode?.trim() !== '' &&
      marketId > 0
    ) {
      const formData = {
        name: name.trim(),
        userName: generatedUsername,
        location: location.trim(),
        marketId,
        description: description.trim(),
        categories: categories,
        clubCode: clubCode?.trim(),
        profile: profile ?? null,
        image: image ?? null
      }

      try {
        const res = await addSupplier(formData);

        if (res.status == 200 || res.status == 201) {
          toast({
            variant: "success",
            title: "Success",
            description: "Supplier added",
            duration: 2000
          });

          setFormValues({
            name: '',
            userName: '',
            location: '',
            marketId: 0,
            description: '',
            categories: [],
            clubCode: '',
            profile: null,
            image: null
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
        description: "Please fill in all required fields",
        duration: 2000
      });
    }
  }

  return (
    <div className="pb-8">
      <form onSubmit={handleSubmit}>
        <Input
          input_type="text"
          element="input"
          placeholder="Enter supplier name"
          tag="Supplier Name"
          name="name"
          value={formValues.name}
          handler={handleChange}
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Auto generated from supplier name"
          tag="Username"
          name="userName"
          value={generatedUsername}
          handler={() => {}}
          disabled
        />
        <FileUpload
          label="Profile Image"
          name="profile"
          fileType="image"
          maxSizeMB={3}
          onFilesChange={(files) => setFormValues({ ...formValues, profile: files[0] })}
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter supplier location"
          tag="Location"
          name="location"
          value={formValues.location}
          handler={handleChange}
        />
        <Input
          element="select"
          placeholder={isMarketsPending ? "Loading markets..." : "Select market"}
          tag="Market"
          name="marketId"
          value={String(formValues.marketId || "")}
          handler={handleChange}
          selectOptions={filterMarket}
          disabled={isMarketsPending}
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter supplier club code"
          tag="Club Code"
          name="clubCode"
          value={formValues.clubCode || ""}
          handler={handleChange}
        />
        <FileUpload
          label="Cover Image"
          name="image"
          fileType="image"
          maxSizeMB={3}
          onFilesChange={(files) => setFormValues({ ...formValues, image: files[0] })}
        />
        <Input
          element="textarea"
          tag="Description"
          placeholder="Enter market description"
          name="description"
          value={formValues.description}
          handler={handleChange}
        />
        <Button primary isFullWidth className="rounded-xl!">
          {isSupplierPending ? 'Adding Supplier...' : 'Add Supplier' }
        </Button>
      </form>
    </div>
  )
}

export default AddSupplier
