"use server";

import {
  DriverStatus,
  type DriverRow,
  type FuelLogRow,
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
    national_id: string;
    phone: string;
    password?: string;
    license_url?: string;
    license_number?: string;
  };
  vehicle: Pick<
    VehicleRow,
    "truck_type" | "plates_number" | "trailer_plates" | "truck_volume" | "image_url"
  >;
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

const trimText = (value: string | undefined | null): string => (value ?? "").trim();

const generateDriverCode = (): string => {
  const seed = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `DRV-${Date.now().toString().slice(-6)}-${seed}`;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("duplicate key")) {
      return "رمز السائق أو رقم الهاتف مستخدم من قبل.";
    }
    return error.message;
  }

  return "حدث خطأ غير متوقع.";
};

export async function registerDriverWithVehicle(
  input: RegisterDriverInput,
): Promise<ActionResponse<{ driver: DriverRow; vehicle: VehicleRow }>> {
  try {
    const sql = await getSql();

    const driverData = {
      code: trimText(input.driver.code) || generateDriverCode(),
      full_name: trimText(input.driver.full_name),
      national_id: trimText(input.driver.national_id),
      phone: trimText(input.driver.phone),
      password: trimText(input.driver.password) || null,
      license_url: trimText(input.driver.license_url) || null,
      license_number: trimText(input.driver.license_number) || null,
    };

    const vehicleData = {
      truck_type: trimText(input.vehicle.truck_type),
      plates_number: trimText(input.vehicle.plates_number),
      trailer_plates: trimText(input.vehicle.trailer_plates) || null,
      truck_volume: Number(input.vehicle.truck_volume),
      image_url: trimText(input.vehicle.image_url) || null,
    };

    if (
      !driverData.full_name ||
      !driverData.national_id ||
      !driverData.phone ||
      !vehicleData.truck_type ||
      !vehicleData.plates_number
    ) {
      return {
        success: false,
        error: "يجب إدخال البيانات الأساسية للسائق والمركبة.",
      };
    }

    if (!driverData.license_url && !driverData.license_number) {
      return {
        success: false,
        error: "أدخل صورة الرخصة أو رقم الرخصة.",
      };
    }

    if (!Number.isFinite(vehicleData.truck_volume) || vehicleData.truck_volume <= 0) {
      return {
        success: false,
        error: "سعة الشاحنة يجب أن تكون أكبر من صفر.",
      };
    }

    const [createdDriver] = await sql<DriverRow[]>`
      INSERT INTO "Driver" (
        code, full_name, national_id, phone, password, license_url, license_number, status, deleted_at
      )
      VALUES (
        ${driverData.code},
        ${driverData.full_name},
        ${driverData.national_id},
        ${driverData.phone},
        ${driverData.password},
        ${driverData.license_url},
        ${driverData.license_number},
        ${DriverStatus.ACTIVE},
        NULL
      )
      RETURNING
        id, code, full_name, national_id, phone, password, license_url, license_number, status, deleted_at, created_at, updated_at
    `;

    if (!createdDriver) {
      throw new Error("تعذر إنشاء حساب السائق.");
    }

    const [createdVehicle] = await sql<VehicleRow[]>`
      INSERT INTO "Vehicle" (
        "driverId", truck_type, plates_number, trailer_plates, truck_volume, image_url, is_active
      )
      VALUES (
        ${createdDriver.id},
        ${vehicleData.truck_type},
        ${vehicleData.plates_number},
        ${vehicleData.trailer_plates},
        ${vehicleData.truck_volume},
        ${vehicleData.image_url},
        true
      )
      RETURNING
        id, "driverId", truck_type, plates_number, trailer_plates, truck_volume::float8 AS truck_volume, image_url, is_active, created_at, updated_at
    `;

    if (!createdVehicle) {
      throw new Error("تم إنشاء السائق وتعذر إنشاء المركبة.");
    }

    return {
      success: true,
      data: {
        driver: createdDriver,
        vehicle: createdVehicle,
      },
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
        d.national_id,
        d.phone,
        d.password,
        d.license_url,
        d.license_number,
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
        v.truck_type,
        v.plates_number,
        v.trailer_plates,
        v.truck_volume::float8 AS truck_volume,
        v.image_url,
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
