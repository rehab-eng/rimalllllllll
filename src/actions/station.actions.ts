"use server";

import { getSql } from "../lib/prisma";

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

const isTimeValue = (value: string): boolean => /^\d{2}:\d{2}$/.test(value);
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
    const schedules = input.schedules
      .filter((schedule) => schedule.isEnabled)
      .map((schedule) => ({
        day_of_week: schedule.dayOfWeek,
        opens_at: schedule.opensAt,
        closes_at: schedule.closesAt,
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
        (schedule) => !isTimeValue(schedule.opens_at) || !isTimeValue(schedule.closes_at),
      )
    ) {
      return {
        success: false,
        error: "يجب إدخال وقت افتتاح ووقت إغلاق صالحين لكل يوم مفعّل.",
      };
    }

    if (schedules.some((schedule) => toMinutes(schedule.opens_at) >= toMinutes(schedule.closes_at))) {
      return {
        success: false,
        error: "وقت الإغلاق يجب أن يكون بعد وقت الافتتاح.",
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
      `;

      for (const schedule of schedules) {
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

    for (const schedule of schedules) {
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
    const [station] = await sql<{ id: number; is_active: boolean }[]>`
      UPDATE "Station"
      SET is_active = ${isActive}
      WHERE id = ${stationId}
      RETURNING id, is_active
    `;

    if (!station) {
      return {
        success: false,
        error: "المحطة غير موجودة.",
      };
    }

    return {
      success: true,
      data: {
        id: station.id,
        isActive: station.is_active,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
