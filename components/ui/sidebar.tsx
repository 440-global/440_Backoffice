"use client";

import { useState, useSyncExternalStore } from "react";
import {
  RiBarChartFill,
  RiGroup2Fill,
  RiDashboardFill,
  RiSidebarFoldLine,
  RiStore3Fill,
  RiBuilding3Fill,
  RiBookShelfFill,
  RiListUnordered,
  RiMoneyDollarCircleFill,
  RiFileList3Fill,
  RiRefund2Fill,
  RiCalendarScheduleLine,
  RiTelegramFill,
  RiPlaneFill,
  RiUserLine,
  RiShoppingCart2Line,
  RiCustomerService2Fill,
  RiSurveyLine,
  RiVerifiedBadgeLine,
  RiCarLine,
  RiHandCoinLine,
  RiRoadMapLine,
  RiToolsFill,
  RiArchiveDrawerLine,
  RiArchive2Line,
  RiCommunityFill,
  RiArchiveStackFill,
  RiShip2Line,
  RiLineChartLine,
  RiFilter2Line,
  RiShirtLine,
  RiMoneyCnyCircleLine,
  RiTruckLine,
  RiBillLine,
  RiAdminFill,
  RiUserForbidFill,
  RiUser4Fill,
} from "react-icons/ri";
import { usePathname, useRouter } from "next/navigation";

import NavItem from "./nav-item";
import { LuBox, LuBoxes, LuChartBar } from "react-icons/lu";
import { useAuth } from "@/hooks/use-auth";
import ActionDropdown from "./action_dropdown";
import ThemeToggle from "./themetoggle";
import { NavigationItem } from "@/types/types";
import { canAccess } from "@/lib/route-access";

/* ------------------------------------------------------------------ */
/* External stores (localStorage + window size)                        */
/* ------------------------------------------------------------------ */

const COLLAPSED_KEY = "sidebar-collapsed";
const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(cb: () => void) {
  collapsedListeners.add(cb);
  // keeps other browser tabs in sync
  window.addEventListener("storage", cb);
  return () => {
    collapsedListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getCollapsedSnapshot() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

const getCollapsedServerSnapshot = () => false;

function setCollapsedStored(next: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode, quota): the toggle just won't persist
  }
  collapsedListeners.forEach((listener) => listener());
}

function subscribeViewport(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

const getIsMobileViewport = () => window.innerWidth < 768;
const getIsMobileViewportServer = () => false;

function filterNav(items: NavigationItem[], user: Parameters<typeof canAccess>[0]): NavigationItem[] {
  return items.flatMap((item) => {
    const children = item.children ? filterNav(item.children, user) : undefined;

    // group headers (href "#") show only if at least one child is allowed
    if (item.href === "#") return children?.length ? [{ ...item, children }] : [];

    if (!canAccess(user, item.href!)) return [];
    return [children ? { ...item, children } : item];
  });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const isMobileViewport = useSyncExternalStore(
    subscribeViewport,
    getIsMobileViewport,
    getIsMobileViewportServer,
  );

  const handleLogout = () => {
    logout();
    router.replace('/');
  }

  // The menu only counts as open for the route it was opened on, and only on
  // a mobile viewport, so route changes and resizing to desktop close it.
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === pathname && isMobileViewport;
  const openMobile = () => setMobileOpenPath(pathname);
  const closeMobile = () => setMobileOpenPath(null);

  const hideMobileNavForTelegramTopic = pathname.startsWith(
    "/dashboard/telegram/topic",
  );
  const isSupportRoute = pathname.startsWith("/dashboard/support");
  const effectiveCollapsed = isSupportRoute ? true : collapsed;

  const sidebarWidth = effectiveCollapsed ? "w-16" : "w-64";
  const mobileTranslate = hideMobileNavForTelegramTopic
    ? "-translate-x-full"
    : mobileOpen
      ? "translate-x-0"
      : "-translate-x-full";

  const navLinks: NavigationItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <RiDashboardFill />,
    },
    {
      title: "Marketplace",
      href: "#",
      icon: <RiCommunityFill />,
      children: [
        {
          title: "Markets",
          href: "/dashboard/markets",
          icon: <RiStore3Fill />,
        },
        {
          title: "Suppliers",
          href: "/dashboard/suppliers",
          icon: <RiBuilding3Fill />,
        },
        {
          title: "Cities",
          href: "/dashboard/cities",
          icon: <RiRoadMapLine />,
        },
      ],
    },
    {
      title: "Stock Management",
      href: "#",
      icon: <RiArchiveStackFill />,
      children: [
        {
          title: "Products",
          href: "/dashboard/products",
          icon: <RiArchive2Line />,
          children: [
            {
              title: "Categories",
              href: "/dashboard/products/categories",
              icon: <LuBoxes />,
              children: [
                {
                  title: "Sub-Categories",
                  href: "/dashboard/products/categories/sub-categories",
                  icon: <LuBox />,
                },
              ],
            },
            // {
            //   title: "Sizes",
            //   href: "/dashboard/products/sizes",
            //   icon: <LuRuler />,
            // },
            // {
            //   title: "Variants",
            //   href: "/dashboard/products/variants",
            //   icon: <LuLayers />,
            // },
          ],
        },
        {
          title: "Bales",
          href: "/dashboard/bales",
          icon: <RiArchiveDrawerLine />,
        },
        {
          title: "Orders",
          href: "/dashboard/orders",
          icon: <RiListUnordered />,
        },
        {
          title: "Shipments",
          href: "/dashboard/shipments",
          icon: <RiShip2Line />,
        },
      ],
    },
    {
      title: "Services",
      href: "#",
      icon: <RiToolsFill />,
      children: [
        {
          title: "Inspections",
          href: "/dashboard/inspections",
          icon: <RiSurveyLine />,
        },
        {
          title: "Supplier Verifications",
          href: "/dashboard/supplier-verifications",
          icon: <RiVerifiedBadgeLine />,
        },
        {
          title: "Logistics",
          href: "/dashboard/logistics",
          icon: <RiTruckLine />,
        },
        {
          title: "RFQ Orders",
          href: "/dashboard/rfqs",
          icon: <RiFileList3Fill />,
        },
        {
          title: "Taxi Bookings",
          href: "/dashboard/taxi-bookings",
          icon: <RiCarLine />,
        },
        {
          title: "Pay Merchant",
          href: "/dashboard/pay-merchant",
          icon: <RiHandCoinLine />,
        },
        // {
        //   title: "Add Customer Cart",
        //   href: "/dashboard/add-to-cart",
        //   icon: <RiShoppingCart2Line />,
        // },
        {
          title: "Travel services",
          href: "/dashboard/travel-services",
          icon: <RiPlaneFill />,
          children: [
            {
              title: "Contacts",
              href: "/dashboard/travel-services/contacts",
              icon: <RiUserLine />,
            },
            {
              title: "Orders",
              href: "/dashboard/travel-services/orders",
              icon: <RiShoppingCart2Line />,
            },
          ],
        },
      ],
    },
    {
      title: "Customers",
      href: "/dashboard/customers",
      icon: <RiGroup2Fill />,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: <RiBarChartFill />,
      children: [
        {
          title: "Detailed Analytics",
          href: "/dashboard/analytics/raw-data",
          icon: <RiLineChartLine />,
        },
        {
          title: "Conversion Funnel",
          href: "/dashboard/analytics/funnels",
          icon: <RiFilter2Line />,
        },
        {
          title: "Product Analytics",
          href: "/dashboard/analytics/top-products",
          icon: <RiShirtLine />,
        },
        // {
        //   title: "User Analytics",
        //   href: "/dashboard/analytics/users",
        //   icon: <RiUserCommunityLine />,
        // },
      ],
    },
    {
      title: "Library",
      href: "/dashboard/library",
      icon: <RiBookShelfFill />,
    },
    {
      title: "Telegram",
      href: "/dashboard/telegram",
      icon: <RiTelegramFill />,
    },
    {
      title: "Exchange Rates",
      href: "/dashboard/rates",
      icon: <RiMoneyCnyCircleLine />,
      children: [
        {
          title: "Inspection Rates",
          href: "/dashboard/rates/inspections",
          icon: <RiSurveyLine />,
        },
        {
          title: "Logistics Rates",
          href: "/dashboard/rates/logistics",
          icon: <RiShip2Line />,
        },
        {
          title: "Shipping Charges",
          href: "/dashboard/shipping-charges",
          icon: <RiBillLine />,
        },
      ],
    },
    ...(user?.role === "super_admin" ||
    user?.role === "support_admin" ||
    user?.role === "operations_admin" ||
    user?.role === "admin"
      ? [
          {
            title: "Support Chat",
            href: "/dashboard/support",
            icon: <RiCustomerService2Fill />,
          },
        ]
      : []),
    ...(user?.role === "super_admin" || user?.role === "finance_admin"
      ? [
          {
            title: "Finance",
            href: "/dashboard/finance",
            icon: <RiMoneyDollarCircleFill />,
            children: [
              {
                title: "Records",
                href: "/dashboard/finance/records",
                icon: <RiFileList3Fill />,
              },
              {
                title: "Installments",
                href: "/dashboard/finance/installments",
                icon: <RiCalendarScheduleLine />,
              },
              {
                title: "Refunds",
                href: "/dashboard/finance/refunds",
                icon: <RiRefund2Fill />,
              },
            ],
          },
        ]
      : []),
    ...(user?.role === "super_admin" ||
    user?.role === "support_admin" ||
    user?.role === "admin"
      ? [
          {
            title: "Product Stats",
            href: "/dashboard/products/stats",
            icon: <LuChartBar />,
          },
        ]
      : []),
    ...(user?.role === "super_admin"
      ? [
          {
            title: "Admins",
            href: "/dashboard/admins",
            icon: <RiAdminFill />,
          },
          {
            title: "Roles",
            href: "/dashboard/roles",
            icon: <RiUserForbidFill />,
          },
        ]
      : []),
  ];

  const visibleLinks = filterNav(navLinks, user)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && !hideMobileNavForTelegramTopic && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
      {!hideMobileNavForTelegramTopic && (
        <button
          onClick={openMobile}
          className="
            fixed top-8 left-4 z-50
            md:hidden
            bg-(--surface)
            shadow-lg
            rounded-xl
            p-3
            border border-(--table-border)
          "
        >
          <RiSidebarFoldLine size={24} />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative top-0 left-0 z-50
          h-screen flex flex-col justify-between bg-(--surface)
          border-r border-(--table-border)
          transition-all duration-300 ease-in-out
          ${sidebarWidth}
          ${mobileTranslate}
          md:translate-x-0 no-scrollbar
        `}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div
            className={`my-3 mx-2 mb-6 p-2 rounded-xl flex ${effectiveCollapsed ? "flex-col" : "flex-row"} items-center justify-between gap-4`}
          >
            <p className="text-2xl font-bold">
              {effectiveCollapsed ? "L" : "440"}
            </p>

            {!isSupportRoute && (
              <RiSidebarFoldLine
                size={32}
                onClick={() => setCollapsedStored(!collapsed)}
                className="cursor-pointer bg-(--primary)/20 p-2 rounded-xl hidden md:block"
              />
            )}
            <button
              onClick={closeMobile}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 min-h-0">
            <ul className="flex flex-col items-center gap-2 px-2 overflow-y-auto h-full no-scrollbar">
              {visibleLinks.map((link, index) => {
                return (
                  <NavItem
                    key={index}
                    item={link}
                    collapsed={effectiveCollapsed}
                    onClick={closeMobile}
                  />
                );
              })}
            </ul>
          </nav>
        </div>

        {/* User Profile */}
        <div
          className={`
            flex items-center justify-between
            bg-(--background) sticky bottom-0
            ${effectiveCollapsed ? "p-1 justify-center" : "p-2"}
          `}
        >
          <div className="flex gap-2 items-center">
            <div className="w-10 h-10 rounded-full object-cover flex justify-center items-center bg-(--primary)/20">
              <RiUser4Fill className="text-(--primary)" />
            </div>
            {!effectiveCollapsed && (
              <div>
                <p className="font-bold text-sm">{user?.name}</p>
                <p className="text-(--muted) text-sm capitalize">
                  {user?.role.replace("_", " ")}
                </p>
              </div>
            )}
          </div>
          {!effectiveCollapsed && (
            <ActionDropdown
              actions={[
                {
                  label: "View Profile",
                  onClick: () => router.push("/dashboard/profile"),
                },
                {
                  label: "Logout",
                  danger: true,
                  onClick: () => handleLogout(),
                },
              ]}
              position={(rect) => ({
                top: rect.top - 8,
                left: rect.right,
                transform: "translate(-100%, -100%)",
              })}
            >
              <ThemeToggle />
            </ActionDropdown>
          )}
        </div>
      </aside>

      {/* Floating icon */}
      {/* {
        user?.role === "super_admin" &&
          <div className="w-12 h-12 rounded-full bg-(--primary) flex items-center justify-center text-white shadow-lg fixed bottom-4 right-8 z-50">
            <RiAdminLine size={24} />
          </div>
      } */}
    </>
  );
};

export default Sidebar;