import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Analytics",
};

export default function TopProductsLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
