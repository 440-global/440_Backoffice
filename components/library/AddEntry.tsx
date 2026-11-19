"use client"
import { useCreateLibrary } from '@/api/library'
import { LibraryPayload } from '@/types/types'
import React, { FormEvent, useState } from 'react'
import { useToast } from '../ui/toast/ToastContext'
import { AxiosError } from 'axios'
import { Button, FileUpload, Input } from '../ui'

type Props = {
  onSuccess: () => void;
};

const defaultValues: LibraryPayload = {
  title: '',
  fileUrl: '',
  description: '',
  isActive: true
}

const AddEntry = ({ onSuccess }: Props) => {
  const [formValues, setFormValues] = useState<LibraryPayload>(defaultValues);
  const { mutateAsync: addEntry, isPending: isEntryPending, error: entryError } = useCreateLibrary();
  const { toast } = useToast();

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

    const { title, fileUrl, description } = formValues;
    if (title !== "" || fileUrl !== "" || description !== "") {
      try {
        const res = await addEntry(formValues);

        if (res.status == 200 || res.status == 201) {
          toast({
            variant: "success",
            title: "Success",
            description: "Library entry added",
            duration: 2000,
          });

          setFormValues(defaultValues);
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
    } else {
      toast({
        variant: "warning",
        title: "Empty fields",
        description: "Please fill in all fields",
        duration: 2000,
      });
    }
  }

  return (
    <div className="pb-2">
      <form onSubmit={handleSubmit}>
        <Input
          input_type="text"
          element="input"
          placeholder="Enter title"
          tag="Entry Title"
          name="title"
          value={formValues.title}
          handler={handleChange}
          required
        />
        <FileUpload
          label="Entry Document"
          name="image"
          fileType="document"
          multiple={false}
          onFilesChange={(urls) => {
            setFormValues((prev) => ({
              ...prev,
              fileUrl: urls[0],
            }));
          }}
        />
        <Input
          element="textarea"
          placeholder="Enter description"
          tag="Entry Description"
          name="description"
          value={formValues.description}
          handler={handleChange}
          required
        />

        <Button
          primary
          disabled={isEntryPending}
        >
          { isEntryPending ? 'Adding Entry...' : 'Add Entry' }
        </Button>
      </form>
    </div>
  );
}

export default AddEntry