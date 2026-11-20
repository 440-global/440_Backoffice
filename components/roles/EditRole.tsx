"use client"

import { useEditRole, useGetRole } from '@/api/admin'
import { useNestedForm } from '@/hooks/use-nested-form'
import { getApiError, issuesByField } from '@/lib/api-error'
import { EditRolePayload } from '@/types/types'
import React, { FormEvent, useEffect, useState } from 'react'
import { Button, Input } from '../ui'
import PermissionPicker from '../ui/group_checkbox'

type Props = {
  roleId: number
  onSuccess: () => void
}

const defaultValues: EditRolePayload = {
  name: '',
  description: '',
  permissions: []
}

const EditRole = ({ roleId, onSuccess }: Props) => {
  const { mutateAsync: updateRole, isPending, error } = useEditRole(roleId);
  const { data: role, isPending: rolePending } = useGetRole(roleId);
  const { formValues, setFormValues, handleChange } = useNestedForm<EditRolePayload>(defaultValues);

  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if(role) {
      setFormValues({
        name: role.name ?? '',
        description: role.description ?? '',
        permissions: permissions
      })
    }
  }, [role]);
  

  // errors
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const body: EditRolePayload = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      permissions: permissions
    };

    updateRole({ body }, { onSuccess });
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
        {isPending ? "Editing Role..." : "Edit Role"}
      </Button>
    </form>
  )
}

export default EditRole