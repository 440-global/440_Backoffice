"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  RiArchive2Line,
  RiArchiveDrawerLine,
  RiBarChartFill,
  RiBillLine,
  RiBookShelfFill,
  RiBuilding3Fill,
  RiCarLine,
  RiCustomerService2Fill,
  RiFileList3Fill,
  RiGroup2Fill,
  RiHandCoinLine,
  RiListUnordered,
  RiMoneyCnyCircleLine,
  RiMoneyDollarCircleFill,
  RiPlaneFill,
  RiRoadMapLine,
  RiShip2Line,
  RiStore3Fill,
  RiSurveyLine,
  RiTelegramFill,
  RiTruckLine,
  RiVerifiedBadgeLine,
  RiAdminFill,
  RiUserForbidFill,
  RiArrowRightLine,
  RiHandHeartLine,
} from "react-icons/ri";
import { useAuth } from "@/hooks/use-auth";
import { canAccess, requiredPermission } from "@/lib/route-access";

type QuickLink = { title: string; description: string; href: string; icon: ReactNode };
type QuickGroup = { title: string; links: QuickLink[] };

/**
 * Every page a role might land on, grouped like the sidebar. Nothing here decides access:
 * each link is filtered with `canAccess`, the same check RouteGuard uses, so the card can't
 * offer a page the guard would block.
 */
const GROUPS: QuickGroup[] = [
  {
    title: "Marketplace",
    links: [
      { title: "Markets", description: "Browse and manage markets", href: "/dashboard/markets", icon: <RiStore3Fill /> },
      { title: "Suppliers", description: "Supplier accounts and details", href: "/dashboard/suppliers", icon: <RiBuilding3Fill /> },
      { title: "Cities", description: "Cities we operate in", href: "/dashboard/cities", icon: <RiRoadMapLine /> },
    ],
  },
  {
    title: "Stock management",
    links: [
      { title: "Products", description: "Catalogue, categories and stats", href: "/dashboard/products", icon: <RiArchive2Line /> },
      { title: "Bales", description: "Bale inventory and pools", href: "/dashboard/bales", icon: <RiArchiveDrawerLine /> },
      { title: "Orders", description: "Customer orders and payments", href: "/dashboard/orders", icon: <RiListUnordered /> },
      { title: "Shipments", description: "Track shipments and stages", href: "/dashboard/shipments", icon: <RiShip2Line /> },
    ],
  },
  {
    title: "Services",
    links: [
      { title: "Inspections", description: "Inspection requests", href: "/dashboard/inspections", icon: <RiSurveyLine /> },
      { title: "Supplier verifications", description: "Verification requests", href: "/dashboard/supplier-verifications", icon: <RiVerifiedBadgeLine /> },
      { title: "Logistics", description: "Logistics requests", href: "/dashboard/logistics", icon: <RiTruckLine /> },
      { title: "RFQ orders", description: "Requests for quotation", href: "/dashboard/rfqs", icon: <RiFileList3Fill /> },
      { title: "Taxi bookings", description: "Taxi booking requests", href: "/dashboard/taxi-bookings", icon: <RiCarLine /> },
      { title: "Pay merchant", description: "Pay a merchant for a customer", href: "/dashboard/pay-merchant", icon: <RiHandCoinLine /> },
      { title: "Travel services", description: "Contacts and travel orders", href: "/dashboard/travel-services", icon: <RiPlaneFill /> },
    ],
  },
  {
    title: "Customers & communication",
    links: [
      { title: "Customers", description: "Customer accounts", href: "/dashboard/customers", icon: <RiGroup2Fill /> },
      { title: "Support chat", description: "Talk to customers", href: "/dashboard/support", icon: <RiCustomerService2Fill /> },
      { title: "Telegram", description: "Telegram topics and drafts", href: "/dashboard/telegram", icon: <RiTelegramFill /> },
      { title: "Library", description: "Shared files and resources", href: "/dashboard/library", icon: <RiBookShelfFill /> },
    ],
  },
  {
    title: "Money & insight",
    links: [
      { title: "Finance", description: "Records, installments and refunds", href: "/dashboard/finance", icon: <RiMoneyDollarCircleFill /> },
      { title: "Exchange rates", description: "Inspection and logistics rates", href: "/dashboard/rates", icon: <RiMoneyCnyCircleLine /> },
      { title: "Shipping charges", description: "Order shipping charges", href: "/dashboard/shipping-charges", icon: <RiBillLine /> },
      { title: "Analytics", description: "Traffic, funnels and top products", href: "/dashboard/analytics", icon: <RiBarChartFill /> },
    ],
  },
  {
    title: "Administration",
    links: [
      { title: "Admins", description: "Admin accounts", href: "/dashboard/admins", icon: <RiAdminFill /> },
      { title: "Roles", description: "Roles and permissions", href: "/dashboard/roles", icon: <RiUserForbidFill /> },
    ],
  },
];

const formatRole = (role?: string | null) =>
  role ? role.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "";

const WelcomeCard = () => {
  const { user } = useAuth();
  const role = user?.role;

  const groups = GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => canAccess(user, link.href)),
  })).filter((group) => group.links.length > 0);

  const firstName = user?.name?.split(" ")[0];
  const pageCount = groups.reduce((total, group) => total + group.links.length, 0);

  console.log(
    user?.permissions,
    GROUPS[0].links.map((l) => [l.href, requiredPermission(l.href), canAccess(user, l.href)]),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <section className="rounded-2xl border border-(--table-border) bg-(--surface) p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--primary)/20 text-(--primary)">
            <RiHandHeartLine size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{firstName ? `Welcome, ${firstName}` : "Welcome"}</h1>
            <p className="mt-1 text-sm text-(--muted)">
              You&apos;re signed in as <span className="font-medium text-inherit">{formatRole(role)}</span>.
              {pageCount > 0
                ? ` Here are the ${pageCount} pages you can open.`
                : " No pages are assigned to your role yet."}
            </p>
          </div>
        </div>
      </section>

      {/* Nothing available */}
      {groups.length === 0 && (
        <section className="rounded-2xl border border-dashed border-(--table-border) p-8 text-center text-sm text-(--muted)">
          Ask a super admin to update your role if you need access to something.
        </section>
      )}

      {/* Allowed pages */}
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-(--muted)">{group.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-xl border border-(--table-border) bg-(--surface) p-4 transition-colors hover:border-(--primary)"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--primary)/10 text-lg text-(--primary)">
                  {link.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{link.title}</span>
                  <span className="block truncate text-xs text-(--muted)">{link.description}</span>
                </span>
                <RiArrowRightLine className="shrink-0 text-(--muted) transition-transform group-hover:translate-x-0.5 group-hover:text-(--primary)" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default WelcomeCard;