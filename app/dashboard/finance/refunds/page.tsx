"use client";

import { useState } from "react";
import { useGetRefunds } from "@/api/finance";
import { Badge, Button } from "@/components/ui";
import DemoBanner from "@/components/finance/DemoBanner";
import { DEMO_REFUNDS } from "@/lib/finance-demo";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import MyModal from "@/components/dashboard/Modal";
import FinanceRecordModal from "@/components/finance/FinanceRecordModal";
import { FinanceRecord } from "@/types/types";
import { RiCloseLine } from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_BADGE: Record<string, "success" | "warning" | "danger" | "secondary" | "primary"> = {
  REFUNDED: "secondary",
  PARTIALLY_REFUNDED: "warning",
};

export default function RefundsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedDates, setAppliedDates] = useState({ startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);

  const params = {
    ...(appliedDates.startDate ? { startDate: appliedDates.startDate } : {}),
    ...(appliedDates.endDate ? { endDate: appliedDates.endDate } : {}),
    page,
    limit,
  };

  const { data: apiData, isPending } = useGetRefunds(params);

  // Show demo when API hasn't responded, failed, or returned an empty list
  const isDemo = !apiData || apiData.rows.length === 0;
  const data = isDemo ? DEMO_REFUNDS : apiData;

  const rows = data.rows;
  const totalPages = data.totalPages;
  const totalItems = data.total;
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalItems);

  const handleApply = () => {
    setAppliedDates({ startDate, endDate });
    setPage(1);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setAppliedDates({ startDate: "", endDate: "" });
    setPage(1);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold">Refunds</h3>
          <p className="text-(--muted) text-sm mt-1">
            All refunded and partially refunded transactions
          </p>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-(--table-border) bg-(--card) rounded-lg px-3 py-2 text-sm focus:outline-(--primary)"
          />
          <span className="text-(--muted) text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-(--table-border) bg-(--card) rounded-lg px-3 py-2 text-sm focus:outline-(--primary)"
          />
          <Button primary className="py-2! px-4! rounded-lg!" onClick={handleApply}>
            Apply
          </Button>
          {(appliedDates.startDate || appliedDates.endDate) && (
            <Button
              onClick={handleClear}
              className="flex items-center gap-1 py-2! px-4! rounded-lg! bg-(--card)! text-(--text)! border border-(--table-border)"
            >
              <RiCloseLine />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* {isDemo && <DemoBanner />} */}

      <Table
        aria-label="Refunds"
        pageSize={limit}
        pageSizeOptions={[10, 20, 50]}
        onPageSizeChange={(s) => { setLimit(s); setPage(1); }}
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Customer</TableColumn>
            <TableColumn>Category</TableColumn>
            <TableColumn>Description</TableColumn>
            <TableColumn>Amount</TableColumn>
            <TableColumn>Method</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Refund Date</TableColumn>
            <TableColumn></TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isPending && !apiData}>
          {rows.map((record) => (
            <TableRow key={record.id} className="bg-(--card)">
              <TableCell className="text-(--primary) font-semibold">
                #{record.id}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-semibold text-sm">{record.customerName}</p>
                  <p className="text-xs text-(--muted)">{record.customerEmail}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs bg-(--primary)/10 text-(--primary) px-2 py-1 rounded-full font-semibold">
                  {record.category.replace("_", " ")}
                </span>
              </TableCell>
              <TableCell className="text-sm max-w-40 truncate">
                {record.description}
              </TableCell>
              <TableCell className="font-bold whitespace-nowrap">
                {fmt(record.amount)}
              </TableCell>
              <TableCell className="text-sm capitalize">
                {record.paymentMethod.replace("_", " ")}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE[record.status] ?? "secondary"}>
                  {record.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap text-(--muted)">
                {new Date(record.updatedAt).toLocaleDateString("en-NG", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => setSelectedRecord(record)}
                  className="text-xs text-(--primary) font-semibold hover:underline"
                >
                  View
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="refunds"
      />

      {selectedRecord && (
        <MyModal
          isOpen
          onClose={() => setSelectedRecord(null)}
          title="Refund Detail"
        >
          <FinanceRecordModal record={selectedRecord} />
        </MyModal>
      )}
    </>
  );
}
