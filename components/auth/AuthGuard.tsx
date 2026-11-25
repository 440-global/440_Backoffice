"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCrossSubdomainCookie } from "@/lib/utils";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getCrossSubdomainCookie('admin_token');

    if (!token) {
      router.replace(`/?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setAuthorized(true);
  }, [router, pathname]);

  if (!authorized) return null;

  return <>{children}</>;
}