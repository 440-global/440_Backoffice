"use client";

import { useState } from "react";
import { useGetFinanceRecords } from "@/api/finance";
import { Badge, Button, Card } from "@/components/ui";
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
import {
  FinanceRecord,
  FinanceCategory,
  FinanceStatus,
  FinanceSourceType,
  FinanceFlowDirection,
  FinanceFlowType,
} from "@/types/types";
import { RiSearchLine, RiFilterLine, RiCloseLine, RiFileList3Fill } from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_BADGE: Record<
  string,
  "success" | "warning" | "danger" | "secondary" | "primary"
> = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "danger",
  REFUNDED: "secondary",
  PARTIALLY_REFUNDED: "warning",
};

const CATEGORIES: { label: string; value: FinanceCategory }[] = [
  { label: "SIM / VPN", value: "SIM_VPN" },
  { label: "Hotel", value: "HOTEL" },
  { label: "Flight", value: "FLIGHT" },
  { label: "Item Purchased", value: "ITEM_PURCHASED" },
  { label: "RFQ Order", value: "RFQ_ORDER" },
];

const STATUSES: { label: string; value: FinanceStatus }[] = [
  { label: "Success", value: "SUCCESS" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
  { label: "Partially Refunded", value: "PARTIALLY_REFUNDED" },
];

const METHODS = ["wallet", "paystack", "card", "bank_transfer"];
const SOURCE_TYPES: FinanceSourceType[] = ["CHECKOUT", "SERVICE_ORDER", "RFQ_ORDER"];
const FLOW_DIRECTIONS: FinanceFlowDirection[] = ["INFLOW", "OUTFLOW"];
const FLOW_TYPES: FinanceFlowType[] = [
  "DEPOSIT_FROM_CUSTOMER",
  "POST_DEPOSIT_PAYMENT",
  "INTER_COMPANY",
  "REFUND",
  "INC",
  "PAYMENT_FOR_GOODS_SERVICES",
];

type Filters = {
  search: string;
  category: FinanceCategory | "";
  status: FinanceStatus | "";
  paymentMethod: string;
  sourceType: FinanceSourceType | "";
  flowDirection: FinanceFlowDirection | "";
  flowType: FinanceFlowType | "";
  startDate: string;
  endDate: string;
};

const defaultFilters: Filters = {
  search: "",
  category: "",
  status: "",
  paymentMethod: "",
  sourceType: "",
  flowDirection: "",
  flowType: "",
  startDate: "",
  endDate: "",
};

export default function FinanceRecordsPage() {
  const [draft, setDraft] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);

  const params = {
    ...(applied.search ? { search: applied.search } : {}),
    ...(applied.category ? { category: applied.category } : {}),
    ...(applied.status ? { status: applied.status } : {}),
    ...(applied.paymentMethod ? { paymentMethod: applied.paymentMethod } : {}),
    ...(applied.sourceType ? { sourceType: applied.sourceType } : {}),
    ...(applied.flowDirection ? { flowDirection: applied.flowDirection } : {}),
    ...(applied.flowType ? { flowType: applied.flowType } : {}),
    ...(applied.startDate ? { startDate: applied.startDate } : {}),
    ...(applied.endDate ? { endDate: applied.endDate } : {}),
    page,
    limit,
  };

  const { data: apiData, isPending } = useGetFinanceRecords(params);

  const data = apiData ?? { rows: [], totalPages: 1, total: 0 };

  const rows = data.rows;
  const totalPages = data.totalPages;
  const totalItems = data.total;
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalItems);

  const handleApply = () => {
    setApplied(draft);
    setPage(1);
  };

  const handleClear = () => {
    setDraft(defaultFilters);
    setApplied(defaultFilters);
    setPage(1);
  };

  const isFiltered = Object.values(applied).some(Boolean);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold">Finance Records</h3>
          <p className="text-(--muted) text-sm mt-1">Unified payment ledger</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          className={`shadow-none ${isPending ? "bg-(--elevated) animate-pulse" : "bg-(--primary)"} text-white py-6!`}
        >
          <div
            className={`p-3 w-fit rounded-xl ${isPending ? "bg-(--primary)/50" : "bg-white/50"} mb-2`}
          >
            <RiFileList3Fill />
          </div>
          <h1
            className={`text-sm font-medium ${
              isPending ? "text-(--muted)" : "text-white/90"
            }`}
          >
            Total Records
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isPending ? "—" : totalItems}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-(--primary)/20 mb-2`}>
            <RiFileList3Fill className="text-(--primary)" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>
            Completed Transactions
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isPending
              ? "—"
              : (
                  rows.filter(
                    (record: any) => record.status == "SUCCESS",
                  ).length ?? 0
                ).toLocaleString()}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-red-200 mb-2`}>
            <RiFileList3Fill className="text-red-500" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>
            Pending Transactions
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isPending
              ? "—"
              : (
                  rows.filter(
                    (record: any) => record.status == "PENDING",
                  ).length ?? 0
                ).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-(--card) border border-(--table-border) rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <RiSearchLine className="absolute top-3 left-3 text-(--muted)" />
            <input
              type="text"
              placeholder="Search reference, customer..."
              value={draft.search}
              onChange={(e) =>
                setDraft((p) => ({ ...p, search: e.target.value }))
              }
              className="w-full pl-9 pr-3 py-2 bg-(--background) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
            />
          </div>

          {/* Category */}
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                category: e.target.value as FinanceCategory | "",
              }))
            }
            className="px-3 py-2 bg-(--background) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                status: e.target.value as FinanceStatus | "",
              }))
            }
            className="px-3 py-2 bg-(--background) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Payment method */}
          <select
            value={draft.paymentMethod}
            onChange={(e) =>
              setDraft((p) => ({ ...p, paymentMethod: e.target.value }))
            }
            className="px-3 py-2 bg-(--background) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
          >
            <option value="">All Methods</option>
            {METHODS.map((m) => (
              <option key={m} value={m} className="capitalize">
                {m.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={draft.sourceType}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                sourceType: e.target.value as FinanceSourceType | "",
              }))
            }
            className="px-3 py-2 bg-(--background) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
          >
            <option value="">All Sources</option>
            {SOURCE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={draft.flowDirection}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                flowDirection: e.target.value as FinanceFlowDirection | "",
              }))
            }
            className="px-3 py-2 bg-(--background) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
          >
            <option value="">All Flow Directions</option>
            {FLOW_DIRECTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={draft.flowType}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                flowType: e.target.value as FinanceFlowType | "",
              }))
            }
            className="px-3 py-2 bg-(--background) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
          >
            <option value="">All Flow Types</option>
            {FLOW_TYPES.map((f) => (
              <option key={f} value={f}>
                {f.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) =>
              setDraft((p) => ({ ...p, startDate: e.target.value }))
            }
            className="px-3 py-2 bg-(--background) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
          />
          <span className="text-(--muted) text-sm">to</span>
          <input
            type="date"
            value={draft.endDate}
            onChange={(e) =>
              setDraft((p) => ({ ...p, endDate: e.target.value }))
            }
            className="px-3 py-2 bg-(--background) border border-(--table-border) rounded-lg text-sm focus:outline-(--primary)"
          />

          <div className="flex gap-2 ml-auto">
            {isFiltered && (
              <Button
                onClick={handleClear}
                className="flex items-center gap-1 py-2! px-4! rounded-lg! bg-(--card)! text-(--text)! border border-(--table-border)"
              >
                <RiCloseLine />
                Clear
              </Button>
            )}
            <Button
              primary
              onClick={handleApply}
              className="flex items-center gap-1 py-2! px-4! rounded-lg!"
            >
              <RiFilterLine />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      <Table
        aria-label="Finance Records"
        pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={(s) => {
          setLimit(s);
          setPage(1);
        }}
        title="All Records"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Customer</TableColumn>
            <TableColumn>Category</TableColumn>
            <TableColumn>Description</TableColumn>
            <TableColumn>Amount</TableColumn>
            <TableColumn>Method</TableColumn>
            <TableColumn>Flow</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Date</TableColumn>
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
                  <p className="text-xs text-(--muted)">
                    {record.customerEmail}
                  </p>
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
                {record.paymentMethod !== null &&
                  record?.paymentMethod?.replace("_", " ")}
              </TableCell>
              <TableCell className="text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{record.flowDirection}</span>
                  <span className="text-(--muted)">{record.flowType}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE[record.status] ?? "primary"}>
                  {record.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap text-(--muted)">
                {new Date(record.createdAt).toLocaleDateString("en-NG", {
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
        itemLabel="records"
      />

      {/* Detail Modal */}
      {selectedRecord && (
        <MyModal
          isOpen
          onClose={() => setSelectedRecord(null)}
          title="Transaction Detail"
        >
          <FinanceRecordModal record={selectedRecord} />
        </MyModal>
      )}
    </>
  );
}
