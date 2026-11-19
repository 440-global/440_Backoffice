"use client"
import { useGetAnalyticsRaw } from '@/api/analytics'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { ActionDropdown, Button, Card, Input } from "@/components/ui";
import { toISODateTime } from '@/lib/date'
import { AnalyticsParams } from '@/types/types'
import React, { useState } from 'react'
import { RiFilterLine, RiFilterOffLine } from 'react-icons/ri'
import { LuSearchX } from 'react-icons/lu';
import { cn } from '@/components/ui/utils';
import { analyticsResourceTypePillClass, analyticsSourcePillClass, eventCategoryPillClass, eventPillClass } from '@/lib/order-badges';

type Props = {}

const defaultFilters: AnalyticsParams = {
  event_name: "",
  event_category: "USER",
  user_id: null,
  resource_type: "product",
  resource_id: "",
  source: "mobile_android",
  from: "",
  to: "",
  page: 1, 
  limit: 50
}

const RawData = (props: Props) => {
  const [tempFilters, setTempFilters] = useState<AnalyticsParams>(defaultFilters);
  const [filters, setFilters] = useState<AnalyticsParams>(defaultFilters);

  const params: AnalyticsParams = {
    ...(filters.event_name ? { event_name: filters.event_name } : {}),
    ...(filters.event_category
      ? { event_category: filters.event_category }
      : {}),
    ...(filters.user_id ? { user_id: filters.user_id } : {}),
    ...(filters.resource_id ? { resource_id: filters.resource_id } : {}),
    ...(filters.resource_type ? { resource_type: filters.resource_type } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.limit ? { limit: filters.limit } : {}),
    ...(filters.from ? { from: toISODateTime(filters.from) } : {}),
    ...(filters.to ? { to: toISODateTime(filters.to) } : {}),
  };

  const {
    data: analytics,
    isPending: isAnalyticsPending,
    error: analyticsError,
  } = useGetAnalyticsRaw(params);

  const fetchedData = analytics?.data ?? [];
  const totalPages = analytics?.meta?.totalPages;
  const page = analytics?.meta?.page;
  const totalItems = analytics?.meta?.total;
  const limit = analytics?.meta?.limit;

  const handleApply = () => {
    setFilters(tempFilters);
  };

  const handleClear = () => {
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  };

  const resourceOptions = ["product", "order", "checkout", "bale", "rfq"];
  const sourceOptions = ["web", "mobile_ios", "mobile_android", "server"];
  const categoryOptions = ["USER", "PRODUCT", "WISHLIST", "CART", "SEARCH", "CHECKOUT", "PAYMENT", "ORDER", "BALE", "RFQ"];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Detailed Analytics</h3>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2">
          <Input
            element="input"
            value={tempFilters.event_name!}
            name="event_name"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, event_name: e.target.value }))
            }
            tag="Event Name"
            placeholder="Enter event name"
            genStyle="my-0! mt-3!"
          />
          <Input
            element="select"
            value={tempFilters.event_category!}
            name="currency"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, event_category: e.target.value }))
            }
            tag="Event Category"
            placeholder="Select event category"
            genStyle="my-0! mt-3!"
            selectOptions={categoryOptions.map((category) => ({
              label: category,
              value: category,
            }))}
          />
          <Input
            element="select"
            value={tempFilters.resource_type!}
            name="resource_type"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, resource_type: e.target.value }))
            }
            tag="Resource Type"
            placeholder="Select resource type"
            genStyle="my-0! mt-3!"
            selectOptions={resourceOptions.map((resource) => ({
              label: resource,
              value: resource,
            }))}
          />
          <Input
            element="input"
            input_type="text"
            value={tempFilters.user_id!}
            name="user_id"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                user_id: Number(e.target.value),
              }))
            }
            tag="User ID"
            placeholder="user ID"
            genStyle="my-0! mt-3!"
          />
          <Input
            element="select"
            value={tempFilters.source!}
            name="source"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, source: e.target.value }))
            }
            selectOptions={sourceOptions.map((val) => ({
              label: val.replace(/_/g, " "),
              value: val,
            }))}
            tag="Verification Status"
            placeholder="All Statuses"
            genStyle="my-0! mt-3!"
          />
          <div className="flex flex-wrap gap-2 justify-end items-end">
            <Button
              onClick={handleClear}
              className="flex items-center gap-1 py-2! px-4! rounded-lg! bg-red-500"
            >
              <RiFilterOffLine />
              Clear
            </Button>
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
        aria-label="Analytics Table"
        // pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        title="Analytics"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Event ID</TableColumn>
            <TableColumn>User ID</TableColumn>
            <TableColumn>User Type</TableColumn>
            <TableColumn>Event Category</TableColumn>
            <TableColumn>Event Name</TableColumn>
            <TableColumn>Source</TableColumn>
            <TableColumn>Resource Type</TableColumn>
            <TableColumn>Platform</TableColumn>
            {/* <TableColumn>Actions</TableColumn> */}
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isAnalyticsPending}
          emptyContent={
            <div className="min-h-50 flex justify-center items-center flex-col gap-4 text-center">
              <LuSearchX size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No Data</h2>
                <p>There are currently no data</p>
              </div>
            </div>
          }
        >
          {fetchedData.map((item) => (
            <TableRow className="bg-(--card)" key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.event_id}</TableCell>
              <TableCell>{item.user_id}</TableCell>
              <TableCell>{item.user_type}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    eventCategoryPillClass(item.event_category),
                  )}
                >
                  {(item.event_category ?? "—").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    eventPillClass(item.event_name),
                  )}
                >
                  {(item.event_name ?? "—").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    analyticsSourcePillClass(item.source),
                  )}
                >
                  {(item.source ?? "—").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    analyticsResourceTypePillClass(item.resource_type),
                  )}
                >
                  {(item.resource_type ?? "—").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    analyticsSourcePillClass(item.platform),
                  )}
                >
                  {(item.platform ?? "—").replace(/_/g, " ")}
                </span>
              </TableCell>
              {/* <TableCell>
                <ActionDropdown
                  actions={[
                    {
                      label: "View",
                      onClick: () => {console.log('View')},
                    },
                    {
                      label: "Edit",
                      onClick: () => {console.log('edit')},
                    },
                  ]}
                />
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        page={filters.page!}
        totalPages={totalPages!}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        startIndex={(filters.page! - 1) * filters.limit! + 1}
        endIndex={(filters.page! - 1) * filters.limit! + fetchedData.length}
        itemLabel="item(s)"
      />
    </>
  );
}

export default RawData