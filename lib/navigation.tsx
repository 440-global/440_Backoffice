import {
  RiDashboardFill, RiCommunityFill, RiArchive2Line, RiArchiveDrawerLine,
  RiListUnordered, RiShip2Line, RiGroup2Fill, RiSurveyLine, RiVerifiedBadgeLine,
  RiTruckLine, RiFileList3Fill, RiCarLine, RiHandCoinLine, RiPlaneFill,
  RiBarChartFill, RiBookShelfFill, RiTelegramFill, RiCustomerService2Fill,
  RiMoneyDollarCircleFill, RiMoneyCnyCircleLine, RiAdminFill, RiUserForbidFill,
} from "react-icons/ri";
import { LuChartBar } from "react-icons/lu";
import type { NavSection, PageTabGroup } from "@/types/types";

export const NAV_SECTIONS: NavSection[] = [
  {
    links: [
      { title: "Dashboard", href: "/dashboard", icon: <RiDashboardFill />, exact: true },
    ],
  },
  {
    label: "Catalog",
    links: [
      { title: "Products", href: "/dashboard/products", icon: <RiArchive2Line /> },
      { title: "Bales", href: "/dashboard/bales", icon: <RiArchiveDrawerLine /> },
    ],
  },
  {
    label: "Operations",
    links: [
      { title: "Orders", href: "/dashboard/orders", icon: <RiListUnordered /> },
      { title: "Shipments", href: "/dashboard/shipments", icon: <RiShip2Line /> },
    ],
  },
  {
    label: "Marketplace",
    links: [
      {
        title: "Marketplace",
        href: "/dashboard/markets",
        icon: <RiCommunityFill />,
        matchPaths: ["/dashboard/markets", "/dashboard/suppliers", "/dashboard/cities"],
      },
      { title: "Customers", href: "/dashboard/customers", icon: <RiGroup2Fill /> },
    ],
  },
  {
    label: "Services",
    links: [
      { title: "Inspections", href: "/dashboard/inspections", icon: <RiSurveyLine /> },
      { title: "Supplier Verifications", href: "/dashboard/supplier-verifications", icon: <RiVerifiedBadgeLine /> },
      { title: "Logistics", href: "/dashboard/logistics", icon: <RiTruckLine /> },
      { title: "RFQ Orders", href: "/dashboard/rfqs", icon: <RiFileList3Fill /> },
      { title: "Taxi Bookings", href: "/dashboard/taxi-bookings", icon: <RiCarLine /> },
      { title: "Pay Merchant", href: "/dashboard/pay-merchant", icon: <RiHandCoinLine /> },
      { title: "Travel Services", href: "/dashboard/travel-services", icon: <RiPlaneFill /> },
    ],
  },
  {
    label: "Insights & Comms",
    links: [
      { title: "Analytics", href: "/dashboard/analytics", icon: <RiBarChartFill /> },
      { title: "Library", href: "/dashboard/library", icon: <RiBookShelfFill /> },
      { title: "Telegram", href: "/dashboard/telegram", icon: <RiTelegramFill /> },
      {
        title: "Support Chat",
        href: "/dashboard/support",
        icon: <RiCustomerService2Fill />,
      },
    ],
  },
  {
    label: "Finance",
    links: [
      {
        title: "Finance",
        href: "/dashboard/finance",
        icon: <RiMoneyDollarCircleFill />,
      },
      {
        title: "Rates & Charges",
        href: "/dashboard/rates",
        icon: <RiMoneyCnyCircleLine />,
        matchPaths: ["/dashboard/rates", "/dashboard/shipping-charges"],
      },
    ],
  },
  {
    label: "Administration",
    links: [
      {
        title: "Product Stats",
        href: "/dashboard/products/stats",
        icon: <LuChartBar />,
      },
      { title: "Admins", href: "/dashboard/admins", icon: <RiAdminFill /> },
      { title: "Roles", href: "/dashboard/roles", icon: <RiUserForbidFill /> },
    ],
  },
];

/** Former sidebar children, now shown as tabs on these pages. */
export const PAGE_TAB_GROUPS: PageTabGroup[] = [
  {
    id: "products",
    tabs: [
      { title: "Products", href: "/dashboard/products" },
      { title: "Categories", href: "/dashboard/products/categories" },
      { title: "Sub-Categories", href: "/dashboard/products/categories/sub-categories" },
    ],
  },
  {
    id: "marketplace",
    tabs: [
      { title: "Markets", href: "/dashboard/markets" },
      { title: "Suppliers", href: "/dashboard/suppliers" },
      { title: "Cities", href: "/dashboard/cities" },
    ],
  },
  {
    id: "travel",
    tabs: [
      { title: "Overview", href: "/dashboard/travel-services" },
      { title: "Contacts", href: "/dashboard/travel-services/contacts" },
      { title: "Orders", href: "/dashboard/travel-services/orders" },
    ],
  },
  {
    id: "analytics",
    tabs: [
      { title: "Overview", href: "/dashboard/analytics" },
      { title: "Detailed Analytics", href: "/dashboard/analytics/raw-data" },
      { title: "Conversion Funnel", href: "/dashboard/analytics/funnels" },
      { title: "Product Analytics", href: "/dashboard/analytics/top-products" },
    ],
  },
  {
    id: "finance",
    tabs: [
      { title: "Overview", href: "/dashboard/finance" },
      { title: "Records", href: "/dashboard/finance/records" },
      { title: "Installments", href: "/dashboard/finance/installments" },
      { title: "Refunds", href: "/dashboard/finance/refunds" },
    ],
  },
  {
    id: "rates",
    tabs: [
      { title: "Overview", href: "/dashboard/rates" },
      { title: "Inspection Rates", href: "/dashboard/rates/inspections" },
      { title: "Logistics Rates", href: "/dashboard/rates/logistics" },
      { title: "Shipping Charges", href: "/dashboard/shipping-charges" },
    ],
  },
];