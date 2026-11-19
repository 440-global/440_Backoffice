"use client";

import React, { useEffect, useState } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { AmountInput, Button, Input } from "../ui";
import { useAddOfflineOrder } from "@/api/offline";
import { useGetAllProducts } from "@/api/product";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { getApiError, issuesByField } from "@/lib/api-error";
import { MIN_UPFRONT_PERCENT, OFFLINE_PAYMENT_STATES, PAYMENT_METHOD_OPTIONS } from "@/lib/enums";
import { fmtNgn, fromLocalInputValue } from "@/lib/format";
import { truncateText } from "@/lib/funcs";
import type { AddCustomerOrderPayload, OfflineOrderPayment, OrderPaymentMethod, OrderPaymentStatus } from "@/types/types";

type Props = {
  customerId: number;
  onSuccess: () => void;
  customerInfo: {
    name: string;
    email: string;
  };
};

type Line = {
  productId: number;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
};

type PartialBy = "percent" | "amount";

const STATE_OPTIONS = OFFLINE_PAYMENT_STATES.map((value) => ({
  value,
  label: { UNPAID: "Unpaid", PARTIAL: "Part paid", PAID: "Paid in full" }[value],
}));

const STEPS = ["Order items", "Payment"];

/** The backend takes images over https only, and a line name up to 255 characters. */
const httpsImage = (url: string | undefined) => (url && url.toLowerCase().startsWith("https://") ? url : undefined);

const AddCustomerOrder = ({ customerId, customerInfo, onSuccess }: Props) => {
  const [step, setStep] = useState(1);
  const [lines, setLines] = useState<Line[]>([]);

  const [state, setState] = useState<OrderPaymentStatus>("UNPAID");
  const [partialBy, setPartialBy] = useState<PartialBy>("percent");
  const [percent, setPercent] = useState(0);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<OrderPaymentMethod>("bank_transfer");
  const [bankReference, setBankReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [interestPercent, setInterestPercent] = useState(0);
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const keyFor = useIdempotencyKey();
  const { mutate, isPending: addPending, error: addError } = useAddOfflineOrder();
  const parsed = addError ? getApiError(addError) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const { data, isPending, error } = useGetAllProducts(
    { search: debouncedSearchTerm, limit: 20, page: 1 },
    Boolean(debouncedSearchTerm.trim()),
  );
  const products = data?.data ?? [];

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const paidNow =
    state === "PAID" ? total : state === "PARTIAL" ? round2(partialBy === "percent" ? (total * percent) / 100 : amount) : 0;
  const paidPercent = total > 0 ? round2((paidNow / total) * 100) : 0;
  const balance = round2(total - paidNow);

  const addProduct = (product: (typeof products)[number]) => {
    setLines((prev) => {
      if (prev.some((l) => l.productId === product.id)) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name.slice(0, 255),
          image: httpsImage(product.images?.[0]),
          quantity: 1,
          // The product list is already in naira, and the order keeps exactly the price typed here.
          unitPrice: Number(product.price) || 0,
        },
      ];
    });
    setSearchTerm("");
  };

  const updateLine = (productId: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));

  /** What is wrong with the payment as typed, in the backend's own terms. */
  const paymentProblem = (): string | null => {
    if (state === "PARTIAL") {
      if (partialBy === "percent") {
        if (!(percent >= MIN_UPFRONT_PERCENT && percent < 100)) {
          return `A part payment is ${MIN_UPFRONT_PERCENT}% to under 100% of the total.`;
        }
      } else if (!(amount > 0 && amount < total)) {
        return "A part payment must be more than 0 and less than the order total.";
      } else if (paidPercent + 0.005 < MIN_UPFRONT_PERCENT) {
        return `A part payment must be at least ${MIN_UPFRONT_PERCENT}% of the total (${fmtNgn((total * MIN_UPFRONT_PERCENT) / 100)}).`;
      }
    }
    return null;
  };
  const problem = step === 2 ? paymentProblem() : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 2 || lines.length === 0 || paymentProblem()) return;

    const details = {
      method,
      ...(method === "bank_transfer" && bankReference.trim() && { bankReference: bankReference.trim() }),
      ...(paidAt && { paidAt: fromLocalInputValue(paidAt) }),
      ...(note.trim() && { note: note.trim() }),
    };
    const payment: OfflineOrderPayment =
      state === "UNPAID"
        ? { state }
        : state === "PAID"
          ? { state, ...details }
          : { state, ...(partialBy === "percent" ? { percent } : { amount }), ...details };

    const body: AddCustomerOrderPayload = {
      customer: { id: customerId },
      items: lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        ...(l.image && { image: l.image }),
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
      payment,
      ...(state !== "PAID" && (dueDate || interestPercent > 0) && {
        balance: { ...(dueDate && { dueDate }), interestPercent },
      }),
      notifyCustomer,
    };

    mutate({ body, idempotencyKey: keyFor(body) }, { onSuccess });
  };

  return (
    <>
      <ol className="flex flex-row items-center justify-center gap-3 sm:gap-4 mb-6 pt-5" aria-label="Steps">
        {STEPS.map((label, idx) => {
          const n = idx + 1;
          const active = step >= n;
          return (
            <li key={label} className="flex items-center" aria-current={step === n ? "step" : undefined}>
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 mr-2 flex items-center justify-center rounded-full text-sm font-bold ${
                  active ? "bg-(--primary) text-(--surface)" : "bg-(--elevated) text-(--muted)"
                }`}
              >
                {n}
              </div>
              <span className={`mr-3 text-sm ${step === n ? "font-semibold" : "text-(--muted)"}`}>{label}</span>
              {idx < STEPS.length - 1 && (
                <div className={`hidden sm:block w-12 h-0.5 ${step > n ? "bg-(--primary)" : "bg-gray-300"}`} />
              )}
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <Input element="input" name="customerName" value={customerInfo.name} handler={() => {}} tag="Customer name" disabled />
            <Input element="input" name="customerEmail" value={customerInfo.email} handler={() => {}} tag="Customer email" disabled />

            <fieldset className="border border-(--table-border) px-4 rounded-md">
              <legend className="text-sm font-medium text-(--muted)">Order items</legend>
              <div className="relative">
                <Input
                  element="input"
                  name="searchTerm"
                  value={searchTerm}
                  handler={(e) => setSearchTerm(e.target.value)}
                  tag="Add a product"
                  placeholder="Search for a product"
                  helperText="Prices are in naira and are kept exactly as typed on the order."
                />

                {searchTerm.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-(--table-border) bg-(--background) shadow-lg">
                    {isPending ? (
                      <p className="p-3 text-sm text-(--muted)">Searching products...</p>
                    ) : error ? (
                      <p className="p-3 text-sm text-red-500">Failed to search products. Try again.</p>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProduct(product)}
                          className="flex w-full items-center gap-3 p-3 text-left hover:bg-(--elevatedHover) cursor-pointer"
                        >
                          {product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-(--table-border)" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-(--muted)">{fmtNgn(Number(product.price))}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-sm text-(--muted)">No products found.</p>
                    )}
                  </div>
                )}
              </div>

              {lines.length > 0 && (
                <div className="my-4 space-y-3 w-full">
                  {lines.map((line) => (
                    <div key={line.productId} className="w-full flex flex-col gap-3 rounded-md border border-(--table-border) p-3">
                      <div className="flex gap-2">
                        {line.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={line.image} alt="" className="h-12 w-12 rounded object-cover" />
                        )}
                        <p className="min-w-0 flex-1 text-sm font-medium whitespace-normal wrap-break-word">
                          {truncateText(line.name, 45)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <AmountInput
                          name={`quantity-${line.productId}`}
                          tag="Quantity"
                          value={line.quantity}
                          onChange={(n) => updateLine(line.productId, { quantity: Math.max(1, n) })}
                          integer
                          min={1}
                          required
                          genStyle="my-0!"
                        />
                        <AmountInput
                          name={`unitPrice-${line.productId}`}
                          tag="Unit price (NGN)"
                          value={line.unitPrice}
                          onChange={(n) => updateLine(line.productId, { unitPrice: n })}
                          required
                          genStyle="my-0!"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{fmtNgn(line.quantity * line.unitPrice)}</p>
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((l) => l.productId !== line.productId))}
                          className="text-sm text-red-500 py-2 px-3 flex items-center gap-1 cursor-pointer rounded-xl bg-red-100"
                        >
                          <RiDeleteBinLine />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <p className="text-right text-sm font-semibold">Order total: {fmtNgn(total)}</p>
                </div>
              )}
            </fieldset>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                primary
                disabled={lines.length < 1 || lines.some((l) => !(l.unitPrice > 0))}
                onClick={() => setStep(2)}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mb-3 rounded-lg bg-(--elevated) p-3 text-sm">
              Order total: <strong>{fmtNgn(total)}</strong> for {lines.length} item{lines.length === 1 ? "" : "s"}. Shipping is
              added later, once the goods are weighed.
            </p>

            <fieldset className="border border-(--table-border) px-4 rounded-md mb-3">
              <legend className="text-sm font-medium text-(--muted)">Payment</legend>
              <Input
                element="select"
                name="paymentState"
                value={state}
                handler={(e) => setState(e.target.value as OrderPaymentStatus)}
                tag="How much has been paid"
                placeholder="Select payment status"
                selectOptions={STATE_OPTIONS}
                required
                error={fieldErrors["payment.state"]}
              />

              {state === "PARTIAL" && (
                <>
                  <Input
                    element="select"
                    name="partialBy"
                    value={partialBy}
                    handler={(e) => setPartialBy(e.target.value as PartialBy)}
                    tag="Give the part paid as"
                    selectOptions={[
                      { value: "percent", label: "A percentage of the total" },
                      { value: "amount", label: "An amount" },
                    ]}
                    required
                  />
                  {partialBy === "percent" ? (
                    <AmountInput
                      name="percent"
                      tag="Percent paid"
                      placeholder={`${MIN_UPFRONT_PERCENT} to 99`}
                      value={percent}
                      onChange={(n) => setPercent(n)}
                      min={0}
                      max={99.99}
                      helperText={`At least ${MIN_UPFRONT_PERCENT}%, like a customer's split payment.`}
                      required
                      error={fieldErrors["payment.percent"]}
                    />
                  ) : (
                    <AmountInput
                      name="amount"
                      tag="Amount paid (NGN)"
                      placeholder="Enter amount paid"
                      value={amount}
                      onChange={(n) => setAmount(n)}
                      helperText={`At least ${fmtNgn((total * MIN_UPFRONT_PERCENT) / 100)} and under ${fmtNgn(total)}.`}
                      required
                      error={fieldErrors["payment.amount"]}
                    />
                  )}
                </>
              )}

              {state !== "UNPAID" && (
                <>
                  <p className="text-sm text-(--muted)">
                    Recorded as paid: <strong>{fmtNgn(paidNow)}</strong> ({paidPercent}%). Balance: <strong>{fmtNgn(balance)}</strong>.
                  </p>
                  <Input
                    element="select"
                    name="method"
                    value={method}
                    handler={(e) => setMethod(e.target.value as OrderPaymentMethod)}
                    tag="Payment method"
                    placeholder="Select payment method"
                    selectOptions={PAYMENT_METHOD_OPTIONS}
                    optional
                    error={fieldErrors["payment.method"]}
                  />
                  {method === "bank_transfer" && (
                    <Input
                      element="input"
                      name="bankReference"
                      value={bankReference}
                      handler={(e) => setBankReference(e.target.value)}
                      tag="Bank reference"
                      placeholder="Transfer reference"
                      optional
                      maxLength={64}
                      error={fieldErrors["payment.bankReference"]}
                    />
                  )}
                  <Input
                    element="input"
                    input_type="date"
                    name="paidAt"
                    value={paidAt}
                    handler={(e) => setPaidAt(e.target.value)}
                    tag="Paid at"
                    helperText="Leave empty to use the time you save this. It cannot be in the future."
                    optional
                    error={fieldErrors["payment.paidAt"]}
                  />
                  <Input
                    element="textarea"
                    name="note"
                    value={note}
                    handler={(e) => setNote(e.target.value)}
                    tag="Payment note"
                    placeholder="Anything the team should know"
                    optional
                    maxLength={500}
                    error={fieldErrors["payment.note"]}
                  />
                </>
              )}
            </fieldset>

            {state !== "PAID" && (
              <fieldset className="border border-(--table-border) px-4 rounded-md mb-3">
                <legend className="text-sm font-medium text-(--muted)">Balance</legend>
                <Input
                  element="input"
                  input_type="date"
                  name="dueDate"
                  value={dueDate}
                  handler={(e) => setDueDate(e.target.value)}
                  tag="Due date"
                  helperText="When the balance is due. Leave empty if there is no date yet."
                  optional
                  error={fieldErrors["balance.dueDate"]}
                />
                <AmountInput
                  name="interestPercent"
                  tag="Interest on the balance (%)"
                  placeholder="0"
                  value={interestPercent}
                  onChange={(n) => setInterestPercent(n)}
                  min={0}
                  max={50}
                  helperText="0 to 50. Added to what is left to pay."
                  optional
                  error={fieldErrors["balance.interestPercent"]}
                />
              </fieldset>
            )}

            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyCustomer} onChange={(e) => setNotifyCustomer(e.target.checked)} />
              Email the customer about this order
            </label>

            {problem && (
              <p role="alert" className="mb-3 text-sm text-red-500">
                {problem}
              </p>
            )}
            {parsed && (
              <p role="alert" className="mb-3 text-sm text-red-500">
                {parsed.message}
                {parsed.issues.length > 0 && ": " + parsed.issues.map((i) => i.message).join("; ")}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <Button type="button" onClick={() => setStep(1)} disabled={addPending}>
                Previous
              </Button>
              <Button type="submit" primary isLoading={addPending} disabled={!!problem}>
                {addPending ? "Adding order..." : "Add order"}
              </Button>
            </div>
          </>
        )}
      </form>
    </>
  );
};

export default AddCustomerOrder;
