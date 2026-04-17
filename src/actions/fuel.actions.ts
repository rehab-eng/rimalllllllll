"use server";

import { FuelLogStatus, FuelType, Prisma } from "../generated/prisma/client";
import { getPrisma } from "../lib/prisma";
import { getPusherServer } from "../lib/pusher";
import { getStationRuntimeStatus } from "../lib/station-status";

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type CreateFuelLogInput = Pick<
  Prisma.FuelLogUncheckedCreateInput,
  "driverId" | "vehicleId" | "stationId" | "liters" | "date" | "status" | "fuel_type"
>;

const fuelLogArgs = {
  include: {
    driver: {
      select: {
        id: true,
        code: true,
        full_name: true,
        phone: true,
        status: true,
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
    station: {
      select: {
        id: true,
        name: true,
        location: true,
        is_active: true,
      },
    },
  },
} satisfies Prisma.FuelLogDefaultArgs;

type FuelLogWithRelations = Prisma.FuelLogGetPayload<typeof fuelLogArgs>;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return "مرجع السائق أو المركبة أو المحطة غير صالح.";
    }

    return "فشلت عملية قاعدة البيانات.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "حدث خطأ غير متوقع.";
};

export async function logFuelEntry(
  input: CreateFuelLogInput,
): Promise<ActionResponse<FuelLogWithRelations>> {
  try {
    const prisma = getPrisma();

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

    const status = input.status ?? FuelLogStatus.APPROVED;
    const fuelType = input.fuel_type ?? FuelType.DIESEL;
    const stationId = Number(rawStationId);

    const fuelLog = await prisma.$transaction(async (tx) => {
      const [vehicle, station] = await Promise.all([
        tx.vehicle.findFirst({
          where: {
            id: input.vehicleId,
            driverId: input.driverId,
            is_active: true,
          },
          select: {
            id: true,
          },
        }),
        tx.station.findUnique({
          where: {
            id: stationId,
          },
          include: {
            schedules: true,
          },
        }),
      ]);

      if (!vehicle) {
        throw new Error("المركبة المختارة لا تتبع هذا السائق.");
      }

      if (!station) {
        throw new Error("المحطة المختارة غير موجودة.");
      }

      const stationStatus = getStationRuntimeStatus(
        {
          is_active: station.is_active,
          schedules: station.schedules,
        },
        fuelLogDate,
      );

      if (stationStatus !== "OPEN") {
        throw new Error(
          stationStatus === "INACTIVE"
            ? "هذه المحطة غير فعالة حاليًا."
            : "هذه المحطة مغلقة الآن وخارج ساعات العمل.",
        );
      }

      return tx.fuelLog.create({
        data: {
          driverId: input.driverId,
          vehicleId: input.vehicleId,
          stationId,
          liters: input.liters,
          date: fuelLogDate,
          fuel_type: fuelType,
          confirmed_at: new Date(),
          status,
        },
        include: fuelLogArgs.include,
      });
    });

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
