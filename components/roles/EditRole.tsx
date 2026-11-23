"use client"

import { useEditRole, useGetRole } from '@/api/admin'
import { useNestedForm } from '@/hooks/use-nested-form'
import { getApiError, issuesByField } from '@/lib/api-error'
import { EditRolePayload, Role } from '@/types/types'
import React, { FormEvent } from 'react'
import { RiLoader5Fill } from 'react-icons/ri'
import { Button, Input } from '../ui'
import PermissionPicker from '../ui/group_checkbox'

type Props = {
  roleId: number
  onSuccess: () => void
}

// Outer: loads the role
const EditRole = ({ roleId, onSuccess }: Props) => {
  const { data: role, isPending, error } = useGetRole(roleId);

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <RiLoader5Fill className="text-(--primary) animate-spin" size={32} />
      </div>
    );
  }

  if (error || !role) {
    return <p className="p-6 text-sm text-red-600">Unable to load role.</p>;
  }

  return <EditRoleForm key={role.id} roleId={roleId} role={role} onSuccess={onSuccess} />;
};

// Inner: mounts only when `role` exists, so initial values are correct
const EditRoleForm = ({ roleId, role, onSuccess }: Props & { role: Role }) => {
  const { mutateAsync: updateRole, isPending, error } = useEditRole(roleId);

  const { formValues, setFormValues, handleChange } = useNestedForm<EditRolePayload>({
    name: role.name ?? '',
    description: role.description ?? '',
    permissions: role.permissions ?? [],
  });

  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const body: EditRolePayload = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      permissions: formValues.permissions,
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

      <PermissionPicker
        value={formValues.permissions}
        onChange={(next) => setFormValues({ ...formValues, permissions: next })}
        disabled={isPending}
      />

      <Button primary disabled={isPending} isFullWidth type="submit">
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}

export default EditRole