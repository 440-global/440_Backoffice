import SupportChatGuard from "@/components/support/SupportChatGuard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Chat",
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <SupportChatGuard>{children}</SupportChatGuard>;
}
