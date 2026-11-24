"use client"

import { useGetRole } from '@/api/admin'
import React from 'react'
import { RiLoader5Fill, RiLockLine, RiShieldCheckLine } from 'react-icons/ri'

type Props = {
  roleId: number
}

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
  </div>
);

const Badge = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
  >
    {children}
  </span>
);

const ViewRole = ({ roleId }: Props) => {
  const { data: role, isLoading, error } = useGetRole(roleId);

  if (isLoading) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <RiLoader5Fill className="text-(--primary) animate-spin" size={40} />
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="p-6 text-sm text-red-600">
        {error?.message ?? 'Unable to load role.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{role.name}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {role.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {role.isSystem && (
            <Badge className="bg-blue-50 text-blue-700">
              <RiShieldCheckLine size={14} />
              System role
            </Badge>
          )}
          {role.locked && (
            <Badge className="bg-amber-50 text-amber-700">
              <RiLockLine size={14} />
              Locked
            </Badge>
          )}
        </div>
      </div>

      {/* Details */}
      <dl className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
        <Field label="Role ID" value={role.id} />
        <Field
          label="Key"
          value={<code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{role.key}</code>}
        />
        <Field label="Type" value={role.isSystem ? 'System' : 'Custom'} />
        <Field label="Status" value={role.locked ? 'Locked' : 'Editable'} />
        <Field
          label="Assigned admins"
          value={`${role.adminCount} ${role.adminCount === 1 ? 'admin' : 'admins'}`}
        />
        <Field label="Permissions" value={role.permissions.length} />
      </dl>

      {/* Permissions */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Permissions</h3>

        {role.permissions?.length === 0 ? (
          <p className="text-sm text-gray-500">This role has no permissions.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {role.permissions.map((permission: string) => (
              <li key={permission}>
                <Badge className="bg-gray-100 text-gray-700">{permission}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ViewRole