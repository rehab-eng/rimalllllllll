"use client";

import { useState, useTransition } from "react";

import { exportDriversToCsv } from "../../lib/exportDriversCsv";
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
  const [selectedDriver, setSelectedDriver] = useState<AdminDriverRow | null>(null);
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

  const handleExport = () => {
    const result = exportDriversToCsv(drivers);
    setFeedback(
      result.success
        ? `تم تنزيل الملف ${result.data?.fileName ?? ""}.`
        : result.error ?? "تعذر تصدير بيانات السائقين.",
    );
  };

  return (
    <>
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-right">
            <p className="text-xs font-black tracking-[0.18em] text-slate-500">DRIVERS TABLE</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">السائقون</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              جدول مختصر لاسم السائق والهاتف والرخصة، مع زر منفصل لعرض الشاحنات.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <button
              type="button"
              onClick={handleExport}
              className="min-h-11 rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-black text-white"
            >
              تصدير بيانات السائقين
            </button>
            {feedback ? <p className="text-sm font-black text-slate-700">{feedback}</p> : null}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[980px] w-full border-separate border-spacing-0">
            <thead className="bg-slate-50">
              <tr>
                <HeaderCell>السائق</HeaderCell>
                <HeaderCell>الهاتف</HeaderCell>
                <HeaderCell>الرخصة</HeaderCell>
                <HeaderCell>الشاحنات</HeaderCell>
                <HeaderCell>إجمالي التعبئة</HeaderCell>
                <HeaderCell>السجلات</HeaderCell>
                <HeaderCell>الحالة</HeaderCell>
                <HeaderCell align="left">الإجراءات</HeaderCell>
              </tr>
            </thead>

            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-base font-black text-slate-500">
                    لا توجد حسابات سائقين بعد.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => {
                  const canActivate = driver.status === "SUSPENDED";

                  return (
                    <tr key={driver.id} className="bg-white">
                      <BodyCell>
                        <p className="text-base font-black text-slate-950">{driver.fullName}</p>
                        <p className="mt-1 text-xs font-bold tracking-[0.08em] text-slate-500">
                          {driver.code}
                        </p>
                      </BodyCell>

                      <BodyCell>{driver.phone}</BodyCell>
                      <BodyCell>{driver.licenseNumber || "-"}</BodyCell>
                      <BodyCell>
                        <button
                          type="button"
                          onClick={() => setSelectedDriver(driver)}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700"
                        >
                          عرض الشاحنات ({formatArabicNumber(driver.vehicleCount)})
                        </button>
                      </BodyCell>
                      <BodyCell>{formatArabicNumber(driver.totalFilledLiters)} لتر</BodyCell>
                      <BodyCell>{formatArabicNumber(driver.totalFuelLogs)}</BodyCell>
                      <BodyCell>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                          {driverStatusLabels[driver.status]}
                        </span>
                      </BodyCell>

                      <BodyCell align="left">
                        <div className="flex justify-start gap-2">
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
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-black text-white disabled:opacity-60"
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
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-600 disabled:opacity-60"
                          >
                            حذف
                          </button>
                        </div>
                      </BodyCell>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedDriver ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="إغلاق نافذة الشاحنات"
            onClick={() => setSelectedDriver(null)}
            className="absolute inset-0 bg-slate-950/30"
          />

          <div className="absolute left-4 right-4 top-1/2 mx-auto w-full max-w-2xl -translate-y-1/2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setSelectedDriver(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              >
                <CloseIcon />
              </button>

              <div className="text-right">
                <p className="text-xs font-black tracking-[0.18em] text-slate-500">VEHICLES</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{selectedDriver.fullName}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  الشاحنات المرتبطة بهذا الحساب
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {selectedDriver.vehicles.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-right">
                  <p className="text-sm font-bold text-slate-600">لا توجد شاحنات مرتبطة حالياً.</p>
                </div>
              ) : (
                selectedDriver.vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-right">
                    <p className="text-base font-black text-slate-950">{vehicle.plates_number}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      لوحة المقطورة: {vehicle.trailer_plates || "-"}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl bg-white px-3 py-3">
                        <p className="text-sm font-black text-slate-900">
                          {formatArabicNumber(Number(vehicle.capacity_liters))} لتر
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">سعة التانك</p>
                      </div>

                      <div className="rounded-xl bg-white px-3 py-3">
                        <p className="text-sm font-black text-slate-900">
                          {formatArabicNumber(Number(vehicle.cubic_capacity))}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">التكعيب</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function HeaderCell({
  children,
  align = "right",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`border-b border-slate-200 px-5 py-4 text-sm font-black tracking-[0.08em] text-slate-700 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function BodyCell({
  children,
  align = "right",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`border-b border-slate-200 px-5 py-4 align-top text-sm font-semibold text-slate-700 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
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
