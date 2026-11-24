"use client";
import { useGetTaxiBookings } from '@/api/taxi-booking';
import { TaxiBookingParams, TaxiBookingStatus } from '@/types/types';
import { ActionDropdown, Button, Card, Input } from "@/components/ui";
import React, { useEffect, useMemo, useState } from 'react'
import { RiFilterLine, RiFilterOffLine } from 'react-icons/ri';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TablePagination, TableRow } from '@/components/ui/table/TableWrapper';
import { LuSearchX } from 'react-icons/lu';
import MyModal from '@/components/dashboard/Modal';
import ViewBooking from '@/components/taxi-booking/ViewBooking';
import EditBooking from '@/components/taxi-booking/EditBooking';
import { taxiBookingStatusPillClass } from '@/lib/order-badges';
import { cn } from '@/components/ui/utils';
import { useCanUpdate, useCanView } from '@/hooks/use-can';

const TAXI_BOOKING_PLAN_OPTIONS = [
  "SUBMITTED",
  "AVAILABILITY_CHECK",
  "CONFIRMED",
  "DRIVER_ASSIGNED",
  "IN_TRANSIT",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
  "REFUND_PENDING"
];

const CITIES = ["GUANGZHOU", "FOSHAN", "DONGGUAN"];

type TaxiBookingFilters = {
  status?: TaxiBookingStatus;
  city?: typeof CITIES[number];
  plan?: "A" | "B";
  merchantId?: number;
  assignedAdminId?: number;
};

const defaultFilters: TaxiBookingFilters = {
  status: "SUBMITTED",
  city: "GUANGZHOU",
  plan: "A",
  merchantId: undefined,
  assignedAdminId: undefined,
};

const TaxiBookingsPage = () => {
  const [debouncedFilters, setDebouncedFilters] = useState<TaxiBookingFilters>(defaultFilters);
  const [tempFilters, setTempFilters] = useState<TaxiBookingFilters>(defaultFilters);
  const [modalType, setModalType] = useState<"view" | "edit" | "update" | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(tempFilters);
    }, 300);

    return () => clearTimeout(timeout);
  }, [tempFilters]);

  const { 
    data: taxiBookingsData, 
    isPending: isTaxiBookingsPending, 
    error: isTaxiBookingsError 
  } = useGetTaxiBookings(debouncedFilters as TaxiBookingParams);

  const fetchedData = taxiBookingsData?.data?.rows ?? [];
  const totalPages = taxiBookingsData?.data?.totalPages;
  const page = taxiBookingsData?.data?.page;
  const totalItems = taxiBookingsData?.data?.count;
  const limit = taxiBookingsData?.data?.limit;

  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!fetchedData.length) return [];

    let data = [...fetchedData];

    if (query) {
      const q = query.toLowerCase();

      data = data.filter(
        (item) =>
          item.reference.toLowerCase().includes(q) ||
          // item.supplier.name.toLowerCase().includes(q) ||
          // item.productDetails.description.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q),
      );
    }

    return data;
  }, [query, fetchedData]);

  const startIndex = (page! - 1) * limit!;
  const endIndex = Math.min(startIndex + limit!, filteredData.length);

  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleApply = () => {
    setDebouncedFilters(tempFilters);
  };

  const handleClear = () => {
    setTempFilters(defaultFilters);
    setDebouncedFilters(defaultFilters);
  };

  const isFiltered =
    !!tempFilters.city ||
    !!tempFilters.status ||
    !tempFilters.merchantId ||
    !tempFilters.assignedAdminId;

  // Permissions
  const canView = useCanView("services");
  const canUpdate = useCanUpdate("services");

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Taxi Bookings</h1>
        </div>
      </div>

      <Card className="shadow-none! border border-(--table-border) mb-4 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2">
          <Input
            element="select"
            value={tempFilters.city!}
            name="city"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, city: e.target.value }))
            }
            tag="City"
            placeholder="City"
            genStyle="my-0! mt-3!"
            selectOptions={CITIES.map((city) => ({
              label: city,
              value: city,
            }))}
          />
          <Input
            element="input"
            input_type="text"
            value={tempFilters.merchantId!}
            name="merchantId"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                merchantId: Number(e.target.value),
              }))
            }
            tag="Merchant ID"
            placeholder="Merchant ID"
            genStyle="my-0! mt-3!"
          />
          <Input
            element="select"
            value={tempFilters.status!}
            name="status"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, status: e.target.value }))
            }
            selectOptions={TAXI_BOOKING_PLAN_OPTIONS.map((val) => ({
              label: val.replace(/_/g, " "),
              value: val,
            }))}
            tag="Verification Status"
            placeholder="All Statuses"
            genStyle="my-0! mt-3!"
          />
          <Input
            element="select"
            value={tempFilters.plan!}
            name="plan"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, plan: e.target.value }))
            }
            selectOptions={["A", "B"].map((val) => ({
              label: val,
              value: val,
            }))}
            tag="Plan"
            placeholder="All Plans"
            genStyle="my-0! mt-3!"
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
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
      </Card>

      <Table
        aria-label="Admin verifications"
        // pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        title='All Bookings'
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Reference</TableColumn>
            <TableColumn>Merchant ID</TableColumn>
            <TableColumn>City</TableColumn>
            <TableColumn>Plan</TableColumn>
            <TableColumn>Location</TableColumn>
            <TableColumn>Passenger Count</TableColumn>
            <TableColumn>Fare (Yuan)</TableColumn>
            <TableColumn>Fare (Naira)</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isTaxiBookingsPending}
          emptyContent={
            <div className="min-h-50 flex justify-center items-center flex-col gap-4 text-center">
              <LuSearchX size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No Taxi Bookings</h2>
                <p>There are currently no taxi bookings available</p>
              </div>
            </div>
          }
        >
          {paginatedData.map((booking) => (
            <TableRow key={booking.id} className="bg-(--surface)">
              <TableCell>{booking.id}</TableCell>
              <TableCell>{booking.reference}</TableCell>
              <TableCell>{booking.merchantId}</TableCell>
              <TableCell>{booking.city}</TableCell>
              <TableCell>{booking.plan}</TableCell>
              <TableCell>{booking?.locations?.[0]?.address || "N/A"}</TableCell>
              <TableCell>{booking.passengerCount}</TableCell>
              <TableCell>&yen;{booking.fareYuan.toLocaleString()}</TableCell>
              <TableCell>&#8358;{booking.fareNaira.toLocaleString()}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    taxiBookingStatusPillClass(booking.status),
                  )}
                >
                  {(booking.status ?? "—").replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    ...(canView ? [
                      {
                        label: "View",
                        onClick: () => {
                          setSelectedBookingId(booking.id);
                          setModalType("view");
                        },
                      },
                    ] : []),
                    ...(canUpdate ? [
                      {
                        label: "Edit",
                        onClick: () => {
                          setSelectedBookingId(booking.id);
                          setModalType("edit");
                        },
                      }
                    ] : [])
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        page={page!}
        totalPages={totalPages!}
        onPageChange={(page) => setDebouncedFilters((f) => ({ ...f, page }))}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="bookings"
      />

      {selectedBookingId && modalType === "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedBookingId(null)}
          title="Booking Details"
        >
          <ViewBooking bookingId={selectedBookingId} />
        </MyModal>
      )}

      {selectedBookingId && modalType === "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedBookingId(null)}
          title="Edit Booking"
        >
          <EditBooking bookingId={selectedBookingId} />
        </MyModal>
      )}
    </>
  );
}

export default TaxiBookingsPage