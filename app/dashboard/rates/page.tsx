"use client";
import React, { useMemo, useState } from "react";
import { RiAddFill } from "react-icons/ri";
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
import { useGetRates } from "@/api/rates";
import { SingleRate } from "@/types/types";
import { TbBoxOff } from "react-icons/tb";
import MyModal from "@/components/dashboard/Modal";
import CurrencyHistory from "@/components/rates/CurrencyHistory";
import EditRate from "@/components/rates/EditRate";
import { useCanCreate, useCanDelete, useCanManage, useCanUpdate, useCanView } from "@/hooks/use-can";

type Props = {};

const Rates = (props: Props) => {
  const { data: rates, isPending, error } = useGetRates();

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalType, setModalType] = useState<"view" | "edit" | "add" | null>(
    null,
  );
  const [selectedCurrencyID, setSelectedCurrencyID] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filteredData: SingleRate[] = useMemo(() => {
    if (!rates) return [];

    type Row = (typeof rates)[number];

    const searchableKeys = (
      Object.keys(rates[0] ?? {}) as (keyof Row)[]
    ).filter((key) => typeof rates[0]?.[key] === "string");

    const result = !query
      ? rates
      : rates.filter((row: Row) =>
          searchableKeys.some((key) =>
            String(row[key]).toLowerCase().includes(query.toLowerCase()),
          ),
        );

    return [...result].sort((a, b) => {
      // numeric ids
      if (typeof b.id === "number" && typeof a.id === "number") {
        return b.id - a.id;
      }
      // string ids
      return String(b.id).localeCompare(String(a.id));
    });
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
  const canView = useCanView("rates");
  const canUpdate = useCanUpdate("rates");
  const canCreate = useCanCreate("rates");

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Exchange rates</h3>
        {
          canCreate && (
            <Button
              primary
              className="flex items-center gap-1"
              onClick={() => setModalType("add")}
              // disabled={!supplierId}
            >
              <RiAddFill className="font-bold" />
              Add Currency
            </Button>
          )
        }
      </div>

      <Table
        aria-label="Rates Table"
        filterable
        onFilter={handleFilter}
        pageSize={rowsPerPage}
        onPageSizeChange={handlePageSizeChange}
        title="All Currencies"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Name</TableColumn>
            <TableColumn>Short Name</TableColumn>
            <TableColumn>Symbol</TableColumn>
            <TableColumn>Rate</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isPending}
          emptyContent={
            <div className="min-h-75 flex justify-center items-center flex-col gap-4 text-center">
              <TbBoxOff size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No currencies</h2>
                <p>No currencies returned from the server</p>
              </div>
            </div>
          }
        >
          {paginatedData.map((rate, index) => (
            <TableRow className="bg-(--card)" key={index}>
              <TableCell>{rate.id}</TableCell>
              <TableCell>{rate.Name}</TableCell>
              <TableCell>{rate.Short_Name}</TableCell>
              <TableCell>{rate.Symbol}</TableCell>
              <TableCell>{rate.Rate}</TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    ...(canView ? [
                      {
                        label: "View History",
                        onClick: () => {
                          setSelectedCurrencyID(rate.id);
                          setModalType("view");
                        },
                      },
                    ] : []),
                    ...(canUpdate ? [
                      {
                        label: "Update rate",
                        onClick: () => {
                          setSelectedCurrencyID(rate.id);
                          setModalType("edit");
                        },
                      },
                    ] : [])
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
        itemLabel="currencies"
      />

      {selectedCurrencyID && modalType == "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedCurrencyID(null)}
          title="View Exchange History"
        >
          <CurrencyHistory currencyId={selectedCurrencyID} />
        </MyModal>
      )}

      {selectedCurrencyID && modalType == "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedCurrencyID(null)}
          title="Update Rate"
        >
          <EditRate
            currencyId={selectedCurrencyID}
            onSuccess={() => setSelectedCurrencyID(null)}
          />
        </MyModal>
      )}
    </>
  );
};

export default Rates;
