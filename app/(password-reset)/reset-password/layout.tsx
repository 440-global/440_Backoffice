import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Reset Password | Merchant Back Office",
};

type Props = {
  children: React.ReactNode;
};

const ResetLayout = ({ children }: Props) => {
  return <div>{children}</div>;
};

export default ResetLayout;
