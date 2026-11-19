import { useGetTransaction } from '@/api/pay-merchant';
import React from 'react'
import { RiErrorWarningFill, RiLoader5Line } from 'react-icons/ri';
import { cn } from '../ui/utils';
import { transactionStatusPillClass } from '@/lib/order-badges';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '../ui/table/TableWrapper';

type Props = {
  transactionId: number;
};

const ViewTransaction = ({ transactionId }: Props) => {
  const { data, isPending, error } = useGetTransaction(transactionId);

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
                <strong>Reference No</strong>:-{" "}
                {data?.reference}
              </li>
              <li className="pt-1">
                <strong>Merchant ID</strong>:-{" "}
                {data?.merchantId}
              </li>
              <li className="pt-1">
                <strong>Currency</strong>:-{" "}
                {data?.currency}
              </li>
              <li className="pt-1">
                <strong>Amount Foreign</strong>:-{" "}
                {data?.amountForeign}
              </li>
              <li className="pt-1">
                <strong>Amount Naira</strong>:-{" "}
                {data?.amountNaira}
              </li>
              <li className="pt-1">
                <strong>Total Amount Payable</strong>:-{" "}
                {data?.totalPayableNaira}
              </li>
            </ul>
          </div>
          <div className="my-4 border-b border-(--table-border) pb-2">
            <h2 className="text-lg font-bold">Supplier Info</h2>
            <ul className="mt-2">
              <li className="pt-1">
                <strong>Name</strong>:-{" "}
                {data?.supplier.name}
              </li>
              <li className="pt-1">
                <strong>Channel</strong>:-{" "}
                {data?.supplier.channel}
              </li>
              <li className="pt-1">
                <strong>Bank Name</strong>:-{" "}
                {data?.supplier.bank.bankName}
              </li>
              <li className="pt-1">
                <strong>Account Number</strong>:-{" "}
                {data?.supplier.bank.accountNumber}
              </li>
              <li className="pt-1">
                <strong>Account Holder</strong>:-{" "}
                {data?.supplier.bank.accountHolder}
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
                <strong>Current Status</strong>:-{" "}
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    transactionStatusPillClass(data?.status),
                  )}
                >
                  {(data?.status ?? "—").replace(/_/g, " ")}
                </span>
              </li>
              <li className="pt-1">
                <strong>Admin Notes</strong>:-{" "}
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
                          transactionStatusPillClass(history.from),
                        )}
                      >
                        {(history.from ?? "—").replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs",
                          transactionStatusPillClass(history.to),
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

export default ViewTransaction