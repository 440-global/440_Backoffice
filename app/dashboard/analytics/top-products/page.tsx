"use client";

import { useGetTopProductsAnalysis } from "@/api/analytics";
import { TopProductChart } from "@/components/analytics/TopProductChart";
import { Button, Card, Input } from "@/components/ui";
import { toISODateTime } from "@/lib/date";
import type { TopProductAnalyticsParams } from "@/types/types";
import { useState } from "react";
import { RiFilterLine, RiFilterOffLine, RiLoader5Line } from "react-icons/ri";

const defaultFilters: TopProductAnalyticsParams = {
  metric: "views",
  from: "",
  to: "",
  limit: 20,
};

export default function TopProductsPage() {
  const [tempFilters, setTempFilters] = useState(defaultFilters);
  const [filters, setFilters] = useState(defaultFilters);

  const params: TopProductAnalyticsParams = {
    ...(filters.from ? { from: toISODateTime(filters.from) } : {}),
    ...(filters.to ? { to: toISODateTime(filters.to) } : {}),
    ...(filters.metric ? { metric: filters.metric } : {}),
    ...(filters.limit ? { limit: filters.limit } : {}),
  };

  const { data, isPending, error } = useGetTopProductsAnalysis(params);
  const rows = Array.isArray((data as { data?: unknown[] } | undefined)?.data)
    ? ((data as { data: unknown[] }).data ?? [])
    : Array.isArray(data)
      ? data
      : [];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold">Product Analytics</h3>
      </div>

      <Card className="shadow-none! border border-(--table-border) mb-4 space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            element="select"
            value={tempFilters.metric!}
            name="metric"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                metric: e.target.value as TopProductAnalyticsParams["metric"],
              }))
            }
            tag="Metric"
            genStyle="my-0! mt-3! mb-1!"
            selectOptions={[
              { label: "Views", value: "views" },
              { label: "Saves", value: "saves" },
              { label: "Orders", value: "orders" },
            ]}
          />
          <Input
            element="input"
            input_type="date"
            value={tempFilters.from!}
            name="from"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, from: e.target.value }))
            }
            tag="Start date"
            genStyle="my-0! mt-3! mb-1!"
          />
          <Input
            element="input"
            input_type="date"
            value={tempFilters.to!}
            name="to"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, to: e.target.value }))
            }
            tag="End date"
            genStyle="my-0! mt-3! mb-1!"
          />
          <div className="flex flex-wrap items-end justify-end gap-2">
            <Button
              onClick={() => {
                setTempFilters(defaultFilters);
                setFilters(defaultFilters);
              }}
              className="flex items-center gap-1 rounded-lg! bg-red-500 py-2! px-4!"
            >
              <RiFilterOffLine />
              Clear
            </Button>
            <Button
              primary
              onClick={() => setFilters(tempFilters)}
              className="flex items-center gap-1 rounded-lg! py-2! px-4!"
            >
              <RiFilterLine />
              Apply filters
            </Button>
          </div>
        </div>
      </Card>

      {/* <Card className="border border-(--table-border) p-4 shadow-none!">
        {isPending ? (
          <div className="flex min-h-50 items-center justify-center">
            <RiLoader5Line className="animate-spin text-4xl text-(--primary)" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">Could not load product analytics.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-(--muted)">No product analytics for this filter.</p>
        ) : (
          <pre className="overflow-x-auto rounded-lg bg-(--background) p-3 text-xs">
            {JSON.stringify(rows, null, 2)}
          </pre>
        )}
      </Card> */}
      <Card className="border border-(--table-border) p-4 shadow-none!">
        <p className="font-bold text-lg mb-4">Top Products</p>
        {isPending ? (
          <div className="flex min-h-75 items-center justify-center">
            <RiLoader5Line className="animate-spin text-4xl text-(--primary)" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">Could not load funnel data.</p>
        ) : (
          <TopProductChart data={rows} />
        )}
      </Card>
    </>
  );
}
