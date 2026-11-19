"use client"
import { AddCategoryForm, AddMarketForm, CategoryDetails } from "@/types/types"
import { useState } from "react"
import { Button, FileUpload, Input } from "../../ui"

type Props = {
  category: CategoryDetails
}

const EditCategory = ({ category }: Props) => {
  const [formValues, setFormValues] = useState<AddCategoryForm>({
    name: category.name ?? '',
    priority: category.priority ?? '',
    image: null,
    description: category.description ?? '',
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

  const options = ["1", "2", "3", "4", "5"].map(num => ({label: num, value: num}));

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setFormValues(prev => ({
  //       ...prev,
  //       image: e.target.files![0],
  //     }))
  //   }
  // }

  return (
    <div className="pb-20">
      <form>
        <Input
          input_type="text"
          element="input"
          placeholder="Enter market name"
          tag="Category Name"
          name="name"
          value={formValues.name}
          handler={handleChange}
        />
        <Input
          element="select"
          placeholder="Select Priority"
          tag="Priority"
          name="priority"
          value={formValues.priority!}
          handler={handleChange}
          selectOptions={options}
        />
        <FileUpload
          label="Category Image"
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
          Edit Category
        </Button>
      </form>
    </div>
  )
}

export default EditCategory
