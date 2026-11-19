"use client"
import { useGetLibrary } from '@/api/library'
import { fmtDateTime } from '@/lib/funcs'
import React from 'react'
import { RiLoader5Line } from 'react-icons/ri'

type Props = {
  id: number
}

const ViewEntry = ({ id }: Props) => {
  const { data, isPending, error } = useGetLibrary(id);
  // const fetchedData = data?.data;
  return (
    <>
      {isPending ? (
        <div className="flex h-full items-center justify-center">
          <RiLoader5Line className="animate-spin text-4xl text-(--primary)" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">Could not load funnel data.</p>
      ) : (
        <ul className="list-none">
          <li className="py-2">
            <strong>Title</strong> <br /> {data?.title}
          </li>
          <li className="py-2">
            <strong>Description</strong> <br /> {data?.description}
          </li>
          <li className="py-2">
            <strong>Document</strong> <br />{" "}
            <a href={data?.fileUrl} target='_blank' className='text-(--primary) underline'>Click Here</a>
          </li>
          <li className="py-2">
            <strong>Created At</strong> <br />{" "}
            <p>{fmtDateTime(data?.createdAt)}</p>
          </li>
          <li className="py-2">
            <strong>Updated At</strong> <br />{" "}
            <p>{fmtDateTime(data?.updatedAt)}</p>
          </li>
        </ul>
      )}
    </>
  );
}

export default ViewEntry