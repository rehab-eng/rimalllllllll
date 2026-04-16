import * as XLSX from "xlsx";

import type { Driver, FuelLog, Vehicle } from "../generated/prisma/client";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type FuelLogExcelItem = FuelLog & {
  driver?: Pick<Driver, "code" | "full_name"> | null;
  vehicle?: Pick<Vehicle, "plates_number" | "trailer_plates" | "truck_type"> | null;
};

const statusLabels: Record<FuelLog["status"], string> = {
  PENDING: "\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631",
  APPROVED: "\u0645\u0639\u062A\u0645\u062F",
  REJECTED: "\u0645\u0631\u0641\u0648\u0636",
};

const formatDate = (value: FuelLog["date"]): string => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ar-LY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDecimal = (value: FuelLog["liters"]): string => {
  return String(value);
};

export function exportFuelLogsToExcel(
  fuelLogs: readonly FuelLogExcelItem[],
  driverName: Driver["full_name"],
): ActionResponse<{ fileName: string }> {
  try {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Excel export is only available in the browser.",
      };
    }

    const normalizedDriverName = driverName.trim();

    if (!normalizedDriverName) {
      return {
        success: false,
        error: "Driver name is required.",
      };
    }

    const sheetData: Array<Array<string | number>> = [
      [
        "\u0645",
        "\u0627\u0644\u062A\u0627\u0631\u064A\u062E",
        "\u0627\u0644\u0644\u062A\u0631\u0627\u062A",
        "\u0627\u0644\u062D\u0627\u0644\u0629",
        "\u0631\u0642\u0645 \u0627\u0644\u0645\u0631\u0643\u0628\u0629",
        "\u0631\u0642\u0645 \u0627\u0644\u0645\u0642\u0637\u0648\u0631\u0629",
        "\u0646\u0648\u0639 \u0627\u0644\u0634\u0627\u062D\u0646\u0629",
        "\u0643\u0648\u062F \u0627\u0644\u0633\u0627\u0626\u0642",
      ],
      ...fuelLogs.map((log, index) => [
        index + 1,
        formatDate(log.date),
        formatDecimal(log.liters),
        statusLabels[log.status],
        log.vehicle?.plates_number ?? "",
        log.vehicle?.trailer_plates ?? "",
        log.vehicle?.truck_type ?? "",
        log.driver?.code ?? "",
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    const fileName = `\u062D\u0635\u0629 ${normalizedDriverName} \u0645\u0646 \u0627\u0644\u062F\u064A\u0632\u0644.xlsx`;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Fuel Logs");
    XLSX.writeFile(workbook, fileName, {
      compression: true,
    });

    return {
      success: true,
      data: {
        fileName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Excel export failed.",
    };
  }
}
