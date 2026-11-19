"use client";
import { useGetSupplierVerifications } from '@/api/verification';
import { ActionDropdown, Button, Card, Input } from "@/components/ui";
import { SupplierVerificationStatus } from '@/types/types';
import React, { useEffect, useMemo, useState } from 'react'
import { RiFilterLine, RiFilterOffLine } from 'react-icons/ri';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { LuSearchX } from 'react-icons/lu';
import MyModal from '@/components/dashboard/Modal';
import ViewVerification from '@/components/verifications/ViewVerification';
import EditVerification from '@/components/verifications/EditVerification';
import { supplierVerificationStatusPillClass } from '@/lib/order-badges';
import { cn } from '@/components/ui/utils';
import UpdateFindings from '@/components/verifications/UpdateFindings';

type Props = {}

const SUPPLIER_VERIFICATION_STATUS_OPTIONS = [
  "SUBMITTED",
  "INTAKE_REVIEW",
  "ONLINE_CHECK",
  "SUPPLIER_ENGAGED",
  "DOC_REVIEW",
  "SCORED",
  "REPORT_READY",
  "COMPLETED",
  "REJECTED",
  "REFUNDED",
  "CANCELLED"
];

type SupplierVerificationFilters = {
  status: SupplierVerificationStatus | "";
  merchantId?: number | null;
  assignedAdminId?: number | null;
  reference?: string;
}

const defaultFilters: SupplierVerificationFilters = {
  status: "SUBMITTED",
  merchantId: null,
  reference: ""
};

const SupplierVerifications = (props: Props) => {
  const [tempFilters, setTempFilters] =
    useState<SupplierVerificationFilters>(defaultFilters);
  const [debouncedFilters, setDebouncedFilters] =
    useState<SupplierVerificationFilters>(defaultFilters);
  const [modalType, setModalType] = useState<"view" | "edit" | "update" | null>(null);
  const [selectedVerificationId, setSelectedVerificationId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(tempFilters);
    }, 300);

    return () => clearTimeout(timeout);
  }, [tempFilters]);

  const {
    data: supplierVerifications,
    isLoading: isSupplierVerificationsLoading,
    error: isSupplierVerificationsError,
  } = useGetSupplierVerifications(debouncedFilters);

  const fetchedData = supplierVerifications?.data?.rows ?? [];
  const totalPages = supplierVerifications?.data?.totalPages;
  const page = supplierVerifications?.data?.page;
  const totalItems = supplierVerifications?.data?.count;
  const limit = supplierVerifications?.data?.limit;

  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!fetchedData.length) return [];

    let data = [...fetchedData];

    if (query) {
      const q = query.toLowerCase();
      data = data.filter(
        (item) =>
          item.reference.toLowerCase().includes(q) ||
          item.supplier.name.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q),
      );
    }

    return data;
  }, [query, fetchedData]);

  const startIndex = (page! - 1) * limit!;
  const endIndex = Math.min(startIndex + limit!, filteredData.length);

  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleApply = () => {
    setDebouncedFilters(tempFilters);
  };

  const handleClear = () => {
    setTempFilters(defaultFilters);
    setDebouncedFilters(defaultFilters);
  };

  const isFiltered =
    !!tempFilters.reference ||
    !!tempFilters.status ||
    tempFilters.merchantId !== undefined ||
    tempFilters.assignedAdminId !== undefined;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Supplier Verifications</h1>
        </div>
      </div>

      <Card className="shadow-none! border border-(--table-border) mb-4 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2">
          <Input
            element="input"
            input_type="text"
            value={tempFilters.merchantId!}
            name="merchantId"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                merchantId: Number(e.target.value),
              }))
            }
            tag="Merchant ID"
            placeholder="Merchant ID"
            genStyle="my-0! mt-3!"
          />
          <Input
            element="input"
            input_type="text"
            value={tempFilters.reference!}
            name="reference"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, reference: e.target.value }))
            }
            tag="Reference"
            placeholder="Reference"
            genStyle="my-0! mt-3!"
          />
          <Input
            element="select"
            value={tempFilters.status}
            name="status"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, status: e.target.value }))
            }
            selectOptions={SUPPLIER_VERIFICATION_STATUS_OPTIONS.map((val) => ({
              label: val.replace(/_/g, " "),
              value: val,
            }))}
            tag="Verification Status"
            placeholder="All Statuses"
            genStyle="my-0! mt-3!"
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
        aria-label="Admin verifications"
        // pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        title="Verifications"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Reference</TableColumn>
            <TableColumn>Merchant ID</TableColumn>
            <TableColumn>Amount Paid</TableColumn>
            <TableColumn>Supplier Name</TableColumn>
            <TableColumn>Scores</TableColumn>
            <TableColumn>Attachments</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isSupplierVerificationsLoading}
          emptyContent={
            <div className="min-h-50 flex justify-center items-center flex-col gap-4 text-center">
              <LuSearchX size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No Supplier Verifications</h2>
                <p>There are currently no supplier verifications pending</p>
              </div>
            </div>
          }
        >
          {paginatedData.map((verification) => (
            <TableRow key={verification.id} className="bg-(--surface)">
              <TableCell>{verification.id}</TableCell>
              <TableCell>{verification.reference}</TableCell>
              <TableCell>{verification.merchantId}</TableCell>
              <TableCell>
                &#8358;{verification.feePaidNaira.toLocaleString()}
              </TableCell>
              <TableCell>{verification.supplier.name}</TableCell>
              <TableCell>{verification.scores?.total}</TableCell>
              <TableCell>
                <img
                  src={verification.attachments?.[0]?.url ?? "-"}
                  alt={`Attachment for ${verification.reference}`}
                  className="w-16 h-16 object-cover rounded"
                />
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    supplierVerificationStatusPillClass(verification.status),
                  )}
                >
                  {(verification.status ?? "—").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    {
                      label: "View",
                      onClick: () => {
                        setSelectedVerificationId(verification.id);
                        setModalType("view");
                      },
                    },
                    {
                      label: "Edit",
                      onClick: () => {
                        setSelectedVerificationId(verification.id);
                        setModalType("edit");
                      },
                    },
                    // {
                    //   label: "Update Findings",
                    //   onClick: () => {
                    //     setSelectedVerificationId(verification.id);
                    //     setModalType("update");
                    //   },
                    // },
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
        onPageChange={(page) => setDebouncedFilters((f) => ({ ...f, page }))}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="verifications"
      />

      {selectedVerificationId && modalType === "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedVerificationId(null)}
          title="Verification Details"
        >
          <ViewVerification verificationId={selectedVerificationId} />
        </MyModal>
      )}

      {selectedVerificationId && modalType === "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedVerificationId(null)}
          title="Edit Verification"
        >
          <EditVerification
            verificationId={selectedVerificationId}
            onSuccess={() => setSelectedVerificationId(null)}
          />
        </MyModal>
      )}

      {selectedVerificationId && modalType === "update" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedVerificationId(null)}
          title="Update Findings"
        >
          <UpdateFindings verificationId={selectedVerificationId} />
        </MyModal>
      )}
    </>
  );
}

export default SupplierVerifications