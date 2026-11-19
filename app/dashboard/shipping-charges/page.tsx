"use client";

import React, { useState } from "react";
import { RiAddFill } from "react-icons/ri";
import { useGetShippingSettings } from "../../../api/shipping";
import { useCan } from "@/hooks/use-can";
import { fmtNgn, fmtUsd } from "@/lib/format";
import { UNIT_INPUT } from "@/lib/enums";
import { Button } from "../../../components/ui";
import MyModal from "../../../components/dashboard/Modal";
import AddCharge from "../../../components/shipping/AddCharge";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "../../../components/ui/table/TableWrapper";

const tba = <span className="text-(--muted)">To be advised</span>;

const ShippingCharges = () => {
  const { data, isPending, error } = useGetShippingSettings();
  const [modalType, setModalType] = useState<"add" | null>(null);

  const canEdit = useCan("shippingSettings.write");
  const settings = data?.data;
  const cards = settings?.cards ?? [];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold">Shipping Settings</h3>
          {settings && (
            <p className="text-sm text-(--muted) mt-1">
              Exchange rate:{" "}
              {settings.usdToNgn ? `$1 = ${fmtNgn(settings.usdToNgn)}` : "not set yet. Charges cannot be created until it is."}
            </p>
          )}
        </div>
        {canEdit && (
          <Button
            primary
            className="flex items-center gap-1"
            onClick={() => setModalType("add")}
          >
            <RiAddFill className="font-bold" />
            Update settings
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">
          Failed to load shipping settings.
        </p>
      )}

      <Table aria-label="Shipping Settings Table" title="Shipping Rate Cards">
        <TableHeader>
          <TableRow>
            <TableColumn>Service</TableColumn>
            <TableColumn>Goods Type</TableColumn>
            <TableColumn>Unit</TableColumn>
            <TableColumn>Freight (USD)</TableColumn>
            <TableColumn>Clearing (NGN)</TableColumn>
            <TableColumn>Misc (NGN)</TableColumn>
            <TableColumn>Status</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isPending}>
          {cards.length === 0 && !isPending ? (
            <TableRow className="bg-(--card)">
              <TableCell colSpan={7}>No shipping rate cards yet.</TableCell>
            </TableRow>
          ) : (
            cards.map((card) => (
              <TableRow className="bg-(--card)" key={card.id}>
                <TableCell>{card.serviceLabel}</TableCell>
                <TableCell>{card.goodsTypeLabel}</TableCell>
                <TableCell>{UNIT_INPUT[card.unit].suffix}</TableCell>
                <TableCell>{fmtUsd(card.freightUsd)}</TableCell>
                <TableCell>
                  {card.clearingNgn === null ? tba : fmtNgn(card.clearingNgn)}
                </TableCell>
                <TableCell>
                  {card.service !== "CONTAINER"
                    ? "Not applicable"
                    : card.miscNgn === null
                      ? tba
                      : fmtNgn(card.miscNgn)}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      card.isActive ? "text-green-500" : "text-(--muted)"
                    }
                  >
                    {card.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {modalType == "add" && (
        <MyModal
          title="Update shipping settings"
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          isOpen={true}
        >
          <AddCharge settings={settings} onSuccess={() => setModalType(null)} />
        </MyModal>
      )}
    </>
  );
};

export default ShippingCharges;