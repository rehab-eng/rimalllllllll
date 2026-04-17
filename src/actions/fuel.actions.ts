"use server";

import type { FuelLogRow, FuelLogStatus, FuelType } from "../lib/db-types";
import { FuelLogStatus as FuelLogStatusValues, FuelType as FuelTypeValues } from "../lib/db-types";
import { getPusherServer } from "../lib/pusher";
import { getSql } from "../lib/prisma";
import { getStationRuntimeStatus } from "../lib/station-status";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type CreateFuelLogInput = {
  driverId: number;
  vehicleId: number;
  stationId: number | null;
  liters: number;
  date?: Date | string;
  status?: FuelLogStatus;
  fuel_type?: FuelType;
};

type FuelLogWithRelations = FuelLogRow & {
  driver: {
    id: number;
    code: string;
    full_name: string;
    phone: string;
    status: "ACTIVE" | "SUSPENDED" | "DELETED";
  };
  vehicle: {
    id: number;
    truck_type: string;
    plates_number: string;
    trailer_plates: string | null;
    truck_volume: number;
    image_url: string | null;
  };
  station: {
    id: number;
    name: string;
    location: string | null;
    is_active: boolean;
  } | null;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "حدث خطأ غير متوقع.";
};

export async function logFuelEntry(
  input: CreateFuelLogInput,
): Promise<ActionResponse<FuelLogWithRelations>> {
  try {
    const sql = await getSql();

    if (!Number.isInteger(input.driverId) || input.driverId <= 0) {
      return {
        success: false,
        error: "يجب اختيار سائق صالح.",
      };
    }

    if (!Number.isInteger(input.vehicleId) || input.vehicleId <= 0) {
      return {
        success: false,
        error: "يجب اختيار مركبة صالحة.",
      };
    }

    const rawStationId = input.stationId;

    if (!Number.isInteger(rawStationId) || Number(rawStationId) <= 0) {
      return {
        success: false,
        error: "اختر محطة فعالة أولًا.",
      };
    }

    if (!Number.isFinite(Number(input.liters)) || Number(input.liters) <= 0) {
      return {
        success: false,
        error: "يجب أن تكون كمية اللترات أكبر من صفر.",
      };
    }

    const fuelLogDate = input.date ? new Date(input.date) : new Date();

    if (Number.isNaN(fuelLogDate.getTime())) {
      return {
        success: false,
        error: "تاريخ تعبئة الوقود غير صالح.",
      };
    }

    const status = input.status ?? FuelLogStatusValues.APPROVED;
    const fuelType = input.fuel_type ?? FuelTypeValues.DIESEL;
    const stationId = Number(rawStationId);

    const [vehicle] = await sql<{ id: number }[]>`
      SELECT id
      FROM "Vehicle"
      WHERE id = ${input.vehicleId}
        AND "driverId" = ${input.driverId}
        AND is_active = true
      LIMIT 1
    `;

    if (!vehicle) {
      return {
        success: false,
        error: "المركبة المختارة لا تتبع هذا السائق.",
      };
    }

    const [station] = await sql<{ id: number; is_active: boolean }[]>`
      SELECT id, is_active
      FROM "Station"
      WHERE id = ${stationId}
      LIMIT 1
    `;

    if (!station) {
      return {
        success: false,
        error: "المحطة المختارة غير موجودة.",
      };
    }

    const stationSchedules = await sql<{
      day_of_week: number;
      opens_at: string;
      closes_at: string;
      is_enabled: boolean;
    }[]>`
      SELECT day_of_week, opens_at, closes_at, is_enabled
      FROM "StationSchedule"
      WHERE "stationId" = ${stationId}
    `;

    const stationStatus = getStationRuntimeStatus(
      {
        is_active: station.is_active,
        schedules: stationSchedules,
      },
      fuelLogDate,
    );

    if (stationStatus !== "OPEN") {
      return {
        success: false,
        error:
          stationStatus === "INACTIVE"
            ? "هذه المحطة غير فعالة حاليًا."
            : "هذه المحطة مغلقة الآن وخارج ساعات العمل.",
      };
    }

    const [fuelLog] = await sql<FuelLogWithRelations[]>`
      WITH inserted AS (
        INSERT INTO "FuelLog" ("driverId", "vehicleId", "stationId", liters, fuel_type, date, confirmed_at, status)
        VALUES (
          ${input.driverId},
          ${input.vehicleId},
          ${stationId},
          ${input.liters},
          ${fuelType},
          ${fuelLogDate.toISOString()},
          NOW(),
          ${status}
        )
        RETURNING id, "driverId", "vehicleId", "stationId", liters::float8 AS liters, fuel_type, date, confirmed_at, status
      )
      SELECT
        i.id,
        i."driverId",
        i."vehicleId",
        i."stationId",
        i.liters,
        i.fuel_type,
        i.date,
        i.confirmed_at,
        i.status,
        json_build_object(
          'id', d.id,
          'code', d.code,
          'full_name', d.full_name,
          'phone', d.phone,
          'status', d.status
        ) AS driver,
        json_build_object(
          'id', v.id,
          'truck_type', v.truck_type,
          'plates_number', v.plates_number,
          'trailer_plates', v.trailer_plates,
          'truck_volume', v.truck_volume::float8,
          'image_url', v.image_url
        ) AS vehicle,
        CASE
          WHEN s.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', s.id,
            'name', s.name,
            'location', s.location,
            'is_active', s.is_active
          )
        END AS station
      FROM inserted i
      JOIN "Driver" d ON d.id = i."driverId"
      JOIN "Vehicle" v ON v.id = i."vehicleId"
      LEFT JOIN "Station" s ON s.id = i."stationId"
    `;

    if (!fuelLog) {
      throw new Error("تعذر حفظ عملية التعبئة.");
    }

    try {
      const pusher = await getPusherServer();
      await pusher.trigger("admin-dashboard", "new-fuel-log", fuelLog);
    } catch {
      return {
        success: true,
        data: fuelLog,
        error: "تم حفظ التعبئة لكن الإشعار اللحظي لم يعمل.",
      };
    }

    return {
      success: true,
      data: fuelLog,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
