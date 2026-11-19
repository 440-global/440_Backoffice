"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiArrowRightSLine } from "react-icons/ri";

const Breadcrumbs = () => {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean).filter(segment => segment !== "dashboard");

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-(--medium-grey)">
        <li>
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
        </li>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");

          return (
            <li key={href} className="flex items-center gap-2">
              <span><RiArrowRightSLine /></span>
              <Link href={`/dashboard/${href}`} className="capitalize hover:underline">
                {segment.replace(/-/g, " ")}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
