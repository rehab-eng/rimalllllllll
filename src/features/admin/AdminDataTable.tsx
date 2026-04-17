"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import type { FuelLogStatus } from "../../lib/db-types";
import {
  driverStatusLabels,
  formatArabicDateTime,
  formatArabicNumber,
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
  PENDING: "bg-black/40 text-white",
  APPROVED: "bg-white text-black",
  REJECTED: "bg-red-600 text-white",
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
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-6 text-white shadow-2xl lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-14 items-center gap-3 rounded-2xl border border-white bg-white px-5 text-base font-black text-black"
          >
            <ExportIcon />
            تصدير إلى إكسل
          </button>
          {feedback ? <p className="text-sm font-bold text-white">{feedback}</p> : null}
        </div>

        <div className="text-right">
          <p className="text-sm font-bold tracking-[0.16em] text-white">سجل التعبئة</p>
          <h2 className="mt-2 text-3xl font-black text-white">سجلات السائقين</h2>
          <p className="mt-2 text-sm font-semibold text-white">
            راجع التعبئات والمحطات وأنواع الوقود وتحكم في حالة الحساب مباشرة من كل صف.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[28px] border border-white/20">
        <table className="min-w-[1420px] w-full border-separate border-spacing-0">
          <thead className="bg-black/40">
            <tr>
              <HeaderCell>السائق</HeaderCell>
              <HeaderCell>الهاتف</HeaderCell>
              <HeaderCell>الحالة</HeaderCell>
              <HeaderCell>لوحة الشاحنة</HeaderCell>
              <HeaderCell>نوع الشاحنة</HeaderCell>
              <HeaderCell>المحطة</HeaderCell>
              <HeaderCell>نوع الوقود</HeaderCell>
              <HeaderCell>اللترات</HeaderCell>
              <HeaderCell>حالة السجل</HeaderCell>
              <HeaderCell>التاريخ</HeaderCell>
              <HeaderCell align="left">الإجراءات</HeaderCell>
            </tr>
          </thead>

          <tbody>
            {fuelLogs.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-10 text-center text-base font-bold text-white">
                  لا توجد سجلات تعبئة بعد.
                </td>
              </tr>
            ) : (
              fuelLogs.map((row) => {
                const canActivate = row.driver.status === "SUSPENDED";

                return (
                  <tr key={row.id} className="bg-black/20">
                    <BodyCell>
                      <p className="text-base font-black text-white">{row.driver.full_name}</p>
                      <p className="mt-1 text-xs font-bold tracking-[0.08em] text-white">{row.driver.code}</p>
                    </BodyCell>
                    <BodyCell>{row.driver.phone}</BodyCell>
                    <BodyCell>
                      <span className="inline-flex rounded-full border border-white/20 bg-black/30 px-3 py-2 text-xs font-black text-white">
                        {driverStatusLabels[row.driver.status]}
                      </span>
                    </BodyCell>
                    <BodyCell>{row.vehicle.plates_number}</BodyCell>
                    <BodyCell>{row.vehicle.truck_type}</BodyCell>
                    <BodyCell>{row.station?.name ?? "-"}</BodyCell>
                    <BodyCell>{fuelTypeLabels[row.fuel_type]}</BodyCell>
                    <BodyCell>{formatArabicNumber(Number(row.liters))} لتر</BodyCell>
                    <BodyCell>
                      <span
                        className={`inline-flex rounded-full px-3 py-2 text-sm font-black ${statusStyles[row.status]}`}
                      >
                        {fuelLogStatusLabels[row.status]}
                      </span>
                    </BodyCell>
                    <BodyCell>{formatArabicDateTime(row.date)}</BodyCell>
                    <BodyCell align="left">
                      <div className="flex justify-start gap-3">
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
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white bg-white px-4 text-sm font-black text-black disabled:opacity-60"
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
                          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500 bg-red-600 text-white disabled:opacity-60"
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
      className={`px-6 py-4 text-sm font-black tracking-[0.08em] text-white ${
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
      className={`border-t border-white/10 px-6 py-4 text-sm font-semibold text-white ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 4V15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7.5 10.5L12 15L16.5 10.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M5 19H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 7H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9 7V5H15V7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 7L9 19H15L16 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11V16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 11V16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
