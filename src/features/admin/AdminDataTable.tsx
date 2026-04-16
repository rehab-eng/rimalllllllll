"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import type { ActionResult } from "../driver/types";
import { exportFuelLogsToExcel } from "../../lib/exportExcel";
import type { FuelLogStatus } from "../../generated/prisma/client";
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

const formatDate = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function AdminDataTable({
  fuelLogs,
  exportDriverName = "All Drivers",
  onSuspendDriver,
  onActivateDriver,
  onDeleteDriver,
}: AdminDataTableProps) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    const result = exportFuelLogsToExcel(fuelLogs, exportDriverName);
    setFeedback(result.success ? `Exported ${result.data?.fileName ?? "file"}.` : result.error ?? "Export failed.");
  };

  const runDriverAction = (
    action: () => Promise<ActionResult> | ActionResult,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(result.success ? successMessage : result.error ?? "Action failed.");
    });
  };

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-6 text-white shadow-2xl lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Fuel Operations</p>
          <h2 className="mt-2 text-3xl font-black text-white">Driver Fill Records</h2>
          <p className="mt-2 text-sm font-semibold text-white">
            Review all fills, station usage, fuel types, and use wider account powers per row.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-14 items-center gap-3 rounded-2xl border border-white bg-white px-5 text-base font-black text-black"
          >
            <ExportIcon />
            Export to Excel
          </button>
          {feedback ? <p className="text-sm font-bold text-white">{feedback}</p> : null}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[28px] border border-white/20">
        <table className="min-w-[1420px] w-full border-separate border-spacing-0">
          <thead className="bg-black/40">
            <tr>
              <HeaderCell>Driver</HeaderCell>
              <HeaderCell>Phone</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Truck Plates</HeaderCell>
              <HeaderCell>Truck Type</HeaderCell>
              <HeaderCell>Station</HeaderCell>
              <HeaderCell>Fuel Type</HeaderCell>
              <HeaderCell>Liters</HeaderCell>
              <HeaderCell>Log Status</HeaderCell>
              <HeaderCell>Date</HeaderCell>
              <HeaderCell align="right">Account Powers</HeaderCell>
            </tr>
          </thead>

          <tbody>
            {fuelLogs.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-10 text-center text-base font-bold text-white">
                  No fuel logs available yet.
                </td>
              </tr>
            ) : (
              fuelLogs.map((row) => {
                const canActivate = row.driver.status === "SUSPENDED";

                return (
                  <tr key={row.id} className="bg-black/20">
                    <BodyCell>
                      <p className="text-base font-black text-white">{row.driver.full_name}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
                        {row.driver.code}
                      </p>
                    </BodyCell>
                    <BodyCell>{row.driver.phone}</BodyCell>
                    <BodyCell>
                      <span className="inline-flex rounded-full border border-white/20 bg-black/30 px-3 py-2 text-xs font-black text-white">
                        {row.driver.status}
                      </span>
                    </BodyCell>
                    <BodyCell>{row.vehicle.plates_number}</BodyCell>
                    <BodyCell>{row.vehicle.truck_type}</BodyCell>
                    <BodyCell>{row.station?.name ?? "-"}</BodyCell>
                    <BodyCell>{row.fuel_type}</BodyCell>
                    <BodyCell>{String(row.liters)} L</BodyCell>
                    <BodyCell>
                      <span className={`inline-flex rounded-full px-3 py-2 text-sm font-black ${statusStyles[row.status]}`}>
                        {row.status}
                      </span>
                    </BodyCell>
                    <BodyCell>{formatDate(row.date)}</BodyCell>
                    <BodyCell align="right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            runDriverAction(
                              () =>
                                canActivate
                                  ? onActivateDriver(row.driver.id)
                                  : onSuspendDriver(row.driver.id),
                              canActivate ? "Driver reactivated." : "Driver suspended.",
                            )
                          }
                          disabled={isPending}
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white bg-white px-4 text-sm font-black text-black disabled:opacity-60"
                        >
                          {canActivate ? "Activate" : "Suspend"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            runDriverAction(
                              () => onDeleteDriver(row.driver.id),
                              "Driver account marked as deleted.",
                            )
                          }
                          disabled={isPending}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500 bg-red-600 text-white disabled:opacity-60"
                          aria-label={`Delete driver ${row.driver.full_name}`}
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
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-white ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function BodyCell({
  children,
  align = "left",
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
