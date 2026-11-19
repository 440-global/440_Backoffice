"use client";

import { useGetAnalyticsOverview } from '@/api/analytics';
import DailyActiveUsersChart from '@/components/analytics/DailyActiveUserChart';
import EventsByCategoryChart from '@/components/analytics/EventCategoryChart';
import PaymentFunnelChart from '@/components/analytics/PaymentFunnelChart';
import { Button, Card, Input } from '@/components/ui';
import { toISODateTime } from '@/lib/date';
import { AnalyticsOverviewParams } from '@/types/types';
import React, { useState } from 'react'
import { RiCalendarEventLine, RiFilterLine, RiFilterOffLine, RiGroup2Fill, RiLayout2Line, RiLoader5Line } from 'react-icons/ri';

type Props = {}

const defaultFilters: AnalyticsOverviewParams = {
  from: "",
  to: "",
  granularity: "month",
};

const AnalyticsPage = (props: Props) => {
  const [modalType, setModalType] = useState<"add" | "view" | "edit" | null>(null);
  const [tempFilters, setTempFilters] = useState<AnalyticsOverviewParams>(defaultFilters);
  const [filters, setFilters] = useState<AnalyticsOverviewParams>(defaultFilters);

  const params: AnalyticsOverviewParams = {
    ...(filters.from ? { from: toISODateTime(filters.from) } : {}),
    ...(filters.to ? { to: toISODateTime(filters.to) } : {}),
    ...(filters.granularity ? { granularity: filters.granularity } : {}),
  };

  const { data: overviewData, isPending: isOverviewPending, error: overviewError } = useGetAnalyticsOverview(params);
  const fetchedData = overviewData;

  const granularOptions = ["day", "week", "month"];
  const isFiltered = !!tempFilters.from || !!tempFilters.to || !!tempFilters.granularity;

  const handleApply = () => {
    setFilters(tempFilters);
  };

  const handleClear = () => {
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
  };
  

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Analytics</h3>
        {/* <Button
          primary
          className="flex items-center gap-1"
          onClick={() => setModalType("add")}
          // disabled={!supplierId}
        >
          <RiAddFill className="font-bold" />
          Add Product
        </Button> */}
      </div>
      <Card className="shadow-none! border border-(--table-border) mb-4 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            element="input"
            input_type="date"
            value={tempFilters.from!}
            name="from"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, from: e.target.value }))
            }
            tag="Start Date"
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
            tag="End Date"
            genStyle="my-0! mt-3! mb-1!"
          />
          <Input
            element="select"
            value={tempFilters.granularity!}
            name="granularity"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, granularity: e.target.value }))
            }
            selectOptions={granularOptions.map((val) => ({
              label: val.toLocaleUpperCase(),
              value: val,
            }))}
            tag="Granularity"
            placeholder="Select time mode"
            genStyle="my-0! mt-3! mb-1!"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <Card
          className={`shadow-none ${isOverviewPending ? "bg-(--primary)/30 animate-pulse" : "bg-(--primary)"} text-white py-6!`}
        >
          <div
            className={`p-3 w-fit rounded-xl ${isOverviewPending ? "bg-(--primary)/50" : "bg-white/50"} mb-2`}
          >
            <RiGroup2Fill />
          </div>
          <h1
            className={`text-sm font-medium ${
              isOverviewPending ? "text-(--muted)" : "text-white/90"
            }`}
          >
            Active Users
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isOverviewPending ? "—" : fetchedData?.active_users}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-(--primary)/20 mb-2`}>
            <RiCalendarEventLine className="text-(--primary)" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>Total Events</h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isOverviewPending ? "—" : overviewData?.total_events}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-(--primary)/20 mb-2`}>
            <RiLayout2Line className="text-(--primary)" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>
            Total Event Categories
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isOverviewPending ? "—" : fetchedData?.events_by_category.length}
          </p>
        </Card>
      </div>
      <Card className="py-6! mt-8 shadow-none!">
        <p className="font-bold text-lg">Category Chart</p>
        <div>
          {isOverviewPending ? (
            <div className="py-6 flex items-center justify-center">
              <RiLoader5Line
                size={24}
                className="text-(--primary) animate-spin"
              />
            </div>
          ) : (
            <EventsByCategoryChart data={fetchedData?.events_by_category!} />
          )}
        </div>
      </Card>
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        <Card className="py-6! mt-8 shadow-none! w-full md:w-[50%]">
          <p className="font-bold text-lg">Daily Active Users</p>
          <div>
            {isOverviewPending ? (
              <div className="py-6 flex items-center justify-center">
                <RiLoader5Line
                  size={24}
                  className="text-(--primary) animate-spin"
                />
              </div>
            ) : (
              <DailyActiveUsersChart data={fetchedData?.daily_active_users!} />
            )}
          </div>
        </Card>
        <Card className="py-6! mt-8 shadow-none! w-full md:w-[50%]">
          <p className="font-bold text-lg">Payment Funnel Chart</p>
          <div>
            {isOverviewPending ? (
              <div className="py-6 flex items-center justify-center">
                <RiLoader5Line
                  size={24}
                  className="text-(--primary) animate-spin"
                />
              </div>
            ) : (
              <PaymentFunnelChart data={fetchedData?.payment_funnel!} />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

export default AnalyticsPage