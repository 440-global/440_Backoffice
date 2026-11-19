import { InspectionDepth, InspectionStatus, SingleInspection } from "@/types/types";

export const inspections: SingleInspection[] = Array.from({ length: 20 }, (_, i) => {
  const id = i + 1;

  const depths: InspectionDepth[] = ["BASIC", "STANDARD", "COMPREHENSIVE"];
  const statuses: InspectionStatus[] = [
    "SUBMITTED",
    "SCHEDULED",
    "IN_PROGRESS",
    "REPORT_READY",
    "COMPLETED",
    "REJECTED",
    "REFUNDED",
    "CANCELLED",
  ];

  const depth = depths[id % depths.length];
  const status = statuses[id % statuses.length];

  return {
    id,
    reference: `INSP-${String(id).padStart(5, "0")}`,
    merchantId: 1000 + id,

    depth,
    feePaidNaira:
      depth === "BASIC" ? 15000 : depth === "STANDARD" ? 25000 : 40000,

    supplier: {
      name: `Supplier ${id}`,
      address: `No. ${id} Industrial Road, Lagos`,
      contact: `080${String(10000000 + id).slice(1)}`,
    },

    productDetails: {
      description: `Inspection of textile batch ${id}`,
      quantity: 10 + id,
      unit: "bales",
      specifications:
        id % 2 === 0 ? "Must meet export quality standards" : undefined,
    },

    attachments: [
      {
        url: `https://example.com/inspection-${id}.jpg`,
        kind: "PHOTO",
        uploadedBy: "MERCHANT",
        uploadedById: 1000 + id,
        uploadedAt: `2026-04-${String((id % 28) + 1).padStart(2, "0")}`,
        note: "Initial product image",
      },
    ],

    status,
    assignedAdminId: 500 + (id % 5),

    report:
      status === "REPORT_READY" || status === "COMPLETED"
        ? `Inspection report for batch ${id}`
        : null,

    adminNotes:
      status === "REJECTED"
        ? "Failed quality checks"
        : status === "CANCELLED"
          ? "Inspection cancelled by merchant"
          : "",

    wallet: {
      debitTxnId: `TXN-${2000 + id}`,
      refundTxnId: status === "REFUNDED" ? `RTXN-${3000 + id}` : null,
    },

    history: [
      {
        from: "SUBMITTED",
        to: status,
        actorType: "MERCHANT",
        actorId: 1000 + id,
        note: `Moved to ${status}`,
        at: `2026-04-${String((id % 28) + 1).padStart(2, "0")}`,
      },
    ],

    createdAt: `2026-04-${String((id % 28) + 1).padStart(2, "0")}`,
    updatedAt: `2026-04-${String((id % 28) + 2).padStart(2, "0")}`,
  };
});
