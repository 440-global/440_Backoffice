"use client"

import { useCreateType } from "@/api/product"
import { Button, Input } from "@/components/ui"
import { useToast } from "@/components/ui/toast/ToastContext"
import { Type } from "@/types/types"
import { AxiosError } from "axios"
import { FormEvent, useState } from "react"

type Props = {
  subCategoryId: number
}

const AddType = ({ subCategoryId }: Props) => {
  const [name, setName] = useState('');
  const { toast } = useToast();

  const { mutateAsync: addType, isPending: isTypePending } = useCreateType();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if(name != '') {
      const data: Type = {
        name: name,
        subCategoryId
      }

      try {
        const res = await addType(data);

        if (res.status === 200 || res.status === 201) {
          toast({
            variant: "success",
            title: "Success",
            description: "Type added",
            duration: 2000
          });

          setName('');
        } else {
          toast({
            variant: "danger",
            title: "Error",
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
        title: "Warning",
        description: "Fill in the name field",
        duration: 2000
      });
    }
  }

  return (
    <div className='pb-8'>
      <form onSubmit={handleSubmit}>
        <Input
          input_type="text"
          element="input"
          placeholder="Enter category name"
          tag="Category Name"
          name="name"
          value={name}
          handler={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />

        <Button primary isFullWidth className="rounded-xl!" disabled={isTypePending}>
          {isTypePending ? 'Adding Type...' : 'Add Product Type'}
        </Button>
      </form>
    </div>
  )
}

export default AddType