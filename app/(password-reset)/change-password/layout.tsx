import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Change Password | Merchant Back Office",
};

type Props = {
  children: React.ReactNode;
};

const ChangePasswordLayout = ({ children }: Props) => {
  return <div>{children}</div>;
};

export default ChangePasswordLayout;
