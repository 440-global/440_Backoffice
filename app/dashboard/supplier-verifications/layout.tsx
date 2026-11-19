import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Supplier Verifications",
};

type Props = {
  children: React.ReactNode;
};

const SupplierVerificationLayout = ({ children }: Props) => {
  return <div>{children}</div>;
};

export default SupplierVerificationLayout;
