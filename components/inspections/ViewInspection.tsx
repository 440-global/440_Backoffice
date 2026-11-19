"use client";

import { useGetSupplierVerification } from '@/api/verification';
import { inspectionStatusPillClass, supplierVerificationStatusPillClass } from '@/lib/order-badges';
import React from 'react'
import { cn } from '../ui/utils';
import { RiErrorWarningFill, RiLoader5Line } from 'react-icons/ri';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '../ui/table/TableWrapper';
import { useGetInspection } from '@/api/inspection';

type Props = {
  inspectionId: number;
}

const ViewInspection = ({ inspectionId }: Props) => {
  const { data, isPending, error } = useGetInspection(inspectionId);

  console.log("inspection data", data, isPending, error);

  return (
    <>
      {isPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : error ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="text-red-500" size={60} />
          <p>Error occurred while fetching inspection data.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-bold">General Info</h2>
            <ul className="mt-2">
              <li className="pt-1">
                <span className="font-semibold">Reference No</span>:-{" "}
                {data?.reference}
              </li>
              <li className="pt-1">
                <span className="font-semibold">Merchant ID</span>:-{" "}
                {data?.merchantId}
              </li>
              <li className="pt-1">
                <span className="font-semibold">Amount Paid</span>:-{" "}
                {data?.feePaidNaira}
              </li>
            </ul>
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-bold">Supplier Info</h2>
            <ul className="mt-2">
              <li className="pt-1">
                <span className="font-semibold">Name</span>:-{" "}
                {data?.supplier.name}
              </li>
              <li className="pt-1">
                <span className="font-semibold">Address</span>:-{" "}
                {data?.supplier.address}
              </li>
              <li className="pt-1">
                <span className="font-semibold">Contact</span>:-{" "}
                {data?.supplier.contact}
              </li>
            </ul>
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-bold">Product Info</h2>
            <ul className="mt-2">
              <li className="pt-1">
                <strong>Quantity:</strong> {data?.productDetails.quantity} {data?.productDetails.unit}
              </li>
              <li className="pt-1">
                <span className="font-semibold">Description</span>:-{" "}
                {data?.productDetails.description}
              </li>
            </ul>
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-bold">Attachments</h2>
            <div className="mt-2 flex gap-2 flex-wrap">
              {data?.attachments.map((attachment, index) => (
                <img
                  key={index}
                  src={attachment.url}
                  alt={attachment.url}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-bold">Other Info</h2>
            <ul className="mt-2">
              <li className="pt-1 flex items-center gap-1">
                <span className="font-semibold">Current Status</span>:-{" "}
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    inspectionStatusPillClass(data?.status),
                  )}
                >
                  {(data?.status ?? "—").replace(/_/g, " ")}
                </span>
              </li>
              <li className="pt-1">
                <span className="font-semibold">Assigned Admin</span>:-{" "}
                {data?.assignedAdminId == null
                  ? "Not Assigned"
                  : data?.assignedAdminId}
              </li>
              <li className="pt-1">
                <span className="font-semibold">Admin Notes</span>:-{" "}
                {data?.adminNotes == null
                  ? "No notes available"
                  : data?.adminNotes}
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
                          inspectionStatusPillClass(history.from),
                        )}
                      >
                        {(history.from ?? "—").replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs",
                          supplierVerificationStatusPillClass(history.to),
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
      )}
    </>
  );
}

export default ViewInspection;