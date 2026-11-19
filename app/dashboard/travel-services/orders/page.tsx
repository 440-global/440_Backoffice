"use client";

import { useServiceOrders } from "@/api/travel";
import ServiceOrderDetailPanel from "@/components/travel/ServiceOrderDetailPanel";
import { Badge, Button } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import type { ServiceOrderStatus, TravelServiceType } from "@/types/travel";
import {
  SERVICE_ORDER_STATUSES,
  TRAVEL_SERVICE_TYPES,
} from "@/types/travel";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "react-icons/ri";

function rowId(row: Record<string, unknown>): string {
  const id = row.id;
  return typeof id === "string" ? id : String(id ?? "");
}

function rowStatus(row: Record<string, unknown>): string {
  const s = row.status;
  return typeof s === "string" ? s : "—";
}

function rowCreated(row: Record<string, unknown>): string {
  const c = row.createdAt;
  if (typeof c === "string") return c;
  return "—";
}

function rowUserName(row: Record<string, unknown>): string {
  const u = row.user;
  if (u && typeof u === "object" && u !== null) {
    const name = (u as Record<string, unknown>).name;
    if (typeof name === "string") return name;
  }
  return "—";
}

function rowServiceLabel(row: Record<string, unknown>): string {
  const s = row.service;
  if (s && typeof s === "object" && s !== null) {
    const o = s as Record<string, unknown>;
    const name = o.name;
    const type = o.type;
    if (typeof name === "string") {
      return typeof type === "string" ? `${name} (${type})` : name;
    }
  }
  return "—";
}

function rowReference(row: Record<string, unknown>): string {
  const r = row.referenceCode;
  return typeof r === "string" ? r : "—";
}

const LIMIT = 20;

function TravelServiceOrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const detailOrderId = searchParams.get("order");

  const openDetail = useCallback(
    (id: string) => {
      router.replace(`${pathname}?order=${encodeURIComponent(id)}`, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  const closeDetail = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TravelServiceType | "">("");
  const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | "">(
    ""
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(startDate.trim() ? { startDate: startDate.trim() } : {}),
      ...(endDate.trim() ? { endDate: endDate.trim() } : {}),
    }),
    [page, typeFilter, statusFilter, startDate, endDate]
  );

  const { data, isPending } = useServiceOrders(params);
  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Service orders</h2>
        <p className="mt-1 text-sm text-(--muted)">
          <Link
            href="/dashboard/travel-services"
            className="text-sky-600 underline underline-offset-2"
          >
            Catalog
          </Link>
          {" · "}
          <Link
            href="/dashboard/travel-services/contacts"
            className="text-sky-600 underline underline-offset-2"
          >
            Contacts
          </Link>
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <select
          value={typeFilter}
          onChange={(e) => {
            setPage(1);
            setTypeFilter(e.target.value as TravelServiceType | "");
          }}
          className="rounded-xl border border-(--table-border) bg-(--card) px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {TRAVEL_SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as ServiceOrderStatus | "");
          }}
          className="rounded-xl border border-(--table-border) bg-(--card) px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {SERVICE_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex flex-col gap-1 text-xs text-(--muted)">
          From
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setPage(1);
              setStartDate(e.target.value);
            }}
            className="rounded-xl border border-(--table-border) bg-(--card) px-3 py-2 text-sm text-(--foreground)"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-(--muted)">
          To
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setPage(1);
              setEndDate(e.target.value);
            }}
            className="rounded-xl border border-(--table-border) bg-(--card) px-3 py-2 text-sm text-(--foreground)"
          />
        </label>
      </div>

      <Table aria-label="Service orders">
        <TableHeader>
          <TableRow>
            <TableColumn>Reference</TableColumn>
            <TableColumn>Customer</TableColumn>
            <TableColumn>Service</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Created</TableColumn>
            <TableColumn></TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isPending}>
          {rows.map((row, index) => {
            const r = row as Record<string, unknown>;
            const id = rowId(r);
            return (
              <TableRow key={id || `row-${index}`} className="bg-(--card)">
                <TableCell className="font-mono text-sm">
                  {rowReference(r)}
                </TableCell>
                <TableCell>{rowUserName(r)}</TableCell>
                <TableCell className="max-w-50 truncate">
                  {rowServiceLabel(r)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="lowercase">
                    {rowStatus(r)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-(--muted)">
                  {rowCreated(r)}
                </TableCell>
                <TableCell>
                  {id ? (
                    <button
                      type="button"
                      onClick={() => openDetail(id)}
                      className="text-sm text-sky-600 underline underline-offset-2"
                    >
                      View
                    </button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-(--muted)">
        <span>
          Page {data?.page ?? page} of {Math.max(totalPages, 1)} ·{" "}
          {data?.total ?? 0} total
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isPending}
            className="gap-1"
          >
            <RiArrowLeftLine />
            Previous
          </Button>
          <Button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages || totalPages === 0 || isPending}
            className="gap-1"
          >
            Next
            <RiArrowRightLine />
          </Button>
        </div>
      </div>

      <ServiceOrderDetailPanel
        orderId={detailOrderId}
        onClose={closeDetail}
      />
    </>
  );
}

export default function TravelServiceOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-(--muted)">
          Loading orders…
        </div>
      }
    >
      <TravelServiceOrdersContent />
    </Suspense>
  );
}
