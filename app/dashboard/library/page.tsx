"use client";

import { useDeleteLibrary, useGetLibraries } from "@/api/library";
import { LibraryParams } from "@/types/types";
import React, { useState } from "react";
import { RiAddFill } from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import {
  ActionDropdown,
  Badge,
  Button,
  Card,
  Dropdown,
  Input,
} from "@/components/ui";
import { LuSearchX } from "react-icons/lu";
import { fmtDateTime, truncateText } from "@/lib/funcs";
import MyModal from "@/components/dashboard/Modal";
import AddEntry from "@/components/library/AddEntry";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast/ToastContext";
import ViewEntry from "@/components/library/ViewEntry";
import EditEntry from "@/components/library/EditEntry";
import {
  useCanCreate,
  useCanDelete,
  useCanManage,
  useCanUpdate,
  useCanView,
} from "@/hooks/use-can";

type Props = {};

const defaultFilters: LibraryParams = {
  page: 1,
  limit: 20,
  isActive: true,
};

const Library = (props: Props) => {
  const [filters, setFilters] = useState<LibraryParams>(defaultFilters);
  const [modalType, setModalType] = useState<"view" | "edit" | "add" | null>(
    null,
  );
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  const params: LibraryParams = {
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.limit ? { limit: filters.limit } : {}),
    ...(filters.isActive ? { isActive: filters.isActive } : {}),
  };

  const { mutateAsync: deleteEntry } = useDeleteLibrary();

  const {
    data: entries,
    isPending: isEntriesPending,
    error: entryError,
  } = useGetLibraries(params);

  const confirm = useConfirm();
  const { toast } = useToast();

  const fetchedData = entries?.data;
  const totalPages = entries?.meta.totalPages;
  const totalItems = entries?.meta.total;
  const page = entries?.meta.page;
  const limit = entries?.meta.limit;

  const sortedData = fetchedData?.sort((a, b) => a.id - b.id);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm("Are you sure you want to delete this item?");
    if (!ok) return;

    const res = await deleteEntry(id);
    if (res.status == 200 || res.status == 201) {
      toast({
        title: "Success",
        description: "Entry deleted successfully",
        variant: "success",
      });
    } else {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "danger",
      });
    }
  };

  // Map display value → filter value
  const STATUS_OPTIONS = ["all", "active", "inactive"];
  type StatusOption = (typeof STATUS_OPTIONS)[number];

  const isActiveToStatus = (isActive?: boolean): StatusOption => {
    if (isActive === true) return "active";
    if (isActive === false) return "inactive";
    return "all";
  };

  const statusToIsActive = (status: StatusOption): boolean | undefined => {
    if (status === "active") return true;
    if (status === "inactive") return false;
    return undefined;
  };

  // Permissions
  const canView = useCanView("library");
  const canUpdate = useCanUpdate("library");
  const canCreate = useCanCreate("library");
  const canDelete = useCanDelete("library");

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Library</h3>
        {canCreate && (
          <Button
            primary
            className="flex items-center gap-1"
            onClick={() => setModalType("add")}
          >
            <RiAddFill className="font-bold" />
            Add Library Entry
          </Button>
        )}
      </div>

      <Table
        aria-label="Library Table"
        // pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        title="Library Entries"
        customFilter={
          <div className="flex gap-1 items-center">
            <p className="font-semibold">Status:</p>
            <Dropdown
              value={isActiveToStatus(filters.isActive)} // boolean → string
              onChange={(val) => {
                setFilters((prev) => ({
                  ...prev,
                  page: 1,
                  isActive: statusToIsActive(val as StatusOption), // string → boolean | undefined
                }));
              }}
              options={STATUS_OPTIONS}
            />
          </div>
        }
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Title</TableColumn>
            <TableColumn>URL ID</TableColumn>
            <TableColumn>Active Status</TableColumn>
            <TableColumn>Created At</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isEntriesPending}
          emptyContent={
            <div className="min-h-50 flex justify-center items-center flex-col gap-4 text-center">
              <LuSearchX size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No Library Entries</h2>
                <p>There are currently no library entries</p>
              </div>
            </div>
          }
        >
          {sortedData?.map((entry) => (
            <TableRow className="bg-(--card)" key={entry.id}>
              <TableCell>{entry.id}</TableCell>
              <TableCell>{entry.title}</TableCell>
              <TableCell>{truncateText(entry.fileUrl, 30)}</TableCell>
              <TableCell>
                <Badge
                  variant={`${entry.isActive == true ? "success" : "danger"}`}
                >
                  {entry.isActive == true ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>{fmtDateTime(entry.createdAt)}</TableCell>
              {/* action */}
              <TableCell>
                <ActionDropdown
                  actions={[
                    ...(canView ? [
                      {
                        label: "View",
                        onClick: () => {
                          setModalType("view");
                          setSelectedEntryId(entry.id);
                        },
                      },
                    ] : []),
                    ...(canUpdate ? [
                      {
                        label: "Edit",
                        onClick: () => {
                          setModalType("edit");
                          setSelectedEntryId(entry.id);
                        },
                      },
                    ] : []),
                    ...(canDelete ? [
                      {
                        label: "Delete",
                        onClick: () => {
                          handleDelete(entry.id);
                        },
                        danger: true,
                      },
                    ] : [])
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        page={filters.page!}
        totalPages={totalPages!}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        startIndex={(filters.page! - 1) * filters.limit! + 1}
        endIndex={(filters.page! - 1) * filters.limit! + fetchedData?.length!}
        itemLabel="item(s)"
      />

      {modalType == "add" && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          title="Add Library Entry"
        >
          <AddEntry onSuccess={() => setModalType(null)} />
        </MyModal>
      )}

      {modalType == "view" && selectedEntryId != null && (
        <MyModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title="View Library Entry"
        >
          <ViewEntry id={selectedEntryId} />
        </MyModal>
      )}

      {modalType == "edit" && selectedEntryId != null && (
        <MyModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title="Edit Library Entry"
        >
          <EditEntry
            onSuccess={() => setModalType(null)}
            id={selectedEntryId}
          />
        </MyModal>
      )}
    </>
  );
};

export default Library;
