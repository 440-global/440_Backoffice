"use client";

import { useState, useSyncExternalStore } from "react";
import {
  RiSidebarFoldLine,
  RiUser4Fill,
} from "react-icons/ri";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import ActionDropdown from "./action_dropdown";
import { canAccess } from "@/lib/route-access";
import NavLink from "./nav-link";
import { NAV_SECTIONS } from "@/lib/navigation";
import type { NavLinkItem, NavSection } from "@/types/types";
import Image from "next/image";

import Logo from "@/public/images/favicon.svg";

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

function filterSections(sections: NavSection[], user: Parameters<typeof canAccess>[0]): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      links: section.links.flatMap((link) => {
        const target = (link.matchPaths ?? [link.href]).find((p) => canAccess(user, p));
        return target ? [{ ...link, href: target }] : [];
      }),
    }))
    .filter((section) => section.links.length > 0);
}

// longest matching prefix wins, so /dashboard/products/stats
// highlights "Product Stats", not "Products"
function findActiveHref(links: NavLinkItem[], pathname: string) {
  let bestHref: string | null = null;
  let bestLen = -1;
  for (const link of links) {
    for (const p of link.matchPaths ?? [link.href]) {
      const hit = link.exact
        ? pathname === p
        : pathname === p || pathname.startsWith(p + "/");
      if (hit && p.length > bestLen) {
        bestLen = p.length;
        bestHref = link.href;
      }
    }
  }
  return bestHref;
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

    const visibleSections = filterSections(NAV_SECTIONS, user);
    const activeHref = findActiveHref(visibleSections.flatMap((s) => s.links), pathname);

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
            className={`my-2 mx-2 mb-3 p-2 rounded-xl flex ${effectiveCollapsed ? "flex-col" : "flex-row"} items-center justify-between gap-4`}
          >
            <div className="flex gap-2 items-center">
              <Image src={Logo} alt=""  />
              <p className={`text-xl font-bold ${effectiveCollapsed ? 'hidden' : 'block'}`}>
                440
              </p>
            </div>

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
            <div className="flex h-full flex-col gap-1 overflow-y-auto px-2 no-scrollbar">
              {visibleSections.map((section, i) => (
                <div key={section.label ?? i} className="w-full">
                  {section.label && !effectiveCollapsed ? (
                    <p className="mb-1 mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-(--muted)">
                      {section.label}
                    </p>
                  ) : (
                    i > 0 && <hr className="my-2 border-(--table-border)" />
                  )}
                  <ul className="flex flex-col gap-1">
                    {section.links.map((link) => (
                      <NavLink
                        key={link.href}
                        item={link}
                        active={link.href === activeHref}
                        collapsed={effectiveCollapsed}
                        onClick={closeMobile}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
            />
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