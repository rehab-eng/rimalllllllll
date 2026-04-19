"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import type { FuelLogStatus } from "../../lib/db-types";
import {
  driverStatusLabels,
  formatArabicDateTime,
  formatArabicDecimal,
  fuelLogStatusLabels,
  fuelTypeLabels,
} from "../../lib/labels";
import { exportFuelLogsToExcel } from "../../lib/exportExcel";
import type { ActionResult } from "../driver/types";
import type { AdminFuelLogRow } from "./types";

type AdminDataTableProps = {
  fuelLogs: readonly AdminFuelLogRow[];
  exportDriverName?: string;
  onSuspendDriver: (driverId: number) => Promise<ActionResult> | ActionResult;
  onActivateDriver: (driverId: number) => Promise<ActionResult> | ActionResult;
  onDeleteDriver: (driverId: number) => Promise<ActionResult> | ActionResult;
};

const statusStyles: Record<FuelLogStatus, string> = {
  PENDING: "border border-slate-200 bg-slate-50 text-slate-700",
  APPROVED: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border border-red-200 bg-red-50 text-red-700",
};

export default function AdminDataTable({
  fuelLogs,
  exportDriverName = "كل السائقين",
  onSuspendDriver,
  onActivateDriver,
  onDeleteDriver,
}: AdminDataTableProps) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    const result = exportFuelLogsToExcel(fuelLogs, exportDriverName);
    setFeedback(
      result.success
        ? `تم تصدير الملف ${result.data?.fileName ?? ""}.`
        : result.error ?? "فشل التصدير.",
    );
  };

  const runDriverAction = (
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-right">
          <p className="text-xs font-black tracking-[0.18em] text-slate-500">FUEL LOGS</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">سجل التعبئة</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            مراجعة كل عمليات التعبئة مع السائق والمحطة ونوع الوقود وحالة السجل.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-black text-white"
          >
            <ExportIcon />
            تصدير إلى إكسل
          </button>
          {feedback ? <p className="text-sm font-black text-slate-700">{feedback}</p> : null}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[1380px] w-full border-separate border-spacing-0">
          <thead className="bg-slate-50">
            <tr>
              <HeaderCell>السائق</HeaderCell>
              <HeaderCell>الهاتف</HeaderCell>
              <HeaderCell>حالة الحساب</HeaderCell>
              <HeaderCell>لوحة الشاحنة</HeaderCell>
              <HeaderCell>سعة التانك</HeaderCell>
              <HeaderCell>المحطة</HeaderCell>
              <HeaderCell>نوع الوقود</HeaderCell>
              <HeaderCell>الكمية</HeaderCell>
              <HeaderCell>حالة السجل</HeaderCell>
              <HeaderCell>التاريخ</HeaderCell>
              <HeaderCell align="left">الإجراءات</HeaderCell>
            </tr>
          </thead>

          <tbody>
            {fuelLogs.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-10 text-center text-base font-black text-slate-500">
                  لا توجد سجلات تعبئة بعد.
                </td>
              </tr>
            ) : (
              fuelLogs.map((row) => {
                const canActivate = row.driver.status === "SUSPENDED";

                return (
                  <tr key={row.id} className="bg-white">
                    <BodyCell>
                      <p className="text-base font-black text-slate-950">{row.driver.full_name}</p>
                      <p className="mt-1 text-xs font-bold tracking-[0.08em] text-slate-500">
                        {row.driver.code}
                      </p>
                    </BodyCell>

                    <BodyCell>{row.driver.phone}</BodyCell>

                    <BodyCell>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                        {driverStatusLabels[row.driver.status]}
                      </span>
                    </BodyCell>

                    <BodyCell>{row.vehicle.plates_number}</BodyCell>
                    <BodyCell>{formatArabicDecimal(Number(row.vehicle.capacity_liters))} لتر</BodyCell>
                    <BodyCell>{row.station?.name ?? "-"}</BodyCell>
                    <BodyCell>{fuelTypeLabels[row.fuel_type]}</BodyCell>
                    <BodyCell>{formatArabicDecimal(Number(row.liters))} لتر</BodyCell>
                    <BodyCell>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusStyles[row.status]}`}>
                        {fuelLogStatusLabels[row.status]}
                      </span>
                    </BodyCell>
                    <BodyCell>{formatArabicDateTime(row.date)}</BodyCell>

                    <BodyCell align="left">
                      <div className="flex justify-start gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            runDriverAction(
                              () =>
                                canActivate
                                  ? onActivateDriver(row.driver.id)
                                  : onSuspendDriver(row.driver.id),
                              canActivate ? "تمت إعادة تفعيل السائق." : "تم إيقاف السائق.",
                            )
                          }
                          disabled={isPending}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-black text-white disabled:opacity-60"
                        >
                          {canActivate ? "تفعيل" : "إيقاف"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            runDriverAction(
                              () => onDeleteDriver(row.driver.id),
                              "تم تعليم حساب السائق كمحذوف.",
                            )
                          }
                          disabled={isPending}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 disabled:opacity-60"
                          aria-label={`حذف السائق ${row.driver.full_name}`}
                        >
                          <DeleteIcon />
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
  children: ReactNode;
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
  children: ReactNode;
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

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 4V15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7.5 10.5L12 15L16.5 10.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M5 19H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M5 7H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9 7V5H15V7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M8 7L9 19H15L16 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11V16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 11V16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
