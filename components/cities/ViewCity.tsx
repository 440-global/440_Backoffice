"use client";
import { useGetCity } from '@/api/cities';
import React from 'react'
import { RiErrorWarningFill, RiLoader5Line } from 'react-icons/ri';

type Props = {
  cityId: number
}

const ViewCity = ({ cityId }: Props) => {
  const { data: city, isPending, error } = useGetCity(cityId);
  return (
    <>
      {isPending ? (
        <div className="h-full flex justify-center items-center">
          <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
        </div>
      ) : error ? (
        <div className="h-full flex flex-col gap-2 justify-center items-center">
          <RiErrorWarningFill className="text-red-500" size={60} />
          <p>Error occurred while fetching city data.</p>
        </div>
      ) : (
        <div>
          <ul className="mt-2">
            <li className="pt-1">
              <strong>Name</strong>:- {city?.name}
            </li>
            <li className="pt-1">
              <strong>Province</strong>:- {city?.province}
            </li>
            <li className="pt-1">
              <strong>Country</strong>:- {city?.country}
            </li>
            <li className="pt-1">
              <strong>Date Added</strong>:- {new Date(city?.createdAt).toDateString()}
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

export default ViewCity