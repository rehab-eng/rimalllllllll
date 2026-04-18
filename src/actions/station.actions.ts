"use server";

import { getSql } from "../lib/prisma";
import { FORCE_ACTIVE_DAY_OF_WEEK } from "../lib/station-status";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type StationScheduleInput = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isEnabled: boolean;
};

export type SaveStationInput = {
  id?: number;
  name: string;
  location?: string;
  isActive?: boolean;
  schedules: StationScheduleInput[];
};

const trimText = (value: string | undefined | null): string => (value ?? "").trim();

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "حدث خطأ غير متوقع.";
};

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

const normalizeTimeValue = (value: string): string | null => {
  const normalized = trimText(value);
  const match = normalized.match(timePattern);

  if (!match) {
    return null;
  }

  const hours = match[1];
  const minutes = match[2];
  return `${hours}:${minutes}`;
};

const toMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export async function saveStation(
  input: SaveStationInput,
): Promise<ActionResponse<{ id: number }>> {
  try {
    const sql = await getSql();
    const name = trimText(input.name);
    const location = trimText(input.location) || null;

    const schedules = input.schedules.map((schedule) => ({
      day_of_week: schedule.dayOfWeek,
      opens_at: normalizeTimeValue(schedule.opensAt),
      closes_at: normalizeTimeValue(schedule.closesAt),
      is_enabled: schedule.isEnabled,
    }));

    if (!name) {
      return {
        success: false,
        error: "اسم المحطة مطلوب.",
      };
    }

    if (
      schedules.some(
        (schedule) =>
          schedule.day_of_week < 0 ||
          schedule.day_of_week > 6 ||
          !Number.isInteger(schedule.day_of_week),
      )
    ) {
      return {
        success: false,
        error: "اليوم المحدد غير صالح.",
      };
    }

    if (
      schedules.some(
        (schedule) => schedule.is_enabled && (!schedule.opens_at || !schedule.closes_at),
      )
    ) {
      return {
        success: false,
        error: "أدخل وقتًا صالحًا (ساعة:دقيقة) لكل يوم مفعّل.",
      };
    }

    if (
      schedules.some(
        (schedule) =>
          schedule.is_enabled &&
          schedule.opens_at &&
          schedule.closes_at &&
          toMinutes(schedule.opens_at) >= toMinutes(schedule.closes_at),
      )
    ) {
      return {
        success: false,
        error: "وقت الإغلاق يجب أن يكون بعد وقت الافتتاح.",
      };
    }

    const enabledSchedules = schedules.filter((schedule) => schedule.is_enabled);

    if (enabledSchedules.length === 0) {
      return {
        success: false,
        error: "فعّل يومًا واحدًا على الأقل للمحطة.",
      };
    }

    if (input.id) {
      await sql`
        UPDATE "Station"
        SET
          name = ${name},
          location = ${location},
          is_active = ${input.isActive ?? true}
        WHERE id = ${input.id}
      `;

      await sql`
        DELETE FROM "StationSchedule"
        WHERE "stationId" = ${input.id}
          AND day_of_week <> ${FORCE_ACTIVE_DAY_OF_WEEK}
      `;

      for (const schedule of enabledSchedules) {
        if (!schedule.opens_at || !schedule.closes_at) {
          continue;
        }

        await sql`
          INSERT INTO "StationSchedule" ("stationId", day_of_week, opens_at, closes_at, is_enabled)
          VALUES (${input.id}, ${schedule.day_of_week}, ${schedule.opens_at}, ${schedule.closes_at}, ${schedule.is_enabled})
        `;
      }

      return {
        success: true,
        data: { id: input.id },
      };
    }

    const [createdStation] = await sql<{ id: number }[]>`
      INSERT INTO "Station" (name, location, is_active)
      VALUES (${name}, ${location}, ${input.isActive ?? true})
      RETURNING id
    `;

    if (!createdStation) {
      throw new Error("تعذر إنشاء المحطة.");
    }

    for (const schedule of enabledSchedules) {
      if (!schedule.opens_at || !schedule.closes_at) {
        continue;
      }

      await sql`
        INSERT INTO "StationSchedule" ("stationId", day_of_week, opens_at, closes_at, is_enabled)
        VALUES (${createdStation.id}, ${schedule.day_of_week}, ${schedule.opens_at}, ${schedule.closes_at}, ${schedule.is_enabled})
      `;
    }

    return {
      success: true,
      data: createdStation,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function toggleStationActivity(
  stationId: number,
  isActive: boolean,
): Promise<ActionResponse<{ id: number; isActive: boolean }>> {
  try {
    const sql = await getSql();
    const [station] = await sql<{ id: number }[]>`
      UPDATE "Station"
      SET is_active = true
      WHERE id = ${stationId}
      RETURNING id
    `;

    if (!station) {
      return {
        success: false,
        error: "المحطة غير موجودة.",
      };
    }

    if (isActive) {
      await sql`
        INSERT INTO "StationSchedule" ("stationId", day_of_week, opens_at, closes_at, is_enabled)
        SELECT ${stationId}, ${FORCE_ACTIVE_DAY_OF_WEEK}, '00:00', '23:59', true
        WHERE NOT EXISTS (
          SELECT 1
          FROM "StationSchedule"
          WHERE "stationId" = ${stationId}
            AND day_of_week = ${FORCE_ACTIVE_DAY_OF_WEEK}
        )
      `;
    } else {
      await sql`
        DELETE FROM "StationSchedule"
        WHERE "stationId" = ${stationId}
          AND day_of_week = ${FORCE_ACTIVE_DAY_OF_WEEK}
      `;
    }

    return {
      success: true,
      data: {
        id: station.id,
        isActive,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function deleteStation(
  stationId: number,
): Promise<ActionResponse<{ id: number }>> {
  try {
    const sql = await getSql();

    await sql`
      UPDATE "FuelLog"
      SET "stationId" = NULL
      WHERE "stationId" = ${stationId}
    `;

    await sql`
      DELETE FROM "StationSchedule"
      WHERE "stationId" = ${stationId}
    `;

    const [deletedStation] = await sql<{ id: number }[]>`
      DELETE FROM "Station"
      WHERE id = ${stationId}
      RETURNING id
    `;

    if (!deletedStation) {
      return {
        success: false,
        error: "المحطة غير موجودة.",
      };
    }

    return {
      success: true,
      data: deletedStation,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
