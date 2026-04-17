"use server";

import {
  DriverStatus,
  Prisma,
  type Driver,
  type Vehicle,
} from "../generated/prisma/client";
import { getPrisma } from "../lib/prisma";

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
    Prisma.VehicleCreateInput,
    "truck_type" | "plates_number" | "trailer_plates" | "truck_volume" | "image_url"
  >;
};

const driverDashboardArgs = {
  include: {
    vehicles: {
      where: {
        is_active: true,
      },
      orderBy: {
        id: "asc",
      },
      include: {
        fuel_logs: {
          select: {
            liters: true,
            fuel_type: true,
            status: true,
          },
        },
      },
    },
    fuel_logs: {
      include: {
        station: {
          select: {
            id: true,
            name: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plates_number: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 12,
    },
    _count: {
      select: {
        fuel_logs: true,
        vehicles: true,
      },
    },
  },
} satisfies Prisma.DriverDefaultArgs;

type DriverDashboardRecord = Prisma.DriverGetPayload<typeof driverDashboardArgs>;

type VehicleConsumptionSummary = {
  vehicleId: number;
  platesNumber: string;
  totalLiters: number;
  totalLogs: number;
};

type DriverDashboardStats = {
  driver: Omit<DriverDashboardRecord, "_count" | "vehicles">;
  vehicles: Array<
    Omit<DriverDashboardRecord["vehicles"][number], "fuel_logs"> & {
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
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "رمز السائق أو رقم الهاتف مستخدم من قبل.";
    }

    return "فشلت عملية قاعدة البيانات.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "حدث خطأ غير متوقع.";
};

export async function registerDriverWithVehicle(
  input: RegisterDriverInput,
): Promise<ActionResponse<{ driver: Driver; vehicle: Vehicle }>> {
  try {
    const prisma = getPrisma();

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
      truck_volume: input.vehicle.truck_volume,
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

    if (!Number.isFinite(Number(vehicleData.truck_volume)) || Number(vehicleData.truck_volume) <= 0) {
      return {
        success: false,
        error: "سعة الشاحنة يجب أن تكون أكبر من صفر.",
      };
    }

    const data = await prisma.$transaction(async (tx) => {
      const driver = await tx.driver.create({
        data: {
          ...driverData,
          status: DriverStatus.ACTIVE,
        },
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
    const prisma = getPrisma();
    const normalizedCode = trimText(code);

    if (!normalizedCode) {
      return {
        success: false,
        error: "رمز السائق مطلوب.",
      };
    }

    const driver = await prisma.driver.findFirst({
      where: {
        code: normalizedCode,
        deleted_at: null,
      },
      ...driverDashboardArgs,
    });

    if (!driver) {
      return {
        success: false,
        error: "السائق غير موجود.",
      };
    }

    const { _count, vehicles, ...driverData } = driver;

    const vehicleConsumption = vehicles.map((vehicle) => {
      const totalLiters = vehicle.fuel_logs.reduce(
        (total, fuelLog) => total + Number(fuelLog.liters),
        0,
      );

      return {
        vehicleId: vehicle.id,
        platesNumber: vehicle.plates_number,
        totalLiters,
        totalLogs: vehicle.fuel_logs.length,
      };
    });

    const totalFilledLiters = vehicleConsumption.reduce(
      (total, vehicle) => total + vehicle.totalLiters,
      0,
    );

    return {
      success: true,
      data: {
        driver: driverData,
        vehicles: vehicles.map(({ fuel_logs, ...vehicle }) => ({
          ...vehicle,
          totalLiters: fuel_logs.reduce((total, fuelLog) => total + Number(fuelLog.liters), 0),
          totalLogs: fuel_logs.length,
        })),
        totalFuelLogs: _count.fuel_logs,
        totalVehicles: _count.vehicles,
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
  driverId: Driver["id"],
  status: DriverStatus,
): Promise<ActionResponse<{ id: number; status: DriverStatus }>> {
  try {
    const prisma = getPrisma();

    const driver = await prisma.driver.update({
      where: {
        id: driverId,
      },
      data: {
        status,
        deleted_at: status === DriverStatus.DELETED ? new Date() : null,
      },
      select: {
        id: true,
        status: true,
      },
    });

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
  driverId: Driver["id"],
): Promise<ActionResponse<{ id: number; deletedAt: Date | null }>> {
  try {
    const prisma = getPrisma();

    const driver = await prisma.driver.update({
      where: {
        id: driverId,
      },
      data: {
        status: DriverStatus.DELETED,
        deleted_at: new Date(),
      },
      select: {
        id: true,
        deleted_at: true,
      },
    });

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
