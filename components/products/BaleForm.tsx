"use client";

import React, { useState } from "react";
import { useCreateBale } from "@/api/bales";
import { useGetSingleProduct } from "@/api/product";
import { getApiError, issuesByField } from "@/lib/api-error";
import { currencies } from "@/lib/currencies";
import { fmtMoney, fromLocalInputValue } from "@/lib/format";
import type { BalePriceTier, CreateBale } from "@/types/types";
import { AmountInput, Button, Input } from "../ui";

type Props = {
  productId: number;
  /** Shown above the form. When the bale is offered right after a product is created, also says what for. */
  productName?: string;
  onSuccess: () => void;
  /** Adds a "Skip for now" button. Used right after a product is created, when a bale is optional. */
  onSkip?: () => void;
};

type TierRow = { key: number; min: number; max: number; price: number; maxTyped: boolean };

let tierKey = 0;

/** The same rule the backend applies: every slot from 1 to `slots` is in exactly one tier. */
function tierProblem(slots: number, tiers: TierRow[]): string | null {
  if (tiers.length === 0) return null;
  for (const [i, t] of tiers.entries()) {
    if (!(t.min >= 1)) return `Tier ${i + 1}: start at slot 1 or higher.`;
    if (!(t.price > 0)) return `Tier ${i + 1}: enter a price.`;
    const end = t.maxTyped && t.max > 0 ? t.max : slots;
    if (end < t.min) return `Tier ${i + 1}: the last slot is below the first.`;
    if (end > slots) return `Tier ${i + 1}: runs past the ${slots} slots in the bale.`;
  }
  for (let slot = 1; slot <= slots; slot++) {
    const covering = tiers.filter((t) => slot >= t.min && slot <= (t.maxTyped && t.max > 0 ? t.max : slots)).length;
    if (covering === 0) return `Slot ${slot} has no price. Every slot from 1 to ${slots} needs one.`;
    if (covering > 1) return `Slot ${slot} is in more than one tier.`;
  }
  return null;
}

/**
 * Creates a bale (a pool of slots) for a product. Replaces two near-identical forms. Only the number of slots
 * is required; price, old price and currency default to the product's, the quantity to the slots, and the
 * end date to 5 to 10 days away, so none of those are asked for unless the admin wants a different value.
 */
const BaleForm = ({ productId, productName, onSuccess, onSkip }: Props) => {
  const { data: product } = useGetSingleProduct(productId);
  const { mutate, isPending, error } = useCreateBale();
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const [slots, setSlots] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [currency, setCurrency] = useState("");
  const [price, setPrice] = useState(0);
  const [oldPrice, setOldPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [filledSlot, setFilledSlot] = useState(0);
  const [endIn, setEndIn] = useState("");
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [allowSecondPool, setAllowSecondPool] = useState(false);

  const productPrice = product ? fmtMoney(product.price, product.currency) : null;
  const tiersBad = tierProblem(slots, tiers);
  const filledTooMany = filledSlot > slots && slots > 0;
  const canSubmit = slots >= 1 && !tiersBad && !filledTooMany;

  const updateTier = (key: number, patch: Partial<TierRow>) => setTiers((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const body: CreateBale = {
      productId,
      slot: slots,
      ...(quantity > 0 && { quantity }),
      ...(currency && { currency }),
      ...(price > 0 && { price }),
      ...(oldPrice > 0 && { oldPrice }),
      ...(originalPrice > 0 && { originalPrice }),
      ...(filledSlot > 0 && { filledSlot }),
      ...(endIn && { endIn: fromLocalInputValue(endIn) }),
      ...(tiers.length > 0 && {
        prices: tiers.map((t): BalePriceTier => ({ price: t.price, min: t.min, max: t.maxTyped && t.max > 0 ? t.max : null })),
      }),
      ...(allowSecondPool && { allowSecondPool: true }),
    };
    mutate(body, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1 my-2">
        <h1 className="text-lg font-semibold">{productName ? `Bale for ${productName}` : "Bale information"}</h1>
        <p className="text-(--muted) text-sm">
          A bale is a pool of slots customers buy into. Only the number of slots is required; leave the rest to use the product&apos;s
          own values.
        </p>
      </div>

      <AmountInput
        name="slot"
        tag="Number of slots"
        placeholder="Enter number of slots"
        value={slots}
        onChange={(n) => setSlots(n)}
        integer
        min={1}
        helperText="A single-slot bale is just 1."
        required
        error={fieldErrors.slot}
      />
      <AmountInput
        name="quantity"
        tag="Units in the bale"
        placeholder={slots > 0 ? `Same as slots (${slots})` : "Same as slots"}
        value={quantity}
        onChange={(n) => setQuantity(n)}
        integer
        optional
        error={fieldErrors.quantity}
      />
      <Input
        element="select"
        placeholder={product?.currency ? `Product's currency (${product.currency})` : "Product's currency"}
        tag="Currency"
        name="currency"
        value={currency}
        handler={(e) => setCurrency(e.target.value)}
        selectOptions={currencies}
        optional
        error={fieldErrors.currency}
      />
      <AmountInput
        name="price"
        tag="Price"
        placeholder="Enter price"
        value={price}
        onChange={(n) => setPrice(n)}
        helperText={productPrice ? `Leave empty to use the product's price (${productPrice}).` : "Leave empty to use the product's price."}
        optional
        error={fieldErrors.price}
      />
      <AmountInput
        name="oldPrice"
        tag="Old price"
        placeholder="Enter old price"
        value={oldPrice}
        onChange={(n) => setOldPrice(n)}
        helperText={product ? `Leave empty to use the product's (${fmtMoney(product.oldPrice, product.currency)}).` : undefined}
        optional
        error={fieldErrors.oldPrice}
      />
      <AmountInput
        name="originalPrice"
        tag="Original price (cost)"
        placeholder="Enter original price"
        value={originalPrice}
        onChange={(n) => setOriginalPrice(n)}
        helperText="What it costs you. Kept for margin tracking and never shown to customers."
        optional
        error={fieldErrors.originalPrice}
      />
      <Input
        element="input"
        input_type="datetime-local"
        name="endIn"
        value={endIn}
        handler={(e) => setEndIn(e.target.value)}
        tag="Pool ends"
        helperText="Leave empty and the pool ends 5 to 10 days from now."
        optional
        error={fieldErrors.endIn}
      />
      <AmountInput
        name="filledSlot"
        tag="Slots already taken"
        placeholder="0"
        value={filledSlot}
        onChange={(n) => setFilledSlot(n)}
        integer
        optional
        error={fieldErrors.filledSlot ?? (filledTooMany ? "More than the number of slots." : undefined)}
      />

      <fieldset className="border border-(--table-border) px-4 rounded-md pb-3 mb-3">
        <legend className="text-sm font-medium text-(--muted)">Slot prices (optional)</legend>
        <p className="mt-2 text-xs text-(--muted)">
          Give different slots different prices, for example the first 5 slots cheaper. Together the tiers must cover every slot
          from 1 to {slots > 0 ? slots : "the last"} exactly once. Leave the last slot empty to run to the end.
        </p>
        {tiers.map((t, i) => (
          <div key={t.key} className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-(--table-border) p-2 sm:grid-cols-4">
            <AmountInput name={`tier-min-${t.key}`} tag="From slot" value={t.min} onChange={(n) => updateTier(t.key, { min: n })} integer min={1} required genStyle="my-0!" />
            <AmountInput
              name={`tier-max-${t.key}`}
              tag="To slot"
              placeholder="Last"
              value={t.max}
              onChange={(n, typed) => updateTier(t.key, { max: n, maxTyped: typed })}
              integer
              optional
              genStyle="my-0!"
            />
            <AmountInput name={`tier-price-${t.key}`} tag="Price per slot" value={t.price} onChange={(n) => updateTier(t.key, { price: n })} required genStyle="my-0!" />
            <button type="button" onClick={() => setTiers((prev) => prev.filter((x) => x.key !== t.key))} className="self-end text-sm text-red-500" aria-label={`Remove tier ${i + 1}`}>
              Remove
            </button>
          </div>
        ))}
        {tiersBad && (
          <p role="alert" className="mt-2 text-xs text-red-500">
            {tiersBad}
          </p>
        )}
        {fieldErrors.prices && (
          <p role="alert" className="mt-2 text-xs text-red-500">
            {fieldErrors.prices}
          </p>
        )}
        <button
          type="button"
          onClick={() => setTiers((prev) => [...prev, { key: tierKey++, min: prev.length ? Math.max(...prev.map((t) => (t.maxTyped && t.max > 0 ? t.max : t.min))) + 1 : 1, max: 0, price: 0, maxTyped: false }])}
          className="mt-3 text-sm font-medium"
        >
          + Add a tier
        </button>
      </fieldset>

      {parsed?.code === "OPEN_POOL_EXISTS" && (
        <div role="alert" className="mb-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
          <p>This product already has an open pool.</p>
          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" checked={allowSecondPool} onChange={(e) => setAllowSecondPool(e.target.checked)} />
            Create another one anyway
          </label>
        </div>
      )}
      {parsed && parsed.code !== "OPEN_POOL_EXISTS" && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {parsed.code === "MODE_DISABLED" ? "Pooled purchase is switched off for this product. Turn it on in its purchase options first." : parsed.message}
          {parsed.issues.length > 0 && Object.keys(fieldErrors).length === 0 ? ": " + parsed.issues.map((i) => i.message).join("; ") : ""}
        </p>
      )}

      <div className="flex gap-2">
        {onSkip && (
          <Button type="button" onClick={onSkip} disabled={isPending}>
            Skip for now
          </Button>
        )}
        <Button type="submit" primary isFullWidth={!onSkip} isLoading={isPending} disabled={!canSubmit || (parsed?.code === "OPEN_POOL_EXISTS" && !allowSecondPool)}>
          {isPending ? "Creating bale..." : "Create bale"}
        </Button>
      </div>
    </form>
  );
};

export default BaleForm;
