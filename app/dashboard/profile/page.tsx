"use client"

import { useGetAdminProfile } from '@/api/admin'
import { Input } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import { getInitials } from '@/lib/funcs';
import React, { useState } from 'react'

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
  </div>
);

const AdminProfile = () => {
  const { data, isLoading, error } = useGetAdminProfile();
  const [search, setSearch] = useState('');
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading profile...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6 text-sm text-red-600">
        {error?.message ?? 'Unable to load profile.'}
      </div>
    );
  }

  const { admin, isSuper, permissions } = data;

  const query = search.trim().toLowerCase();
  const filteredPermissions = query
    ? permissions.filter((permission) => permission.toLowerCase().includes(query))
    : permissions;


  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-lg font-semibold text-white">
          {getInitials(admin.name)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{admin.name}</h1>
          <p className="text-sm text-gray-500">{admin.email}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              admin.status
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {admin.status ? 'Active' : 'Inactive'}
          </span>
          {isSuper && (
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
              Super admin
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Account details</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Admin ID" value={admin.id} />
          <Field label="Phone number" value={admin.phoneNumber || '—'} />
          <Field label="Role" value={admin.role.name} />
          <Field label="Role key" value={admin.role.key} />
          <Field label="Created" value={fmtDate(admin.createdAt)} />
          <Field label="Last updated" value={fmtDate(admin.updatedAt)} />
        </dl>
      </section>

      {/* Permissions */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Permissions ({permissions.length})
        </h2>
        <Input 
          placeholder="Search permissions" 
          element="input"
          name="search"
          value={search}
          handler={handleSearch}
          styling='py-2! px-3!'
        />
        {permissions.length === 0 ? (
          <p className="text-sm text-gray-500">No permissions assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredPermissions.map((permission) => (
              <span
                key={permission}
                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
              >
                {permission}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminProfile