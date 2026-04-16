"use server";

import { Prisma, type Station } from "../generated/prisma/client";
import { getPrisma } from "../lib/prisma";

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
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return "Database operation failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred.";
};

const isTimeValue = (value: string): boolean => /^\d{2}:\d{2}$/.test(value);

export async function saveStation(
  input: SaveStationInput,
): Promise<ActionResponse<{ id: number }>> {
  try {
    const prisma = getPrisma();
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
        error: "Station name is required.",
      };
    }

    if (schedules.some((schedule) => !isTimeValue(schedule.opens_at) || !isTimeValue(schedule.closes_at))) {
      return {
        success: false,
        error: "Every enabled schedule must include valid open and close times.",
      };
    }

    const station = await prisma.$transaction(async (tx) => {
      if (input.id) {
        await tx.station.update({
          where: {
            id: input.id,
          },
          data: {
            name,
            location,
            is_active: input.isActive ?? true,
          },
        });

        await tx.stationSchedule.deleteMany({
          where: {
            stationId: input.id,
          },
        });

        if (schedules.length > 0) {
          await tx.stationSchedule.createMany({
            data: schedules.map((schedule) => ({
              stationId: input.id!,
              ...schedule,
            })),
          });
        }

        return {
          id: input.id,
        };
      }

      const createdStation = await tx.station.create({
        data: {
          name,
          location,
          is_active: input.isActive ?? true,
          schedules: {
            create: schedules,
          },
        },
        select: {
          id: true,
        },
      });

      return createdStation;
    });

    return {
      success: true,
      data: station,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function toggleStationActivity(
  stationId: Station["id"],
  isActive: boolean,
): Promise<ActionResponse<{ id: number; isActive: boolean }>> {
  try {
    const prisma = getPrisma();
    const station = await prisma.station.update({
      where: {
        id: stationId,
      },
      data: {
        is_active: isActive,
      },
      select: {
        id: true,
        is_active: true,
      },
    });

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
