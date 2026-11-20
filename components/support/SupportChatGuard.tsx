"use client";

import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { RiLoader5Line, RiShieldFill } from "react-icons/ri";

const SUPPORT_CHAT_ALLOWED_ROLES = [
  "super_admin",
  "support_admin",
  "operations_admin",
  "admin",
];

const subscribe = () => () => {};

// false on the server and during hydration, true once on the client
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export default function SupportChatGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const mounted = useMounted();

  const blocked =
    mounted && !!user && !SUPPORT_CHAT_ALLOWED_ROLES.includes(user.role);

  useEffect(() => {
    if (blocked) router.replace("/dashboard");
  }, [blocked, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RiLoader5Line size={48} className="animate-spin text-(--primary)" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-red-100 p-5 dark:bg-red-900/30">
          <RiShieldFill size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p className="max-w-sm text-(--muted)">
          Support chat is only available to support agents and admins.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 rounded-xl bg-(--primary) px-6 py-2 text-white transition-all hover:bg-(--primary-accent)"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}