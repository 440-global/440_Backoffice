"use client"
import { useGetLibrary, useUpdateLibrary } from '@/api/library'
import { fmtDateTime } from '@/lib/funcs'
import React, { FormEvent, useEffect, useState } from 'react'
import { RiLoader5Line } from 'react-icons/ri'
import { useToast } from '../ui/toast/ToastContext'
import { LibraryPayload } from '@/types/types'
import { AxiosError } from 'axios'
import { Button, FileUpload, Input } from '../ui'

type Props = {
  id: number;
  onSuccess: () => void;
};

const EditEntry = ({ id, onSuccess }: Props) => {
  const {
    data: entry,
    isPending: entryPending,
    error: entryError,
  } = useGetLibrary(id);

  const [formValues, setFormValues] = useState<LibraryPayload>({
    title: "",
    fileUrl: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    if (entry) {
      setFormValues({
        title: entry.title ?? "",
        fileUrl: entry.fileUrl ?? "",
        description: entry.description ?? "",
        isActive: entry.isActive ?? true,
      });
    }
  }, [entry]);

  const {
    mutateAsync: editEntry,
    isPending: updatePending,
    error: updateError,
  } = useUpdateLibrary(id);
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
        const res = await editEntry(formValues);

        if (res.status == 200 || res.status == 201) {
          toast({
            variant: "success",
            title: "Success",
            description: "Library entry added",
            duration: 2000,
          });

          setFormValues({
            title: "",
            fileUrl: "",
            description: "",
            isActive: true,
          });
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
  };
  return (
    <>
      {entryPending ? (
        <div className="flex h-full items-center justify-center">
          <RiLoader5Line className="animate-spin text-4xl text-(--primary)" />
        </div>
      ) : entryError ? (
        <p className="text-sm text-red-600">Could not load funnel data.</p>
      ) : (
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

          <Button primary disabled={updatePending}>
            {updatePending ? "Updating Entry..." : "Update Entry"}
          </Button>
        </form>
      )}
    </>
  );
}

export default EditEntry