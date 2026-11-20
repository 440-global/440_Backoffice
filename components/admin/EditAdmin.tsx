"use client";

import { useNestedForm } from "@/hooks/use-nested-form";
import { PatchAdminPayload } from "@/types/types";
import React, { FormEvent, useEffect } from "react";
import { Button, Input } from "../ui";
import { useAddAdmin, useEditAdmin, useGetAdmin, useGetRoles } from "@/api/admin";
import { getApiError, issuesByField } from "@/lib/api-error";
import { RiErrorWarningFill, RiLoader5Fill } from "react-icons/ri";

type Props = {
  onSuccess: () => void;
  adminId: number;
};

const defaultValues: PatchAdminPayload = {
  name: "",
  phoneNumber: "",
  roleId: 0,
  status: true
};

const EditAdmin = ({ onSuccess ,adminId }: Props) => {
  const { formValues, setFormValues, handleChange } =
    useNestedForm<PatchAdminPayload>(defaultValues);
  const { mutateAsync: createAdmin, isPending, error } = useEditAdmin(adminId);
  const { data: admin, isLoading, error: adminError } = useGetAdmin(adminId);

  const {
    data: roles,
    isLoading: roleLoading,
    error: roleError,
  } = useGetRoles();

  // errors
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  useEffect(() => {
    if(admin) {
      setFormValues({
        name: admin.name ?? "",
        phoneNumber: admin.phoneNumber ?? "",
        roleId: admin.role.id ?? 0,
        status: true
      })
    }
  }, [admin])
  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const body: PatchAdminPayload = {
      name: formValues.name.trim(),
      phoneNumber: formValues.phoneNumber.trim(),
      roleId: Number(formValues.roleId),
      status: true
    };

    createAdmin({ body }, { onSuccess });
  };

  if (isLoading) {
    return <div className="h-full w-full flex justify-center items-center">
      <RiLoader5Fill className='text-(--primary) animate-spin' size={40} />
    </div>;
  }

  if (error || !admin) {
    return (
      <div className="h-full w-full flex flex-col gap-2 justify-center items-center">
        <RiErrorWarningFill className="text-red-500" size={36} />
        <p className="text-red-500">{adminError?.message ?? 'Unable to load admin.'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        element="input"
        name="name"
        value={formValues.name}
        handler={handleChange}
        placeholder="Enter admin name"
        tag="Name"
        required
        error={fieldErrors.name}
      />
      <Input
        element="input"
        input_type="tel"
        name="phoneNumber"
        value={formValues.phoneNumber}
        handler={handleChange}
        placeholder="Enter admin phone number"
        tag="Phone Number"
        required
        error={fieldErrors.phoneNumber}
      />
      <Input
        element="select"
        name="roleId"
        value={formValues.roleId || ""}
        handler={handleChange}
        placeholder="Select role"
        tag="Role"
        selectOptions={(roles ?? []).map((val) => ({
          label: val.name,
          value: String(val.id),
        }))}
        required
        error={fieldErrors.roleId}
      />
      <Button
        primary
        disabled={isPending}
        isFullWidth
        type="submit"
      >
        {isPending ? "Editing Admin..." : "Edit Admin"}
      </Button>
    </form>
  );
};

export default EditAdmin;
