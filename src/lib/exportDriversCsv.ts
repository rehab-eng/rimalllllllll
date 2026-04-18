type DriverCsvVehicle = {
  plates_number: string;
  trailer_plates: string | null;
  capacity_liters: number | string;
  cubic_capacity: number | string;
};

type DriverCsvItem = {
  fullName: string;
  phone: string;
  licenseNumber: string | null;
  vehicles: DriverCsvVehicle[];
};

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const escapeCsvValue = (value: string | number | null | undefined) => {
  const normalized = String(value ?? "");
  const escaped = normalized.replaceAll('"', '""');
  return `"${escaped}"`;
};

export function exportDriversToCsv(
  drivers: readonly DriverCsvItem[],
): ActionResponse<{ fileName: string }> {
  try {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "CSV export is only available in the browser.",
      };
    }

    const rows = [
      [
        "اسم السائق",
        "رقم الهاتف",
        "رقم الرخصة",
        "لوحة الشاحنة",
        "لوحة المقطورة",
        "سعة التانك",
        "التكعيب",
      ],
    ];

    for (const driver of drivers) {
      if (driver.vehicles.length === 0) {
        rows.push([
          driver.fullName,
          driver.phone,
          driver.licenseNumber ?? "",
          "",
          "",
          "",
          "",
        ]);
        continue;
      }

      for (const vehicle of driver.vehicles) {
        rows.push([
          driver.fullName,
          driver.phone,
          driver.licenseNumber ?? "",
          vehicle.plates_number,
          vehicle.trailer_plates ?? "",
          String(vehicle.capacity_liters ?? ""),
          String(vehicle.cubic_capacity ?? ""),
        ]);
      }
    }

    const csvContent = rows
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\r\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = "driver-raw-data.csv";

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      data: { fileName },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "CSV export failed.",
    };
  }
}
