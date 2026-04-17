import { revalidatePath } from "next/cache";

import SystemStatusCard from "../../components/SystemStatusCard";
import { deleteDriverAccount } from "../../actions/driver.actions";
import { logFuelEntry } from "../../actions/fuel.actions";
import DriverDangerZone from "../../features/driver/DriverDangerZone";
import DriverDashboard from "../../features/driver/DriverDashboard";
import DriverStationsBoard from "../../features/driver/DriverStationsBoard";
import DriverVehicleStats from "../../features/driver/DriverVehicleStats";
import AddVehicleForm from "../../features/driver/AddVehicleForm";
import FuelFillForm from "../../features/driver/FuelFillForm";
import type {
  ActionResult,
  AddVehiclePayload,
  DriverFuelHistoryItem,
  DriverStationSummary,
  DriverVehicleSummary,
  FuelFillPayload,
  FuelFillStationOption,
  FuelFillVehicleOption,
} from "../../features/driver/types";
import { DriverStatus, FuelLogStatus } from "../../generated/prisma/client";
import { fuelLogStatusLabels, fuelTypeLabels, formatArabicDateTime } from "../../lib/labels";
import { getPrisma, isDatabaseConfigured } from "../../lib/prisma";
import {
  formatScheduleWindow,
  getStationRuntimeStatus,
  weekdayLabels,
} from "../../lib/station-status";

export const dynamic = "force-dynamic";

const MOCK_DRIVER_CODE = "DRV-001";
const pageBackground =
  "min-h-screen bg-[radial-gradient(circle_at_top,rgba(214,211,209,0.16),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(115,115,115,0.14),transparent_32%),linear-gradient(140deg,#050816_0%,#111827_42%,#1f2937_100%)]";

const parseNumber = (value: string | number): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

export default async function DriverPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className={pageBackground}>
        <SystemStatusCard
          title="بوابة السائق غير مهيأة بعد"
          description="البوابة تحتاج اتصالًا بقاعدة البيانات، لكن متغير DATABASE_URL غير موجود داخل إعدادات الاستضافة."
          details="أضف DATABASE_URL في Cloudflare Workers، وضعه أيضًا في Build Variables and Secrets، ثم أعد النشر."
        />
      </main>
    );
  }

  try {
    const prisma = getPrisma();

    const requestedDriver = await prisma.driver.findFirst({
      where: {
        code: MOCK_DRIVER_CODE,
        deleted_at: null,
        status: {
          not: DriverStatus.DELETED,
        },
      },
      include: {
        vehicles: {
          where: {
            is_active: true,
          },
          orderBy: {
            id: "asc",
          },
        },
        _count: {
          select: {
            vehicles: true,
            fuel_logs: true,
          },
        },
      },
    });

    const fallbackDriver =
      requestedDriver ??
      (await prisma.driver.findFirst({
        where: {
          deleted_at: null,
          status: {
            not: DriverStatus.DELETED,
          },
        },
        include: {
          vehicles: {
            where: {
              is_active: true,
            },
            orderBy: {
              id: "asc",
            },
          },
          _count: {
            select: {
              vehicles: true,
              fuel_logs: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      }));

    const driver = fallbackDriver;

    const [recentFuelLogs, litersAggregate, vehicleAggregates, stations] = driver
      ? await Promise.all([
          prisma.fuelLog.findMany({
            where: {
              driverId: driver.id,
            },
            include: {
              station: {
                select: {
                  name: true,
                },
              },
              vehicle: {
                select: {
                  plates_number: true,
                },
              },
            },
            orderBy: {
              date: "desc",
            },
            take: 8,
          }),
          prisma.fuelLog.aggregate({
            where: {
              driverId: driver.id,
              status: FuelLogStatus.APPROVED,
            },
            _sum: {
              liters: true,
            },
          }),
          prisma.fuelLog.groupBy({
            by: ["vehicleId"],
            where: {
              driverId: driver.id,
              status: FuelLogStatus.APPROVED,
            },
            _sum: {
              liters: true,
            },
            _count: {
              _all: true,
            },
          }),
          prisma.station.findMany({
            include: {
              schedules: {
                where: {
                  is_enabled: true,
                },
                orderBy: {
                  day_of_week: "asc",
                },
              },
              _count: {
                select: {
                  fuel_logs: true,
                },
              },
            },
            orderBy: [
              {
                is_active: "desc",
              },
              {
                name: "asc",
              },
            ],
          }),
        ])
      : [[], null, [], []];

    const totalFilledLiters = litersAggregate?._sum.liters ? Number(litersAggregate._sum.liters) : 0;
    const vehicleAggregateMap = new Map(
      vehicleAggregates.map((vehicle) => [
        vehicle.vehicleId,
        {
          totalLiters: Number(vehicle._sum.liters ?? 0),
          totalLogs: vehicle._count._all,
        },
      ]),
    );

    const stationSummaries: DriverStationSummary[] = stations.map((station) => ({
      id: station.id,
      name: station.name,
      location: station.location,
      isActive: station.is_active,
      runtimeStatus: getStationRuntimeStatus(station),
      scheduleSummary: station.schedules.map((schedule) =>
        `${weekdayLabels[schedule.day_of_week]} ${formatScheduleWindow(
          schedule.opens_at,
          schedule.closes_at,
        )}`,
      ),
    }));

    const vehicleSummaries: DriverVehicleSummary[] =
      driver?.vehicles.map((vehicle) => {
        const aggregate = vehicleAggregateMap.get(vehicle.id);

        return {
          id: vehicle.id,
          truckType: vehicle.truck_type,
          platesNumber: vehicle.plates_number,
          trailerPlates: vehicle.trailer_plates,
          imageUrl: vehicle.image_url,
          totalLiters: aggregate?.totalLiters ?? 0,
          totalLogs: aggregate?.totalLogs ?? 0,
        };
      }) ?? [];

    const fuelVehicles: FuelFillVehicleOption[] = vehicleSummaries.map((vehicle) => ({
      id: vehicle.id,
      truckType: vehicle.truckType,
      platesNumber: vehicle.platesNumber,
      trailerPlates: vehicle.trailerPlates,
    }));

    const fuelStations: FuelFillStationOption[] = stationSummaries.map((station) => ({
      id: station.id,
      name: station.name,
      location: station.location,
      runtimeStatus: station.runtimeStatus,
    }));

    const recentFuelHistory: DriverFuelHistoryItem[] = recentFuelLogs.map((log) => ({
      id: log.id,
      liters: Number(log.liters),
      fuelType: fuelTypeLabels[log.fuel_type],
      status: fuelLogStatusLabels[log.status],
      date: formatArabicDateTime(log.date),
      stationName: log.station?.name,
      vehiclePlates: log.vehicle.plates_number,
    }));

    async function handleAddVehicle(payload: AddVehiclePayload): Promise<ActionResult> {
      "use server";

      if (!driver) {
        return {
          success: false,
          error: "لا يوجد سائق متاح في هذه الجلسة التجريبية.",
        };
      }

      const prisma = getPrisma();
      const truckType = payload.truckType.trim();
      const platesNumber = payload.platesNumber.trim();
      const trailerPlates = payload.trailerPlates.trim();
      const imageUrl = payload.imageUrl.trim();
      const truckVolume = parseNumber(payload.truckVolume);

      if (!truckType || !platesNumber || truckVolume <= 0) {
        return {
          success: false,
          error: "يجب إدخال نوع الشاحنة ورقم اللوحة وسعة صحيحة.",
        };
      }

      try {
        await prisma.vehicle.create({
          data: {
            driverId: driver.id,
            truck_type: truckType,
            plates_number: platesNumber,
            trailer_plates: trailerPlates || null,
            truck_volume: truckVolume,
            image_url: imageUrl || null,
          },
        });

        revalidatePath("/driver");

        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "تعذر إضافة المركبة.",
        };
      }
    }

    async function handleFuelFill(payload: FuelFillPayload): Promise<ActionResult> {
      "use server";

      if (!driver) {
        return {
          success: false,
          error: "لا يوجد سائق متاح في هذه الجلسة التجريبية.",
        };
      }

      const result = await logFuelEntry({
        driverId: driver.id,
        vehicleId: payload.vehicleId,
        stationId: payload.stationId,
        liters: payload.liters,
        fuel_type: payload.fuelType,
        status: FuelLogStatus.APPROVED,
      });

      if (result.success) {
        revalidatePath("/driver");
        revalidatePath("/admin");
      }

      return {
        success: result.success,
        error: result.error,
      };
    }

    async function handleDeleteAccount(): Promise<ActionResult> {
      "use server";

      if (!driver) {
        return {
          success: false,
          error: "لا يوجد سائق متاح في هذه الجلسة التجريبية.",
        };
      }

      const result = await deleteDriverAccount(driver.id);

      if (result.success) {
        revalidatePath("/driver");
        revalidatePath("/admin");
      }

      return {
        success: result.success,
        error: result.error,
      };
    }

    const dashboardDriver = {
      fullName: driver?.full_name ?? "سائق تجريبي",
      code: driver?.code ?? MOCK_DRIVER_CODE,
      totalFilledLiters,
      totalFuelLogs: driver?._count.fuel_logs ?? 0,
      vehicleCount: driver?._count.vehicles ?? 0,
      activeStationCount: stationSummaries.filter((station) => station.runtimeStatus === "OPEN")
        .length,
      accountStatus: driver?.status ?? DriverStatus.ACTIVE,
    };

    return (
      <main className={pageBackground}>
        <DriverDashboard
          driver={dashboardDriver}
          navigationItems={[
            { id: "fuel-fill", label: "تأكيد التعبئة" },
            { id: "stations", label: "المحطات" },
            { id: "fleet", label: "مركباتي" },
            { id: "account", label: "الحساب" },
          ]}
          activeNavId="fuel-fill"
        >
          <div className="space-y-4 pb-6">
            <FuelFillForm vehicles={fuelVehicles} stations={fuelStations} onSubmit={handleFuelFill} />
            <DriverStationsBoard stations={stationSummaries} />
            <DriverVehicleStats vehicles={vehicleSummaries} recentFuelLogs={recentFuelHistory} />
            <AddVehicleForm existingVehicles={vehicleSummaries} onSubmit={handleAddVehicle} />
            <DriverDangerZone onDeleteAccount={handleDeleteAccount} />
          </div>
        </DriverDashboard>
      </main>
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";

    return (
      <main className={pageBackground}>
        <SystemStatusCard
          title="تعذر تحميل بوابة السائق"
          description="حدث خطأ أثناء تحميل بيانات السائق أو المحطات. غالبًا الاتصال بقاعدة البيانات غير متاح داخل الاستضافة."
          details={details}
        />
      </main>
    );
  }
}
