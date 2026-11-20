"use client"

import { useAddRole } from '@/api/admin'
import { useNestedForm } from '@/hooks/use-nested-form'
import { getApiError, issuesByField } from '@/lib/api-error'
import { AddRolePayload } from '@/types/types'
import React, { FormEvent, useState } from 'react'
import { Button, Input } from '../ui'
import PermissionPicker from '../ui/group_checkbox'

type Props = {
  onSuccess: () => void
}

const defaultValues: AddRolePayload = {
  key: '',
  name: '',
  description: '',
  permissions: []
}

const AddRole = ({ onSuccess }: Props) => {
  const { mutateAsync: createRole, isPending, error } = useAddRole();
  const { formValues, setFormValues, handleChange } = useNestedForm<AddRolePayload>(defaultValues);

  const [permissions, setPermissions] = useState<string[]>([]);

  // errors
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const body: AddRolePayload = {
      key: formValues.key.trim(),
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      permissions: permissions
    };

    createRole({ body }, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        element="input"
        name="name"
        value={formValues.name}
        handler={handleChange}
        placeholder="Enter role name"
        tag="Name"
        required
        error={fieldErrors.name}
      />
      <Input
        element="input"
        name="key"
        value={formValues.key}
        handler={handleChange}
        placeholder="Enter role key"
        tag="Key"
        required
        error={fieldErrors.key}
      />
      <Input
        element="textarea"
        name="description"
        value={formValues.description}
        handler={handleChange}
        placeholder="Enter role description"
        tag="Description"
        required
        error={fieldErrors.description}
      />
      <PermissionPicker value={permissions} onChange={setPermissions} />

      <Button
        primary
        disabled={isPending}
        isFullWidth
        type="submit"
      >
        {isPending ? "Creating Role..." : "Create Role"}
      </Button>
    </form>
  )
}

export default AddRole