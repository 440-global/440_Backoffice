"use client"
import Breadcrumbs from "../breadcrumb";
import { cn } from "./utils";
import { usePathname } from "next/navigation";

type DashTopType = {
  breadcrumb?: boolean,
  children?: React.ReactNode,
  className?: string;
}

const DashTop = ({ breadcrumb, children, className }: DashTopType) => {
  const pathname = usePathname();
  const hideOnMobileForTelegramTopic = pathname.startsWith("/dashboard/telegram/topic");

  return (
    <div
      className={cn(
        "p-4 bg-(--surface) border-b border-b-(--table-border) w-full fixed z-30 md:static",
        hideOnMobileForTelegramTopic && "hidden md:block",
        className
      )}
    >
      { breadcrumb && <Breadcrumbs /> }
      { children }
    </div>
  )
}

export default DashTop
