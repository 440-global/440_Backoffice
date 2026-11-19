"use client"
import { AddSupplierForm, SupplierDetails } from "@/types/types"
import { useState } from "react"
import { Button, FileUpload, Input } from "../ui"

type EditSupplierProps = {
  supplier: SupplierDetails;
  onSuccess: () => void;
};

const EditSupplier = ({ supplier, onSuccess }: EditSupplierProps) => {
  const [formValues, setFormValues] = useState<AddSupplierForm>({
    name: '',
    userName: '',
    location: '',
    marketId: 0,
    description: '',
    categories: [],
    profile: null,
    image: null
  })

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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;

    setFormValues((prev: any) => {
      const values = prev[name] || [];
      return {
        ...prev,
        [name]: checked
          ? [...values, value]
          : values.filter((v: string) => v !== value),
      };
    });
  };

  const markets = [
    {
      "categories": [],
      "id": 1,
      "name": "Chihu",
      "country": "China",
      "image": "https://english.sse.com.cn/home/focus/c/10790291/images/38213059ae8149d490774e15996fde9f.png",
      "address": "Changi",
      "description": "Chihu market in china",
      "status": true,
      "createdAt": "2026-01-14T15:12:18.000Z",
      "updatedAt": "2026-01-14T15:12:18.000Z"
    }
  ]

  const filterMarket = markets.map(market => ({ label: market.name, value: String(market.id) }));

  return (
    <div className="pb-20">
      <form>
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
          placeholder="Enter supplier username"
          tag="Username"
          name="userName"
          value={formValues.userName}
          handler={handleChange}
        />
        <FileUpload
          label="Profile Image"
          name="image"
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
          placeholder="Enter your market"
          tag="Market"
          name="marketId"
          value={formValues.marketId}
          handler={handleChange}
          selectOptions={filterMarket}
        />
        <Input
          element="input"
          input_type="checkbox"
          tag="Categories"
          name="categories"
          value={formValues.categories}
          handler={handleCheckboxChange}
          // checkboxOptions={productCategories}
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
          Add Market
        </Button>
      </form>
    </div>
  )
}

export default EditSupplier
