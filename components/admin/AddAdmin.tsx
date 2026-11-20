"use client";

import { useNestedForm } from "@/hooks/use-nested-form";
import { AddAdminPayload } from "@/types/types";
import React, { FormEvent } from "react";
import { Button, Input } from "../ui";
import { useAddAdmin, useGetRoles } from "@/api/admin";
import { getApiError, issuesByField } from "@/lib/api-error";
import { useToast } from "../ui/toast/ToastContext";

type Props = {
  onSuccess: () => void;
};

const defaultValues: AddAdminPayload = {
  email: "",
  password: "",
  name: "",
  phoneNumber: "",
  roleId: 0,
  role: "",
};

const AddAdmin = ({ onSuccess }: Props) => {
  const { formValues, setFormValues, handleChange } =
    useNestedForm<AddAdminPayload>(defaultValues);
  const { mutateAsync: createAdmin, isPending, error } = useAddAdmin();
  const {
    data: roles,
    isLoading: roleLoading,
    error: roleError,
  } = useGetRoles();

  const { toast } = useToast();

  // errors
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const body: AddAdminPayload = {
      email: formValues.email.trim(),
      password: formValues.password.trim(),
      name: formValues.name.trim(),
      phoneNumber: formValues.phoneNumber.trim(),
      roleId: Number(formValues.roleId),
      role: roles?.find((r) => r.id === Number(formValues.roleId))?.key ?? "",
    };

    createAdmin({ body }, { onSuccess });
  };

  const passwordTooShort =
    formValues.password.length > 0 && formValues.password.length < 8;

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = Number(e.target.value);
    const selectedRole = roles?.find((r) => r.id === roleId);

    setFormValues((prev) => ({
      ...prev,
      roleId,
      role: selectedRole?.key ?? "",
    }));
  };

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
        input_type="email"
        name="email"
        value={formValues.email}
        handler={handleChange}
        placeholder="Enter admin email"
        tag="Email address"
        required
        error={fieldErrors.email}
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
        handler={handleRoleChange}
        placeholder="Select role"
        tag="Role"
        selectOptions={(roles ?? []).map((val) => ({
          label: val.name,
          value: String(val.id),
        }))}
        required
        error={fieldErrors.roleId}
      />
      <Input
        element="input"
        input_type="password"
        name="password"
        value={formValues.password}
        handler={handleChange}
        placeholder="At least 8 characters"
        tag="Password"
        required
        maxLength={128}
        error={
          fieldErrors.temporaryPassword ??
          (passwordTooShort ? "Use at least 8 characters." : undefined)
        }
      />
      <Button
        primary
        disabled={isPending || passwordTooShort}
        isFullWidth
        type="submit"
      >
        {isPending ? "Creating Admin..." : "Create Admin"}
      </Button>
    </form>
  );
};

export default AddAdmin;
