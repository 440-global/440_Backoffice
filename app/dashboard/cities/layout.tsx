import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Cities",
};

type Props = {
  children: React.ReactNode;
};

const CitiesLayout = ({ children }: Props) => {
  return <div>{children}</div>;
};

export default CitiesLayout;
