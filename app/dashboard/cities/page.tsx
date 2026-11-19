"use client";

import React, { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { useDeleteCity, useGetCities } from '@/api/cities';
import { SingleCity } from '@/types/types';
import { ActionDropdown, Button } from '@/components/ui';
import MyModal from '@/components/dashboard/Modal';
import ViewCity from '@/components/cities/ViewCity';
import EditCity from '@/components/cities/EditCity';
import { useConfirm } from '@/components/ui/confirm';
import { useToast } from '@/components/ui/toast/ToastContext';
import { RiAddFill, RiImportLine } from 'react-icons/ri';
import AddCity from '@/components/cities/AddCity';
import ImportCities from '@/components/cities/ImportCities';
import { fmtDateTime } from '@/lib/funcs';

type Props = {}

const Cities = (props: Props) => {
  const { data: cities, isPending: isCitiesPending, error: citiesError } = useGetCities();
  const { mutateAsync: deleteCity } = useDeleteCity();

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | "add" | "import" | null>(null);

  const [query, setQuery] = useState("");
  const confirm = useConfirm();
  const { toast } = useToast();

  const fetchedData = cities?.data ?? []
  const filteredData: SingleCity[] = useMemo(() => {
    if (!query) return fetchedData;

    if (!fetchedData.length) return [];

    type Row = (typeof fetchedData)[number];

    const searchableKeys = (
      Object.keys(fetchedData[0]) as (keyof Row)[]
    ).filter((key) => typeof fetchedData[0][key] === "string");

    return fetchedData.filter((row: Row) =>
      searchableKeys.some((key) =>
        String(row[key]).toLowerCase().includes(query.toLowerCase()),
      ),
    );
  }, [query, fetchedData]);

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

  const handleDelete = async (id: number) => {
    const ok = await confirm("Are you sure you want to delete this item?");
    if (!ok) return;

    const res = await deleteCity(id);
    if(res.status == 200 || res.status == 201) {
      toast({
        title: "Success",
        description: "City deleted successfully",
        variant: "success",
      });
    } else {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "danger",
      });
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Cities</h3>
        <div className="flex gap-2">
          <Button
            primary
            className="flex items-center gap-1"
            onClick={() => setModalType("add")}
          >
            <RiAddFill className="font-bold" />
            Add City
          </Button>
          <Button
            className="flex items-center gap-1"
            onClick={() => setModalType("import")}
          >
            <RiImportLine className="font-bold" />
            Import Cities
          </Button>
        </div>
      </div>

      {/* Suppliers Table */}
      <Table
        aria-label="Cities Table"
        filterable
        onFilter={handleFilter}
        pageSize={rowsPerPage}
        onPageSizeChange={handlePageSizeChange}
        title="All Cities"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>Name</TableColumn>
            <TableColumn>Province</TableColumn>
            <TableColumn>Country</TableColumn>
            <TableColumn>Created At</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isCitiesPending}>
          {paginatedData.map((city, index) => (
            <TableRow className="bg-(--card)" key={index}>
              <TableCell>{city.name}</TableCell>
              <TableCell>{city.province}</TableCell>
              <TableCell>{city.country}</TableCell>
              <TableCell>{fmtDateTime(city.createdAt)}</TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    {
                      label: "View",
                      onClick: () => {
                        setSelectedCityId(city.id);
                        setModalType("view");
                      },
                    },
                    {
                      label: "Edit",
                      onClick: () => {
                        setSelectedCityId(city.id);
                        setModalType("edit");
                      },
                    },
                    {
                      label: "Delete",
                      onClick: () => {
                        handleDelete(city.id);
                      },
                      danger: true,
                    },
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
        itemLabel="cities"
      />

      {selectedCityId && modalType === "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedCityId(null)}
          title="City Details"
        >
          <ViewCity cityId={selectedCityId} />
        </MyModal>
      )}

      {selectedCityId && modalType === "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedCityId(null)}
          title="Edit City"
        >
          <EditCity
            cityId={selectedCityId}
            onSuccess={() => setSelectedCityId(null)}
          />
        </MyModal>
      )}

      {modalType === "add" && (
        <MyModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title="Add City"
        >
          <AddCity onSuccess={() => setModalType(null)} />
        </MyModal>
      )}

      {modalType === "import" && (
        <MyModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title="Import Cities"
        >
          <ImportCities onSuccess={() => setModalType(null)} />
        </MyModal>
      )}
    </>
  );
}

export default Cities