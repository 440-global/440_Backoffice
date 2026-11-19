"use client"

import { useGetSuppliers } from '@/api/supplier'
import MyModal from '@/components/dashboard/Modal'
import AddSupplier from '@/components/suppliers/AddSupplier'
import EditSupplier from '@/components/suppliers/EditSupplier'
import ViewSupplier from '@/components/suppliers/ViewSupplier'
import { ActionDropdown, Badge, Button, Dropdown } from '@/components/ui'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TablePagination, TableRow } from '@/components/ui/table/TableWrapper'
import { SupplierDetails } from '@/types/types'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { RiAddFill, RiDeleteBinLine, RiEdit2Line, RiEye2Line, RiMore2Fill } from 'react-icons/ri'

const Suppliers = () => {
   // Fetching the suppliers data
    const { data: getSuppliers = [], isPending: isGetSuppliersLoading, error } = useGetSuppliers();
  
    useEffect(() => {
      console.log(getSuppliers);
    }, [getSuppliers]);
  
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [addModalOpen, setAddModalOpen] = useState(false);

    const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetails | null>(null);
    const [modalType, setModalType] = useState<'view' | 'edit' | null>(null);
    
    const [query, setQuery] = useState("");
    const filteredData: SupplierDetails[] = useMemo(() => {
      if (!query) return getSuppliers;

      if (!getSuppliers.length) return [];

      type Row = typeof getSuppliers[number];

      const searchableKeys = (Object.keys(getSuppliers[0]) as (keyof Row)[])
        .filter((key) => typeof getSuppliers[0][key] === "string");

      return getSuppliers.filter((row: Row) =>
        searchableKeys.some((key) =>
          String(row[key]).toLowerCase().includes(query.toLowerCase())
        )
      );
    }, [query, getSuppliers]);
    
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
          <h3 className="text-2xl font-bold">Suppliers</h3>
          <Button
            primary
            className="flex items-center gap-1"
            onClick={() => setAddModalOpen(true)}
          >
            <RiAddFill className="font-bold" />
            Add Supplier
          </Button>
        </div>

        {/* Suppliers Table */}
        <Table
          aria-label="supplier Table"
          filterable
          onFilter={handleFilter}
          pageSize={rowsPerPage}
          onPageSizeChange={handlePageSizeChange}
          title="Suppliers Table"
          filter_placeholder="Filter by supplier name..."
        >
          <TableHeader>
            <TableRow>
              <TableColumn>Name</TableColumn>
              <TableColumn>Image</TableColumn>
              <TableColumn>Username</TableColumn>
              <TableColumn>Club Code</TableColumn>
              <TableColumn>Location</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody isLoading={isGetSuppliersLoading}>
            {paginatedData.map((supplier, index) => (
              <TableRow className="bg-(--card)" key={index}>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>
                  <img
                    src={supplier.image}
                    alt={supplier.name}
                    width={50}
                    height={50}
                    className="object-cover!"
                  />
                </TableCell>
                <TableCell>{supplier.userName}</TableCell>
                <TableCell>{supplier.clubCode || "-"}</TableCell>
                <TableCell>{supplier.location}</TableCell>
                <TableCell>
                  {supplier.status && (
                    <Badge variant="success" className="lowercase">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <ActionDropdown
                    actions={[
                      {
                        label: "View",
                        onClick: () => {
                          setSelectedSupplier(supplier);
                          setModalType("view");
                        },
                      },
                      {
                        label: "Edit",
                        onClick: () => {
                          setSelectedSupplier(supplier);
                          setModalType("edit");
                        },
                      },
                      {
                        label: "View products",
                        onClick: () => {
                          window.location.href = `/dashboard/products?supplierId=${supplier.id}`;
                        },
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
          itemLabel="suppliers"
        />

        {selectedSupplier && modalType === "view" && (
          <MyModal
            isOpen={true}
            onClose={() => setSelectedSupplier(null)}
            title="Market Details"
          >
            <ViewSupplier supplier={selectedSupplier} />
          </MyModal>
        )}

        {selectedSupplier && modalType === "edit" && (
          <MyModal
            isOpen={true}
            onClose={() => setSelectedSupplier(null)}
            title="Edit Market Details"
          >
            <EditSupplier
              supplier={selectedSupplier}
              onSuccess={() => setModalType(null)}
            />
          </MyModal>
        )}

        {/* Add supplier Modal */}
        <MyModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(!addModalOpen)}
          title="Add Supplier"
        >
          <AddSupplier onSuccess={() => setAddModalOpen(!addModalOpen)} />
        </MyModal>
      </>
    );
}

export default Suppliers
