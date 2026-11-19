"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RiArrowDownSLine } from "react-icons/ri";
import { cn } from "./utils";

type NavItemType = {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItemType[];
};

const hasActiveChild = (item: NavItemType, pathname: string): boolean => {
  if (!item.children) return false;
  return item.children.some(
    (child) =>
      (child.href && pathname.startsWith(child.href)) ||
      hasActiveChild(child, pathname)
  );
};

const NavItem = ({
  item,
  depth = 0,
  collapsed,
  onClick,
}: {
  item: NavItemType;
  depth?: number;
  collapsed?: boolean;
  onClick?: () => void;
}) => {
  const pathname = usePathname();
  const hasChildren = !!item.children?.length;
  const [open, setOpen] = useState(() => hasActiveChild(item, pathname));

  const isActive =
    item.href &&
    (item.href === "/dashboard"
      ? pathname === item.href
      : pathname.startsWith(item.href));

  return (
    <li className="w-full">
      <div
        onClick={() => hasChildren && setOpen((prev) => !prev)}
        className={cn(
          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition",

          // Hover styles
          depth === 0
            ? "hover:bg-(--primary) hover:text-white"
            : "hover:bg-(--primary)/10",

          depth > 0 && "text-sm",

          // Active styles
          depth === 0
            ? isActive && "text-(--primary) bg-(--primary)/10"
            : isActive && "text-(--primary) font-semibold"
        )}
        style={{ paddingLeft: depth * 12 + 12 }}
      >
        <Link
          href={item.href || "#"}
          onClick={onClick}
          className={`flex items-center gap-2 flex-1`}
        >
          {item.icon}
          {!collapsed && <span>{item.title}</span>}
        </Link>

        {hasChildren && !collapsed && (
          <RiArrowDownSLine
            className={cn("transition-transform", open && "rotate-180")}
          />
        )}
      </div>

      {hasChildren && open && !collapsed && (
        <ul className="mt-1 flex flex-col gap-1">
          {item.children!.map((child, index) => (
            <NavItem
              key={index}
              item={child}
              depth={depth + 1}
              collapsed={collapsed}
              onClick={onClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default NavItem;