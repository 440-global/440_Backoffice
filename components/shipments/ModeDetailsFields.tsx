"use client";

import React from "react";
import type { AirModeDetails, SeaModeDetails } from "@/types/types";
import type { ShipmentMode } from "@/lib/enums";
import { AmountInput, Input } from "../ui";

type Props = {
  mode: ShipmentMode;
  value: Partial<SeaModeDetails> | Partial<AirModeDetails> | null | undefined;
  onChange: (key: string, value: string | number) => void;
  /** Backend messages keyed like `modeDetails.cbm`. */
  errors?: Record<string, string>;
};

/**
 * The extra details that only exist for one transport mode: a vessel for sea, a waybill and flight for air.
 * Every field is optional on the backend, so none is marked required.
 */
const ModeDetailsFields = ({ mode, value, onChange, errors = {} }: Props) => {
  const details = (value ?? {}) as Record<string, string | number | undefined>;
  const text = (key: string) => String(details[key] ?? "");
  const num = (key: string) => Number(details[key] ?? 0);
  const textHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange(e.target.name, e.target.value);

  return (
    <fieldset className="border border-(--table-border) px-4 rounded-md">
      <legend className="text-sm font-medium text-(--muted)">{mode === "AIR" ? "Air freight details" : "Sea freight details"}</legend>
      {mode === "SEA" ? (
        <>
          <Input element="input" name="vesselName" value={text("vesselName")} handler={textHandler} tag="Vessel name" placeholder="Enter vessel name" optional maxLength={120} error={errors["modeDetails.vesselName"]} />
          <Input element="input" name="voyage" value={text("voyage")} handler={textHandler} tag="Voyage" placeholder="Enter voyage number" optional maxLength={60} error={errors["modeDetails.voyage"]} />
          <Input element="input" name="billOfLading" value={text("billOfLading")} handler={textHandler} tag="Bill of lading" placeholder="Enter bill of lading number" optional maxLength={60} error={errors["modeDetails.billOfLading"]} />
          <AmountInput name="cbm" tag="Volume (CBM)" placeholder="Enter volume in cubic metres" value={num("cbm")} onChange={(n) => onChange("cbm", n)} allowZero optional error={errors["modeDetails.cbm"]} />
        </>
      ) : (
        <>
          <Input element="input" name="awb" value={text("awb")} handler={textHandler} tag="Air waybill (AWB) number" placeholder="Enter AWB number" optional maxLength={40} error={errors["modeDetails.awb"]} />
          <Input element="input" name="flightNumber" value={text("flightNumber")} handler={textHandler} tag="Flight number" placeholder="Enter flight number" optional maxLength={20} error={errors["modeDetails.flightNumber"]} />
          <Input element="input" name="originAirport" value={text("originAirport")} handler={textHandler} tag="Origin airport" placeholder="Airport code, e.g. CAN" optional maxLength={10} error={errors["modeDetails.originAirport"]} />
          <Input element="input" name="destinationAirport" value={text("destinationAirport")} handler={textHandler} tag="Destination airport" placeholder="Airport code, e.g. LOS" optional maxLength={10} error={errors["modeDetails.destinationAirport"]} />
          <AmountInput name="chargeableWeightKg" tag="Chargeable weight (kg)" placeholder="Enter chargeable weight" value={num("chargeableWeightKg")} onChange={(n) => onChange("chargeableWeightKg", n)} allowZero optional error={errors["modeDetails.chargeableWeightKg"]} />
        </>
      )}
    </fieldset>
  );
};

export default ModeDetailsFields;

/** Drops blank text and untouched zeros, so the backend gets only what the admin filled in. */
export function cleanModeDetails(
  value: Partial<SeaModeDetails> | Partial<AirModeDetails> | null | undefined,
): Record<string, string | number> | undefined {
  const out: Record<string, string | number> = {};
  for (const [key, v] of Object.entries(value ?? {})) {
    if (typeof v === "string" && v.trim() !== "") out[key] = v.trim();
    else if (typeof v === "number" && v > 0) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
