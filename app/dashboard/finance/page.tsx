"use client";

import { useState } from "react";
import { useGetFinanceSummary } from "@/api/finance";
import MyModal from "@/components/dashboard/Modal";
import ManualFinanceEntryForm from "@/components/finance/ManualFinanceEntryForm";
import { Card, Button } from "@/components/ui";
import FinanceCategoryChart from "@/components/finance/FinanceCategoryChart";
import { cashFlowMagnitudes } from "@/lib/finance-summary-display";
import Link from "next/link";
import {
  RiMoneyDollarCircleFill,
  RiRefund2Fill,
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
  RiExchangeDollarLine,
  RiFileList3Fill,
  RiCalendarScheduleLine,
  RiLoader4Fill,
} from "react-icons/ri";
import { FinanceCategory, FinanceFlowDirection, FinanceFlowType } from "@/types/types";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-green-200 text-green-700",
  PENDING: "bg-amber-200 text-amber-700",
  FAILED: "bg-red-200 text-red-700",
  REFUNDED: "bg-blue-200 text-blue-700",
  PARTIALLY_REFUNDED: "bg-orange-200 text-orange-700",
};

export default function FinancePage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState<FinanceCategory | "">("");
  const [flowDirection, setFlowDirection] = useState<FinanceFlowDirection | "">("");
  const [flowType, setFlowType] = useState<FinanceFlowType | "">("");
  const [appliedDates, setAppliedDates] = useState<{
    startDate?: string;
    endDate?: string;
    category?: FinanceCategory;
    flowDirection?: FinanceFlowDirection;
    flowType?: FinanceFlowType;
  }>({});

  const { data: summary, isPending } = useGetFinanceSummary(
    Object.keys(appliedDates).length ? appliedDates : undefined
  );
  const cash = cashFlowMagnitudes(summary);

  const [keepRecordOpen, setKeepRecordOpen] = useState(false);

  const handleApply = () => {
    setAppliedDates({
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(category ? { category } : {}),
      ...(flowDirection ? { flowDirection } : {}),
      ...(flowType ? { flowType } : {}),
    });
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setCategory("");
    setFlowDirection("");
    setFlowType("");
    setAppliedDates({});
  };

  return (
    <>
      <MyModal
        isOpen={keepRecordOpen}
        onClose={() => setKeepRecordOpen(false)}
        title="Keep record (manual entry)"
      >
        <ManualFinanceEntryForm compact />
      </MyModal>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-2xl font-bold">Finance Dashboard</h3>
            <p className="text-(--muted) text-sm mt-1">
              Revenue, transactions, and collections overview
            </p>
          </div>
          {isPending && (
            <RiLoader4Fill size={20} className="animate-spin text-(--primary) mt-1 shrink-0" />
          )}
        </div>

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
          {Object.keys(appliedDates).length > 0 && (
            <Button
              className="py-2! px-4! rounded-lg! bg-(--card)! text-(--text)! border border-(--table-border)"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-(--muted) mb-4 max-w-3xl">
        Cash KPIs use absolute magnitudes and recompute <span className="font-semibold">Inflow − Outflow</span>{" "}
        so signed ledger amounts do not flip the net.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-none!">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-100">
              <RiMoneyDollarCircleFill size={20} className="text-green-600" />
            </div>
            <RiArrowUpCircleLine size={16} className="text-green-600" />
          </div>
          <p className="text-xs text-(--muted) uppercase mb-1">Total Inflow</p>
          <p className="text-lg font-bold">{fmt(cash.totalInflow)}</p>
        </Card>

        <Card className="shadow-none!">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-(--primary)/10">
              <RiExchangeDollarLine size={20} className="text-(--primary)" />
            </div>
            <RiArrowDownCircleLine size={16} className="text-(--primary)" />
          </div>
          <p className="text-xs text-(--muted) uppercase mb-1">Total Outflow</p>
          <p className="text-lg font-bold">{fmt(cash.totalOutflow)}</p>
        </Card>

        <Card className="shadow-none!">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <RiRefund2Fill size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-(--muted) uppercase mb-1">Total Refunded</p>
          <p className="text-lg font-bold">{fmt(summary?.totalRefunded ?? 0)}</p>
        </Card>

        <Card className="shadow-none!">
          <p className="text-xs text-(--muted) uppercase mb-1">Inflow − Outflow</p>
          <p className="text-lg font-bold">{fmt(cash.netInMinusOut)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-none!">
          <p className="text-xs text-(--muted) uppercase mb-1">Total Revenue (legacy)</p>
          <p className="text-lg font-bold">{fmt(summary?.totalRevenue ?? 0)}</p>
        </Card>
        <Card className="shadow-none!">
          <p className="text-xs text-(--muted) uppercase mb-1">Net Revenue (legacy)</p>
          <p className="text-lg font-bold">{fmt(summary?.netRevenue ?? 0)}</p>
        </Card>
        <Card className="shadow-none!">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-(--primary)/10">
              <RiFileList3Fill size={20} className="text-(--primary)" />
            </div>
          </div>
          <p className="text-xs text-(--muted) uppercase mb-1">Transactions</p>
          <p className="text-lg font-bold">{(summary?.transactionCount ?? 0).toLocaleString()}</p>
        </Card>
      </div>

      {/* Summary Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as FinanceCategory | "")}
          className="border border-(--table-border) bg-(--card) rounded-lg px-3 py-2 text-sm focus:outline-(--primary)"
        >
          <option value="">All Categories</option>
          <option value="SIM_VPN">SIM / VPN</option>
          <option value="HOTEL">HOTEL</option>
          <option value="FLIGHT">FLIGHT</option>
          <option value="ITEM_PURCHASED">ITEM PURCHASED</option>
          <option value="RFQ_ORDER">RFQ ORDER</option>
        </select>

        <select
          value={flowDirection}
          onChange={(e) => setFlowDirection(e.target.value as FinanceFlowDirection | "")}
          className="border border-(--table-border) bg-(--card) rounded-lg px-3 py-2 text-sm focus:outline-(--primary)"
        >
          <option value="">All Flow Directions</option>
          <option value="INFLOW">INFLOW</option>
          <option value="OUTFLOW">OUTFLOW</option>
        </select>

        <select
          value={flowType}
          onChange={(e) => setFlowType(e.target.value as FinanceFlowType | "")}
          className="border border-(--table-border) bg-(--card) rounded-lg px-3 py-2 text-sm focus:outline-(--primary)"
        >
          <option value="">All Flow Types</option>
          <option value="DEPOSIT_FROM_CUSTOMER">DEPOSIT_FROM_CUSTOMER</option>
          <option value="POST_DEPOSIT_PAYMENT">POST_DEPOSIT_PAYMENT</option>
          <option value="INTER_COMPANY">INTER_COMPANY</option>
          <option value="REFUND">REFUND</option>
          <option value="INC">INC</option>
          <option value="PAYMENT_FOR_GOODS_SERVICES">PAYMENT_FOR_GOODS_SERVICES</option>
        </select>

        <Button primary className="py-2! px-4! rounded-lg!" onClick={handleApply}>
          Apply
        </Button>
        {Object.keys(appliedDates).length > 0 && (
          <Button
            className="py-2! px-4! rounded-lg! bg-(--card)! text-(--text)! border border-(--table-border)"
            onClick={handleClear}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-none!">
          <h4 className="font-bold text-sm uppercase mb-4">Revenue by Category</h4>
          <FinanceCategoryChart data={summary?.byCategory ?? {}} />
        </Card>

        <Card className="shadow-none!">
          <h4 className="font-bold text-sm uppercase mb-4">Breakdown by Status</h4>
          <div className="space-y-4">
            {Object.entries(summary?.byStatus ?? {}).map(([status, stats]) => {
              const txCount = summary?.transactionCount ?? 0;
              const pct = txCount ? Math.round((stats.count / txCount) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {status.replace(/_/g, " ")}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold">{fmt(stats.total)}</span>
                      <span className="text-xs text-(--muted) ml-2">
                        ({stats.count} txns)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-(--table-border) rounded-full overflow-hidden">
                    <div
                      className="h-full bg-(--primary) rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/finance/records">
          <Card className="shadow-none! hover:border-(--primary)/60 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-(--primary)/10 group-hover:bg-(--primary)/20 transition-all">
                <RiFileList3Fill size={24} className="text-(--primary)" />
              </div>
              <div>
                <p className="font-bold">All Records</p>
                <p className="text-sm text-(--muted)">Unified payment ledger</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/finance/installments">
          <Card className="shadow-none! hover:border-(--primary)/60 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100 group-hover:bg-amber-200 transition-all">
                <RiCalendarScheduleLine size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="font-bold">Installments</p>
                <p className="text-sm text-(--muted)">Track payment schedules</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/finance/refunds">
          <Card className="shadow-none! hover:border-(--primary)/60 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-all">
                <RiRefund2Fill size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold">Refunds</p>
                <p className="text-sm text-(--muted)">Refunded transactions only</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <Button
        primary
        type="button"
        onClick={() => setKeepRecordOpen(true)}
        className="fixed bottom-6 right-6 z-40 py-3! px-5! rounded-2xl! shadow-lg shadow-black/10 ring-1 ring-black/5 bg-orange-500! hover:bg-orange-600!"
        aria-label="Keep record — manual finance entry"
      >
        Keep record
      </Button>
    </>
  );
}
