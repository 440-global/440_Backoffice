import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Shipping Charges",
};

type Props = {
  children: React.ReactNode;
};

const ChargesLayout = ({ children }: Props) => {
  return <div>{children}</div>;
};

export default ChargesLayout;
