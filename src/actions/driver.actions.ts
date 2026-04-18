"use server";

import {
  DriverStatus,
  type DriverRow,
  type VehicleRow,
} from "../lib/db-types";
import { getSql } from "../lib/prisma";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type RegisterDriverInput = {
  driver: {
    code?: string;
    full_name: string;
    phone: string;
    license_number: string;
    device_token: string;
  };
  vehicles: Array<
    Pick<VehicleRow, "plates_number" | "trailer_plates" | "capacity_liters" | "cubic_capacity">
  >;
};

type DriverLoginInput = {
  phone?: string;
  license_number?: string;
  device_token?: string;
};

type VehicleConsumptionSummary = {
  vehicleId: number;
  platesNumber: string;
  totalLiters: number;
  totalLogs: number;
};

type DriverDashboardStats = {
  driver: DriverRow;
  vehicles: Array<
    VehicleRow & {
      totalLiters: number;
      totalLogs: number;
    }
  >;
  totalFuelLogs: number;
  totalVehicles: number;
  totalFilledLiters: number;
  vehicleConsumption: VehicleConsumptionSummary[];
};

type NormalizedVehicleInput = {
  plates_number: string;
  trailer_plates: string | null;
  capacity_liters: number;
  cubic_capacity: number;
};

const trimText = (value: string | undefined | null): string => (value ?? "").trim();

const generateDriverCode = (): string => {
  const seed = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DRV-${Date.now().toString().slice(-6)}-${seed}`;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("duplicate key")) {
      return "رقم الهاتف أو رقم الرخصة مستخدم من قبل.";
    }
    return error.message;
  }

  return "حدث خطأ غير متوقع.";
};

const normalizeVehicles = (
  vehicles: RegisterDriverInput["vehicles"],
): ActionResponse<NormalizedVehicleInput[]> => {
  const normalizedVehicles = vehicles.map((vehicle) => ({
    plates_number: trimText(vehicle.plates_number),
    trailer_plates: trimText(vehicle.trailer_plates) || null,
    capacity_liters: Number(vehicle.capacity_liters),
    cubic_capacity: Number(vehicle.cubic_capacity),
  }));

  if (normalizedVehicles.length === 0) {
    return {
      success: false,
      error: "يجب إدخال بيانات شاحنة واحدة على الأقل.",
    };
  }

  for (const vehicle of normalizedVehicles) {
    if (!vehicle.plates_number) {
      return {
        success: false,
        error: "رقم لوحة الشاحنة مطلوب لكل مركبة.",
      };
    }

    if (!Number.isFinite(vehicle.capacity_liters) || vehicle.capacity_liters <= 0) {
      return {
        success: false,
        error: "سعة التانك باللتر يجب أن تكون أكبر من صفر.",
      };
    }

    if (!Number.isFinite(vehicle.cubic_capacity) || vehicle.cubic_capacity <= 0) {
      return {
        success: false,
        error: "تكعيب الشاحنة يجب أن يكون أكبر من صفر.",
      };
    }
  }

  return {
    success: true,
    data: normalizedVehicles,
  };
};

export async function registerDriverWithVehicles(
  input: RegisterDriverInput,
): Promise<ActionResponse<{ driver: DriverRow; vehicles: VehicleRow[] }>> {
  try {
    const sql = await getSql();

    const driverData = {
      code: trimText(input.driver.code) || generateDriverCode(),
      full_name: trimText(input.driver.full_name),
      phone: trimText(input.driver.phone),
      license_number: trimText(input.driver.license_number),
      device_token: trimText(input.driver.device_token),
    };

    if (
      !driverData.full_name ||
      !driverData.phone ||
      !driverData.license_number ||
      !driverData.device_token
    ) {
      return {
        success: false,
        error: "يجب إدخال اسم السائق ورقم الهاتف ورقم الرخصة وتعريف الجهاز.",
      };
    }

    const normalizedVehiclesResult = normalizeVehicles(input.vehicles);
    if (!normalizedVehiclesResult.success || !normalizedVehiclesResult.data) {
      return {
        success: false,
        error: normalizedVehiclesResult.error ?? "تعذر التحقق من بيانات الشاحنات.",
      };
    }

    const vehiclesJson = JSON.stringify(normalizedVehiclesResult.data);

    const [createdDriver] = await sql<DriverRow[]>`
      WITH new_driver AS (
        INSERT INTO "Driver" (
          code, full_name, phone, license_number, device_token, status, deleted_at
        )
        VALUES (
          ${driverData.code},
          ${driverData.full_name},
          ${driverData.phone},
          ${driverData.license_number},
          ${driverData.device_token},
          ${DriverStatus.ACTIVE},
          NULL
        )
        RETURNING
          id, code, full_name, phone, license_number, device_token, status, deleted_at, created_at, updated_at
      ),
      inserted_vehicles AS (
        INSERT INTO "Vehicle" (
          "driverId", plates_number, trailer_plates, capacity_liters, cubic_capacity, is_active
        )
        SELECT
          nd.id,
          payload.plates_number,
          NULLIF(payload.trailer_plates, ''),
          payload.capacity_liters,
          payload.cubic_capacity,
          true
        FROM new_driver nd
        CROSS JOIN jsonb_to_recordset(${vehiclesJson}::jsonb) AS payload(
          plates_number text,
          trailer_plates text,
          capacity_liters numeric,
          cubic_capacity numeric
        )
        RETURNING id
      )
      SELECT
        nd.id,
        nd.code,
        nd.full_name,
        nd.phone,
        nd.license_number,
        nd.device_token,
        nd.status,
        nd.deleted_at,
        nd.created_at,
        nd.updated_at
      FROM new_driver nd
      WHERE EXISTS (SELECT 1 FROM inserted_vehicles)
    `;

    if (!createdDriver) {
      throw new Error("تعذر إنشاء حساب السائق.");
    }

    const createdVehicles = await sql<VehicleRow[]>`
      SELECT
        id,
        "driverId",
        plates_number,
        trailer_plates,
        capacity_liters::float8 AS capacity_liters,
        cubic_capacity::float8 AS cubic_capacity,
        is_active,
        created_at,
        updated_at
      FROM "Vehicle"
      WHERE "driverId" = ${createdDriver.id}
        AND is_active = true
      ORDER BY id ASC
    `;

    return {
      success: true,
      data: {
        driver: createdDriver,
        vehicles: createdVehicles,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function authenticateDriverByPhoneOrLicense(
  input: DriverLoginInput,
): Promise<ActionResponse<DriverRow>> {
  try {
    const sql = await getSql();
    const phone = trimText(input.phone);
    const licenseNumber = trimText(input.license_number);
    const deviceToken = trimText(input.device_token);

    if (!phone && !licenseNumber) {
      return {
        success: false,
        error: "ادخل رقم الهاتف أو رقم الرخصة.",
      };
    }

    if (!deviceToken) {
      return {
        success: false,
        error: "تعذر التحقق من الجهاز الحالي.",
      };
    }

    const [driver] = await sql<DriverRow[]>`
      SELECT
        d.id,
        d.code,
        d.full_name,
        d.phone,
        d.license_number,
        d.device_token,
        d.status,
        d.deleted_at,
        d.created_at,
        d.updated_at
      FROM "Driver" d
      WHERE d.deleted_at IS NULL
        AND d.status = ${DriverStatus.ACTIVE}
        AND (
          (${phone} <> '' AND d.phone = ${phone})
          OR (${licenseNumber} <> '' AND d.license_number = ${licenseNumber})
        )
      ORDER BY d.id DESC
      LIMIT 1
    `;

    if (!driver) {
      return {
        success: false,
        error: "تعذر تسجيل الدخول. تحقق من بيانات السائق.",
      };
    }

    if (driver.device_token && driver.device_token !== deviceToken) {
      return {
        success: false,
        error: "هذا الحساب مرتبط بجهاز آخر، يرجى التواصل مع الإدارة",
      };
    }

    if (!driver.device_token) {
      const [boundDriver] = await sql<DriverRow[]>`
        UPDATE "Driver"
        SET
          device_token = ${deviceToken},
          updated_at = NOW()
        WHERE id = ${driver.id}
        RETURNING
          id, code, full_name, phone, license_number, device_token, status, deleted_at, created_at, updated_at
      `;

      if (!boundDriver) {
        throw new Error("تعذر ربط الحساب بالجهاز الحالي.");
      }

      return {
        success: true,
        data: boundDriver,
      };
    }

    return {
      success: true,
      data: driver,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function getDriverDashboardStatsByCode(
  code: DriverRow["code"],
): Promise<ActionResponse<DriverDashboardStats>> {
  try {
    const sql = await getSql();
    const normalizedCode = trimText(code);

    if (!normalizedCode) {
      return {
        success: false,
        error: "رمز السائق مطلوب.",
      };
    }

    const [driver] = await sql<
      (DriverRow & {
        total_fuel_logs: number;
        total_vehicles: number;
      })[]
    >`
      SELECT
        d.id,
        d.code,
        d.full_name,
        d.phone,
        d.license_number,
        d.device_token,
        d.status,
        d.deleted_at,
        d.created_at,
        d.updated_at,
        (
          SELECT COUNT(*)::int
          FROM "FuelLog" fl
          WHERE fl."driverId" = d.id
        ) AS total_fuel_logs,
        (
          SELECT COUNT(*)::int
          FROM "Vehicle" v
          WHERE v."driverId" = d.id
            AND v.is_active = true
        ) AS total_vehicles
      FROM "Driver" d
      WHERE d.code = ${normalizedCode}
        AND d.deleted_at IS NULL
      LIMIT 1
    `;

    if (!driver) {
      return {
        success: false,
        error: "السائق غير موجود.",
      };
    }

    const vehicles = await sql<
      (VehicleRow & {
        total_liters: number;
        total_logs: number;
      })[]
    >`
      SELECT
        v.id,
        v."driverId",
        v.plates_number,
        v.trailer_plates,
        v.capacity_liters::float8 AS capacity_liters,
        v.cubic_capacity::float8 AS cubic_capacity,
        v.is_active,
        v.created_at,
        v.updated_at,
        COALESCE(SUM(fl.liters), 0)::float8 AS total_liters,
        COUNT(fl.id)::int AS total_logs
      FROM "Vehicle" v
      LEFT JOIN "FuelLog" fl ON fl."vehicleId" = v.id
      WHERE v."driverId" = ${driver.id}
        AND v.is_active = true
      GROUP BY v.id
      ORDER BY v.id ASC
    `;

    const vehicleConsumption = vehicles.map((vehicle) => ({
      vehicleId: vehicle.id,
      platesNumber: vehicle.plates_number,
      totalLiters: Number(vehicle.total_liters),
      totalLogs: Number(vehicle.total_logs),
    }));

    const totalFilledLiters = vehicleConsumption.reduce(
      (total, vehicle) => total + vehicle.totalLiters,
      0,
    );

    return {
      success: true,
      data: {
        driver,
        vehicles: vehicles.map((vehicle) => ({
          ...vehicle,
          totalLiters: Number(vehicle.total_liters),
          totalLogs: Number(vehicle.total_logs),
        })),
        totalFuelLogs: Number(driver.total_fuel_logs),
        totalVehicles: Number(driver.total_vehicles),
        totalFilledLiters,
        vehicleConsumption,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function updateDriverStatus(
  driverId: DriverRow["id"],
  status: DriverStatus,
): Promise<ActionResponse<{ id: number; status: DriverStatus }>> {
  try {
    const sql = await getSql();

    const [driver] = await sql<{ id: number; status: DriverStatus }[]>`
      UPDATE "Driver"
      SET
        status = ${status},
        deleted_at = ${status === DriverStatus.DELETED ? new Date().toISOString() : null}
      WHERE id = ${driverId}
      RETURNING id, status
    `;

    if (!driver) {
      return {
        success: false,
        error: "السائق غير موجود.",
      };
    }

    return {
      success: true,
      data: driver,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function deleteDriverAccount(
  driverId: DriverRow["id"],
): Promise<ActionResponse<{ id: number; deletedAt: Date | string | null }>> {
  try {
    const sql = await getSql();

    const [driver] = await sql<{ id: number; deleted_at: Date | string | null }[]>`
      UPDATE "Driver"
      SET
        status = ${DriverStatus.DELETED},
        deleted_at = NOW()
      WHERE id = ${driverId}
      RETURNING id, deleted_at
    `;

    if (!driver) {
      return {
        success: false,
        error: "السائق غير موجود.",
      };
    }

    return {
      success: true,
      data: {
        id: driver.id,
        deletedAt: driver.deleted_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
