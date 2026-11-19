import type { FinanceSummary } from "@/types/types";

/**
 * Summary APIs may return signed amounts for outflows. Use absolute magnitudes for
 * cash in / out and recompute net as in − out so signed ledger outflows do not flip the net.
 */
export function cashFlowMagnitudes(summary: FinanceSummary | undefined) {
  if (!summary) {
    return { totalInflow: 0, totalOutflow: 0, netInMinusOut: 0 };
  }
  const totalInflow = Math.abs(summary.totalInflow ?? summary.totalRevenue ?? 0);
  const totalOutflow = Math.abs(summary.totalOutflow ?? 0);
  const netInMinusOut = totalInflow - totalOutflow;
  return { totalInflow, totalOutflow, netInMinusOut };
}
