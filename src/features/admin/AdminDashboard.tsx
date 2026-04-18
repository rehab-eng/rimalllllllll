"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { getPusherClient } from "../../lib/pusher";
import { formatArabicNumber } from "../../lib/labels";
import type { AdminRealtimeFuelLog, AdminStatItem } from "./types";

type AdminDashboardProps = {
  adminName: string;
  initialTotalLogsToday: number;
  stats?: AdminStatItem[];
  onRealtimeLog?: (payload: AdminRealtimeFuelLog) => void;
  children?: ReactNode;
};

const navigationItems = [
  { id: "overview", label: "الرئيسية", icon: <HomeIcon /> },
  { id: "stations", label: "المحطات", icon: <StationIcon /> },
  { id: "drivers", label: "السائقين", icon: <DriverIcon /> },
] as const;

const isSameLocalDay = (value: Date | string, compareDate: Date): boolean => {
  const targetDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  return (
    targetDate.getFullYear() === compareDate.getFullYear() &&
    targetDate.getMonth() === compareDate.getMonth() &&
    targetDate.getDate() === compareDate.getDate()
  );
};

export default function AdminDashboard({
  adminName,
  initialTotalLogsToday,
  stats = [],
  onRealtimeLog,
  children,
}: AdminDashboardProps) {
  const [activeSection, setActiveSection] =
    useState<(typeof navigationItems)[number]["id"]>("overview");
  const [totalLogsToday, setTotalLogsToday] = useState(initialTotalLogsToday);
  const [lastRealtimeMessage, setLastRealtimeMessage] = useState("جاري فحص الاتصال اللحظي.");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    try {
      const pusher = getPusherClient();
      const channel = pusher.subscribe("admin-dashboard");

      setIsRealtimeConnected(true);
      setLastRealtimeMessage("المراقبة اللحظية تعمل الآن.");

      const handleNewFuelLog = (payload: AdminRealtimeFuelLog) => {
        if (isSameLocalDay(payload.date, new Date())) {
          setTotalLogsToday((current) => current + 1);
        }

        const driverLabel = payload.driver?.full_name || payload.driver?.code || "سائق";
        setLastRealtimeMessage(`آخر عملية وصلت من السائق ${driverLabel}.`);
        onRealtimeLog?.(payload);
      };

      channel.bind("new-fuel-log", handleNewFuelLog);

      return () => {
        channel.unbind("new-fuel-log", handleNewFuelLog);
        pusher.unsubscribe("admin-dashboard");
      };
    } catch {
      setIsRealtimeConnected(false);
      setLastRealtimeMessage("التغذية اللحظية غير متاحة حالياً. تحقق من إعدادات Pusher.");
    }
  }, [onRealtimeLog]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <section id="overview" className="scroll-mt-24">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="text-right">
                  <p className="text-xs font-black tracking-[0.2em] text-slate-500">RIMALL CONTROL ROOM</p>
                  <h1 className="mt-3 text-3xl font-black text-slate-950 lg:text-5xl">
                    لوحة الإدارة
                  </h1>
                  <p className="mt-3 text-base font-semibold text-slate-600">
                    إدارة المحطات والسائقين وسجل التعبئة من واجهة واحدة مرتبة.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <StatusCard
                    label="البث المباشر"
                    value={isRealtimeConnected ? "متصل" : "متوقف"}
                    tone={isRealtimeConnected ? "success" : "neutral"}
                  />
                  <StatusCard
                    label="سجلات اليوم"
                    value={formatArabicNumber(totalLogsToday)}
                    tone="primary"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-right">
                <p className="text-sm font-black text-slate-800">{lastRealtimeMessage}</p>
              </div>

              {stats.length > 0 ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-right">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-amber-500">{stat.icon ?? <MiniDotIcon />}</span>
                        <p className="text-sm font-black text-slate-700">{stat.label}</p>
                      </div>
                      <p className="mt-4 text-4xl font-black text-slate-950">
                        {typeof stat.value === "number" ? formatArabicNumber(stat.value) : stat.value}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{stat.hint ?? ""}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <div className="mt-8 space-y-8">{children}</div>
        </main>

        <aside className="order-first border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:order-last lg:min-h-screen lg:border-b-0 lg:border-l lg:px-6 lg:py-8">
          <div className="lg:sticky lg:top-8">
            <div className="text-right">
              <p className="text-xs font-black tracking-[0.18em] text-slate-500">ADMIN</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{adminName}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                متابعة يومية للسائقين والمحطات من نفس اللوحة.
              </p>
            </div>

            <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {navigationItems.map((item) => {
                const isActive = activeSection === item.id;

                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setActiveSection(item.id)}
                    className={`inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 text-sm font-black transition-colors ${
                      isActive
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span>{item.icon}</span>
                  </a>
                );
              })}
            </nav>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-right">
              <p className="text-sm font-black text-slate-800">ملخص سريع</p>
              <div className="mt-4 space-y-3">
                <QuickFact label="سجلات اليوم" value={formatArabicNumber(totalLogsToday)} />
                <QuickFact label="الاتصال اللحظي" value={isRealtimeConnected ? "متصل" : "متوقف"} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "neutral" | "primary";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "primary"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`min-w-[180px] rounded-2xl border p-4 text-right ${toneClass}`}>
      <p className="text-xs font-black tracking-[0.12em]">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}

function QuickFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-black text-slate-900">{value}</span>
      <span className="text-sm font-semibold text-slate-500">{label}</span>
    </div>
  );
}

function MiniDotIcon() {
  return <span className="block h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />;
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M4 10.5L12 4L20 10.5V20H4V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function StationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M6 20V8L12 5L18 8V20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DriverIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
