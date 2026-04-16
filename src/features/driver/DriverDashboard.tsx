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

const formatLiters = (value: number): string =>
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4 text-white">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Rimall Lines</p>
            <h1 className="mt-1 text-2xl font-black text-white">{driver.fullName}</h1>
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
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 mt-4 rounded-[28px] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Driver Code</p>
            <div className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-base font-black text-black">
              {driver.code}
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-white">Total Filled Liters</p>
            <p className="mt-2 text-4xl font-black leading-none text-white">
              {formatLiters(driver.totalFilledLiters)}
            </p>
            <p className="mt-2 text-sm font-semibold text-white">Liters</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/20 bg-black/25 px-4 py-3">
          <span className="text-sm font-bold text-white">Registered Vehicles</span>
          <span className="text-lg font-black text-white">{driver.vehicleCount ?? 0}</span>
        </div>
      </div>

      <div className="mt-4 flex-1">{children}</div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <aside className="bg-white/10 backdrop-blur-md border border-white/20 absolute left-4 top-4 bottom-4 z-50 flex w-[min(18rem,calc(100vw-2rem))] flex-col rounded-[32px] p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Navigation</p>
                <p className="mt-1 text-lg font-black text-white">{driver.fullName}</p>
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

            <nav className="mt-6 flex flex-1 flex-col gap-3">
              {navigationItems.map((item) => {
                const isActive = activeNavId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 text-left ${
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
              className="mt-4 min-h-14 rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-black text-white"
            >
              Sign Out
            </button>
          </aside>
        </div>
      ) : null}
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
