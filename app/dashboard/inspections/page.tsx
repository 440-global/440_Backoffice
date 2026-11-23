"use client"

import React, { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { ActionDropdown, Button, Card, Input } from "@/components/ui";
import { inspections } from './data';
import { useGetInspections } from '@/api/inspection';
import { InspectionDepth, InspectionParams, InspectionStatus, SingleInspection } from '@/types/types';
import { LuSearchX } from "react-icons/lu";
import { RiFilterLine, RiFilterOffLine } from 'react-icons/ri';
import MyModal from '@/components/dashboard/Modal';
import ViewInspection from '@/components/inspections/ViewInspection';
import EditInspection from '@/components/inspections/EditInspection';
import { cn } from '@/components/ui/utils';
import { inspectionStatusPillClass } from '@/lib/order-badges';
import { useCanCreate, useCanDelete, useCanManage, useCanUpdate, useCanView } from '@/hooks/use-can';

type Props = {}

const INSPECTION_STATUS_OPTIONS = [
  "SUBMITTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "REPORT_READY",
  "COMPLETED",
  "REJECTED",
  "REFUNDED",
  "CANCELLED",
];

const INSPECTION_DEPTH = ["BASIC", "STANDARD", "COMPREHENSIVE"];

type InspectionFilters = {
  depth?: InspectionDepth,
  merchantId?: number,
  status?: InspectionStatus;
}

const defaultFilters: InspectionFilters = {
  depth: "BASIC",
  merchantId: undefined,
  status: "SUBMITTED",
};

const Inspections = (props: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);
  const [temp, setTemp] = useState<InspectionFilters>(defaultFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<InspectionFilters>(defaultFilters);
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(temp);
    }, 300);

    return () => clearTimeout(timeout);
  }, [temp]);

  const { 
    data: inspections, 
    isLoading: isInspectionsLoading, 
    error: isInspectionsError 
  } = useGetInspections(debouncedFilters as InspectionParams);

  const fetchedData = inspections?.data?.rows ?? [];
  const totalPages = inspections?.data.totalPages;
  const page = inspections?.data.page;
  const totalItems = inspections?.data.count;
  const limit = inspections?.data.limit;

  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!fetchedData.length) return [];

    let data = [...fetchedData];

    if (query) {
      const q = query.toLowerCase();

      data = data.filter(
        (item) =>
          item.reference.toLowerCase().includes(q) ||
          item.productDetails.description.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q),
      );
    }

    return data;
  }, [query, fetchedData]);

  const startIndex = (page! - 1) * limit!;
  const endIndex = Math.min(startIndex + limit!, filteredData.length);

  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleApply = () => {
    setDebouncedFilters(temp);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setTemp(defaultFilters);
    setDebouncedFilters(defaultFilters);
    setTemp({
      merchantId: undefined,
    })
    setCurrentPage(1);
  };

  const isFiltered = !!temp.depth || !!temp.merchantId || !!temp.status;

  // Permissions
  const canView = useCanView("services");
  const canUpdate = useCanUpdate("services");
  const canCreate = useCanCreate("services");
  const canDelete = useCanDelete("services");
  const canManage = useCanManage("services");

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inspections</h1>
        </div>
      </div>

      <Card className="shadow-none! border border-(--table-border) mb-4 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            element="select"
            value={temp.depth!}
            name="depth"
            handler={(e) => setTemp((f) => ({ ...f, depth: e.target.value }))}
            selectOptions={INSPECTION_DEPTH.map((val) => ({
              label: val,
              value: val,
            }))}
            tag="Inspection Type"
            placeholder="All Types"
            genStyle="my-0! mt-3! mb-1!"
          />
          <Input
            element="input"
            input_type="text"
            value={temp.merchantId!}
            name="merchantId"
            handler={(e) =>
              setTemp((f) => ({ ...f, merchantId: Number(e.target.value) }))
            }
            tag="Merchant ID"
            placeholder="Merchant ID"
            genStyle="my-0! mt-3! mb-1!"
          />
          <Input
            element="select"
            value={temp.status!}
            name="status"
            handler={(e) => setTemp((f) => ({ ...f, status: e.target.value }))}
            selectOptions={INSPECTION_STATUS_OPTIONS.map((val) => ({
              label: val.replace(/_/g, " "),
              value: val,
            }))}
            tag="Inspection Status"
            placeholder="All Statuses"
            genStyle="my-0! mt-3! mb-1!"
          />
          <div className="flex flex-wrap gap-2 justify-end items-end">
            {isFiltered && (
              <Button
                onClick={handleClear}
                className="flex items-center gap-1 py-2! px-4! rounded-lg! bg-red-500"
              >
                <RiFilterOffLine />
                Clear
              </Button>
            )}
            <Button
              primary
              onClick={handleApply}
              className="flex items-center gap-1 py-2! px-4! rounded-lg!"
            >
              <RiFilterLine />
              Apply filters
            </Button>
          </div>
        </div>
      </Card>

      <Table
        aria-label="Admin inspections"
        // pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        title="Inspections"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Reference</TableColumn>
            <TableColumn>Merchant ID</TableColumn>
            <TableColumn>Inspection Type</TableColumn>
            <TableColumn>Amount Paid</TableColumn>
            <TableColumn>Supplier Name</TableColumn>
            <TableColumn>Description</TableColumn>
            <TableColumn>Attachments</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isInspectionsLoading}
          emptyContent={
            <div className="min-h-50 flex justify-center items-center flex-col gap-4 text-center">
              <LuSearchX size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No Inspections</h2>
                <p>There are currently no inspections pending</p>
              </div>
            </div>
          }
        >
          {paginatedData.map((inspection) => (
            <TableRow key={inspection.id} className="bg-(--surface)">
              <TableCell>{inspection.id}</TableCell>
              <TableCell>{inspection.reference}</TableCell>
              <TableCell>{inspection.merchantId}</TableCell>
              <TableCell>{inspection.depth}</TableCell>
              <TableCell>
                &#8358;{inspection.feePaidNaira.toLocaleString()}
              </TableCell>
              <TableCell>{inspection.supplier.name}</TableCell>
              <TableCell>{inspection.productDetails.description}</TableCell>
              <TableCell>
                <img
                  src={inspection.attachments?.[0]?.url ?? "-"}
                  alt={`Attachment for ${inspection.reference}`}
                  className="w-16 h-16 object-cover rounded"
                />
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    inspectionStatusPillClass(inspection.status),
                  )}
                >
                  {(inspection.status ?? "—").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    ...(canView ? [
                      {
                        label: "View",
                        onClick: () => {
                          setSelectedInspectionId(inspection.id);
                          setModalType("view");
                        },
                      },
                    ] : []),
                    ...(canUpdate ? [
                      {
                        label: "Edit",
                        onClick: () => {
                          setSelectedInspectionId(inspection.id);
                          setModalType("edit");
                        },
                      },
                    ] : []),
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        page={page!}
        totalPages={totalPages!}
        onPageChange={setCurrentPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="inspections"
      />

      {selectedInspectionId && modalType === "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedInspectionId(null)}
          title="Inspection Details"
        >
          <ViewInspection inspectionId={selectedInspectionId} />
        </MyModal>
      )}

      {selectedInspectionId && modalType === "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedInspectionId(null)}
          title="Edit Inspection"
        >
          <EditInspection
            inspectionId={selectedInspectionId}
            onSuccess={() => setSelectedInspectionId(null)}
          />
        </MyModal>
      )}
    </>
  );
}

export default Inspections