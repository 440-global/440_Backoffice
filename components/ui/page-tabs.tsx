"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { canAccess } from "@/lib/route-access";
import { PAGE_TAB_GROUPS } from "@/lib/navigation";

const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

export default function PageTabs() {
  const pathname = normalize(usePathname());
  const { user } = useAuth();

  // exact match only: tabs show on list pages, not on detail routes like /products/123
  const group = PAGE_TAB_GROUPS.find((g) => g.tabs.some((t) => t.href === pathname));
  if (!group) return null;

  const tabs = group.tabs.filter((t) => canAccess(user, t.href));
  if (tabs.length < 2) return null;

  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-(--table-border) no-scrollbar">
      {tabs.map((tab) => {
        const active = tab.href === pathname;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors ${
              active
                ? "border-(--primary) font-semibold text-(--primary)"
                : "border-transparent text-(--muted) hover:text-(--primary)"
            }`}
          >
            {tab.title}
          </Link>
        );
      })}
    </div>
  );
}