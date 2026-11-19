"use client"
import { AddCategoryForm } from "@/types/types"
import { FormEvent, useEffect, useState } from "react"
import { Button, FileUpload, Input } from "../../ui"
import { useAddSubCategory, useGetCategories } from "@/api/product"
import { useToast } from "@/components/ui/toast/ToastContext"

type SelectType = {
  label: string,
  value: string
}

const AddSubCategory = () => {
  const [formValues, setFormValues] = useState<AddCategoryForm>({
    name: '',
    image: null,
    description: '',
    categoryId: 1
  });

  const { data: getCategories = [], isPending: isGetCategoriesLoading, error } = useGetCategories();
  const { mutateAsync: addSubCategory, isPending: isSubCategoryPending } = useAddSubCategory();
  const { toast } = useToast();

  useEffect(() => {
    if(getCategories) console.log(getCategories)
  }, [getCategories]);

  const options: SelectType[] = getCategories.map((category: any) => ({ label: category.name, value: category.id }));

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
        "image": null,
        "description": formValues.description
      }
    ]

    const id = formValues.categoryId;

    const res = await addSubCategory({body: data, categoryId: id!});

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
    <div className="pb-8">
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
          placeholder="Select Parent Category"
          tag="Parent Category"
          name="categoryId"
          value={formValues.categoryId!}
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
          placeholder="Enter category description"
          name="description"
          value={formValues.description}
          handler={handleChange}
        />
        <Button primary isFullWidth className="rounded-xl!" disabled={isSubCategoryPending}>
          {isSubCategoryPending ? 'Adding Sub-Category...' : 'Add Sub-Category' }
        </Button>
      </form>
    </div>
  )
}

export default AddSubCategory
