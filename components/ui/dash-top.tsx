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
        "px-4 py-2 bg-(--surface) border-b border-b-(--table-border) w-full fixed z-30 md:static flex justify-between items-center",
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
