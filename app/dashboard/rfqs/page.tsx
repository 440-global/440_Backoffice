"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionDropdown, Button } from "@/components/ui";
import { TablePagination } from "@/components/ui/table/TableWrapper";
import { useGetAdminRfqs, useGetAdminRfqSummary } from "@/api/rfqs";
import type { RfqWorkflowState } from "@/types/types";
import {
  RFQ_WORKFLOW_CLASS,
  fmtRfqMoney,
  fmtRfqSubmissionDate,
  rfqContact,
  rfqCurrency,
  rfqDisplayId,
  rfqProductLineCount,
  rfqStatusLabel,
  rfqWorkflow,
} from "@/lib/rfq-display";
import { RiCloseLine, RiEdit2Line, RiEye2Line, RiFilterLine } from "react-icons/ri";
import MyModal from "@/components/dashboard/Modal";
import EditRfq from "@/components/rfqs/EditRfq";

const WORKFLOW_OPTIONS: RfqWorkflowState[] = [
  "PENDING",
  "REVIEWING",
  "QUOTED",
  "APPROVED",
  "AWAITING_PAYMENT",
  "PAID",
  "CONVERTED",
  "CANCELLED",
];

type DraftFilters = {
  workflow: RfqWorkflowState | "";
  search: string;
  fromDate: string;
  toDate: string;
};

const defaultDraft: DraftFilters = {
  workflow: "",
  search: "",
  fromDate: "",
  toDate: "",
};

/** KPI + table shell from `Quotations/Lists.tsx`, wired to admin RFQ APIs */
export default function RfqsPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftFilters>(defaultDraft);
  const [applied, setApplied] = useState<DraftFilters>(defaultDraft);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [editRfqId, setEditRfqId] = useState<number | null>(null);

  const queryParams = useMemo(
    () => ({
      ...(applied.workflow ? { workflow: applied.workflow } : {}),
      ...(applied.search.trim() ? { search: applied.search.trim() } : {}),
      ...(applied.fromDate ? { fromDate: `${applied.fromDate}T00:00:00.000Z` } : {}),
      ...(applied.toDate ? { toDate: `${applied.toDate}T23:59:59.999Z` } : {}),
      page,
      limit,
    }),
    [applied, page, limit]
  );

  const { data: summary, isPending: summaryPending } = useGetAdminRfqSummary();
  const { data, isPending, isError, error } = useGetAdminRfqs(queryParams);

  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;
  const startIndex = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalItems);
  const isFiltered =
    !!applied.workflow || !!applied.search.trim() || !!applied.fromDate || !!applied.toDate;

  return (
    <div className="flex min-h-min flex-col">
      <main className="grow">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-(--text)">
              Request for Quotation (RFQ) Dashboard
            </h2>
            <p className="mt-1 text-sm text-(--muted)">
              Manage and track all RFQs efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div
              className={`rounded-xl border border-(--table-border) p-6 shadow-sm ${
                summaryPending
                  ? "bg-(--elevated) animate-pulse"
                  : "bg-(--primary) text-white"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  summaryPending ? "text-(--muted)" : "text-white/90"
                }`}
              >
                Total Requests
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {summaryPending ? "—" : (summary?.total ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-(--table-border) bg-(--card) p-6 shadow-sm">
              <p className="text-sm font-medium text-(--muted)">
                Pending Requests
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-(--text)">
                {summaryPending
                  ? "—"
                  : (summary?.pending ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-(--table-border) bg-(--card) p-6 shadow-sm">
              <p className="text-sm font-medium text-(--muted)">
                Completed Requests
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-(--text)">
                {summaryPending
                  ? "—"
                  : (summary?.completed ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {!summaryPending && summary != null && (
            <p className="text-xs text-(--muted) mb-4">
              Cancelled (excluded from pending):{" "}
              <span className="font-semibold text-(--text)">
                {(summary.cancelled ?? 0).toLocaleString()}
              </span>
            </p>
          )}

          <div className="mb-4 rounded-xl border border-(--table-border) bg-(--card) p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={draft.workflow}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    workflow: e.target.value as RfqWorkflowState | "",
                  }))
                }
                className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm text-(--text)"
              >
                <option value="">All workflow states</option>
                {WORKFLOW_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={draft.fromDate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, fromDate: e.target.value }))
                }
                className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm text-(--text)"
              />
              <input
                type="date"
                value={draft.toDate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, toDate: e.target.value }))
                }
                className="px-3 py-2 rounded-lg border border-(--table-border) bg-(--background) text-sm text-(--text)"
              />
              <div className="flex justify-end items-end gap-2 mt-3">
                {isFiltered && (
                  <Button
                    onClick={() => {
                      setDraft(defaultDraft);
                      setApplied(defaultDraft);
                      setPage(1);
                    }}
                    className="py-2! px-4! rounded-lg! bg-(--card)! text-(--text)! border border-(--table-border)"
                  >
                    <RiCloseLine />
                    Clear
                  </Button>
                )}
                <Button
                  primary
                  onClick={() => {
                    setApplied(draft);
                    setPage(1);
                  }}
                  className="py-2! px-4! rounded-lg! flex items-center gap-1"
                >
                  <RiFilterLine />
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          {isError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 p-4 text-sm">
              {(
                (error as { message?: string } | undefined)?.message ??
                "Could not fetch RFQs."
              ).toString()}
            </div>
          )}

          <div className="rounded-xl border border-(--table-border) bg-(--card) shadow-sm overflow-hidden">
            <div className="p-6 border-b border-(--table-border)">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h3 className="text-lg font-semibold text-(--text)">
                  All RFQs
                </h3>
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-(--muted)"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border border-(--table-border) rounded-lg leading-5 bg-(--background) text-(--text) placeholder:text-(--muted) focus:outline-none focus:ring-1 focus:ring-(--primary) focus:border-(--primary) sm:text-sm"
                    placeholder="Search by ID, Client, or Date"
                    type="text"
                    value={draft.search}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, search: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setApplied(draft);
                        setPage(1);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-(--table-border)">
                <thead className="bg-(--elevated)">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-(--muted) uppercase tracking-wider"
                      scope="col"
                    >
                      RFQ ID
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-(--muted) uppercase tracking-wider"
                      scope="col"
                    >
                      Client Name
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-(--muted) uppercase tracking-wider"
                      scope="col"
                    >
                      Submission Date
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-(--muted) uppercase tracking-wider"
                      scope="col"
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-(--muted) uppercase tracking-wider"
                      scope="col"
                    >
                      Lines
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-(--muted) uppercase tracking-wider"
                      scope="col"
                    >
                      Quoted
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-(--muted) uppercase tracking-wider"
                      scope="col"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-(--card) divide-y divide-(--table-border)">
                  {isPending && !data ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-(--muted)"
                      >
                        Loading…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-(--muted)"
                      >
                        No RFQ orders for this filter.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const contact = rfqContact(row);
                      const wf = rfqWorkflow(row);
                      const lineCount = rfqProductLineCount(row);
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-(--elevatedHover) transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-(--text)">
                            {rfqDisplayId(row)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-(--medium-grey)">
                            {contact.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-(--muted)">
                            {new Date(
                              fmtRfqSubmissionDate(row.createdAt),
                            ).toDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium lowercase ${
                                RFQ_WORKFLOW_CLASS[wf] ??
                                "bg-(--elevated) text-(--text) border border-(--table-border)"
                              }`}
                            >
                              {rfqStatusLabel(row)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-(--medium-grey) tabular-nums">
                            {lineCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-(--medium-grey)">
                            {row.quotedAmount != null
                              ? fmtRfqMoney(row.quotedAmount, rfqCurrency(row))
                              : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <ActionDropdown
                              actions={[
                                {
                                  label: "View",
                                  icon: <RiEye2Line />,
                                  onClick: () => router.push(`/dashboard/rfqs/detail?id=${row.id}`),
                                  primary: true,
                                },
                                {
                                  label: "Edit",
                                  icon: <RiEdit2Line />,
                                  onClick: () => setEditRfqId(row.id),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-(--table-border) px-4 py-2 flex flex-wrap items-center justify-between gap-3 bg-(--table-border)">
              <div className="flex items-center gap-2 text-sm text-(--muted)">
                <span>Rows per page</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-md border border-(--table-border) bg-(--background) px-2 py-1 text-sm text-(--text)"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <TablePagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
                itemLabel="rfq orders"
              />
            </div>
          </div>
        </div>
      </main>

      {editRfqId && (
        <MyModal
          isOpen={true}
          onClose={() => setEditRfqId(null)}
          title="Edit RFQ"
        >
          <EditRfq rfqOrderId={editRfqId} onClose={() => setEditRfqId(null)} />
        </MyModal>
      )}
    </div>
  );
}
