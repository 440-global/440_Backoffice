"use client";
import { ActionDropdown, Button, Card, Input } from "@/components/ui";
import { ServiceRequestFilters } from "@/types/types";
import React, { useEffect, useMemo, useState } from "react";
import { RiFilterLine, RiFilterOffLine } from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { LuSearchX } from "react-icons/lu";
import MyModal from "@/components/dashboard/Modal";
import { cn } from "@/components/ui/utils";
import { useGetLogisticRequests } from "@/api/logistics";
import { logisticStatusPillClass, paymentOptionPillClass, servicePaymentStatusPillClass } from "@/lib/order-badges";
import ViewLogisticOrder from "@/components/logistics/ViewLogisticOrder";
import UpdateLogisticOrder from "@/components/logistics/UpdateLogisticOrder";
import { useCanCreate, useCanDelete, useCanManage, useCanUpdate, useCanView } from "@/hooks/use-can";

type Props = {};

const defaultFilters: ServiceRequestFilters = {
  serviceType: "logistics",
  paymentOption: null,
  paymentStatus: null,
  status: null,
  page: 1,
  limit: 10,
};

const PAYMENT_OPTIONS = [
  { label: "None", value: "" },
  { label: "Full", value: "full" },
  { label: "In installments", value: "installment" },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: "None", value: "" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Partially paid", value: "partially_paid" },
  { label: "Paid in full", value: "paid_in_full" },
  { label: "Defaulted", value: "defaulted" },
];

const STATUS_OPTIONS = [
  { label: "None", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Processing", value: "processing" },
  { label: "Rejected", value: "rejected" },
  { label: "Canceled", value: "canceled" },
  { label: "Complete", value: "complete" },
  { label: "Close", value: "Close" },
];

const LogisticsPage = (props: Props) => {
  const [filters, setFilters] = useState<ServiceRequestFilters>(defaultFilters);
  const [tempFilters, setTempFilters] =
    useState<ServiceRequestFilters>(defaultFilters);

  const {
    data: logisticData,
    isPending,
    error,
  } = useGetLogisticRequests(filters);

  const [currentID, setCurrentID] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | "update" | null>(null);

  const fetchedData = logisticData?.rows ?? [];
  const totalPages = logisticData?.totalPages;
  const page = logisticData?.page;
  const totalItems = logisticData?.total;
  const limit = logisticData?.limit;

  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!fetchedData.length) return [];

    let data = [...fetchedData];

    if (query) {
      const q = query.toLowerCase();
      data = data.filter(
        (item) =>
          item.fullName.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q),
      );
    }

    return data;
  }, [query, fetchedData]);

  const startIndex = ((page ?? 1) - 1) * (limit ?? 0);
  const endIndex = startIndex + filteredData.length;

  const paginatedData = filteredData;

  const handleApply = () => {
    setFilters(tempFilters);
  };

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
          <h1 className="text-2xl font-bold">Logistics</h1>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-none! border border-(--table-border) mb-4 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2">
          <Input
            element="select"
            input_type="text"
            value={tempFilters.paymentOption!}
            name="paymentOption"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                paymentOption: e.target.value,
              }))
            }
            tag="Payment Options"
            placeholder="Select payment option"
            genStyle="my-0! mt-3!"
            selectOptions={PAYMENT_OPTIONS}
          />
          <Input
            element="select"
            input_type="text"
            value={tempFilters.paymentStatus!}
            name="paymentStatus"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                paymentStatus: e.target.value,
              }))
            }
            tag="Payment Status"
            placeholder="Select payment status"
            genStyle="my-0! mt-3!"
            selectOptions={PAYMENT_STATUS_OPTIONS}
          />
          <Input
            element="select"
            input_type="text"
            value={tempFilters.status!}
            name="status"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                status: e.target.value,
              }))
            }
            tag="Status"
            placeholder="Select status"
            genStyle="my-0! mt-3!"
            selectOptions={STATUS_OPTIONS}
          />

          <div className="flex flex-wrap gap-2 justify-end items-end">
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

      {/* Table */}
      <Table
        aria-label="Admin verifications"
        // pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        title="Logistic Requests"
        customFilter={
          <Input
            element="input"
            name="query"
            value={query}
            handler={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or ID"
            genStyle="my-0!"
          />
        }
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>User ID</TableColumn>
            <TableColumn>Service ID</TableColumn>
            <TableColumn>Full Name</TableColumn>
            <TableColumn>Phone</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Payment Option</TableColumn>
            <TableColumn>Payment Status</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isPending}
          emptyContent={
            <div className="min-h-50 flex justify-center items-center flex-col gap-4 text-center">
              <LuSearchX size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No Logistics</h2>
                <p>
                  There are currently no data. Please change the filters and try
                  again
                </p>
              </div>
            </div>
          }
        >
          {paginatedData.map((log) => (
            <TableRow key={log.id} className="bg-(--surface)">
              <TableCell>{log.id}</TableCell>
              <TableCell>{log.userId}</TableCell>
              <TableCell>
                {log.serviceId == null ? (
                  <span className="text-(--muted) text-xs">Not included</span>
                ) : (
                  log.serviceId
                )}
              </TableCell>
              <TableCell>{log.fullName}</TableCell>
              <TableCell>{log.phone}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    logisticStatusPillClass(log.status),
                  )}
                >
                  {(log.status ?? "none").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    paymentOptionPillClass(log.paymentOption),
                  )}
                >
                  {(log.paymentOption ?? "none").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    servicePaymentStatusPillClass(log.paymentStatus),
                  )}
                >
                  {(log.paymentStatus ?? "none").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    ...(canView ? [
                      {
                        label: "View",
                        onClick: () => {
                          setCurrentID(log.id);
                          setModalType("view");
                        },
                      },
                    ] : []),
                    ...(canUpdate ? [
                      {
                        label: "Update Status",
                        onClick: () => {
                          setCurrentID(log.id);
                          setModalType("update");
                        },
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
        page={page!}
        totalPages={totalPages!}
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="verifications"
      />

      {currentID && modalType === "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setCurrentID(null)}
          title="Logistic Order Details"
        >
          <ViewLogisticOrder orderId={currentID} />
        </MyModal>
      )}

      {currentID && modalType === "update" && (
        <MyModal
          isOpen={true}
          onClose={() => setCurrentID(null)}
          title="Update Logistic Order"
        >
          <UpdateLogisticOrder
            onSuccess={() => {
              setModalType(null);
              setCurrentID(null);
            }}
            orderId={currentID}
          />
        </MyModal>
      )}
    </>
  );
};

export default LogisticsPage;
