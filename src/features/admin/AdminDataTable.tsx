"use client";

import { useState } from "react";

import { exportFuelLogsToExcel } from "../../lib/exportExcel";
import type { FuelLogStatus } from "../../generated/prisma/client";
import type { AdminFuelLogRow } from "./types";

type AdminDataTableProps = {
  fuelLogs: readonly AdminFuelLogRow[];
  exportDriverName?: string;
  onEdit?: (row: AdminFuelLogRow) => void;
  onDelete?: (row: AdminFuelLogRow) => void;
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

const formatLiters = (value: AdminFuelLogRow["liters"]): string => `${String(value)} L`;

export default function AdminDataTable({
  fuelLogs,
  exportDriverName = "All Drivers",
  onEdit,
  onDelete,
}: AdminDataTableProps) {
  const [exportMessage, setExportMessage] = useState<string>("");

  const handleExport = () => {
    const result = exportFuelLogsToExcel(fuelLogs, exportDriverName);
    setExportMessage(result.success ? `Exported ${result.data?.fileName ?? "file"}.` : result.error ?? "Export failed.");
  };

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-6 text-white shadow-2xl lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Fuel Log Records</p>
          <h2 className="mt-2 text-3xl font-black text-white">Operations Table</h2>
          <p className="mt-2 text-sm font-semibold text-white">
            Monitor logs, inspect drivers, and use your override controls per row.
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
          {exportMessage ? <p className="text-sm font-bold text-white">{exportMessage}</p> : null}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[28px] border border-white/20">
        <table className="min-w-[1180px] w-full border-separate border-spacing-0">
          <thead className="bg-black/40">
            <tr>
              <HeaderCell>Driver</HeaderCell>
              <HeaderCell>Code</HeaderCell>
              <HeaderCell>Phone</HeaderCell>
              <HeaderCell>Truck Type</HeaderCell>
              <HeaderCell>Truck Plates</HeaderCell>
              <HeaderCell>Trailer Plates</HeaderCell>
              <HeaderCell>Liters</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Date</HeaderCell>
              <HeaderCell align="right">Actions</HeaderCell>
            </tr>
          </thead>

          <tbody>
            {fuelLogs.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-10 text-center text-base font-bold text-white">
                  No fuel logs available yet.
                </td>
              </tr>
            ) : (
              fuelLogs.map((row) => (
                <tr key={row.id} className="bg-black/20">
                  <BodyCell>
                    <div>
                      <p className="text-base font-black text-white">{row.driver.full_name}</p>
                    </div>
                  </BodyCell>
                  <BodyCell>{row.driver.code}</BodyCell>
                  <BodyCell>{row.driver.phone}</BodyCell>
                  <BodyCell>{row.vehicle.truck_type}</BodyCell>
                  <BodyCell>{row.vehicle.plates_number}</BodyCell>
                  <BodyCell>{row.vehicle.trailer_plates ?? "-"}</BodyCell>
                  <BodyCell>{formatLiters(row.liters)}</BodyCell>
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
                        onClick={() => onEdit?.(row)}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white text-black"
                        aria-label={`Edit fuel log ${row.id}`}
                      >
                        <EditIcon />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete?.(row)}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500 bg-red-600 text-white"
                        aria-label={`Delete fuel log ${row.id}`}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </BodyCell>
                </tr>
              ))
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
  children: React.ReactNode;
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
  children: React.ReactNode;
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

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M4 20H8L18 10C18.5304 9.46957 18.8284 8.75022 18.8284 8C18.8284 7.24978 18.5304 6.53043 18 6C17.4696 5.46957 16.7502 5.17157 16 5.17157C15.2498 5.17157 14.5304 5.46957 14 6L4 16V20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M13 7L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
