"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { getPusherClient } from "../../lib/pusher";
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
  const [lastRealtimeMessage, setLastRealtimeMessage] = useState("Live feed is ready.");

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe("admin-dashboard");

    const handleNewFuelLog = (payload: AdminRealtimeFuelLog) => {
      if (isSameLocalDay(payload.date, new Date())) {
        setTotalLogsToday((current) => current + 1);
      }

      const driverLabel = payload.driver?.full_name || payload.driver?.code || "driver";
      setLastRealtimeMessage(`Latest fuel log received for ${driverLabel}.`);
      onRealtimeLog?.(payload);
    };

    channel.bind("new-fuel-log", handleNewFuelLog);

    return () => {
      channel.unbind("new-fuel-log", handleNewFuelLog);
      pusher.unsubscribe("admin-dashboard");
    };
  }, [onRealtimeLog]);

  return (
    <div className="min-h-screen px-6 py-6 text-white lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-6 shadow-2xl lg:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-white">Rimall Lines ERP</p>
              <h1 className="mt-3 text-3xl font-black text-white lg:text-5xl">Admin Control Panel</h1>
              <p className="mt-3 text-base font-semibold text-white">Signed in as {adminName}</p>
            </div>

            <div className="rounded-full border border-white/20 bg-black/30 px-4 py-2">
              <span className="text-sm font-black text-white">Realtime Connected</span>
            </div>
          </div>

          {stats.length > 0 ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.id} className="rounded-[24px] border border-white/20 bg-black/25 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">{stat.label}</p>
                    <span className="text-white">{stat.icon ?? <MiniDotIcon />}</span>
                  </div>
                  <p className="mt-4 text-3xl font-black text-white">{stat.value}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{stat.hint ?? "Live business signal"}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-6 shadow-2xl lg:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Realtime Stat</p>
          <div className="mt-5 rounded-[28px] border border-white/20 bg-black/30 p-6">
            <p className="text-base font-bold text-white">Total Logs Today</p>
            <p className="mt-4 text-6xl font-black leading-none text-white">{totalLogsToday}</p>
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
