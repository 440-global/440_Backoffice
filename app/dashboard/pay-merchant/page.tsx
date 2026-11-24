"use client";
import { PayMerchantParams, PayMerchantStatus } from '@/types/types';
import { ActionDropdown, Button, Card, Input } from "@/components/ui";
import React, { useEffect, useMemo, useState } from 'react'
import { RiFilterLine, RiFilterOffLine } from 'react-icons/ri';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TablePagination, TableRow } from '@/components/ui/table/TableWrapper';
import { LuSearchX } from 'react-icons/lu';
import MyModal from '@/components/dashboard/Modal';
import { transactionStatusPillClass } from '@/lib/order-badges';
import { cn } from '@/components/ui/utils';
import { useGetTransactions } from '@/api/pay-merchant';
import ViewTransaction from '@/components/pay-merchant/ViewTransaction';
import EditTransaction from '@/components/pay-merchant/EditTransaction';
import { useCanCreate, useCanDelete, useCanManage, useCanUpdate, useCanView } from '@/hooks/use-can';

type Props = {}

const PAY_MERCHANT_OPTIONS = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "PROCESSING",
  "CANCELLED",
  "FAILED",
  "COMPLETED",
  "REJECTED",
  "REFUNDED"
];

const CURRENCY_OPTIONS = ["USD", "CNY"];

type PayMerchantFilters = {
  status?: PayMerchantStatus;
  currency?: "USD" | "CNY";
  merchantId?: number | "";
};

const defaultFilters: PayMerchantFilters = {
  status: "SUBMITTED",
  currency: "USD",
  merchantId: undefined
};

const PayMerchant = (props: Props) => {
  const [debouncedFilters, setDebouncedFilters] = useState<PayMerchantFilters>(defaultFilters);
  const [tempFilters, setTempFilters] = useState<PayMerchantFilters>(defaultFilters);
  const [modalType, setModalType] = useState<"view" | "edit" | "update" | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(tempFilters);
    }, 300);

    return () => clearTimeout(timeout);
  }, [tempFilters]);

  const { 
    data: transactionData, 
    isPending: isTransactionsPending, 
    error: isTransactionsError 
  } = useGetTransactions(debouncedFilters as PayMerchantParams);

  const fetchedData = transactionData?.data ?? [];
  const totalPages = transactionData?.meta?.totalPages;
  const page = transactionData?.meta?.page;
  const totalItems = transactionData?.meta?.total;
  const limit = transactionData?.meta?.limit;

  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!fetchedData.length) return [];

    let data = [...fetchedData];

    if (query) {
      const q = query.toLowerCase();

      data = data.filter(
        (item) =>
          item.reference.toLowerCase().includes(q) ||
          // item.supplier.name.toLowerCase().includes(q) ||
          // item.productDetails.description.toLowerCase().includes(q) ||
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
    !!tempFilters.status ||
    !tempFilters.merchantId;


  // Permissions
  const canView = useCanView("services");
  const canUpdate = useCanUpdate("services");

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pay Merchant</h1>
        </div>
      </div>

      <Card className="shadow-none! border border-(--table-border) mb-4 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2">
          <Input
            element="select"
            value={tempFilters.currency!}
            name="currency"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, currency: e.target.value }))
            }
            tag="Currency"
            placeholder="Currency"
            genStyle="my-0! mt-3!"
            selectOptions={CURRENCY_OPTIONS.map((currency) => ({
              label: currency,
              value: currency,
            }))}
          />
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
            element="select"
            value={tempFilters.status!}
            name="status"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, status: e.target.value }))
            }
            selectOptions={PAY_MERCHANT_OPTIONS.map((val) => ({
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
        title='All Transactions'
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Reference</TableColumn>
            <TableColumn>Merchant ID</TableColumn>
            <TableColumn>Currency</TableColumn>
            <TableColumn>Amount Foreign</TableColumn>
            <TableColumn>Amount (&#8358;)</TableColumn>
            <TableColumn>Total Amount (&#8358;)</TableColumn>
            <TableColumn>Supplier Name</TableColumn>
            <TableColumn>Attachments</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isTransactionsPending}
          emptyContent={
            <div className="min-h-50 flex justify-center items-center flex-col gap-4 text-center">
              <LuSearchX size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No Transactions</h2>
                <p>
                  There are currently no transactions under these settings.
                  Please adjust the filters to get results
                </p>
              </div>
            </div>
          }
        >
          {paginatedData.map((transaction) => (
            <TableRow key={transaction.id} className="bg-(--surface)">
              <TableCell>{transaction.id}</TableCell>
              <TableCell>{transaction.reference}</TableCell>
              <TableCell>{transaction.merchantId}</TableCell>
              <TableCell>{transaction.currency}</TableCell>
              <TableCell>
                {transaction.amountForeign.toLocaleString()}
              </TableCell>
              <TableCell>
                &#8358;{transaction.amountNaira.toLocaleString()}
              </TableCell>
              <TableCell>
                &#8358;{transaction.totalPayableNaira.toLocaleString()}
              </TableCell>
              <TableCell>{transaction?.supplier.name || "N/A"}</TableCell>
              <TableCell>
                <img
                  src={transaction.attachments?.[0]?.url ?? "-"}
                  alt={`Attachment for ${transaction.reference}`}
                  className="w-16 h-16 object-cover rounded"
                />
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    transactionStatusPillClass(transaction.status),
                  )}
                >
                  {(transaction.status ?? "—").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    ...(canView ? [
                      {
                        label: "View",
                        onClick: () => {
                          setSelectedTransactionId(transaction.id);
                          setModalType("view");
                        },
                      },
                    ] : []),
                    ...(canUpdate ? [
                      {
                        label: "Edit",
                        onClick: () => {
                          setSelectedTransactionId(transaction.id);
                          setModalType("edit");
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
        onPageChange={(page) => setDebouncedFilters((f) => ({ ...f, page }))}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="transactions"
      />

      {selectedTransactionId && modalType === "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedTransactionId(null)}
          title="transaction Details"
        >
          <ViewTransaction transactionId={selectedTransactionId} />
        </MyModal>
      )}

      {selectedTransactionId && modalType === "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedTransactionId(null)}
          title="Edit transaction"
        >
          <EditTransaction transactionId={selectedTransactionId} />
        </MyModal>
      )}
    </>
  );
}

export default PayMerchant