"use client";

import { useGetCustomers, useSendWelcomeEmail } from "@/api/customers";
import AddToCustomerCart from "@/components/customers/AddToCustomerCart";
import MyModal from "@/components/dashboard/Modal";
import { ActionDropdown, Button, Card, Input } from "@/components/ui";
import { CustomerParams } from "@/types/types";
import React, { useEffect, useState } from "react";
import {
  RiAddFill,
  RiFilterLine,
  RiFilterOffLine,
  RiUserForbidLine,
} from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import AddCustomer from "@/components/customers/AddCustomer";
import { useCan, useCanCreate, useCanManage, useCanUpdate } from "@/hooks/use-can";
import AddCustomerOrder from "@/components/customers/AddCustomerOrder";

type Props = {};

const defaultFilters: CustomerParams = {
  q: "",
};

const CustomersPage = (props: Props) => {
  const [modalType, setModalType] = useState<"add" | "order" | "cart" | null>(null);
  const [selectedCustomerID, setSelectedCustomerID] = useState<number | null>(null);
  const [selectedCustomerInfo, setSelectedCustomerInfo] = useState<{name?: string; email: string; phone?: string} | null>(null);
  const [filters, setFilters] = useState<CustomerParams>(defaultFilters);
  const [tempFilters, setTempFilters] =
    useState<CustomerParams>(defaultFilters);

  const { data, isPending, error } = useGetCustomers(filters);
  const customers = data?.data ?? [];
  const totalPages = data?.meta?.totalPages;
  const page = data?.meta?.page;
  const totalItems = data?.meta?.total;
  const limit = data?.meta?.limit;

  const startIndex = ((page ?? 1) - 1) * (limit ?? 0);
  const endIndex = (page ?? 1) * (limit ?? 0);

  const { mutate: sendWelcomeEmail } = useSendWelcomeEmail();
  const canCreate = useCanCreate("customers");
  const canCreateOrders = useCanCreate("orders");
  const canUpdate = useCanUpdate("customers");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        q: tempFilters.q,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timeout);
  }, [tempFilters.q]);

  const handleApply = () => {
    setFilters({
      ...tempFilters,
      page: 1,
    });
  };

  const handleClear = () => {
    setTempFilters({
      ...defaultFilters,
    });

    setFilters({
      ...defaultFilters,
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Customers</h3>
        {canCreate && (
          <Button
            primary
            className="flex items-center gap-1"
            onClick={() => setModalType("add")}
          >
            <RiAddFill className="font-bold" />
            Add customer
          </Button>
        )}
      </div>

      <Table
        aria-label="Customers Table"
        // pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        title="Customers"
        customFilter={
          <Input
            element="input"
            input_type="text"
            value={tempFilters.q!}
            name="q"
            handler={(e) =>
              setTempFilters((f) => ({ ...f, q: e.target.value }))
            }
            // tag="Search"
            placeholder="Search name, email, phone, shop name..."
            genStyle="my-0! flex-1"
          />
        }
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Name</TableColumn>
            <TableColumn>Email</TableColumn>
            <TableColumn>Phone</TableColumn>
            <TableColumn>Shop Name</TableColumn>
            <TableColumn>Account Source</TableColumn>
            <TableColumn>Must Change Password</TableColumn>
            {/* <TableColumn>Welcome Sent</TableColumn> */}
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isPending}
          emptyContent={
            <div className="min-h-50 flex justify-center items-center flex-col gap-4 text-center">
              <RiUserForbidLine size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No Customers</h2>
                <p>There are currently no customers</p>
              </div>
            </div>
          }
        >
          {customers?.map((customer) => (
            <TableRow key={customer.id} className="bg-(--surface)">
              <TableCell>{customer.id}</TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.shopName}</TableCell>
              <TableCell>{customer.accountSource}</TableCell>
              <TableCell>
                {customer.mustChangePassword == false ? "No" : "Yes"}
              </TableCell>
              {/* <TableCell>
                {customer.welcomeSentAt != null
                  ? fmtDateTime(customer.welcomeSentAt)
                  : "Not found"}
              </TableCell> */}
              <TableCell>
                <ActionDropdown
                  actions={[
                    // Only a customer an admin created, who has not logged in yet, has a welcome to resend.
                    ...(canUpdate && customer.accountSource === "ADMIN" && customer.mustChangePassword
                      ? [
                          {
                            label: "Resend welcome email",
                            onClick: () => sendWelcomeEmail(customer.id),
                          },
                        ]
                      : []),
                    ...(canCreateOrders
                      ? [
                          {
                            label: "Add order",
                            onClick: () => {
                              setSelectedCustomerID(customer.id);
                              setModalType("order");
                              setSelectedCustomerInfo({
                                name: customer.name,
                                email: customer.email,
                              });
                            },
                          },
                        ]
                      : []),
                    ...(canUpdate
                      ? [
                          {
                            label: "Add product to cart",
                            onClick: () => {
                              setSelectedCustomerID(customer.id);
                              setModalType("cart");
                              setSelectedCustomerInfo({
                                name: customer.name,
                                email: customer.email,
                              });
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        page={page ?? 1}
        totalPages={totalPages ?? 1}
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        startIndex={startIndex + 1}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="customer(s)"
      />

      {selectedCustomerID && selectedCustomerInfo && modalType === "order" && (
        <MyModal
          title="Add customer order"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          <AddCustomerOrder
            customerId={selectedCustomerID}
            onSuccess={() => setModalType(null)}
            customerInfo={selectedCustomerInfo}
          />
        </MyModal>
      )}

      {selectedCustomerID && selectedCustomerInfo && modalType === "cart" && (
        <MyModal
          title="Add to customer cart"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          {/* <AddToCustomerCart
            customerId={selectedCustomerID}
            onSuccess={() => setModalType(null)}
            customerInfo={selectedCustomerInfo}
          /> */}
          <div className="h-full w-full flex justify-center items-center">
            <h1 className="text-2xl text-(--muted)">Coming soon</h1>
          </div>
        </MyModal>
      )}

      {modalType === "add" && (
        <MyModal
          title="Add customer"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          <AddCustomer onSuccess={() => setModalType(null)} />
        </MyModal>
      )}
    </>
  );
};

export default CustomersPage;
