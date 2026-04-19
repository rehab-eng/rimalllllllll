"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

type AdminShellProps = {
  children: ReactNode;
};

const navigationItems = [
  { href: "/admin", label: "الرئيسية", shortLabel: "الرئيسية", icon: <HomeIcon /> },
  { href: "/admin/stations", label: "المحطات", shortLabel: "المحطات", icon: <StationIcon /> },
  { href: "/admin/drivers", label: "السائقون", shortLabel: "السائقون", icon: <DriverIcon /> },
];

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex lg:flex-row-reverse">
      <aside className="hidden h-screen w-72 shrink-0 border-l border-slate-200 bg-white lg:flex lg:flex-col lg:sticky lg:top-0">
        <nav className="flex flex-1 flex-col gap-2 px-4 py-6">
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              isActive={pathname === item.href}
              icon={item.icon}
              label={item.label}
              onClick={undefined}
            />
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <button
              type="button"
              aria-label="فتح قائمة الإدارة"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700"
            >
              <MenuIcon />
            </button>

            <div className="text-right">
              <p className="text-lg font-black text-slate-950">{getMobileTitle(pathname)}</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <nav className="grid grid-cols-3">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 ${
                  pathname === item.href ? "text-amber-600" : "text-slate-800"
                }`}
              >
                <span className={pathname === item.href ? "text-amber-600" : "text-slate-900"}>{item.icon}</span>
                <span
                  className={`text-[11px] font-bold ${
                    pathname === item.href ? "text-amber-700" : "text-slate-900"
                  }`}
                >
                  {item.shortLabel}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/25"
          />

          <div className="absolute inset-y-0 right-0 w-[84vw] max-w-xs border-l border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
              >
                <CloseIcon />
              </button>

              <p className="text-lg font-black text-slate-950">القائمة</p>
            </div>

            <nav className="grid gap-2 px-4 py-5">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  isActive={pathname === item.href}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => setIsMenuOpen(false)}
                />
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  href,
  isActive,
  icon,
  label,
  onClick,
}: {
  href: string;
  isActive: boolean;
  icon: ReactNode;
  label: string;
  onClick?: (() => void) | undefined;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 text-sm font-black transition-colors ${
        isActive
          ? "border-amber-200 bg-amber-50 text-amber-600"
          : "border-slate-200 bg-white text-slate-800"
      }`}
    >
      <span className={isActive ? "text-amber-600" : "text-slate-900"}>{icon}</span>
      <span className={isActive ? "text-amber-700" : "text-slate-900"}>{label}</span>
    </Link>
  );
}

function getMobileTitle(pathname: string) {
  if (pathname === "/admin/stations") {
    return "المحطات";
  }

  if (pathname === "/admin/drivers") {
    return "السائقون";
  }

  return "الرئيسية";
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 10.5L12 4L20 10.5V20H4V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function StationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 20V8L12 5L18 8V20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DriverIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
