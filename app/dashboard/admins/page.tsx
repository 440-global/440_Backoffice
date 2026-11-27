"use client";

import { useDeleteAdmin, useGetAllAdmins, useGetRoles } from "@/api/admin";
import { ActionDropdown, Button, Card, Input } from "@/components/ui";
import { useCan, useCanCreate, useCanDelete, useCanManage, useCanUpdate, useCanView } from "@/hooks/use-can";
import { Admin, AdminParams } from "@/types/types";
import React, { useState } from "react";
import { RiAdminLine, RiFilterLine, RiFilterOffLine } from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { useNestedForm } from "@/hooks/use-nested-form";
import { useConfirm } from "@/components/ui/confirm";
import MyModal from "@/components/dashboard/Modal";
import AddAdmin from "@/components/admin/AddAdmin";
import ViewAdmin from "@/components/admin/ViewAdmin";
import EditAdmin from "@/components/admin/EditAdmin";

type Props = {};

const defaultValues: AdminParams = {
  page: 1,
  limit: 20,
  search: "",
};

const Admins = (props: Props) => {
  const [filters, setFilters] = useState<AdminParams>(defaultValues);
  const { formValues, setFormValues, handleChange } =
    useNestedForm<AdminParams>(defaultValues);

  const [modalType, setModalType] = useState<"create" | "view" | "edit" | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);

  const { data: admins, isLoading, error } = useGetAllAdmins(filters);
  const {
    data: roles,
    isLoading: roleLoading,
    error: roleError,
  } = useGetRoles();
  const { mutateAsync: deleteAdmin } = useDeleteAdmin();

  // Permissions
  const canView = useCanView("admins");
  const canUpdate = useCanUpdate("admins");
  const canDelete = useCanDelete("admins");
  const canCreate = useCanCreate("admins");

  const confirm = useConfirm();

  const fetchedData: Admin[] = admins?.data ?? [];
  const totalPages = admins?.meta?.totalPages;
  const totalItems = admins?.meta?.total;

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleApply = () => {
    const { roleId, search, ...rest } = formValues;
  
    setFilters({
      ...rest,
      page: 1,
      search: search?.trim() ? search.trim() : undefined,
      roleId: roleId ? Number(roleId) : undefined,
    });
  };

  const handleClear = () => {
    setFormValues(defaultValues);
    setFilters(defaultValues);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm("Are you sure you want to delete this admin?");
    if (!ok) return;

    await deleteAdmin(id);
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Admins</h3>

        {canCreate && (
          <Button
            primary
            className="flex items-center gap-1"
            onClick={() => setModalType("create")}
          >
            <RiAdminLine className="font-bold" />
            Create Admin
          </Button>
        )}
      </div>

      <Card className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 shadow-none! mb-8">
        <Input
          element="select"
          name="limit"
          value={formValues.limit!}
          handler={handleChange}
          placeholder="Select limit"
          tag="Limit"
          selectOptions={[10, 20, 30, 40, 50]}
          genStyle=""
        />
        <Input
          element="input"
          name="search"
          value={formValues.search!}
          handler={handleChange}
          placeholder="Search by name...."
          tag="Search"
          genStyle=""
        />
        <Input
          element="select"
          name="roleId"
          value={formValues.roleId ?? ""}
          handler={handleChange}
          placeholder="Select role"
          tag="Role"
          selectOptions={[
            { label: "All roles", value: "" },
            ...(roles ?? []).map((val) => ({
              label: val.name,
              value: String(val.id),
            })),
          ]}
          genStyle=""
        />
        <div className="flex flex-wrap items-end justify-end gap-2">
          <Button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-lg! bg-red-500 py-2! px-4!"
          >
            <RiFilterOffLine />
            Clear
          </Button>
          <Button
            primary
            onClick={handleApply}
            className="flex items-center gap-1 rounded-lg! py-2! px-4!"
          >
            <RiFilterLine />
            Apply filters
          </Button>
        </div>
      </Card>

      {/* Bales Table */}
      <Table
        aria-label="Admins Table"
        pageSize={filters.limit}
        onPageSizeChange={handlePageSizeChange}
        title="All Admins"
      >
        <TableHeader>
          <TableRow>
            {/* <TableColumn>Admin ID</TableColumn> */}
            <TableColumn>Name</TableColumn>  
            <TableColumn>Email</TableColumn>
            <TableColumn>Phone Number</TableColumn>
            <TableColumn>Role</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isLoading}>
          {fetchedData.map((admin) => (
            <TableRow className="bg-(--card)" key={admin.id}>
              {/* <TableCell>{ admin.id }</TableCell> */}
              <TableCell>{ admin.name }</TableCell>
              <TableCell>{ admin.email }</TableCell>
              <TableCell>{ admin.phoneNumber }</TableCell>
              <TableCell>{ admin.role.name }</TableCell>
              <TableCell>
              <ActionDropdown
                  actions={[
                    ...(canView ? [
                      {
                        label: 'View Admin',
                        onClick: () => {
                          setModalType("view");
                          setSelectedAdminId(admin.id);
                        },
                      }
                    ]: []),
                    ...(canUpdate ? [
                      {
                        label: 'Edit Admin',
                        onClick: () => {
                          setModalType("edit");
                          setSelectedAdminId(admin.id);
                        },
                      }
                    ]: []),
                    ...(canDelete ? [
                      {
                        label: 'Delete Admin',
                        danger: true,
                        onClick: () => handleDelete(admin.id),
                      }
                    ]: []),
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        page={filters.page ?? 1}
        totalPages={totalPages ?? 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        startIndex={(filters.page! - 1) * filters.limit! + 1}
        endIndex={(filters.page! - 1) * filters.limit! + fetchedData.length}
        itemLabel="bale(s)"
      />

      {
        modalType == 'create' &&
        <MyModal
          title="Add Admin"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          <AddAdmin 
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      }

      {
        selectedAdminId && modalType == 'view' &&
        <MyModal
          title="Admin Details"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          <ViewAdmin adminId={selectedAdminId} />
        </MyModal>
      }

      {
        selectedAdminId && modalType == 'edit' &&
        <MyModal
          title="Edit Admin"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          <EditAdmin 
            adminId={selectedAdminId} 
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      }
    </>
  );
};

export default Admins;
