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
  const [totalLogsToday, setTotalLogsToday] = useState(initialTotalLogsToday);
  const [lastRealtimeMessage, setLastRealtimeMessage] = useState("جارٍ فحص الاتصال اللحظي.");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    try {
      const pusher = getPusherClient();
      const channel = pusher.subscribe("admin-dashboard");

      setIsRealtimeConnected(true);
      setLastRealtimeMessage("المراقبة اللحظية تعمل.");

      const handleNewFuelLog = (payload: AdminRealtimeFuelLog) => {
        if (isSameLocalDay(payload.date, new Date())) {
          setTotalLogsToday((current) => current + 1);
        }

        const driverLabel = payload.driver?.full_name || payload.driver?.code || "سائق";
        setLastRealtimeMessage(`آخر عملية تأكيد تمت للسائق ${driverLabel}.`);
        onRealtimeLog?.(payload);
      };

      channel.bind("new-fuel-log", handleNewFuelLog);

      return () => {
        channel.unbind("new-fuel-log", handleNewFuelLog);
        pusher.unsubscribe("admin-dashboard");
      };
    } catch {
      setIsRealtimeConnected(false);
      setLastRealtimeMessage("التغذية اللحظية غير متاحة. تحقق من إعدادات Pusher.");
    }
  }, [onRealtimeLog]);

  return (
    <div className="min-h-screen px-6 py-6 text-white lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,0.85fr)]">
        <section className="bg-white/10 backdrop-blur-md border border-white/20 relative overflow-hidden rounded-[34px] p-6 shadow-2xl lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.20),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(163,230,53,0.12),transparent_32%)]" />

          <div className="relative flex items-start justify-between gap-6">
            <div className="rounded-full border border-white/20 bg-black/30 px-4 py-2">
              <span className="text-sm font-black text-white">
                {isRealtimeConnected ? "البث المباشر متصل" : "البث المباشر متوقف"}
              </span>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold tracking-[0.18em] text-white">لوحة الإدارة</p>
              <h1 className="mt-3 text-4xl font-black text-white lg:text-6xl">غرفة التحكم</h1>
              <p className="mt-3 text-base font-semibold text-white">مرحبًا، {adminName}</p>
            </div>
          </div>

          {stats.length > 0 ? (
            <div className="relative mt-8 grid gap-4 lg:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.id} className="rounded-[24px] border border-white/20 bg-black/25 p-5 text-right">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-white">{stat.icon ?? <MiniDotIcon />}</span>
                    <p className="text-sm font-bold text-white">{stat.label}</p>
                  </div>
                  <p className="mt-4 text-4xl font-black text-white">
                    {typeof stat.value === "number" ? formatArabicNumber(stat.value) : stat.value}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{stat.hint ?? "إشارة تشغيل مباشرة"}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[34px] p-6 shadow-2xl lg:p-8">
          <p className="text-sm font-bold tracking-[0.16em] text-white text-right">اليوم</p>
          <div className="mt-5 rounded-[28px] border border-white/20 bg-black/30 p-6 text-right">
            <p className="text-base font-bold text-white">إجمالي سجلات اليوم</p>
            <p className="mt-4 text-6xl font-black leading-none text-white">{formatArabicNumber(totalLogsToday)}</p>
            <p className="mt-4 text-sm font-semibold text-white">{lastRealtimeMessage}</p>
          </div>
        </aside>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}

function MiniDotIcon() {
  return <span className="block h-3 w-3 rounded-full bg-white" aria-hidden="true" />;
}
