import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Taxi Bookings",
};

type Props = {
  children: React.ReactNode;
};

const TaxiBookingsLayout = ({ children }: Props) => {
  return <div>{children}</div>;
};

export default TaxiBookingsLayout;
