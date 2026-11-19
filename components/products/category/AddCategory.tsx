"use client"
import { AddCategoryForm } from "@/types/types"
import { FormEvent, useState } from "react"
import { Button, FileUpload, Input } from "../../ui"
import { useAddCategory } from "@/api/product"
import { useToast } from "@/components/ui/toast/ToastContext"

const AddCategory = () => {
  const [formValues, setFormValues] = useState<AddCategoryForm>({
    name: '',
    priority: '',
    image: null,
    description: '',
  });

  const { mutateAsync: addCategory, isPending: isCategoryPending } = useAddCategory();
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const data = [
      {
        "name": formValues.name,
        "priority": String(formValues.priority),
        "image": null,
        "description": formValues.description
      }
    ]

    const res = await addCategory(data);

    if(res.status === 200 || res.status === 201) {
      toast({
        variant: "success",
        title: "Success",
        description: "Category added",
        duration: 2000
      });

      setFormValues({
        name: '',
        priority: 0,
        image: null,
        description: ''
      });
    } else {
      toast({
        variant: "danger",
        title: "Error",
        description: "Something went wrong",
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
          placeholder="Enter category name"
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
          selectOptions={
            [
              { label: "1", value: "1" },
              { label: "2", value: "2" },
              { label: "3", value: "3" },
              { label: "4", value: "4" },
              { label: "5", value: "5" },
            ]
          }
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
          placeholder="Enter category description"
          name="description"
          value={formValues.description}
          handler={handleChange}
        />
        <Button primary isFullWidth className="rounded-xl!" disabled={isCategoryPending}>
          {isCategoryPending ? 'Adding Category...' : 'Add Category' }
        </Button>
      </form>
    </div>
  )
}

export default AddCategory
