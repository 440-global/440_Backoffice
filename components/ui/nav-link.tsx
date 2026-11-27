import Link from "next/link";
import type { NavLinkItem } from "@/types/types";

type Props = {
  item: NavLinkItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
};

export default function NavLink({ item, active, collapsed, onClick }: Props) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        title={collapsed ? item.title : undefined}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl p-2.5 text-sm transition-colors ${
          collapsed ? "justify-center" : ""
        } ${
          active
            ? "bg-(--primary)/20 font-semibold text-(--primary)"
            : "text-(--medium-grey) hover:bg-(--primary)/10"
        }`}
      >
        <span className="shrink-0 text-xl">{item.icon}</span>
        {!collapsed && <span className="truncate">{item.title}</span>}
      </Link>
    </li>
  );
}