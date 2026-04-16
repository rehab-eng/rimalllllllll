"use server";

import { FuelLogStatus, Prisma } from "../generated/prisma/client";
import { getPrisma } from "../lib/prisma";
import { getPusherServer } from "../lib/pusher";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type CreateFuelLogInput = Pick<
  Prisma.FuelLogUncheckedCreateInput,
  "driverId" | "vehicleId" | "liters" | "date" | "status"
>;

const fuelLogArgs = {
  include: {
    driver: {
      select: {
        id: true,
        code: true,
        full_name: true,
        phone: true,
      },
    },
    vehicle: {
      select: {
        id: true,
        truck_type: true,
        plates_number: true,
        trailer_plates: true,
        truck_volume: true,
        image_url: true,
      },
    },
  },
} satisfies Prisma.FuelLogDefaultArgs;

type FuelLogWithRelations = Prisma.FuelLogGetPayload<typeof fuelLogArgs>;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return "Driver or vehicle reference is invalid.";
    }

    return "Database operation failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred.";
};

export async function logFuelEntry(
  input: CreateFuelLogInput,
): Promise<ActionResponse<FuelLogWithRelations>> {
  try {
    const prisma = getPrisma();
    if (!Number.isInteger(input.driverId) || input.driverId <= 0) {
      return {
        success: false,
        error: "A valid driver is required.",
      };
    }

    if (!Number.isInteger(input.vehicleId) || input.vehicleId <= 0) {
      return {
        success: false,
        error: "A valid vehicle is required.",
      };
    }

    if (!Number.isFinite(Number(input.liters)) || Number(input.liters) <= 0) {
      return {
        success: false,
        error: "Liters must be greater than zero.",
      };
    }

    const fuelLogDate = input.date ? new Date(input.date) : undefined;

    if (fuelLogDate && Number.isNaN(fuelLogDate.getTime())) {
      return {
        success: false,
        error: "Fuel log date is invalid.",
      };
    }

    const status = input.status ?? FuelLogStatus.PENDING;

    const fuelLog = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({
        where: {
          id: input.vehicleId,
          driverId: input.driverId,
        },
        select: {
          id: true,
        },
      });

      if (!vehicle) {
        throw new Error("The selected vehicle does not belong to the driver.");
      }

      const fuelLogData: Prisma.FuelLogUncheckedCreateInput = {
        driverId: input.driverId,
        vehicleId: input.vehicleId,
        liters: input.liters,
        status,
      };

      if (fuelLogDate) {
        fuelLogData.date = fuelLogDate;
      }

      return tx.fuelLog.create({
        data: fuelLogData,
        include: fuelLogArgs.include,
      });
    });

    try {
      const pusher = await getPusherServer();

      await pusher.trigger("admin-dashboard", "new-fuel-log", fuelLog);

      return {
        success: true,
        data: fuelLog,
      };
    } catch {
      return {
        success: true,
        data: fuelLog,
        error: "Fuel log created, but real-time notification failed.",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
