"use client";
import { Bale } from '@/types/types'
import { RiErrorWarningFill, RiGroupFill, RiLoader5Line } from 'react-icons/ri'
import { Progress } from '../ui'
import { useGetSingleBale } from '@/api/bales';
import { FiInfo } from 'react-icons/fi';
import BuyingSummaryView from '../products/BuyingSummaryView';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '../ui/table/TableWrapper';

type Props = {
  baleId: number
}

const ViewBale = ({ baleId }: Props) => {
  const { data: bale, isPending, error } = useGetSingleBale(String(baleId));

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US", { maximumFractionDigits: 0 })
  }

  return (
    <>
      {isPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : error ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="text-red-500" size={60} />
          <p>Error occurred while fetching bale data.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold">{bale?.product.name}</h3>
            <div className="flex flex-wrap items-end gap-2 my-4">
              <p className="text-3xl md:text-4xl text-(--primary) font-bold">
                &#8358;{formatPrice(bale!.price)}
              </p>
              <p className="text-(--muted) line-through">
                &#8358;{formatPrice(bale!.oldPrice)}
              </p>
            </div>
          </div>
          <img
            src={bale?.product.images[0]}
            alt={bale?.product.name}
            className="w-full! h-70! object-cover rounded-xl"
          />
          <div className="my-4">
            <h4 className="text-xl font-bold">Description</h4>
            <p className="text-(--muted)">{bale?.product.description}</p>
          </div>
          <div className="mb-4">
            <div className="flex md:items-end justify-between">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2 items-center text-(--primary)">
                  <RiGroupFill />
                  <h2 className="text-lg uppercase font-bold">Pool Progress</h2>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-(--text-muted)">
                    <span className="text-lg md:text-2xl text-(--text-primary) font-bold">
                      {bale?.filledSlot}{" "}
                    </span>
                    / {bale?.slot} slots reserved
                  </p>
                </div>
              </div>
            </div>
            <Progress
              totalQty={bale!.slot}
              currentQty={bale!.filledSlot}
              className="my-0!"
            />
          </div>
          <div className="mb-4">
            {bale.product.productAttributes == null ? (
              <div className="my-16 flex flex-col justify-center items-center gap-4">
                <FiInfo size={40} className="text-red-400" />
                <div className="text-center">
                  <h2 className="mb-1 text-lg">No Product Specifications</h2>
                  <p>There are no specifications for this product</p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="mb-8">
                  <div className="overflow-x-auto">
                    <Table title={`${bale.product.productAttributes.title}`}>
                      <TableHeader>
                        <TableRow>
                          {bale.product.productAttributes.headers.map(
                            (header) => (
                              <TableColumn
                                key={header}
                                className="px-4 py-2 text-left"
                              >
                                {header}
                              </TableColumn>
                            ),
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bale.product.productAttributes.rows.map(
                          (row, rowIndex) => (
                            <TableRow
                              key={rowIndex}
                              className="odd:bg-(--bg-surface) even:bg-(--bg-muted)"
                            >
                              {bale.product.productAttributes!.headers.map(
                                (header) => (
                                  <TableCell key={header} className="px-4 py-2">
                                    {row[header] || "-"}
                                  </TableCell>
                                ),
                              )}
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
          <BuyingSummaryView buying={bale.buying} />
        </div>
      )}
    </>
  );
}

export default ViewBale