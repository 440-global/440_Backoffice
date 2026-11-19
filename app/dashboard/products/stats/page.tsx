"use client";

import { useState } from "react";
import { useGetProductStatsByCreator } from "@/api/product";
import { Card, Button } from "@/components/ui";
import {
  RiArchive2Fill,
  RiLoader4Fill,
  RiMedalFill,
  RiTeamFill,
  RiUser3Fill,
} from "react-icons/ri";

export default function ProductStatsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedDates, setAppliedDates] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const { data, isPending } = useGetProductStatsByCreator(
    Object.keys(appliedDates).length ? appliedDates : undefined
  );

  const handleApply = () => {
    setAppliedDates({
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setAppliedDates({});
  };

  const totalProducts = data?.totalProducts ?? 0;
  const byCreator = data?.byCreator ?? [];
  const topCreator = byCreator[0] ?? null;
  const adminCount = byCreator.filter((c) => c.adminId !== null).length;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-2xl font-bold">Product Stats by Creator</h3>
            <p className="text-(--muted) text-sm mt-1">
              Breakdown of products created per admin
            </p>
          </div>
          {isPending && (
            <RiLoader4Fill
              size={20}
              className="animate-spin text-(--primary) mt-1 shrink-0"
            />
          )}
        </div>

        {/* Date filter */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-(--table-border) bg-(--card) rounded-lg px-3 py-2 text-sm focus:outline-(--primary)"
          />
          <span className="text-(--muted) text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-(--table-border) bg-(--card) rounded-lg px-3 py-2 text-sm focus:outline-(--primary)"
          />
          <Button primary className="py-2! px-4! rounded-lg!" onClick={handleApply}>
            Apply
          </Button>
          {Object.keys(appliedDates).length > 0 && (
            <Button
              className="py-2! px-4! rounded-lg! bg-(--card)! text-(--text)! border border-(--table-border)"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="shadow-none!">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-(--primary)/10">
              <RiArchive2Fill size={20} className="text-(--primary)" />
            </div>
          </div>
          <p className="text-xs text-(--muted) uppercase mb-1">Total Products</p>
          <p className="text-3xl font-bold">
            {isPending ? (
              <span className="inline-block w-16 h-8 bg-(--table-border) rounded-lg animate-pulse" />
            ) : (
              totalProducts.toLocaleString()
            )}
          </p>
        </Card>

        <Card className="shadow-none!">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <RiMedalFill size={20} className="text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-(--muted) uppercase mb-1">Top Creator</p>
          {isPending ? (
            <span className="inline-block w-32 h-6 bg-(--table-border) rounded-lg animate-pulse" />
          ) : topCreator ? (
            <>
              <p className="text-lg font-bold truncate">
                {topCreator.adminName ?? "Unknown"}
              </p>
              <p className="text-sm text-(--muted) truncate">
                {topCreator.productCount.toLocaleString()} products
              </p>
            </>
          ) : (
            <p className="text-sm text-(--muted)">No data</p>
          )}
        </Card>

        <Card className="shadow-none!">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-100">
              <RiTeamFill size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-xs text-(--muted) uppercase mb-1">Active Admins</p>
          <p className="text-3xl font-bold">
            {isPending ? (
              <span className="inline-block w-16 h-8 bg-(--table-border) rounded-lg animate-pulse" />
            ) : (
              adminCount.toLocaleString()
            )}
          </p>
        </Card>
      </div>

      {/* Creator breakdown table */}
      <Card className="shadow-none!">
        <h4 className="font-bold text-sm uppercase mb-4">Products per Admin</h4>

        {isPending ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-(--table-border) rounded-lg animate-pulse" />
            ))}
          </div>
        ) : byCreator.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-(--muted)">
            <RiArchive2Fill size={40} className="opacity-30" />
            <p className="text-sm">No product data available for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--table-border) text-left">
                  <th className="pb-3 pr-4 font-semibold text-(--muted) w-10">#</th>
                  <th className="pb-3 pr-4 font-semibold text-(--muted)">Admin</th>
                  <th className="pb-3 pr-4 font-semibold text-(--muted) hidden md:table-cell">
                    Email
                  </th>
                  <th className="pb-3 pr-4 font-semibold text-(--muted) text-right">
                    Products
                  </th>
                  <th className="pb-3 font-semibold text-(--muted) hidden lg:table-cell w-48">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {byCreator.map((creator, index) => {
                  const pct = totalProducts
                    ? Math.round((creator.productCount / totalProducts) * 100)
                    : 0;
                  return (
                    <tr
                      key={creator.adminId ?? `null-${index}`}
                      className="border-b border-(--table-border) last:border-0 hover:bg-(--table-border)/30 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        {index === 0 ? (
                          <RiMedalFill size={18} className="text-amber-500" />
                        ) : (
                          <span className="text-(--muted)">{index + 1}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-(--primary)/10 shrink-0">
                            <RiUser3Fill size={14} className="text-(--primary)" />
                          </div>
                          <span className="font-medium truncate max-w-40">
                            {creator.adminName ?? (
                              <span className="italic text-(--muted)">Untracked</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-(--muted) hidden md:table-cell">
                        {creator.adminEmail ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold">
                        {creator.productCount.toLocaleString()}
                      </td>
                      <td className="py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-(--table-border) rounded-full overflow-hidden">
                            <div
                              className="h-full bg-(--primary) rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-(--muted) w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
