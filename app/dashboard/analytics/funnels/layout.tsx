import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversion Funnel",
};

export default function FunnelsLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
