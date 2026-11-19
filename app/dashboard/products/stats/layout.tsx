import ProductStatsGuard from "@/components/products/ProductStatsGuard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Stats",
};

export default function ProductStatsLayout({ children }: { children: React.ReactNode }) {
  return <ProductStatsGuard>{children}</ProductStatsGuard>;
}
