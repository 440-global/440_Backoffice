"use client";

import React, { useState } from "react";
import type { ProductPurchaseOptions } from "@/types/types";
import { AmountInput, Button, Input, Switch } from "../ui";

type Mode = ProductPurchaseOptions["mode"];

const MODE_LABEL: Record<Mode, string> = { DIRECT: "Direct purchase", POOL: "Pooled purchase" };
const ALL_MODES: Mode[] = ["DIRECT", "POOL"];

/** What each mode limits for one buyer. The size of a pool is set on its bale, not here. */
const LIMITS: Record<Mode, { min: "minQty" | "minSlotsPerBuyer"; max: "maxQty" | "maxSlotsPerBuyer"; unit: string }> = {
  DIRECT: { min: "minQty", max: "maxQty", unit: "units" },
  POOL: { min: "minSlotsPerBuyer", max: "maxSlotsPerBuyer", unit: "slots" },
};

const describe = (option: ProductPurchaseOptions): string => {
  const { min, max, unit } = LIMITS[option.mode];
  const lo = option[min] ?? 1;
  const hi = option[max];
  return `At least ${lo} ${unit}, ${hi != null ? `up to ${hi}` : "no upper limit"}`;
};

type Props = {
  options: ProductPurchaseOptions[];
  onChange: (options: ProductPurchaseOptions[]) => void;
};

/**
 * Optional: a product with no purchase options is sold on the default rules. One mode or both can be set;
 * each can be switched on or off, and `no limit` is simply an empty maximum.
 */
const PurchaseOptionsStep = ({ options, onChange }: Props) => {
  const [mode, setMode] = useState<Mode | "">("");
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(0);
  const [maxTyped, setMaxTyped] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const used = options.map((o) => o.mode);
  const available = ALL_MODES.filter((m) => !used.includes(m));
  const hasMax = maxTyped && max > 0;
  const maxBelowMin = hasMax && max < min;
  const canAdd = mode !== "" && min >= 1 && !maxBelowMin;

  const reset = () => {
    setMode("");
    setMin(1);
    setMax(0);
    setMaxTyped(false);
    setEnabled(true);
  };

  const add = () => {
    if (!canAdd || !mode) return;
    const { min: minKey, max: maxKey } = LIMITS[mode];
    onChange([...options, { mode, enabled, [minKey]: min, [maxKey]: hasMax ? max : null }]);
    reset();
  };

  const unit = mode ? LIMITS[mode].unit : "units";

  return (
    <>
      <p className="mb-3 text-sm text-(--muted)">
        Choose how customers can buy this product. This step is optional: with nothing here the product is sold on the default
        rules. You can set direct purchase, pooled purchase, or both.
      </p>

      {options.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {options.map((opt) => (
            <div key={opt.mode} className="flex flex-col gap-2 justify-between rounded-xl border border-(--table-border) p-3">
              <div>
                <p className="font-medium">{MODE_LABEL[opt.mode]}</p>
                <p className="text-sm text-(--muted)">{describe(opt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2 items-center">
                  <p className="font-bold">Enabled:</p>
                  <Switch
                    label={`${MODE_LABEL[opt.mode]} enabled`}
                    checked={opt.enabled}
                    onChange={() => onChange(options.map((o) => (o.mode === opt.mode ? { ...o, enabled: !o.enabled } : o)))}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => onChange(options.filter((o) => o.mode !== opt.mode))}
                  className="bg-red-500 py-1! px-3! rounded-lg! text-sm"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 ? (
        <div className="rounded-xl border border-(--table-border) px-3 pt-1 pb-3 mb-4">
          <Input
            element="select"
            name="mode"
            tag="Purchase mode"
            placeholder="Select purchase mode"
            value={mode}
            handler={(e) => {
              setMode(e.target.value as Mode | "");
              setMin(1);
              setMax(0);
              setMaxTyped(false);
            }}
            selectOptions={available.map((m) => ({ label: MODE_LABEL[m], value: m }))}
          />

          {mode && (
            <>
              <AmountInput
                name="min"
                tag={`Smallest number of ${unit} per buyer`}
                value={min}
                onChange={(n) => setMin(n)}
                integer
                min={1}
                required
              />
              <AmountInput
                name="max"
                tag={`Largest number of ${unit} per buyer`}
                placeholder="No limit"
                value={max}
                onChange={(n, typed) => {
                  setMax(n);
                  setMaxTyped(typed);
                }}
                integer
                helperText="Leave empty for no limit."
                optional
                error={maxBelowMin ? "The largest number cannot be below the smallest." : undefined}
              />
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Enabled</span>
                <Switch label="Enabled" checked={enabled} onChange={setEnabled} />
              </div>
            </>
          )}

          <Button type="button" onClick={add} disabled={!canAdd}>
            Add purchase option
          </Button>
        </div>
      ) : (
        <p className="text-sm text-(--muted) mb-4">Both purchase modes have been added.</p>
      )}
    </>
  );
};

export default PurchaseOptionsStep;
