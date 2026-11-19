"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RiLoader5Line, RiShieldFill } from "react-icons/ri";
import Link from "next/link";

const FINANCE_ROLES = ["super_admin", "finance_admin"];

export default function FinanceGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && !FINANCE_ROLES.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [mounted, user, router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RiLoader5Line size={48} className="animate-spin text-(--primary)" />
      </div>
    );
  }

  if (mounted && user && !FINANCE_ROLES.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="p-5 rounded-full bg-red-100 dark:bg-red-900/30">
          <RiShieldFill size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p className="text-(--muted) max-w-sm">
          This section is only accessible to Finance Admins and Super Admins.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 px-6 py-2 bg-(--primary) text-white rounded-xl hover:bg-(--primary-accent) transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
