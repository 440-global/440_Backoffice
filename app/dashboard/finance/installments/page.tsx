"use client";

import { useState } from "react";
import { useGetInstallments } from "@/api/finance";
import { Badge, Card, Button } from "@/components/ui";
import DemoBanner from "@/components/finance/DemoBanner";
import { DEMO_INSTALLMENTS } from "@/lib/finance-demo";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { InstallmentStatus } from "@/types/types";
import {
  RiAlarmWarningFill,
  RiTimeLine,
  RiCloseLine,
} from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_TABS: { label: string; value: InstallmentStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
];

const STATUS_BADGE: Record<InstallmentStatus, "success" | "warning" | "danger"> = {
  PAID: "success",
  PENDING: "warning",
  OVERDUE: "danger",
};

export default function InstallmentsPage() {
  const [activeStatus, setActiveStatus] = useState<InstallmentStatus | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedDates, setAppliedDates] = useState({ startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const params = {
    ...(activeStatus ? { status: activeStatus } : {}),
    ...(appliedDates.startDate ? { startDate: appliedDates.startDate } : {}),
    ...(appliedDates.endDate ? { endDate: appliedDates.endDate } : {}),
    page,
    limit,
  };

  const { data: apiData, isPending } = useGetInstallments(params);

  // Show demo when API hasn't responded, failed, or returned an empty list
  const isDemo = !apiData || apiData.rows.length === 0;
  const data = isDemo ? DEMO_INSTALLMENTS : apiData;

  const rows = data.rows;
  const totalPages = data.totalPages;
  const totalItems = data.total;
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalItems);
  const overdueTotal = data.overdueTotal;
  const pendingTotal = data.pendingTotal;

  const handleApplyDates = () => {
    setAppliedDates({ startDate, endDate });
    setPage(1);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    setAppliedDates({ startDate: "", endDate: "" });
    setPage(1);
  };

  const handleStatusChange = (s: InstallmentStatus | "") => {
    setActiveStatus(s);
    setPage(1);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold">Installment Tracker</h3>
          <p className="text-(--muted) text-sm mt-1">
            Monitor payment schedules and overdue collections
          </p>
        </div>
      </div>

      {/* {isDemo && <DemoBanner />} */}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="shadow-none! flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-100 shrink-0">
            <RiAlarmWarningFill size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-(--muted) uppercase mb-1">Total Overdue</p>
            <p className="text-2xl font-bold">{fmt(overdueTotal)}</p>
          </div>
        </Card>

        <Card className="shadow-none! flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 shrink-0">
            <RiTimeLine size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-(--muted) uppercase mb-1">Total Pending</p>
            <p className="text-2xl font-bold">{fmt(pendingTotal)}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Status tabs */}
        <div className="flex gap-1 bg-(--card) border border-(--table-border) p-1 rounded-xl">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeStatus === tab.value
                  ? "bg-(--primary) text-white"
                  : "text-(--muted) hover:text-(--text)"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 bg-(--card) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
        />
        <span className="text-(--muted) text-sm">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 bg-(--card) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
        />
        <Button primary onClick={handleApplyDates} className="py-2! px-4! rounded-lg!">
          Apply
        </Button>
        {(appliedDates.startDate || appliedDates.endDate) && (
          <Button
            onClick={handleClearDates}
            className="flex items-center gap-1 py-2! px-4! rounded-lg! bg-(--card)! text-(--text)! border border-(--table-border)"
          >
            <RiCloseLine /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Table
        aria-label="Installments"
        pageSize={limit}
        pageSizeOptions={[10, 20, 50]}
        onPageSizeChange={(s) => { setLimit(s); setPage(1); }}
        title="All Installments"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Order</TableColumn>
            <TableColumn>Customer</TableColumn>
            <TableColumn>Seq.</TableColumn>
            <TableColumn>Due Date</TableColumn>
            <TableColumn>Amount</TableColumn>
            <TableColumn>Interest</TableColumn>
            <TableColumn>Penalty</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Paid At</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isPending && !apiData}>
          {rows.map((inst) => {
            const merchant = inst.btobOrder?.checkout?.merchant;
            return (
              <TableRow key={inst.id} className="bg-(--card)">
                <TableCell className="text-(--primary) font-semibold">
                  #{inst.id}
                </TableCell>
                <TableCell className="font-semibold">
                  #{inst.orderId}
                </TableCell>
                <TableCell>
                  {merchant ? (
                    <div>
                      <p className="font-semibold text-sm">{merchant.name}</p>
                      <p className="text-xs text-(--muted)">{merchant.shop_name}</p>
                    </div>
                  ) : (
                    <span className="text-(--muted)">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{inst.sequence}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(inst.dueDate).toLocaleDateString("en-NG", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="font-bold whitespace-nowrap">
                  {fmt(inst.amount)}
                </TableCell>
                <TableCell className="text-sm text-amber-600">
                  {inst.interest > 0 ? fmt(inst.interest) : "—"}
                </TableCell>
                <TableCell className="text-sm text-red-500">
                  {inst.penalty > 0 ? fmt(inst.penalty) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[inst.status]}>
                    {inst.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-(--muted) whitespace-nowrap">
                  {inst.paidAt
                    ? new Date(inst.paidAt).toLocaleDateString("en-NG", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="installments"
      />
    </>
  );
}
