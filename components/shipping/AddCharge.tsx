"use client";

import React, { useState } from "react";
import { usePutShippingSettings } from "@/api/shipping";
import { getApiError } from "@/lib/api-error";
import {
  GOODS_TYPE_OPTIONS,
  SHIPPING_SERVICE_OPTIONS,
  UNIT_OF_SERVICE,
  type GoodsType,
  type ShippingService,
} from "@/lib/enums";
import type { ShippingCard, ShippingCardPatch, ShippingResponse, ShippingSettingsPayload } from "@/types/shipping";
import { AmountInput, Button, Input } from "../ui";

type Props = {
  /** What is saved now. The form starts from it, so changing one rate does not mean retyping the rest. */
  settings?: ShippingResponse["data"];
  onSuccess: () => void;
};

type Row = {
  key: string;
  /** A saved card: its service and goods type cannot change, only its rates and whether it is active. */
  saved: ShippingCard | null;
  service: ShippingService;
  goodsType: GoodsType;
  freightUsd: number;
  /** `null` is "to be advised", which only container shipping may leave on the card. */
  clearingNgn: number | null;
  miscNgn: number | null;
  isActive: boolean;
};

const rowFromCard = (card: ShippingCard): Row => ({
  key: `saved-${card.id}`,
  saved: card,
  service: card.service,
  goodsType: card.goodsType,
  freightUsd: card.freightUsd,
  clearingNgn: card.clearingNgn,
  miscNgn: card.miscNgn,
  isActive: card.isActive,
});

let nextKey = 0;
const newRow = (): Row => ({
  key: `new-${nextKey++}`,
  saved: null,
  service: "GENERAL_SEA",
  goodsType: "NORMAL",
  freightUsd: 0,
  clearingNgn: 0,
  miscNgn: null,
  isActive: true,
});

const label = (service: ShippingService, goodsType: GoodsType) =>
  `${SHIPPING_SERVICE_OPTIONS.find((o) => o.value === service)?.label} / ${GOODS_TYPE_OPTIONS.find((o) => o.value === goodsType)?.label}`;

/** The patch for one row: everything for a new card, only what changed for a saved one, or nothing. */
function patchFor(row: Row): ShippingCardPatch | null {
  const base = { service: row.service, goodsType: row.goodsType };
  const isContainer = row.service === "CONTAINER";
  if (!row.saved) {
    return {
      ...base,
      freightUsd: row.freightUsd,
      clearingNgn: row.clearingNgn,
      ...(isContainer && { miscNgn: row.miscNgn }),
      isActive: row.isActive,
    };
  }
  const patch: ShippingCardPatch = { ...base };
  if (row.freightUsd !== row.saved.freightUsd) patch.freightUsd = row.freightUsd;
  if (row.clearingNgn !== row.saved.clearingNgn) patch.clearingNgn = row.clearingNgn;
  if (isContainer && row.miscNgn !== row.saved.miscNgn) patch.miscNgn = row.miscNgn;
  if (row.isActive !== row.saved.isActive) patch.isActive = row.isActive;
  return Object.keys(patch).length > 2 ? patch : null;
}

const AddCharge = ({ settings, onSuccess }: Props) => {
  const [usdToNgn, setUsdToNgn] = useState(settings?.usdToNgn ?? 0);
  const [rows, setRows] = useState<Row[]>(() => (settings?.cards ?? []).map(rowFromCard));
  const [problem, setProblem] = useState<string | null>(null);
  const { mutate, isPending, error } = usePutShippingSettings();

  const update = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProblem(null);

    const rateChanged = usdToNgn !== (settings?.usdToNgn ?? 0);
    if (rateChanged && !(usdToNgn > 0)) return setProblem("Enter the USD to NGN rate (more than 0).");

    const seen = new Set<string>();
    for (const row of rows) {
      const id = `${row.service}:${row.goodsType}`;
      if (seen.has(id)) return setProblem(`${label(row.service, row.goodsType)} appears twice. Each service and goods type can only have one card.`);
      seen.add(id);
    }

    const cards: ShippingCardPatch[] = [];
    for (const row of rows) {
      const patch = patchFor(row);
      if (!patch) continue;
      if (!row.saved) {
        if (!(row.freightUsd > 0)) return setProblem(`${label(row.service, row.goodsType)}: enter the freight rate (USD).`);
        if (row.service !== "CONTAINER" && !(row.clearingNgn && row.clearingNgn > 0)) {
          return setProblem(`${label(row.service, row.goodsType)}: enter the clearing rate. Only container shipping can leave it to be advised.`);
        }
      }
      cards.push(patch);
    }

    if (!rateChanged && cards.length === 0) return setProblem("Nothing has changed.");

    const payload: ShippingSettingsPayload = { ...(rateChanged && { usdToNgn }), ...(cards.length > 0 && { cards }) };
    mutate(payload, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit}>
      <AmountInput
        name="usdToNgn"
        tag="USD to NGN rate"
        placeholder="Enter exchange rate"
        value={usdToNgn}
        onChange={(n) => setUsdToNgn(n)}
        helperText="New charges use this rate. Charges that already exist keep the rate they were created with."
        required
      />

      {rows.map((row) => {
        const isContainer = row.service === "CONTAINER";
        const unit = UNIT_OF_SERVICE[row.service];
        const per = unit === "CONTAINER" ? "container" : unit;
        return (
          <fieldset key={row.key} className="border border-(--table-border) px-4 rounded-md pb-3 mt-4">
            <legend className="text-sm font-medium text-(--muted)">
              {row.saved ? label(row.service, row.goodsType) : "New rate card"}
            </legend>

            {!row.saved && (
              <>
                <Input
                  element="select"
                  name={`service-${row.key}`}
                  value={row.service}
                  handler={(e) => {
                    const service = e.target.value as ShippingService;
                    update(row.key, {
                      service,
                      miscNgn: null,
                      clearingNgn: service === "CONTAINER" ? row.clearingNgn : row.clearingNgn ?? 0,
                    });
                  }}
                  tag="Shipping service"
                  placeholder="Select shipping service"
                  selectOptions={SHIPPING_SERVICE_OPTIONS}
                  required
                />
                <Input
                  element="select"
                  name={`goodsType-${row.key}`}
                  value={row.goodsType}
                  handler={(e) => update(row.key, { goodsType: e.target.value as GoodsType })}
                  tag="Type of goods"
                  placeholder="Select goods type"
                  selectOptions={GOODS_TYPE_OPTIONS}
                  required
                />
              </>
            )}

            <AmountInput
              name={`freight-${row.key}`}
              tag={`Freight rate (USD per ${per})`}
              placeholder="Enter amount"
              value={row.freightUsd}
              onChange={(n) => update(row.key, { freightUsd: n })}
              required
            />

            <AmountInput
              name={`clearing-${row.key}`}
              tag={`Clearing rate (NGN per ${per})`}
              placeholder={row.clearingNgn === null ? "To be advised" : "Enter amount"}
              value={row.clearingNgn ?? 0}
              onChange={(n) => update(row.key, { clearingNgn: n })}
              disabled={row.clearingNgn === null}
              required={!isContainer}
              optional={isContainer}
            />
            {isContainer && (
              <label className="flex items-center gap-2 text-sm -mt-2 mb-2">
                <input
                  type="checkbox"
                  checked={row.clearingNgn === null}
                  onChange={(e) => update(row.key, { clearingNgn: e.target.checked ? null : 0 })}
                />
                To be advised (the admin enters it on each charge)
              </label>
            )}

            {isContainer && (
              <>
                <AmountInput
                  name={`misc-${row.key}`}
                  tag="Miscellaneous expenses (NGN, flat)"
                  placeholder={row.miscNgn === null ? "To be advised" : "Enter amount"}
                  value={row.miscNgn ?? 0}
                  onChange={(n) => update(row.key, { miscNgn: n })}
                  disabled={row.miscNgn === null}
                  optional
                />
                <label className="flex items-center gap-2 text-sm -mt-2 mb-2">
                  <input
                    type="checkbox"
                    checked={row.miscNgn === null}
                    onChange={(e) => update(row.key, { miscNgn: e.target.checked ? null : 0 })}
                  />
                  To be advised (the admin enters it on each charge)
                </label>
              </>
            )}

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isActive}
                  onChange={(e) => update(row.key, { isActive: e.target.checked })}
                />
                Active (admins can add charges from this card)
              </label>

              {!row.saved && (
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                  className="text-sm text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
          </fieldset>
        );
      })}

      <button type="button" onClick={() => setRows((prev) => [...prev, newRow()])} className="text-sm font-medium mt-3 mb-4">
        + Add a rate card
      </button>

      {(problem || !!error) && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {problem ?? (error ? getApiError(error).message : null)}
        </p>
      )}

      <Button type="submit" primary isFullWidth isLoading={isPending}>
        {isPending ? "Saving settings..." : "Save settings"}
      </Button>
    </form>
  );
};

export default AddCharge;
