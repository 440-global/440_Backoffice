"use client"

import { useDeleteRole, useGetRoles } from '@/api/admin'
import { ActionDropdown, Button } from '@/components/ui'
import { useConfirm } from '@/components/ui/confirm'
import { useCan } from '@/hooks/use-can'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import React, { useState } from 'react'
import { RiUserForbidLine } from 'react-icons/ri'
import MyModal from '@/components/dashboard/Modal'
import ViewRole from '@/components/roles/ViewRole'
import AddRole from '@/components/roles/AddRole'
import EditRole from '@/components/roles/EditRole'

type Props = {}

const RolesPage = (props: Props) => {
  const { data: roles, isLoading, error } = useGetRoles();
  const { mutateAsync: deleteRole } = useDeleteRole();

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<"create" | "view" | "edit" | null>(null);

  // Permissions
  const canView = useCan("roles.view");
  const canManage = useCan("roles.manage");
  const canUpdate = useCan("roles.update");
  const canDelete = useCan("roles.delete");
  const canCreate = useCan("roles.create");

  const confirm = useConfirm();

  const handleDelete = async (id: number) => {
    const ok = await confirm("Are you sure you want to delete this role?");
    if (!ok) return;

    await deleteRole(id);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Roles</h3>

        {canCreate && (
          <Button
            primary
            className="flex items-center gap-1"
            onClick={() => setModalType("create")}
          >
            <RiUserForbidLine className="font-bold" />
            Create Role
          </Button>
        )}
      </div>

      <Table
        aria-label="Roles Table"
        title="All Roles"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>Role ID</TableColumn>
            <TableColumn>Name</TableColumn>  
            <TableColumn>Key</TableColumn>
            <TableColumn>System Role</TableColumn>
            <TableColumn>Locked</TableColumn>
            <TableColumn>Admin Count</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isLoading}>
          {roles?.map((role) => (
            <TableRow className="bg-(--card)" key={role.id}>
              <TableCell>{ role.id }</TableCell>
              <TableCell>{ role.name }</TableCell>
              <TableCell>{ role.key }</TableCell>
              <TableCell>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  role.isSystem
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {role.isSystem ? 'True' : 'False'}
              </span>
              </TableCell>
              <TableCell>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  role.locked
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {role.locked ? 'Yes' : 'No'}
              </span>
              </TableCell>
              <TableCell>{ role.adminCount }</TableCell>
              <TableCell>
              <ActionDropdown
                  actions={[
                    ...(canView ? [
                      {
                        label: 'View Role',
                        onClick: () => {
                          setModalType("view");
                          setSelectedRoleId(role.id);
                        },
                      }
                    ]: []),
                    ...(canUpdate ? [
                      {
                        label: 'Edit Role',
                        onClick: () => {
                          setModalType("edit");
                          setSelectedRoleId(role.id);
                        },
                      }
                    ]: []),
                    ...(canDelete ? [
                      {
                        label: 'Delete Role',
                        danger: true,
                        onClick: () => handleDelete(role.id),
                      }
                    ]: []),
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {
        modalType == 'create' &&
        <MyModal
          title="Create Role"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          <AddRole onSuccess={() => setModalType(null)} />
        </MyModal>
      }

      {
        selectedRoleId && modalType == 'view' &&
        <MyModal
          title="Role Details"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          <ViewRole roleId={selectedRoleId} />
        </MyModal>
      }

      {
        selectedRoleId && modalType == 'edit' &&
        <MyModal
          title="Edit Role Details"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          <EditRole 
            roleId={selectedRoleId} 
            onSuccess={() => setModalType(null)} 
          />
        </MyModal>
      }
    </>
  )
}

export default RolesPage