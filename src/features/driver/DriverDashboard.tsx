"use client";

import { Children, cloneElement, isValidElement, useMemo, useState, useTransition } from "react";
import type { ReactElement, ReactNode } from "react";

import { driverStatusLabels, formatArabicDecimal, formatArabicNumber } from "../../lib/labels";
import type { DriverDashboardData, DriverNavigationItem } from "./types";

type DriverDashboardProps = {
  driver: DriverDashboardData;
  navigationItems?: DriverNavigationItem[];
  activeNavId?: string;
  onNavigate?: (itemId: string) => void;
  onSignOut?: () => Promise<void> | void;
  children?: ReactNode;
  homeContent?: ReactNode;
  vehiclesContent?: ReactNode;
  historyContent?: ReactNode;
};

type DriverTabId = "home" | "vehicles" | "history";

const tabs: Array<{
  id: DriverTabId;
  label: string;
  icon: ReactNode;
}> = [
  {
    id: "home",
    label: "الرئيسية",
    icon: <HomeIcon />,
  },
  {
    id: "vehicles",
    label: "شاحناتي",
    icon: <TruckIcon />,
  },
  {
    id: "history",
    label: "السجل",
    icon: <HistoryIcon />,
  },
];

export default function DriverDashboard({
  driver,
  onNavigate,
  onSignOut,
  children,
  homeContent,
  vehiclesContent,
  historyContent,
}: DriverDashboardProps) {
  const [activeTab, setActiveTab] = useState<DriverTabId>("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, startTransition] = useTransition();

  const legacyChildren = useMemo(() => {
    const directChildren = Children.toArray(children);

    if (directChildren.length === 1 && isValidElement(directChildren[0])) {
      const onlyChild = directChildren[0] as ReactElement<{ children?: ReactNode }>;
      return Children.toArray(onlyChild.props.children);
    }

    return directChildren;
  }, [children]);

  const fallbackStatsElement = legacyChildren[2];
  const fallbackAddVehicleElement = legacyChildren[3];

  const resolvedHomeContent = useMemo(
    () =>
      homeContent ?? (
        <>
          {legacyChildren[0] ?? null}
          {legacyChildren[1] ?? null}
        </>
      ),
    [homeContent, legacyChildren],
  );

  const resolvedVehiclesContent = useMemo(
    () =>
      vehiclesContent ?? (
        <>
          {cloneStatsSection(fallbackStatsElement, "fleet")}
          {fallbackAddVehicleElement ?? null}
        </>
      ),
    [fallbackAddVehicleElement, fallbackStatsElement, vehiclesContent],
  );

  const resolvedHistoryContent = useMemo(
    () => historyContent ?? cloneStatsSection(fallbackStatsElement, "history"),
    [fallbackStatsElement, historyContent],
  );

  const activeContent = useMemo(() => {
    if (activeTab === "vehicles") {
      return resolvedVehiclesContent;
    }

    if (activeTab === "history") {
      return resolvedHistoryContent;
    }

    return resolvedHomeContent;
  }, [activeTab, resolvedHistoryContent, resolvedHomeContent, resolvedVehiclesContent]);

  const handleSignOut = () => {
    if (!onSignOut) {
      return;
    }

    startTransition(async () => {
      await onSignOut();
      setIsMenuOpen(false);
    });
  };

  const handleTabChange = (tabId: DriverTabId) => {
    setActiveTab(tabId);
    onNavigate?.(tabId);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              aria-label="فتح القائمة"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            >
              <MenuIcon />
            </button>

            <div className="text-right">
              <p className="text-[11px] font-bold tracking-[0.16em] text-slate-500">بوابة السائق</p>
              <h1 className="mt-1 text-xl font-black text-slate-950">{driver.fullName}</h1>
              <div className="mt-2 flex items-center justify-end gap-2">
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {driver.code}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    driver.accountStatus === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {driverStatusLabels[driver.accountStatus]}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <QuickStat label="لتر مؤكد" value={formatArabicDecimal(driver.totalFilledLiters)} />
            <QuickStat label="عمليات" value={formatArabicNumber(driver.totalFuelLogs)} />
            <QuickStat label="محطات مفتوحة" value={formatArabicNumber(driver.activeStationCount)} />
          </div>
        </div>
      </header>

      <main className="pb-24">{activeContent}</main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto grid w-full max-w-md grid-cols-3">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1.5 ${
                  isActive ? "text-amber-500" : "text-slate-400"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="text-[11px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/20"
          />

          <aside className="absolute inset-x-4 top-4 rounded-3xl border border-slate-200 bg-white p-5 text-right shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              >
                <CloseIcon />
              </button>

              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-slate-500">الحساب</p>
                <p className="mt-1 text-lg font-black text-slate-950">{driver.fullName}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  الجلسة محفوظة حالياً
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-black text-slate-700 disabled:opacity-60"
            >
              {isSigningOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function cloneStatsSection(node: ReactNode, mode: "fleet" | "history") {
  if (!isValidElement(node)) {
    return node ?? null;
  }

  return cloneElement(node as ReactElement<{ mode?: "fleet" | "history" }>, {
    mode,
  });
}

function QuickStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-slate-500">{label}</p>
    </div>
  );
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

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M3 7H14V16H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 10H18L21 13V16H14V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 7V12L15.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12A8 8 0 1 0 6.34 6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 4V9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
