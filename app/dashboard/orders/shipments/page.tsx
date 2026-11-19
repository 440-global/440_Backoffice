"use client"
import { useGetShipments } from '@/api/shipment';
import React, { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { fmtDateTime } from '@/lib/funcs';
import { ActionDropdown, Button, Card, Input } from "@/components/ui";
import { RiAddFill, RiFilterLine, RiFilterOffLine, RiShip2Line } from 'react-icons/ri';
import MyModal from '@/components/dashboard/Modal';
import { ShipmentParams } from '@/types/types';
import AddShipment from '@/components/shipments/AddShipment';
import { cn } from '@/components/ui/utils';
import { shipmentStatusPillClass } from '@/lib/order-badges';
import ViewShipment from '@/components/shipments/ViewShipment';
import EditShipment from '@/components/shipments/EditShipment';
import UpdateShipment from '@/components/shipments/UpdateShipment';
import AddShipmentEvent from '@/components/shipments/AddShipmentEvent';
import CopyButton from '@/components/ui/copy_button';
import { useCan } from '@/hooks/use-can';
import { SHIPMENT_MODES, SHIPMENT_PROVIDERS, SHIPMENT_STAGES, SHIPMENT_STATUSES, labelize, stageLabel } from '@/lib/enums';
import AddOrdersToShipment from '@/components/shipments/AddOrdersToShipment';

type Props = {}

const defaultFilters: ShipmentParams = {
  page: 1,
  limit: 10,
  status: "",
  mode: "",
  stage: "",
  provider: "",
  orderReference: "",
  trackingNumber: "",
  containerNumber: "",
  delayed: false,
}

const STATUS_OPTIONS = SHIPMENT_STATUSES;
const MODE_OPTIONS = SHIPMENT_MODES;
const STAGE_OPTIONS = SHIPMENT_STAGES;
const PROVIDER_OPTIONS = SHIPMENT_PROVIDERS;

const DELAYED_OPTIONS = [
  { label: "Yes", value: true },
  { label: "No", value: false },
] as const;

const Shipments = (props: Props) => {
  const [tempFilters, setTempFilters] = useState(defaultFilters);
  const [filters, setFilters] = useState(defaultFilters);
  const [modalType, setModalType] = useState<"add" | "view" | "edit" | "update" | "event" | "add-orders" | null>(
    null,
  );
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
  const canWrite = useCan("shipment.write");

  const { data, isPending, error } = useGetShipments(filters);
  const shipments = data?.data?.shipments ?? [];
  const totalPages = data?.data?.totalPages;
  const page = data?.data?.page;
  const totalItems = data?.data?.total;
  const limit = data?.data?.limit;

  const [query, setQuery] = useState("");

  // The server already returns one page. This box only narrows the rows on that page; the filters above
  // search every shipment. Tracking number and carrier are optional, so either may be missing.
  const visibleShipments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter(
      (item) =>
        (item.trackingNumber ?? "").toLowerCase().includes(q) ||
        (item.carrier ?? "").toLowerCase().includes(q),
    );
  }, [query, shipments]);

  const currentPage = page ?? 1;
  const pageSize = limit ?? filters.limit;
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = (currentPage - 1) * pageSize + shipments.length;

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

  const handleFilter = (value: string) => {
    setQuery(value);
    // setCurrentPage(1);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Shipments</h3>
        {canWrite && (
          <Button
            primary
            className="flex items-center gap-1"
            onClick={() => setModalType("add")}
          >
            <RiAddFill className="font-bold" />
            Add shipment
          </Button>
        )}
      </div>

      <Card className="shadow-none! border border-(--table-border) mb-4 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 lg:grid-cols-5 gap-3">
          <Input
            element="select"
            value={tempFilters.limit!}
            name="limit"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                limit: Number(e.target.value),
              }))
            }
            tag="Limit"
            placeholder="Limit"
            genStyle="my-0! flex-1"
            selectOptions={[10, 20, 30, 40, 50].map((val) => {
              return {
                label: String(val),
                value: String(val),
              };
            })}
          />
          <Input
            element="select"
            value={tempFilters.status!}
            name="status"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                status: e.target.value,
              }))
            }
            tag="Status"
            placeholder="Select shipment status"
            genStyle="my-0! flex-1"
            selectOptions={STATUS_OPTIONS.map((val) => {
              return {
                label: labelize(val),
                value: String(val),
              };
            })}
          />
          <Input
            element="select"
            value={tempFilters.mode!}
            name="mode"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                mode: e.target.value,
              }))
            }
            tag="Mode"
            placeholder="Select shipment mode"
            genStyle="my-0! flex-1"
            selectOptions={MODE_OPTIONS.map((val) => {
              return {
                label: labelize(val),
                value: String(val),
              };
            })}
          />
          <Input
            element="select"
            value={tempFilters.stage!}
            name="stage"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                stage: e.target.value,
              }))
            }
            tag="Stage"
            placeholder="Stage"
            genStyle="my-0! flex-1"
            selectOptions={STAGE_OPTIONS.map((val) => {
              return {
                label: stageLabel(val),
                value: String(val),
              };
            })}
          />
          <Input
            element="select"
            value={tempFilters.provider!}
            name="provider"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                provider: e.target.value,
              }))
            }
            tag="Provider"
            placeholder="Select provider"
            genStyle="my-0! flex-1"
            selectOptions={PROVIDER_OPTIONS.map((val) => {
              return {
                label: labelize(val),
                value: String(val),
              };
            })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 lg:grid-cols-5 gap-3">
          <Input
            element="input"
            value={tempFilters.orderReference!}
            name="orderReference"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                orderReference: e.target.value,
              }))
            }
            tag="Order Reference"
            placeholder="Order Reference"
            genStyle="my-0! flex-1"
          />
          <Input
            element="input"
            value={tempFilters.trackingNumber!}
            name="trackingNumber"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                trackingNumber: e.target.value,
              }))
            }
            tag="Tracking Number"
            placeholder="Tracking Number"
            genStyle="my-0! flex-1"
          />
          <Input
            element="input"
            value={tempFilters.containerNumber!}
            name="containerNumber"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                containerNumber: e.target.value,
              }))
            }
            tag="Container Number"
            placeholder="Container Number"
            genStyle="my-0! flex-1"
          />
          <Input
            element="select"
            value={
              tempFilters.delayed === undefined
                ? ""
                : String(tempFilters.delayed)
            }
            name="delayed"
            handler={(e) =>
              setTempFilters((f) => ({
                ...f,
                delayed: e.target.value === "true",
              }))
            }
            tag="Delayed"
            placeholder="Delayed"
            genStyle="my-0! flex-1"
            selectOptions={DELAYED_OPTIONS.map((val) => ({
              label: val.label,
              value: String(val.value),
            }))}
          />
          <div className="flex flex-wrap gap-2 justify-end items-end">
            <Button
              onClick={handleClear}
              className="flex items-center gap-1 py-2! px-4! rounded-lg! bg-red-500"
            >
              <RiFilterOffLine />
              Clear
            </Button>
            <Button
              primary
              onClick={handleApply}
              className="flex items-center gap-1 py-2! px-4! rounded-lg!"
            >
              <RiFilterLine />
              Apply filters
            </Button>
          </div>
        </div>
      </Card>

      <Table
        aria-label="Shipments' Table"
        filterable
        onFilter={handleFilter}
        // pageSize={rowsPerPage}
        // onPageSizeChange={handlePageSizeChange}
        title="Shipments Table"
        filter_placeholder="Narrow this page by tracking number or carrier..."
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Tracking Number</TableColumn>
            <TableColumn>Carrier</TableColumn>
            <TableColumn>Provider</TableColumn>
            <TableColumn>Estimated Delivery</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isPending}
          emptyContent={
            <div className="min-h-50 flex justify-center items-center flex-col gap-4 text-center">
              <RiShip2Line size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No Shipments</h2>
                <p>There are currently no shipments pending</p>
              </div>
            </div>
          }
        >
          {visibleShipments.map((shipment) => (
            <TableRow key={shipment.id} className="bg-(--surface)">
              <TableCell>{shipment.id}</TableCell>
              <TableCell>{shipment.trackingNumber ?? "—"}</TableCell>
              <TableCell>{shipment.carrier ?? "—"}</TableCell>
              <TableCell>{labelize(shipment.provider)}</TableCell>
              <TableCell>{fmtDateTime(shipment.estimatedDelivery ?? undefined)}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs",
                    shipmentStatusPillClass(shipment.status),
                  )}
                >
                  {labelize(shipment.status)}
                </span>
              </TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    {
                      label: "View",
                      onClick: () => {
                        setModalType("view");
                        setSelectedShipmentId(shipment.id);
                      },
                    },
                    ...(canWrite
                      ? [
                          {
                            label: "Edit details",
                            onClick: () => {
                              setModalType("edit");
                              setSelectedShipmentId(shipment.id);
                            },
                          },
                          {
                            label: "Update status",
                            onClick: () => {
                              setModalType("update");
                              setSelectedShipmentId(shipment.id);
                            },
                          },
                          {
                            label: "Add update",
                            onClick: () => {
                              setModalType("event");
                              setSelectedShipmentId(shipment.id);
                            },
                          },
                          {
                            label: "Add orders to shipment",
                            onClick: () => {
                              setModalType("add-orders");
                              setSelectedShipmentId(shipment.id);
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
        page={currentPage}
        totalPages={totalPages ?? 1}
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="shipment(s)"
      />

      {selectedShipmentId && modalType == "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedShipmentId(null)}
          title={`Shipment #${selectedShipmentId}`}
        >
          <ViewShipment shipmentId={selectedShipmentId} />
        </MyModal>
      )}

      {selectedShipmentId && modalType == "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedShipmentId(null)}
          title="Edit shipment"
        >
          <EditShipment
            shipmentId={selectedShipmentId}
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      )}

      {selectedShipmentId && modalType == "update" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedShipmentId(null)}
          title="Update shipment status"
        >
          <UpdateShipment
            shipmentId={selectedShipmentId}
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      )}

      {selectedShipmentId && modalType == "event" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedShipmentId(null)}
          title="Add shipment update"
        >
          <AddShipmentEvent
            shipmentId={selectedShipmentId}
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      )}

      {modalType == "add" && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          title="Add shipment"
        >
          <AddShipment onSuccess={() => setModalType(null)} />
        </MyModal>
      )}

      {modalType == "add-orders" && selectedShipmentId != null && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          title={`Add order shipment #${selectedShipmentId}`}
        >
          <AddOrdersToShipment 
            onSuccess={() => setModalType(null)} 
            shipmentId={selectedShipmentId}
          />
        </MyModal>
      )}
    </>
  );
}

export default Shipments