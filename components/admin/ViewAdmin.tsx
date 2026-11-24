"use client"

import { useGetAdmin } from '@/api/admin'
import { fmtDate } from '@/lib/format'
import { getInitials } from '@/lib/funcs'
import React from 'react'
import { RiLoader5Fill } from 'react-icons/ri'

type Props = {
  adminId: number
}

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
  </div>
);

const ViewAdmin = ({ adminId }: Props) => {
  const { data: admin, isLoading, error } = useGetAdmin(adminId);

  if (isLoading) {
    return <div className="h-full w-full flex justify-center items-center">
      <RiLoader5Fill className='text-(--primary) animate-spin' size={40} />
    </div>;
  }

  if (error || !admin) {
    return (
      <div className="p-6 text-sm text-red-600">
        {error?.message ?? 'Unable to load admin.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-900 text-base font-semibold text-white">
          {getInitials(admin.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-gray-900">{admin.name}</h2>
          <p className="truncate text-sm text-gray-500">{admin.email}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            admin.status
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {admin.status ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Account details */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Account details</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Admin ID" value={admin.id} />
          <Field label="Phone number" value={admin.phoneNumber || '—'} />
          <Field label="Created" value={fmtDate(admin.createdAt)} />
          <Field label="Last updated" value={fmtDate(admin.updatedAt)} />
        </dl>
      </section>

      {/* Role */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Role</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" value={admin.role.name} />
          <Field label="Key" value={admin.role.key} />
          <Field
            label="Type"
            value={
              <span
                className={`rounded-md px-2 py-1 text-xs ${
                  admin.role.isSystem
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {admin.role.isSystem ? 'System role' : 'Custom role'}
              </span>
            }
          />
        </dl>
      </section>
    </div>
  );
};

export default ViewAdmin