"use client";

import { useState, useTransition } from "react";

import { driverStatusLabels, formatArabicNumber } from "../../lib/labels";
import type { ActionResult } from "../driver/types";
import type { AdminDriverRow } from "./types";

type AdminDriversPanelProps = {
  drivers: AdminDriverRow[];
  onSuspendDriver: (driverId: number) => Promise<ActionResult> | ActionResult;
  onActivateDriver: (driverId: number) => Promise<ActionResult> | ActionResult;
  onDeleteDriver: (driverId: number) => Promise<ActionResult> | ActionResult;
};

export default function AdminDriversPanel({
  drivers,
  onSuspendDriver,
  onActivateDriver,
  onDeleteDriver,
}: AdminDriversPanelProps) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const runAction = (
    action: () => Promise<ActionResult> | ActionResult,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(result.success ? successMessage : result.error ?? "فشلت العملية.");
    });
  };

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-6 text-white shadow-2xl lg:p-8">
      <div className="flex items-center justify-between gap-4">
        {feedback ? <p className="text-sm font-bold text-white">{feedback}</p> : <span />}

        <div className="text-right">
          <p className="text-sm font-bold tracking-[0.16em] text-white">التحكم في الحسابات</p>
          <h2 className="mt-2 text-3xl font-black text-white">حسابات السائقين</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {drivers.map((driver) => {
          const canActivate = driver.status === "SUSPENDED";

          return (
            <div key={driver.id} className="rounded-[28px] border border-white/20 bg-black/25 p-5 text-right">
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-black text-white">
                  {driverStatusLabels[driver.status]}
                </span>

                <div>
                  <p className="text-lg font-black text-white">{driver.fullName}</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {driver.code} - {driver.phone}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat label="المركبات" value={driver.vehicleCount} />
                <MiniStat label="السجلات" value={driver.totalFuelLogs} />
                <MiniStat label="اللترات" value={driver.totalFilledLiters} />
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      () =>
                        canActivate
                          ? onActivateDriver(driver.id)
                          : onSuspendDriver(driver.id),
                      canActivate ? "تمت إعادة تفعيل السائق." : "تم إيقاف السائق.",
                    )
                  }
                  className="min-h-12 flex-1 rounded-2xl border border-white bg-white px-4 text-sm font-black text-black disabled:opacity-60"
                >
                  {canActivate ? "تفعيل" : "إيقاف"}
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      () => onDeleteDriver(driver.id),
                      "تم تعليم حساب السائق كمحذوف.",
                    )
                  }
                  className="min-h-12 rounded-2xl border border-red-500 bg-red-600 px-4 text-sm font-black text-white disabled:opacity-60"
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-black/30 p-3 text-right">
      <p className="text-xs font-bold tracking-[0.08em] text-white">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{formatArabicNumber(value)}</p>
    </div>
  );
}
