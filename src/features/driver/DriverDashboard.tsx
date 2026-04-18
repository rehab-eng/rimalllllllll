"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";

import { driverStatusLabels, formatArabicNumber } from "../../lib/labels";
import type { DriverDashboardData, DriverNavigationItem } from "./types";

type DriverDashboardProps = {
  driver: DriverDashboardData;
  navigationItems: DriverNavigationItem[];
  activeNavId?: string;
  onNavigate?: (itemId: string) => void;
  onSignOut?: () => Promise<void> | void;
  children?: ReactNode;
};

export default function DriverDashboard({
  driver,
  navigationItems,
  activeNavId,
  onNavigate,
  onSignOut,
  children,
}: DriverDashboardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, startTransition] = useTransition();

  const handleNavigate = (itemId: string) => {
    onNavigate?.(itemId);
    setIsMenuOpen(false);
  };

  const handleSignOut = () => {
    if (!onSignOut) {
      return;
    }

    startTransition(async () => {
      await onSignOut();
      setIsMenuOpen(false);
    });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 text-amber-950">
      <div className="bg-amber-50/85 backdrop-blur-md border border-amber-200 relative overflow-hidden rounded-[30px] p-5 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(120,53,15,0.08),transparent_28%)]" />

        <div className="relative flex items-start justify-between gap-3">
          <button
            type="button"
            aria-label="فتح قائمة التنقل"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-950"
          >
            <HamburgerIcon />
          </button>

          <div className="flex-1 text-right">
            <p className="text-xs font-bold tracking-[0.18em] text-amber-900">بوابة السائق</p>
            <h1 className="mt-2 text-3xl font-black text-amber-950">{driver.fullName}</h1>
            <p className="mt-2 text-sm font-semibold text-amber-900">
              متابعة التعبئة والشاحنات والمحطات
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center justify-end gap-3">
          <div className="inline-flex rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-black text-amber-950">
            {driver.code}
          </div>
          <div
            className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${
              driver.accountStatus === "ACTIVE"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-amber-200 bg-amber-100 text-amber-900"
            }`}
          >
            {driverStatusLabels[driver.accountStatus]}
          </div>
        </div>
      </div>

      <div className="bg-amber-50/85 backdrop-blur-md border border-amber-200 mt-4 rounded-[30px] p-5 shadow-2xl">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="إجمالي اللترات"
            value={formatArabicNumber(driver.totalFilledLiters)}
            helper="كل الفترات"
          />
          <StatCard
            label="سجلات التعبئة"
            value={formatArabicNumber(driver.totalFuelLogs)}
            helper="عمليات مؤكدة"
          />
          <StatCard
            label="الشاحنات"
            value={formatArabicNumber(driver.vehicleCount)}
            helper="مرتبطة بالحساب"
          />
          <StatCard
            label="المحطات المتاحة"
            value={formatArabicNumber(driver.activeStationCount)}
            helper="مفتوحة الآن"
          />
        </div>
      </div>

      <div className="mt-4 flex-1">{children}</div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="إغلاق قائمة التنقل"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <aside className="bg-amber-50/95 backdrop-blur-md border border-amber-200 absolute left-4 right-4 top-4 z-50 rounded-[30px] p-4 text-amber-950 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label="إغلاق القائمة"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-950"
              >
                <CloseIcon />
              </button>

              <div className="text-right">
                <p className="text-xs font-bold tracking-[0.18em] text-amber-900">القائمة</p>
                <p className="mt-2 text-lg font-black text-amber-950">{driver.fullName}</p>
              </div>
            </div>

            <nav className="mt-5 flex flex-col gap-3">
              {navigationItems.map((item) => {
                const isActive = activeNavId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 text-right ${
                      isActive
                        ? "border-amber-300 bg-amber-200 text-amber-950"
                        : "border-amber-200 bg-white text-amber-900"
                    }`}
                  >
                    <span className={`text-base font-black ${isActive ? "text-amber-950" : "text-amber-900"}`}>
                      {item.label}
                    </span>
                    <span className={isActive ? "text-amber-950" : "text-amber-900"}>
                      {item.icon ?? <NavDot />}
                    </span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="mt-4 min-h-14 w-full rounded-2xl border border-amber-300 bg-white px-4 text-base font-black text-amber-950 disabled:opacity-60"
            >
              {isSigningOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <div className="rounded-[24px] border border-amber-200 bg-white p-4 text-right">
      <p className="text-xs font-bold tracking-[0.08em] text-amber-900">{label}</p>
      <p className="mt-3 text-3xl font-black text-amber-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-amber-800">{helper}</p>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-amber-950" fill="none" aria-hidden="true">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-950" fill="none" aria-hidden="true">
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function NavDot() {
  return <span className="block h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />;
}
