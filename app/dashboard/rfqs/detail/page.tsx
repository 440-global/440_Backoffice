"use client";

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";
import RfqDetailClient from "./RfqDetailClient";

function RfqOrderDetailPageInner() {
  const searchParams = useSearchParams();
  const id = Number.parseInt(searchParams.get("id") ?? "", 10);
  if (!Number.isFinite(id) || id < 1) {
    notFound();
  }
  return <RfqDetailClient rfqOrderId={id} />;
}

export default function RfqOrderDetailPage() {
  return (
    <Suspense>
      <RfqOrderDetailPageInner />
    </Suspense>
  );
}
