"use server";

import { Prisma, type Driver, type Vehicle } from "../generated/prisma/client";
import prisma from "../lib/prisma";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type RegisterDriverInput = {
  driver: Pick<
    Prisma.DriverCreateInput,
    "code" | "full_name" | "national_id" | "phone" | "license_url"
  >;
  vehicle: Pick<
    Prisma.VehicleCreateInput,
    "truck_type" | "plates_number" | "trailer_plates" | "truck_volume" | "image_url"
  >;
};

const driverDashboardArgs = {
  include: {
    vehicles: {
      orderBy: {
        id: "desc",
      },
    },
    _count: {
      select: {
        fuel_logs: true,
      },
    },
  },
} satisfies Prisma.DriverDefaultArgs;

type DriverDashboardRecord = Prisma.DriverGetPayload<typeof driverDashboardArgs>;
type DriverDashboardStats = Omit<DriverDashboardRecord, "_count"> & {
  totalFuelLogs: number;
};

const trimText = (value: string): string => value.trim();

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Driver code already exists.";
    }

    return "Database operation failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred.";
};

export async function registerDriverWithVehicle(
  input: RegisterDriverInput,
): Promise<ActionResponse<{ driver: Driver; vehicle: Vehicle }>> {
  try {
    const driverData = {
      code: trimText(input.driver.code),
      full_name: trimText(input.driver.full_name),
      national_id: trimText(input.driver.national_id),
      phone: trimText(input.driver.phone),
      license_url: trimText(input.driver.license_url),
    } satisfies Pick<
      Prisma.DriverCreateInput,
      "code" | "full_name" | "national_id" | "phone" | "license_url"
    >;

    const vehicleData = {
      truck_type: trimText(input.vehicle.truck_type),
      plates_number: trimText(input.vehicle.plates_number),
      trailer_plates: input.vehicle.trailer_plates
        ? trimText(input.vehicle.trailer_plates)
        : null,
      truck_volume: input.vehicle.truck_volume,
      image_url: trimText(input.vehicle.image_url),
    } satisfies Pick<
      Prisma.VehicleCreateInput,
      "truck_type" | "plates_number" | "trailer_plates" | "truck_volume" | "image_url"
    >;

    if (
      !driverData.code ||
      !driverData.full_name ||
      !driverData.national_id ||
      !driverData.phone ||
      !driverData.license_url ||
      !vehicleData.truck_type ||
      !vehicleData.plates_number ||
      !vehicleData.image_url
    ) {
      return {
        success: false,
        error: "All required fields must be provided.",
      };
    }

    if (!Number.isFinite(Number(vehicleData.truck_volume)) || Number(vehicleData.truck_volume) <= 0) {
      return {
        success: false,
        error: "Truck volume must be greater than zero.",
      };
    }

    const data = await prisma.$transaction(async (tx) => {
      const driver = await tx.driver.create({
        data: driverData,
      });

      const vehicle = await tx.vehicle.create({
        data: {
          ...vehicleData,
          driverId: driver.id,
        },
      });

      return {
        driver,
        vehicle,
      };
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function getDriverDashboardStatsByCode(
  code: Driver["code"],
): Promise<ActionResponse<DriverDashboardStats>> {
  try {
    const normalizedCode = trimText(code);

    if (!normalizedCode) {
      return {
        success: false,
        error: "Driver code is required.",
      };
    }

    const driver = await prisma.driver.findUnique({
      where: {
        code: normalizedCode,
      },
      ...driverDashboardArgs,
    });

    if (!driver) {
      return {
        success: false,
        error: "Driver not found.",
      };
    }

    const { _count, ...driverData } = driver;

    return {
      success: true,
      data: {
        ...driverData,
        totalFuelLogs: _count.fuel_logs,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
