"use client"
import React, { useMemo, useState } from "react";
import { RiAddFill } from "react-icons/ri";
import { Button } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { useGetLogisticsRate, useGetRates } from "@/api/rates";
import { SingleLogisticsRate, SingleRate } from "@/types/types";
import { TbBoxOff } from "react-icons/tb";
import MyModal from "@/components/dashboard/Modal";
import UpdateLogisticsRate from "@/components/rates/UpdateLogisticsRate";
import { fmtDateTime } from "@/lib/funcs";
import { useCanCreate, useCanUpdate, useCanView } from "@/hooks/use-can";

type Props = {}

const LogisticsRate = (props: Props) => {
  const { data: rates, isPending, error } = useGetLogisticsRate();

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalType, setModalType] = useState<"view" | "edit" | "add" | null>(
    null,
  );
  const [query, setQuery] = useState("");

  const filteredData: SingleLogisticsRate[] = useMemo(() => {
    if (!rates) return [];

    if (!query) return rates;

    type Row = (typeof rates)[number];

    const searchableKeys = (Object.keys(rates[0]) as (keyof Row)[]).filter(
      (key) => typeof rates[0][key] === "string",
    );

    return rates.filter((row: Row) =>
      searchableKeys.some((key) =>
        String(row[key]).toLowerCase().includes(query.toLowerCase()),
      ),
    );
  }, [query, rates]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);

  const paginatedData = filteredData.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleFilter = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setRowsPerPage(size);
    setCurrentPage(1);
  };

  // Permissions
  const canUpdate = useCanUpdate("rates");

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Logistics rates</h3>
        {
          canUpdate &&
          <Button
            primary
            className="flex items-center gap-1"
            onClick={() => setModalType("add")}
            // disabled={!supplierId}
          >
            <RiAddFill className="font-bold" />
            Update Rates
          </Button>
        }
      </div>

      <Table
        aria-label="Rates Table"
        filterable
        onFilter={handleFilter}
        pageSize={rowsPerPage}
        onPageSizeChange={handlePageSizeChange}
        title="Logistics rates"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>S/N</TableColumn>
            <TableColumn>Method</TableColumn>
            <TableColumn>Currency</TableColumn>
            <TableColumn>Rate Per CBM</TableColumn>
            <TableColumn>Effective At</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isPending}
          emptyContent={
            <div className="min-h-75 flex justify-center items-center flex-col gap-4 text-center">
              <TbBoxOff size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No logistics</h2>
                <p>No data returned from the server</p>
              </div>
            </div>
          }
        >
          {paginatedData.map((rate, index) => (
            <TableRow className="bg-(--card)" key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{rate.method}</TableCell>
              <TableCell>{rate.currency}</TableCell>
              <TableCell>{rate.ratePerCbm}</TableCell>
              <TableCell>{fmtDateTime(rate.effectiveAt!)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        startIndex={startIndex + 1}
        endIndex={endIndex}
        totalItems={filteredData.length}
        itemLabel="currencies"
      />

      {modalType == "add" && (
        <MyModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title="Update Rate"
        >
          <UpdateLogisticsRate onSuccess={() => setModalType(null)} />
        </MyModal>
      )}
    </>
  );
}

export default LogisticsRate