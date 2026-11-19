"use client";

import { useGetAnalyticsFunnel } from "@/api/analytics";
import PaymentFunnelChart from "@/components/analytics/PaymentFunnelChart";
import { Button, Card, Input } from "@/components/ui";
import { toISODateTime } from "@/lib/date";
import type { AnalyticsFunnelParams } from "@/types/types";
import { useMemo, useState } from "react";
import { RiFilterLine, RiFilterOffLine, RiLoader5Line } from "react-icons/ri";

const defaultFilters: AnalyticsFunnelParams = {
  steps: "PRODUCT_VIEWED",
  from: "",
  to: "",
};

type FunnelStep = {
  step: string;
  count: number;
  conversion_rate: number | null;
};

function normalizeFunnelSteps(payload: unknown): FunnelStep[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const candidates = [root.data, root.funnel, root.steps, root.payment_funnel, payload];
  for (const c of candidates) {
    if (!Array.isArray(c)) continue;
    return c
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const step = String(row.step ?? row.event_name ?? row.name ?? "");
        const count = Number(row.count ?? row.value ?? 0);
        const rate = row.conversion_rate;
        return {
          step,
          count: Number.isFinite(count) ? count : 0,
          conversion_rate:
            rate == null ? null : Number.isFinite(Number(rate)) ? Number(rate) : null,
        };
      })
      .filter((x): x is FunnelStep => !!x?.step);
  }
  return [];
}

export default function FunnelsPage() {
  const [tempFilters, setTempFilters] = useState(defaultFilters);
  const [filters, setFilters] = useState(defaultFilters);

  const params: AnalyticsFunnelParams = {
    ...(filters.steps ? { steps: filters.steps } : {}),
    ...(filters.from ? { from: toISODateTime(filters.from) } : {}),
    ...(filters.to ? { to: toISODateTime(filters.to) } : {}),
  };

  const { data, isPending, error } = useGetAnalyticsFunnel(params);
  const funnelSteps = useMemo(() => normalizeFunnelSteps(data), [data]);

  const handleApply = () => setFilters(tempFilters);
  const handleClear = () => {
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
  };
  
  const stepOptions = [ "PRODUCT_VIEWED", "CART_ITEM_ADDED" , "CHECKOUT_CREATED" , "PAYMENT_INITIATED" , "PAYMENT_COMPLETED"];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold">Conversion Funnel</h3>
      </div>

      <Card className="shadow-none! border border-(--table-border) mb-4 space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            element="select"
            value={tempFilters.steps!}
            name="steps"
            handler={(e) => setTempFilters((f) => ({ ...f, steps: e.target.value }))}
            tag="Funnel steps"
            placeholder="Comma-separated event names"
            genStyle="my-0! mt-3! mb-1!"
            selectOptions={stepOptions.map((opt) => ({
              label: opt.replaceAll("_" ," "),
              value: opt
            }))}
          />
          <Input
            element="input"
            input_type="date"
            value={tempFilters.from!}
            name="from"
            handler={(e) => setTempFilters((f) => ({ ...f, from: e.target.value }))}
            tag="Start date"
            genStyle="my-0! mt-3! mb-1!"
          />
          <Input
            element="input"
            input_type="date"
            value={tempFilters.to!}
            name="to"
            handler={(e) => setTempFilters((f) => ({ ...f, to: e.target.value }))}
            tag="End date"
            genStyle="my-0! mt-3! mb-1!"
          />
          <div className="flex flex-wrap items-end justify-end gap-2">
            <Button
              onClick={handleClear}
              className="flex items-center gap-1 rounded-lg! bg-red-500 py-2! px-4!"
            >
              <RiFilterOffLine />
              Clear
            </Button>
            <Button
              primary
              onClick={handleApply}
              className="flex items-center gap-1 rounded-lg! py-2! px-4!"
            >
              <RiFilterLine />
              Apply filters
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border border-(--table-border) p-4 shadow-none!">
        <p className="mb-4 text-lg font-bold">Funnel chart</p>
        {isPending ? (
          <div className="flex min-h-75 items-center justify-center">
            <RiLoader5Line className="animate-spin text-4xl text-(--primary)" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">Could not load funnel data.</p>
        ) : funnelSteps.length === 0 ? (
          <p className="text-sm text-(--muted)">No funnel data for this filter.</p>
        ) : (
          <PaymentFunnelChart data={funnelSteps} />
        )}
      </Card>
    </>
  );
}
