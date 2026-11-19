"use client";
import { useGetInspectionRates } from "@/api/rates";
import { InspectionDepth, SingleInspectionRate } from "@/types/types";
import React, { useMemo, useState } from "react";
import { ActionDropdown, Badge, Button, Card, Dropdown } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { RiAddFill } from "react-icons/ri";
import { fmtDateTime } from "@/lib/funcs";
import { TbBoxOff } from "react-icons/tb";
import MyModal from "@/components/dashboard/Modal";
import UpdateInspectionRate from "@/components/rates/UpdateInspectionRate";
import TierHistory from "@/components/rates/TierHistory";

type Props = {};

const InspectionRate = (props: Props) => {
  const { data: rates, isPending, error } = useGetInspectionRates();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalType, setModalType] = useState<"view" | "edit" | "add" | null>(
    null,
  );
  const [currentTier, setCurrentTier] = useState<InspectionDepth | null>(null);
  const [query, setQuery] = useState("");

  const filteredData: SingleInspectionRate[] = useMemo(() => {
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
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Inspection rates</h3>
        <Button
          primary
          className="flex items-center gap-1"
          onClick={() => setModalType("add")}
          // disabled={!supplierId}
        >
          <RiAddFill className="font-bold" />
          Update Rates
        </Button>
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
            <TableColumn>Tier</TableColumn>
            <TableColumn>Fee</TableColumn>
            <TableColumn>Source</TableColumn>
            <TableColumn>Effective At</TableColumn>
            <TableColumn>Actions</TableColumn>
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
              <TableCell>{rate.tier}</TableCell>
              <TableCell>&#8358;{rate.feeKobo / 100}</TableCell>
              <TableCell>{rate.source}</TableCell>
              <TableCell>{fmtDateTime(rate.effectiveAt!)}</TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    {
                      label: "View History",
                      onClick: () => {
                        setCurrentTier(rate.tier);
                        setModalType("view");
                      },
                    },
                    {
                      label: "Update rate",
                      onClick: () => {
                        setCurrentTier(rate.tier);
                        setModalType("edit");
                      },
                    },
                    // {
                    //   label: "View products",
                    //   onClick: () => {

                    //   },
                    // },
                  ]}
                />
              </TableCell>
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
        itemLabel="inspection rate(s)"
      />

      {modalType == "add" && (
        <MyModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title="Update Rate"
        >
          <UpdateInspectionRate onSuccess={() => setModalType(null)} />
        </MyModal>
      )}

      {currentTier != null && modalType == "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={`View ${currentTier} Tier History`}
        >
          <TierHistory tier={currentTier} />
        </MyModal>
      )}
    </>
  );
};

export default InspectionRate;
