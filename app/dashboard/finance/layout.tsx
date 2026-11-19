import FinanceGuard from "@/components/finance/FinanceGuard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finance",
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <FinanceGuard>{children}</FinanceGuard>;
}
