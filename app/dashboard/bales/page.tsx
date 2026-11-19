"use client"

import { useGetBales, useRelistBale } from '@/api/bales'
import ViewBale from '@/components/bales/ViewBale'
import ViewSubscribers from '@/components/bales/ViewSubscribers'
import MyModal from '@/components/dashboard/Modal'
import { SupplierName } from '@/components/suppliers/SupplierName'
import { ActionDropdown, Badge, Button, Card, Dropdown, Input } from '@/components/ui'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TablePagination, TableRow } from '@/components/ui/table/TableWrapper'
import { useConfirm } from '@/components/ui/confirm'
import EditBale from '@/components/bales/EditBale'
import { BALE_STATUSES, RELISTABLE_BALE_STATUSES, labelize, type BaleStatus } from '@/lib/enums'
import { fmtNgn } from '@/lib/format'
import { BaleFilters, SingleBale } from '@/types/types'
import React, { useState } from 'react'
import { RiAddFill, RiArchive2Fill, RiArchiveLine } from 'react-icons/ri'

const Bales = () => {
  const [filters, setFilters] = useState<BaleFilters>({
    categories: [],
    priceRange: { min: 0, max: 99999999 },
    marketLocation: [],
    page: 1,
    limit: 10,
    search: ''
  });

  const [tempFilters, setTempFilters] = useState<BaleFilters>({
    categories: [],
    priceRange: { min: 0, max: 99999999 },
    marketLocation: [],
    page: 1,
    limit: 10,
    search: ''
  });

  // Fetching the bale data. Search and status are filtered by the server, over every bale.
  const { data: getBales, isPending: isGetBalesLoading } = useGetBales(filters);
  const { mutate: relistBale } = useRelistBale();
  const confirm = useConfirm();

  const fetchedData: SingleBale[] = getBales?.data ?? [];
  const totalPages = getBales?.meta?.totalPages;
  const totalItems = getBales?.meta?.total;

  const [selectedBaleId, setSelectedBaleId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'view_subscribers' | null>(null);

  /** A pool whose end date has passed is "expired" to a customer even before the backend marks it so. */
  const isPastEnd = (bale: SingleBale) => new Date(bale.endIn) < new Date();
  const canRelist = (bale: SingleBale) =>
    RELISTABLE_BALE_STATUSES.includes(bale.status) && (bale.status === 'EXPIRED' || isPastEnd(bale));
  const shownStatus = (bale: SingleBale): BaleStatus => (bale.status === 'OPEN' && isPastEnd(bale) ? 'EXPIRED' : bale.status);

  const statusVariant = (status: BaleStatus) =>
    status === 'OPEN' ? 'success' : status === 'EXPIRED' || status === 'CANCELLED' ? 'danger' : 'primary';

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleApply = () => {
    setFilters({ ...tempFilters, page: 1 });
  }

  const handleClear = () => {
    const { search, ...rest } = tempFilters;

    const clearedFilters = {
      ...rest,
      page: 1,
    };

    setTempFilters((prev) => ({ ...prev, search: "" }));
    setFilters(clearedFilters as BaleFilters);
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  };

  function shortenText(str: string, num: number) {
    if (str?.length > num) {
      return str.slice(0, num) + '...'
    } else {
      return str
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Bales</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          className={`shadow-none ${isGetBalesLoading ? "bg-(--elevated) animate-pulse" : "bg-(--primary)"} text-white py-6!`}
        >
          <div
            className={`p-3 w-fit rounded-xl ${isGetBalesLoading ? "bg-(--primary)/50" : "bg-white/50"} mb-2`}
          >
            <RiArchive2Fill />
          </div>
          <h1
            className={`text-sm font-medium ${
              isGetBalesLoading ? "text-(--muted)" : "text-white/90"
            }`}
          >
            Total Bales
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isGetBalesLoading ? "—" : (totalItems ?? 0).toLocaleString()}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-(--primary)/20 mb-2`}>
            <RiArchiveLine className="text-(--primary)" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>Open on this page</h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isGetBalesLoading
              ? "—"
              : (
                  fetchedData.filter((bale) => shownStatus(bale) === "OPEN").length
                ).toLocaleString()}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-red-200 mb-2`}>
            <RiArchiveLine className="text-red-500" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>
            Not open on this page
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isGetBalesLoading
              ? "—"
              : (
                  fetchedData.filter((bale) => shownStatus(bale) !== "OPEN").length
                ).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Bales Table */}
      <Table
        aria-label="Bales Table"
        pageSize={filters.limit}
        onPageSizeChange={handlePageSizeChange}
        title="All Bales"
        // filter_placeholder="Filter by name..."
        customFilter={
          <div className="flex flex-col md:flex-row gap-2 justify-center items-start md:items-end w-full md:w-fit">
            <Input
              element="input"
              name="search"
              value={tempFilters.search!}
              handler={(e) =>
                setTempFilters((prevData) => ({
                  ...prevData,
                  search: e.target.value,
                }))
              }
              placeholder="Search..."
              genStyle="my-0!"
              styling="md:w-[200px]"
            />
            <div className="w-full">
              <p className="font-semibold">Status:</p>
              <Dropdown
                value={filters.status ?? "ALL"}
                onChange={(val) => {
                  const status = val === "ALL" ? undefined : (val as BaleStatus);
                  setTempFilters((prev) => ({ ...prev, status }));
                  setFilters((prev) => ({ ...prev, status, page: 1 }));
                }}
                options={["ALL", ...BALE_STATUSES]}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApply}
                className="bg-(--danger)! text-white"
                disabled={tempFilters.search == filters.search}
              >
                Apply
              </Button>
              {tempFilters.search != "" && (
                <Button onClick={handleClear} primary>
                  Clear
                </Button>
              )}
            </div>
          </div>
        }
      >
        <TableHeader>
          <TableRow>
            <TableColumn>Bale ID</TableColumn>
            <TableColumn>Product Name</TableColumn>  
            <TableColumn>Image</TableColumn>
            <TableColumn>Total Slots</TableColumn>
            <TableColumn>Filled Slots</TableColumn>
            <TableColumn>Price</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isGetBalesLoading}>
          {fetchedData.map((bale) => (
            <TableRow className="bg-(--card)" key={bale.id}>
              <TableCell>{bale?.id}</TableCell>
              <TableCell className="">
                {shortenText(bale.product.name, 30)}
              </TableCell>
              <TableCell>
                <img
                  src={bale.product.images[0]}
                  alt={shortenText(bale.product.name, 10)}
                  width={50}
                  height={50}
                  className="object-cover!"
                />
              </TableCell>
              <TableCell>{bale?.slot}</TableCell>
              <TableCell>{bale?.filledSlot}</TableCell>
              <TableCell>{fmtNgn(bale?.price)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(shownStatus(bale))}>{labelize(shownStatus(bale))}</Badge>
              </TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    {
                      label: "View",
                      onClick: () => {
                        setSelectedBaleId(bale.id);
                        setModalType("view");
                      },
                    },
                    {
                      label: "View Subscribers",
                      onClick: () => {
                        setSelectedBaleId(bale.id);
                        setModalType("view_subscribers");
                      },
                    },
                    {
                      label: "Edit",
                      onClick: () => {
                        setSelectedBaleId(bale.id);
                        setModalType("edit");
                      },
                    },
                    // The backend relists only an open or expired pool, and picks the new end date itself.
                    ...(canRelist(bale)
                      ? [
                          {
                            label: "Relist bale",
                            primary: true,
                            onClick: async () => {
                              const ok = await confirm({
                                title: "Relist this bale?",
                                message:
                                  "It starts again with no slots taken and ends in 1 to 3 days. This only works if nobody still has an unfinished order in it.",
                              });
                              if (ok) relistBale({ id: bale.id });
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
        page={filters.page ?? 1}
        totalPages={totalPages ?? 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        startIndex={(filters.page! - 1) * filters.limit! + 1}
        endIndex={(filters.page! - 1) * filters.limit! + fetchedData.length}
        itemLabel="bale(s)"
      />

      {selectedBaleId && modalType === "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedBaleId(null)}
          title="Bale details"
        >
          <ViewBale baleId={selectedBaleId} />
        </MyModal>
      )}

      {selectedBaleId && modalType === "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setSelectedBaleId(null)}
          title="Edit bale"
        >
          <EditBale baleId={selectedBaleId} onSuccess={() => setSelectedBaleId(null)} />
        </MyModal>
      )}

      {selectedBaleId && modalType === "view_subscribers" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedBaleId(null)}
          title="Subscribers"
        >
          <ViewSubscribers baleId={selectedBaleId} />
        </MyModal>
      )}
    </>
  );
}

export default Bales
