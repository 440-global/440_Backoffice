"use client";
import { useGetBaleSubscribers } from '@/api/bales';
import React from 'react'
import { RiArrowDownSLine, RiErrorWarningFill, RiLoader5Line, RiUserLine, RiUserUnfollowLine } from 'react-icons/ri';
import { Accordion } from '../ui/accordion';

type Props = {
  baleId: number
}

const ViewSubscribers = ({ baleId }: Props) => {
  const { data, isPending, error } = useGetBaleSubscribers(String(baleId));
  const subscribers = data?.data.subscribers;
  const totalSubscribers = data?.data.totalSubscribers;

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
      ) : subscribers!.length > 0 ? (
        <div>
          <h1 className="text-lg font-bold mb-4">
            Total Subscribers ({totalSubscribers})
          </h1>
          <Accordion>
            {subscribers?.map((sub) => {
              const id = `subscriber-${sub.orderId}`;

              return (
                <Accordion.Item
                  key={id}
                  id={id}
                  className="p-1 bg-(--elevated) rounded-2xl border-none mb-1"
                >
                  <Accordion.Trigger id={id}>
                    <div className="flex justify-between w-full items-center">
                      <div className="flex gap-2 items-center">
                        <div className="w-10 h-10 rounded-full bg-(--primary)/10 flex justify-center items-center">
                          <RiUserLine className="text-(--primary)" />
                        </div>
                        <span>{sub.customer.name}</span>
                      </div>

                      <span>
                        <RiArrowDownSLine
                          className="
                            transition-transform duration-300
                            data-[state=open]:rotate-180
                          "
                        />
                      </span>
                    </div>
                  </Accordion.Trigger>

                  <Accordion.Content id={id}>
                    <div className="space-y-2 mt-3 text-sm">
                      <p>
                        <strong>Email</strong>: {sub.customer.email}
                      </p>
                      <p>
                        <strong>Phone</strong>: {sub.customer.phone}
                      </p>
                      <p>
                        <strong>Status</strong>: {sub.status}
                      </p>
                      <p>
                        <strong>Total</strong>: ₦{sub.totalAmount}
                      </p>
                      <p>
                        <strong>Paid</strong>: ₦{sub.amountPaid}
                      </p>
                      <p>
                        <strong>Outstanding</strong>:{" "}
                        <strong>₦{sub.outstandingAmount}</strong>
                      </p>

                      {sub.followUp.hasOverdueInstallments && (
                        <p className="text-red-500">Overdue installments</p>
                      )}

                      {sub.followUp.needsRemainderPayment && (
                        <p className="text-yellow-500 font-bold">
                          Needs remainder payment
                        </p>
                      )}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </div>
      ) : (
        <div className="h-full flex justify-center items-center flex-col">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex justify-center items-center mb-3">
            <RiUserUnfollowLine size={32} className="text-red-500" />
          </div>
          <h1 className='text-lg font-bold'>No Subscribers</h1>
          <p className='text-(--muted)'>There are no subscribers for this bale</p>
        </div>
      )}
    </>
  );
}

export default ViewSubscribers