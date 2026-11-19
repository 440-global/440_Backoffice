"use client";
import { useGetTaxiBooking } from '@/api/taxi-booking';
import { taxiBookingStatusPillClass } from '@/lib/order-badges';
import React from 'react'
import { RiErrorWarningFill, RiLoader5Line } from 'react-icons/ri';
import { cn } from '../ui/utils';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '../ui/table/TableWrapper';

type Props = {
  bookingId: number;
}

const ViewBooking = ({ bookingId }: Props) => {
  const { data, isPending, error } = useGetTaxiBooking(bookingId);
  return (
    <>
      {isPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : error ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="text-red-500" size={60} />
          <p>Error occurred while fetching taxi data.</p>
        </div>
      ) : data ? (
        <div>
          <div className="mb-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-semibold">General Info</h2>
            <ul className="mt-2">
              <li>
                <strong>Booking ID:</strong> {data.id}
              </li>
              <li>
                <strong>Reference:</strong> {data.reference}
              </li>
              <li>
                <strong>Merchant ID:</strong> {data.merchantId}
              </li>
              <li>
                <strong>Status:</strong>{" "}
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    taxiBookingStatusPillClass(data?.status),
                  )}
                >
                  {(data?.status ?? "—").replace(/_/g, " ")}
                </span>
              </li>
              <li>
                <strong>Number of Passengers:</strong> {data.passengerCount}
              </li>
              <li>
                <strong>Number of Luggage:</strong> {data.luggageCount}
              </li>
              <li>
                <strong>Fare (Yuan):</strong> {data.fareYuan}
              </li>
              <li>
                <strong>Fare (Naira):</strong> {data.fareNaira}
              </li>
            </ul>
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-semibold">Driver Details</h2>
            {data.driverDetails != null ? (
              <ul className="mt-2">
                <li>
                  <strong>Driver Name:</strong> {data.driverDetails.name}
                </li>
                <li>
                  <strong>Driver Phone:</strong> {data.driverDetails.phone}
                </li>
                <li>
                  <strong>Vehicle Details:</strong> {data.driverDetails.vehicleDetails}
                </li>
              </ul>
            ) : (
              <p>No driver details available.</p>
            )}
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-semibold">Locations</h2>
            {data.locations && data.locations.length > 0 ? (
              <ul className="mt-2">
                {data.locations.map((loc, idx) => (
                  <li key={idx}>
                    <strong>Location {idx + 1}:</strong> {loc.address} in{" "}
                    {loc.district}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No locations available.</p>
            )}
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-semibold">Flight Info</h2>
            {data.flightDetails != null ? (
              <ul className="mt-2">
                <li>
                  <strong>Flight Number:</strong>{" "}
                  {data.flightDetails.flightNumber}
                </li>
                <li>
                  <strong>Scheduled At:</strong>{" "}
                  {data.flightDetails.scheduledAt}
                </li>
              </ul>
            ) : (
              <p>No flight details available.</p>
            )}
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-semibold">Other Info</h2>
            <ul className="mt-2">
              <li>
                <strong>Availability Note:</strong>{" "}
                {data.availabilityNote || "N/A"}
              </li>
              <li>
                <strong>Refund Reason:</strong> {data.refundReason || "N/A"}
              </li>
              <li>
                <strong>Admin Note:</strong> {data.adminNotes || "N/A"}
              </li>
            </ul>
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-bold">Status Update History</h2>
            <Table aria-label="Status Update History" className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableColumn>From</TableColumn>
                  <TableColumn>To</TableColumn>
                  <TableColumn>Actor Type</TableColumn>
                  <TableColumn>Date</TableColumn>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.history.map((history, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs",
                          taxiBookingStatusPillClass(history.from),
                        )}
                      >
                        {(history.from ?? "—").replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs",
                          taxiBookingStatusPillClass(history.to),
                        )}
                      >
                        {(history.to ?? "—").replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>{history.actorType}</TableCell>
                    <TableCell>{history.at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ViewBooking