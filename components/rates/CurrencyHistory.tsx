"use client"

import { useGetCurrencyHistory } from "@/api/rates"
import { fmtDateTime } from "@/lib/funcs"
import { RiAlarmWarningLine, RiLoader5Line } from "react-icons/ri"
import { TbBoxOff } from "react-icons/tb"

type Props = {
  currencyId: number
}

const CurrencyHistory = ({ currencyId }: Props) => {
  const { data: currency, isPending, error } = useGetCurrencyHistory(currencyId);
  return (
    <>
      {isPending && (
        <div className="h-full w-full flex justify-center items-center">
          <RiLoader5Line size={40} className="text-(--primary) animate-spin" />
        </div>
      )}

      {error && (
        <div className="h-full w-full flex flex-col gap-2 justify-center items-center">
          <RiAlarmWarningLine size={40} className="text-red-500" />
          <div className="text-center">
            <h2>Error</h2>
            <p className="text">Something went wrong</p>
          </div>
        </div>
      )}

      {currency?.length == 0 ? (
        <div className="h-full w-full flex flex-col gap-2 justify-center items-center">
          <TbBoxOff size={48} className="text-(--primary)" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">No History</h2>
            <p className="text-(--muted)">
              This currency's rate has not been edited yet
            </p>
          </div>
        </div>
      ) : (
        <ul className="border-l border-(--muted) py-2 pl-4">
          {currency?.map((entry, index) => (
            <li
              className="p-4 bg-(--elevated) rounded-xl border border-(--table-border) mb-4 last:mb-0 relative"
              key={index}
            >
              <div className="absolute w-4 h-4 rounded-full bg-(--elevated) -left-6.25 top-[40%] border border-(--table-border)"></div>
              <p className="mb-2">
                <strong>Updated rate</strong>:- {entry.rate}
              </p>
              <p className="">
                <strong>Date updated</strong>:- {fmtDateTime(entry.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default CurrencyHistory