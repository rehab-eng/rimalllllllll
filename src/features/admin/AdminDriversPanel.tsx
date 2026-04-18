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
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-right">
          <p className="text-xs font-black tracking-[0.18em] text-slate-500">DRIVERS</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">جدول السائقين</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            كل حساب يعرض بياناته الأساسية، رخصته، حالة الجهاز، وكل الشاحنات المرتبطة به.
          </p>
        </div>

        {feedback ? <p className="text-sm font-black text-slate-700">{feedback}</p> : null}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[1280px] w-full border-separate border-spacing-0">
          <thead className="bg-slate-50">
            <tr>
              <HeaderCell>السائق</HeaderCell>
              <HeaderCell>الهاتف</HeaderCell>
              <HeaderCell>الرخصة</HeaderCell>
              <HeaderCell>الجهاز</HeaderCell>
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
                <td colSpan={9} className="px-6 py-10 text-center text-base font-black text-slate-500">
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
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          driver.deviceToken
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {driver.deviceToken ? "مرتبط بجهاز" : "غير مربوط بعد"}
                      </span>
                      {driver.deviceToken ? (
                        <p className="mt-2 text-xs font-bold tracking-[0.06em] text-slate-500">
                          {driver.deviceToken.slice(0, 12)}...
                        </p>
                      ) : null}
                    </BodyCell>

                    <BodyCell>
                      <div className="grid gap-2">
                        {driver.vehicles.map((vehicle, index) => (
                          <div key={vehicle.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-black tracking-[0.08em] text-slate-500">
                              {`الشاحنة ${index + 1}`}
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-900">
                              {vehicle.plates_number}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              المقطورة: {vehicle.trailer_plates || "-"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              التانك: {formatArabicNumber(Number(vehicle.capacity_liters))} لتر
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              التكعيب: {formatArabicNumber(Number(vehicle.cubic_capacity))}
                            </p>
                          </div>
                        ))}
                      </div>
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
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-500 bg-red-50 px-4 text-sm font-black text-red-600 disabled:opacity-60"
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
