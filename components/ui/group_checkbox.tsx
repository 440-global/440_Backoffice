"use client"

import { useEffect, useRef } from 'react'
import { RiLoader5Fill } from 'react-icons/ri'
import { useGetPermissions } from '@/api/admin'

const GroupCheckbox = ({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 accent-(--primary)"
    />
  );
};

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

const PermissionPicker = ({ value, onChange, disabled }: Props) => {
  const { data: groups = [], isLoading, error } = useGetPermissions();
  const selected = new Set(value);

  const toggle = (permission: string) => {
    const next = new Set(selected);
    next.has(permission) ? next.delete(permission) : next.add(permission);
    onChange([...next]);
  };

  const toggleGroup = (permissions: string[]) => {
    const allSelected = permissions.every((p) => selected.has(p));
    const next = new Set(selected);
    permissions.forEach((p) => (allSelected ? next.delete(p) : next.add(p)));
    onChange([...next]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <RiLoader5Fill className="text-(--primary) animate-spin" size={28} />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">Unable to load permissions.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className='font-semibold'>Permissions</h3>
      <p className="text-sm text-gray-500">{selected.size} selected</p>

      <div className="grid grid-cols-1 gap-3">
        {groups.map((group) => {
          const count = group.permissions.filter((p) => selected.has(p)).length;
          const all = count === group.permissions.length;

          return (
            <div key={group.resource} className="rounded-lg border border-gray-200 p-3">
              <label className="flex items-start gap-2">
                <GroupCheckbox
                  checked={all}
                  indeterminate={count > 0 && !all}
                  onChange={() => toggleGroup(group.permissions)}
                  disabled={disabled}
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    {group.label}
                  </span>
                  <span className="block text-xs text-gray-500">{group.description}</span>
                </span>
              </label>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 pl-6">
                {group.permissions.map((permission) => (
                  <label key={permission} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.has(permission)}
                      onChange={() => toggle(permission)}
                      disabled={disabled}
                      className="h-4 w-4 accent-(--primary)"
                    />
                    {permission.split(':')[1]}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionPicker