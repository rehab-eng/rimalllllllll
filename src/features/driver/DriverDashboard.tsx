"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type { DriverDashboardData, DriverNavigationItem } from "./types";

type DriverDashboardProps = {
  driver: DriverDashboardData;
  navigationItems: DriverNavigationItem[];
  activeNavId?: string;
  onNavigate?: (itemId: string) => void;
  onSignOut?: () => void;
  children?: ReactNode;
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

export default function DriverDashboard({
  driver,
  navigationItems,
  activeNavId,
  onNavigate,
  onSignOut,
  children,
}: DriverDashboardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (itemId: string) => {
    onNavigate?.(itemId);
    setIsMenuOpen(false);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 text-white">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 relative overflow-hidden rounded-[30px] p-5 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(190,242,100,0.12),transparent_28%)]" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white">Rimall Lines</p>
            <h1 className="mt-2 text-3xl font-black text-white">{driver.fullName}</h1>
            <p className="mt-2 text-sm font-semibold text-white">Driver access and fuel follow-up</p>
          </div>

          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-black/30 text-white"
          >
            <HamburgerIcon />
          </button>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-black">
            {driver.code}
          </div>
          <div
            className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${
              driver.accountStatus === "ACTIVE"
                ? "bg-white text-black"
                : "border border-white/20 bg-black/30 text-white"
            }`}
          >
            {driver.accountStatus}
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 mt-4 rounded-[30px] p-5 shadow-2xl">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Liters" value={formatNumber(driver.totalFilledLiters)} helper="All periods" />
          <StatCard label="Fuel Logs" value={driver.totalFuelLogs} helper="Confirmed fills" />
          <StatCard label="Vehicles" value={driver.vehicleCount} helper="Registered trucks" />
          <StatCard label="Open Stations" value={driver.activeStationCount} helper="Available now" />
        </div>
      </div>

      <div className="mt-4 flex-1">{children}</div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <aside className="bg-white/10 backdrop-blur-md border border-white/20 absolute left-4 right-4 top-4 z-50 rounded-[30px] p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Navigation</p>
                <p className="mt-2 text-lg font-black text-white">{driver.fullName}</p>
              </div>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-black/30 text-white"
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="mt-5 flex flex-col gap-3">
              {navigationItems.map((item) => {
                const isActive = activeNavId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-left ${
                      isActive
                        ? "border-white bg-white text-black"
                        : "border-white/20 bg-black/25 text-white"
                    }`}
                  >
                    <span className={isActive ? "text-black" : "text-white"}>
                      {item.icon ?? <NavDot />}
                    </span>
                    <span className={`text-base font-black ${isActive ? "text-black" : "text-white"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={onSignOut}
              className="mt-4 min-h-14 w-full rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-black text-white"
            >
              Sign Out
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
    <div className="rounded-[24px] border border-white/20 bg-black/25 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm font-semibold text-white">{helper}</p>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" aria-hidden="true">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" aria-hidden="true">
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function NavDot() {
  return <span className="block h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />;
}
