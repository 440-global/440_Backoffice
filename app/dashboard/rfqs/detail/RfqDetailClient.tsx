"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ZoomImage from "@/components/quotations/ZoomImage";
import RfqCommentThread from "@/components/quotations/RfqCommentThread";
import {
  useApproveAdminRfq,
  useConvertAdminRfq,
  useGetAdminRfq,
  useGetAdminRfqActivities,
  useInitiateAdminRfqPayment,
  useManualAdminRfqPaymentConvert,
  usePostAdminRfqComment,
  useSetAdminRfqQuote,
} from "@/api/rfqs";
import { Button, Card } from "@/components/ui";
import MyModal from "@/components/dashboard/Modal";
import EditRfq from "@/components/rfqs/EditRfq";
import type { AdminRfqActivity, AdminRfqOrderLine } from "@/types/types";
import {
  RFQ_WORKFLOW_CLASS,
  collectRfqImageUrls,
  fmtRfqMoney,
  fmtRfqSubmissionDate,
  isRfqCommentAuditAction,
  rfqActivityAdminName,
  rfqActivityCreatedAt,
  rfqCommentBodyFromActivity,
  rfqContact,
  rfqCurrency,
  rfqDisplayId,
  rfqLines,
  rfqStatusLabel,
  rfqWhatsAppHref,
  rfqWorkflow,
} from "@/lib/rfq-display";
import {
  RiArrowLeftLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiErrorWarningLine,
  RiLoader4Fill,
  RiMailLine,
  RiWhatsappFill,
  RiZoomInLine,
} from "react-icons/ri";

function numberInput(v: string): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

type Props = {
  rfqOrderId: number;
};

export default function RfqDetailClient({ rfqOrderId }: Props) {
  const { data: order, isPending, isError, error, refetch } = useGetAdminRfq(rfqOrderId);
  const { data: activities, isPending: activityPending } = useGetAdminRfqActivities(rfqOrderId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const [quotedAmount, setQuotedAmount] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("NGN");
  const [quoteNotes, setQuoteNotes] = useState("");

  const [approveMerchantId, setApproveMerchantId] = useState("");
  const [approveNotes, setApproveNotes] = useState("");

  const [returnUrl, setReturnUrl] = useState("");

  const [manualAmount, setManualAmount] = useState("");
  const [manualPaidDate, setManualPaidDate] = useState("");
  const [manualNarration, setManualNarration] = useState("");
  const [manualEntryType, setManualEntryType] = useState("CASH_DEPOSIT");
  const [manualCurrency, setManualCurrency] = useState("NGN");
  const [manualReference, setManualReference] = useState("");
  const [manualMethod, setManualMethod] = useState("bank_transfer");

  const [zoomOpen, setZoomOpen] = useState(false);
  const [procurementOpen, setProcurementOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const quoteMut = useSetAdminRfqQuote();
  const approveMut = useApproveAdminRfq();
  const initiateMut = useInitiateAdminRfqPayment();
  const manualMut = useManualAdminRfqPaymentConvert();
  const convertMut = useConvertAdminRfq();
  const commentMut = usePostAdminRfqComment();

  const wf = rfqWorkflow(order ?? undefined);
  const contact = order ? rfqContact(order) : { name: "—", email: "—", phone: "—", address: "—" };
  const lines = useMemo(() => (order ? rfqLines(order) : []), [order]);
  const imageUrls = useMemo(() => (order ? collectRfqImageUrls(order) : []), [order]);

  const commentThreadMessages = useMemo(() => {
    const rows = (activities ?? []) as AdminRfqActivity[];
    return rows
      .filter(isRfqCommentAuditAction)
      .sort((a, b) => {
        const ta = rfqActivityCreatedAt(a);
        const tb = rfqActivityCreatedAt(b);
        const da = ta ? new Date(ta).getTime() : 0;
        const db = tb ? new Date(tb).getTime() : 0;
        return da - db;
      })
      .map((a) => ({
        id: a.id,
        at: fmtRfqSubmissionDate(rfqActivityCreatedAt(a)),
        text: rfqCommentBodyFromActivity(a) || "—",
        authorLabel: rfqActivityAdminName(a),
      }));
  }, [activities]);

  const canSetQuote = ["PENDING", "REVIEWING"].includes(wf);
  const canApprove = ["QUOTED", "REVIEWING", "PENDING"].includes(wf);
  const canInitiatePayment = ["APPROVED", "AWAITING_PAYMENT"].includes(wf);
  const canManualConvert = ["APPROVED", "AWAITING_PAYMENT", "QUOTED"].includes(wf);
  const canConvert = ["PAID", "CONVERTED", "AWAITING_PAYMENT"].includes(wf);

  const resetBanner = () => {
    setActionError(null);
    setActionOk(null);
  };

  const handleSetQuote = async () => {
    if (!order) return;
    resetBanner();
    const amount = numberInput(quotedAmount);
    if (!amount) {
      setActionError("Quoted amount must be a positive number.");
      return;
    }
    try {
      await quoteMut.mutateAsync({
        rfqOrderId: order.id,
        body: {
          quotedAmount: amount,
          currency: quoteCurrency.trim() || "NGN",
          ...(quoteNotes.trim() ? { notes: quoteNotes.trim() } : {}),
        },
      });
      setActionOk("Quote saved.");
      refetch();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg ?? "Could not set quote.");
    }
  };

  const handleApprove = async () => {
    if (!order) return;
    resetBanner();
    const merchantId = approveMerchantId.trim() ? numberInput(approveMerchantId) : null;
    if (approveMerchantId.trim() && !merchantId) {
      setActionError("Linked merchant id must be a positive number.");
      return;
    }
    try {
      await approveMut.mutateAsync({
        rfqOrderId: order.id,
        body: {
          ...(merchantId ? { linkedMerchantId: merchantId } : {}),
          ...(approveNotes.trim() ? { notes: approveNotes.trim() } : {}),
        },
      });
      setActionOk("RFQ approved.");
      refetch();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg ?? "Could not approve RFQ.");
    }
  };

  const handleInitiate = async () => {
    if (!order) return;
    resetBanner();
    try {
      await initiateMut.mutateAsync({
        rfqOrderId: order.id,
        body: { ...(returnUrl.trim() ? { returnUrl: returnUrl.trim() } : {}) },
      });
      setActionOk("Paystack payment initiated.");
      refetch();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg ?? "Could not initiate payment.");
    }
  };

  const handleManualConvert = async () => {
    if (!order) return;
    resetBanner();
    const amount = numberInput(manualAmount);
    if (!amount) {
      setActionError("Manual amount must be a positive number.");
      return;
    }
    if (!manualPaidDate) {
      setActionError("Paid date is required.");
      return;
    }
    if (!manualNarration.trim()) {
      setActionError("Narration is required.");
      return;
    }
    try {
      await manualMut.mutateAsync({
        rfqOrderId: order.id,
        body: {
          amount,
          paidDate: new Date(manualPaidDate).toISOString(),
          narration: manualNarration.trim(),
          entryType: manualEntryType.trim(),
          currency: manualCurrency.trim() || "NGN",
          ...(manualReference.trim() ? { reference: manualReference.trim() } : {}),
          ...(manualMethod.trim() ? { paymentMethod: manualMethod.trim() } : {}),
        },
      });
      setActionOk("Manual inflow recorded and conversion triggered.");
      refetch();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg ?? "Could not complete manual payment.");
    }
  };

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen]);

  useEffect(() => {
    if (!procurementOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProcurementOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [procurementOpen]);

  const handleCreateOrder = async () => {
    if (!order) return;
    resetBanner();
    try {
      await convertMut.mutateAsync(order.id);
      setActionOk("Order created or already converted.");
      setProcurementOpen(false);
      refetch();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg ?? "Could not convert RFQ.");
    }
  };

  const handlePostComment = async (text: string) => {
    if (!order) return;
    resetBanner();
    try {
      await commentMut.mutateAsync({
        comment: text,
        rfq_id: String(order.id),
        request_id: "",
      });
      setActionOk("Comment logged.");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg ?? "Could not save comment.");
      throw e;
    }
  };

  if (isPending && !order) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="grow flex min-h-[50vh] items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <RiLoader4Fill className="h-6 w-6 animate-spin" />
          Loading RFQ…
        </main>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="grow">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
            <Link
              href="/dashboard/rfqs"
              className="inline-flex items-center gap-2 text-sm text-(--primary) font-medium hover:underline mb-6"
            >
              <RiArrowLeftLine />
              Back to RFQ orders
            </Link>
            <Card className="shadow-none! border border-red-200 bg-red-50 p-6 text-red-800">
              {(error as { message?: string } | undefined)?.message ?? "RFQ not found."}
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const mailHref =
    contact.email && contact.email !== "—" ? `mailto:${encodeURIComponent(contact.email)}` : "#";
  const waHref = contact.phone && contact.phone !== "—" ? rfqWhatsAppHref(contact.phone) : "#";

  /** Dashboard tokens + `Quotations/QuotationDetails.tsx` card shell */
  const qCard =
    "rounded-lg border border-(--table-border) bg-(--card) shadow overflow-hidden";
  const inputField =
    "px-3 py-2 rounded-lg border border-(--table-border) bg-(--surface) text-sm text-(--text) placeholder:text-(--muted)";
  const sectionTitle = "text-lg font-semibold text-(--text)";

  return (
    <div className="flex min-h-screen flex-col">
      {zoomOpen && imageUrls.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setZoomOpen(false)}
          role="presentation"
        >
          <div
            className="max-h-full w-full max-w-5xl flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ZoomImage images={imageUrls} setZoomImage={setZoomOpen} />
          </div>
        </div>
      )}

      {procurementOpen && (
        <>
          <div
            className="fixed inset-0 z-60 bg-black/40"
            role="presentation"
            aria-hidden
            onClick={() => setProcurementOpen(false)}
          />
          <aside
            className="fixed inset-y-0 right-0 z-70 flex w-full max-w-lg flex-col border-l border-(--table-border) bg-(--card) shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="procurement-panel-title"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-(--table-border) px-4 py-4">
              <h2 id="procurement-panel-title" className="text-lg font-semibold text-(--text)">
                Procurement &amp; payment
              </h2>
              <button
                type="button"
                onClick={() => setProcurementOpen(false)}
                className="rounded-lg p-2 text-(--muted) transition-colors hover:bg-(--elevated) hover:text-(--text)"
                aria-label="Close panel"
              >
                <RiCloseLine className="h-6 w-6" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <p className="text-xs text-(--muted)">
                Quote, approve, Paystack, manual inflow, then convert to order.
              </p>
              <div className="space-y-3 border-b border-(--table-border) pb-3">
                <p className="text-xs font-semibold uppercase text-(--muted)">Set quote</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    type="number"
                    min={1}
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    placeholder="Quoted amount"
                    className={inputField}
                  />
                  <input
                    value={quoteCurrency}
                    onChange={(e) => setQuoteCurrency(e.target.value)}
                    placeholder="Currency"
                    className={inputField}
                  />
                  <Button
                    primary
                    type="button"
                    disabled={!canSetQuote || quoteMut.isPending}
                    onClick={handleSetQuote}
                    className="py-2! rounded-lg!"
                  >
                    {quoteMut.isPending ? "Saving…" : "Set quote"}
                  </Button>
                </div>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Quote notes (optional)"
                  className={`w-full ${inputField}`}
                />
              </div>
              <div className="space-y-2 border-b border-(--table-border) pb-3">
                <p className="text-xs font-semibold uppercase text-(--muted)">Approve</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    type="number"
                    min={1}
                    value={approveMerchantId}
                    onChange={(e) => setApproveMerchantId(e.target.value)}
                    placeholder="Linked merchant id (optional)"
                    className={inputField}
                  />
                  <input
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    placeholder="Approval notes"
                    className={inputField}
                  />
                  <Button
                    primary
                    type="button"
                    disabled={!canApprove || approveMut.isPending}
                    onClick={handleApprove}
                    className="py-2! rounded-lg!"
                  >
                    {approveMut.isPending ? "…" : "Approve"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 border-b border-(--table-border) pb-3">
                <p className="text-xs font-semibold uppercase text-(--muted)">Paystack</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <input
                    value={returnUrl}
                    onChange={(e) => setReturnUrl(e.target.value)}
                    placeholder="Return URL (optional)"
                    className={`sm:col-span-3 ${inputField}`}
                  />
                  <Button
                    primary
                    type="button"
                    disabled={!canInitiatePayment || initiateMut.isPending}
                    onClick={handleInitiate}
                    className="py-2! rounded-lg!"
                  >
                    {initiateMut.isPending ? "…" : "Initiate"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 pb-2">
                <p className="text-xs font-semibold uppercase text-(--muted)">Manual inflow + convert</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="number"
                    min={1}
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="Amount"
                    className={inputField}
                  />
                  <input
                    type="datetime-local"
                    value={manualPaidDate}
                    onChange={(e) => setManualPaidDate(e.target.value)}
                    className={inputField}
                  />
                  <input
                    value={manualNarration}
                    onChange={(e) => setManualNarration(e.target.value)}
                    placeholder="Narration"
                    className={inputField}
                  />
                  <input
                    value={manualEntryType}
                    onChange={(e) => setManualEntryType(e.target.value)}
                    placeholder="Entry type"
                    className={inputField}
                  />
                  <input
                    value={manualCurrency}
                    onChange={(e) => setManualCurrency(e.target.value)}
                    placeholder="Currency"
                    className={inputField}
                  />
                  <input
                    value={manualReference}
                    onChange={(e) => setManualReference(e.target.value)}
                    placeholder="Reference"
                    className={inputField}
                  />
                  <input
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                    placeholder="Payment method"
                    className={inputField}
                  />
                  <Button
                    primary
                    type="button"
                    disabled={!canManualConvert || manualMut.isPending}
                    onClick={handleManualConvert}
                    className="py-2! rounded-lg!"
                  >
                    {manualMut.isPending ? "…" : "Manual pay + convert"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-(--table-border) px-4 py-4">
              <Button
                primary
                type="button"
                disabled={!canConvert || convertMut.isPending}
                onClick={handleCreateOrder}
                className="w-full! rounded-lg! py-3! text-sm! font-medium!"
              >
                {convertMut.isPending ? "Creating…" : "Convert to order"}
              </Button>
              {!canConvert ? (
                <p className="mt-2 text-center text-xs text-(--muted)">
                  Complete payment / workflow steps as required before converting.
                </p>
              ) : null}
            </div>
          </aside>
        </>
      )}

      <main className="grow">
        <div className="container mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
          <Link
            href="/dashboard/rfqs"
            className="mb-6 inline-flex items-center gap-2 text-(--muted) transition-colors hover:text-(--text)"
          >
            <RiArrowLeftLine className="text-xl" />
            <span className="text-sm">Back to RFQ orders</span>
          </Link>

          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-(--text)">RFQ No: {order.id}</h1>
                <p className="mt-1 text-sm text-(--muted)">
                  Viewing details for the request from{" "}
                  <span className="font-medium text-(--text)">{contact.name}</span>.
                </p>
                <p className="mt-1 font-mono text-xs text-(--muted)">Reference: {rfqDisplayId(order)}</p>
                <span
                  className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium lowercase ${
                    RFQ_WORKFLOW_CLASS[wf] ?? "bg-(--elevated) text-(--text)"
                  }`}
                >
                  {rfqStatusLabel(order)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="shrink-0 rounded-md! px-4! py-2! text-sm! font-medium!"
                >
                  Edit
                </Button>
                <Button
                  primary
                  type="button"
                  onClick={() => setProcurementOpen(true)}
                  className="shrink-0 rounded-md! px-4! py-2! text-sm! font-medium!"
                >
                  Create order
                </Button>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {actionError}
            </div>
          )}
          {actionOk && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {actionOk}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {/* `Quotations/QuotationDetails.tsx`: one stacked card for details + items + images */}
              <div className={qCard}>
                <div className="flex flex-col gap-3 border-b border-(--table-border) p-6 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className={sectionTitle}>User Details</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                      <span className="font-semibold text-(--text)">440</span>
                      {order.quotedAmount != null ? (
                        <span className="font-mono text-sm font-semibold text-(--text)">
                          {fmtRfqMoney(order.quotedAmount, rfqCurrency(order))}
                        </span>
                      ) : null}
                    </div>
                    {contact.phone && contact.phone !== "—" ? (
                      <RiCheckboxCircleFill className="shrink-0 text-emerald-500" size={22} aria-hidden />
                    ) : (
                      <RiErrorWarningLine className="shrink-0 text-red-400" size={24} aria-hidden />
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-(--muted)">Client Name</p>
                      <p className="mt-1 text-base text-(--text)">{contact.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-(--muted)">Submission Date</p>
                      <p className="mt-1 text-base text-(--text)">{fmtRfqSubmissionDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-(--muted)">Contact Phone</p>
                      <p className="mt-1 text-base text-(--text)">{contact.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-(--muted)">Contact Email</p>
                      <p className="mt-1 break-all text-base text-(--text)">{contact.email}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-(--muted)">Location</p>
                      <p className="mt-1 text-base text-(--text)">{contact.address}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-(--table-border) p-6">
                  <h3 className={sectionTitle}>Requested Items</h3>
                  <div className="mt-4 flow-root">
                    <div className="-mx-6 -my-4 overflow-x-auto">
                      <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-(--table-border)">
                          <thead>
                            <tr>
                              <th
                                className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-(--text)"
                                scope="col"
                              >
                                Item
                              </th>
                              <th
                                className="px-3 py-3.5 text-left text-sm font-semibold text-(--text)"
                                scope="col"
                              >
                                Quantity
                              </th>
                              <th
                                className="px-3 py-3.5 text-left text-sm font-semibold text-(--text)"
                                scope="col"
                              >
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-(--table-border)">
                            {lines.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="py-8 pl-6 pr-3 text-center text-sm text-(--muted)">
                                  No line items.
                                </td>
                              </tr>
                            ) : (
                              lines.map((line: AdminRfqOrderLine, idx: number) => (
                                <tr key={line.id ?? idx}>
                                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-(--text)">
                                    {(line.name ?? line.productName ?? `Item ${idx + 1}`).toString()}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-(--muted)">
                                    {line.quantity ?? "—"}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-(--muted)">
                                    {(line.description ?? line.notes ?? "—").toString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-(--table-border) p-6">
                  <h3 className={sectionTitle}>Uploaded Images</h3>
                  {imageUrls.length === 0 ? (
                    <p className="mt-4 text-sm text-(--muted)">No images uploaded.</p>
                  ) : (
                    <>
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {imageUrls.map((src, i) => {
                          console.log(src);
                          return (
                            <button
                              key={`${src}-${i}`}
                              type="button"
                              onClick={() => setZoomOpen(true)}
                              className="group relative overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt=""
                                className="h-32 w-full object-cover transition-opacity group-hover:opacity-90"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/50">
                                <RiZoomInLine
                                  className="text-2xl text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  aria-hidden
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs text-(--muted)">Click a thumbnail to open the gallery.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-8 lg:sticky lg:top-20 lg:h-[calc(100svh-5rem)] lg:max-h-[calc(100svh-5rem)] lg:w-full lg:self-start">
              <div className={`${qCard} shrink-0`}>
                <div className="border-b border-(--table-border) p-6">
                  <h3 className={sectionTitle}>Communication channels</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    {waHref !== "#" ? (
                      <div className="rounded-lg p-2 shadow-lg">
                        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex">
                          <RiWhatsappFill className="text-[2.8rem] text-emerald-600" aria-hidden />
                        </a>
                      </div>
                    ) : (
                      <span className="min-w-12" />
                    )}
                    <div className="rounded-lg p-2 shadow-lg">
                      <a
                        href={mailHref}
                        className={`inline-flex ${mailHref === "#" ? "pointer-events-none opacity-40" : ""}`}
                      >
                        <RiMailLine className="text-[2.5rem] text-(--primary)" aria-hidden />
                      </a>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800  ">
                      WhatsApp
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800  ">
                      Email
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`${qCard} flex min-h-[min(58vh,560px)] flex-1 flex-col overflow-hidden p-0 lg:min-h-0`}
              >
                <div className="shrink-0 border-b border-(--table-border) p-6">
                  <h3 className={sectionTitle}>Comment History</h3>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">
                  <RfqCommentThread
                    messages={commentThreadMessages}
                    isLoading={activityPending}
                    isSending={commentMut.isPending}
                    onSend={handlePostComment}
                  />
                </div>
                <p className="shrink-0 px-4 py-2 text-[10px] text-(--muted)">
                  Comments are saved to the audit log.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      {editOpen && (
        <MyModal
          isOpen={true}
          onClose={() => setEditOpen(false)}
          title="Edit RFQ"
        >
          <EditRfq rfqOrderId={rfqOrderId} onClose={() => setEditOpen(false)} />
        </MyModal>
      )}
    </div>
  );
}
