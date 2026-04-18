import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  authenticateDriverByPhoneOrLicense,
  registerDriverWithVehicles,
} from "../../actions/driver.actions";
import { logFuelEntry } from "../../actions/fuel.actions";
import SystemStatusCard from "../../components/SystemStatusCard";
import AddVehicleForm from "../../features/driver/AddVehicleForm";
import DriverDashboard from "../../features/driver/DriverDashboard";
import DriverLoginForm from "../../features/driver/DriverLoginForm";
import DriverStationsBoard from "../../features/driver/DriverStationsBoard";
import DriverVehicleStats from "../../features/driver/DriverVehicleStats";
import FuelFillForm from "../../features/driver/FuelFillForm";
import type {
  ActionResult,
  AddVehiclePayload,
  DriverFuelHistoryItem,
  DriverLoginPayload,
  DriverRegisterPayload,
  DriverStationSummary,
  DriverVehicleSummary,
  FuelFillPayload,
  FuelFillStationOption,
  FuelFillVehicleOption,
} from "../../features/driver/types";
import { DriverStatus, FuelLogStatus } from "../../lib/db-types";
import { fuelLogStatusLabels, fuelTypeLabels, formatArabicDateTime } from "../../lib/labels";
import { getSql, isDatabaseConfigured } from "../../lib/prisma";
import {
  formatScheduleWindow,
  getStationRuntimeStatus,
  weekdayLabels,
} from "../../lib/station-status";

export const dynamic = "force-dynamic";
// force cloudflare update

const DRIVER_SESSION_COOKIE = "rimall_driver_session";
const DRIVER_SESSION_MAX_AGE = 60 * 60 * 24 * 180;

const pageBackground =
  "min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#fff7ed_100%)]";

type DriverRaw = {
  id: number;
  code: string;
  full_name: string;
  phone: string;
  license_number: string | null;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  vehicle_count: number;
  fuel_log_count: number;
};

export default async function DriverPage() {
  if (!(await isDatabaseConfigured())) {
    return (
      <main className={pageBackground}>
        <SystemStatusCard
          title="بوابة السائق غير مهيأة بعد"
          description="البوابة تحتاج اتصالاً بقاعدة البيانات، لكن DATABASE_URL غير موجود."
          details="أضف DATABASE_URL في Cloudflare Workers ثم أعد النشر."
        />
      </main>
    );
  }

  try {
    const sql = await getSql();
    const cookieStore = await cookies();
    const rawSessionDriverId = cookieStore.get(DRIVER_SESSION_COOKIE)?.value;
    const sessionDriverId = Number(rawSessionDriverId ?? Number.NaN);

    const [sessionDriver] =
      Number.isInteger(sessionDriverId) && sessionDriverId > 0
        ? await sql<DriverRaw[]>`
            SELECT
              d.id,
              d.code,
              d.full_name,
              d.phone,
              d.license_number,
              d.status,
              (
                SELECT COUNT(*)::int
                FROM "Vehicle" v
                WHERE v."driverId" = d.id
                  AND v.is_active = true
              ) AS vehicle_count,
              (
                SELECT COUNT(*)::int
                FROM "FuelLog" fl
                WHERE fl."driverId" = d.id
              ) AS fuel_log_count
            FROM "Driver" d
            WHERE d.id = ${sessionDriverId}
              AND d.deleted_at IS NULL
              AND d.status = ${DriverStatus.ACTIVE}
            LIMIT 1
          `
        : [];

    if (!sessionDriver) {
      async function handleLogin(payload: DriverLoginPayload): Promise<ActionResult> {
        "use server";

        const result = await authenticateDriverByPhoneOrLicense({
          phone: payload.phone,
          license_number: payload.licenseNumber,
          device_token: payload.deviceToken,
        });

        if (!result.success || !result.data) {
          return {
            success: false,
            error: result.error ?? "تعذر تسجيل الدخول.",
          };
        }

        const store = await cookies();
        store.set(DRIVER_SESSION_COOKIE, String(result.data.id), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: DRIVER_SESSION_MAX_AGE,
        });

        revalidatePath("/driver");

        return {
          success: true,
        };
      }

      async function handleRegister(payload: DriverRegisterPayload): Promise<ActionResult> {
        "use server";

        const result = await registerDriverWithVehicles({
          driver: {
            full_name: payload.fullName,
            phone: payload.phone,
            license_number: payload.licenseNumber,
            device_token: payload.deviceToken,
          },
          vehicles: payload.vehicles.map((vehicle) => ({
            plates_number: vehicle.platesNumber,
            trailer_plates: vehicle.trailerPlates,
            capacity_liters: vehicle.capacityLiters,
            cubic_capacity: vehicle.cubicCapacity,
          })),
        });

        if (!result.success || !result.data) {
          return {
            success: false,
            error: result.error ?? "تعذر إنشاء الحساب.",
          };
        }

        const store = await cookies();
        store.set(DRIVER_SESSION_COOKIE, String(result.data.driver.id), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: DRIVER_SESSION_MAX_AGE,
        });

        revalidatePath("/driver");
        revalidatePath("/admin");

        return {
          success: true,
        };
      }

      return (
        <main className={pageBackground}>
          <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
            <DriverLoginForm onLogin={handleLogin} onRegister={handleRegister} />
          </div>
        </main>
      );
    }

    const [vehiclesRaw, recentFuelLogsRaw, litersAggregateRaw, vehicleAggregatesRaw, stationsRaw, schedulesRaw] =
      await Promise.all([
        sql<
          {
            id: number;
            plates_number: string;
            trailer_plates: string | null;
            capacity_liters: number;
            cubic_capacity: number;
          }[]
        >`
          SELECT
            id,
            plates_number,
            trailer_plates,
            capacity_liters::float8 AS capacity_liters,
            cubic_capacity::float8 AS cubic_capacity
          FROM "Vehicle"
          WHERE "driverId" = ${sessionDriver.id}
            AND is_active = true
          ORDER BY id ASC
        `,
        sql<
          {
            id: number;
            liters: number;
            fuel_type: "DIESEL" | "GASOLINE";
            status: "PENDING" | "APPROVED" | "REJECTED";
            date: Date | string;
            station_name: string | null;
            vehicle_plates: string;
          }[]
        >`
          SELECT
            fl.id,
            fl.liters::float8 AS liters,
            fl.fuel_type,
            fl.status,
            fl.date,
            s.name AS station_name,
            v.plates_number AS vehicle_plates
          FROM "FuelLog" fl
          LEFT JOIN "Station" s ON s.id = fl."stationId"
          JOIN "Vehicle" v ON v.id = fl."vehicleId"
          WHERE fl."driverId" = ${sessionDriver.id}
          ORDER BY fl.date DESC
          LIMIT 8
        `,
        sql<{ total_liters: number }[]>`
          SELECT COALESCE(SUM(liters), 0)::float8 AS total_liters
          FROM "FuelLog"
          WHERE "driverId" = ${sessionDriver.id}
            AND status = ${FuelLogStatus.APPROVED}
        `,
        sql<{ vehicle_id: number; total_liters: number; total_logs: number }[]>`
          SELECT
            "vehicleId" AS vehicle_id,
            COALESCE(SUM(liters), 0)::float8 AS total_liters,
            COUNT(*)::int AS total_logs
          FROM "FuelLog"
          WHERE "driverId" = ${sessionDriver.id}
            AND status = ${FuelLogStatus.APPROVED}
          GROUP BY "vehicleId"
        `,
        sql<
          {
            id: number;
            name: string;
            location: string | null;
            is_active: boolean;
            total_logs: number;
          }[]
        >`
          SELECT
            s.id,
            s.name,
            s.location,
            s.is_active,
            COUNT(fl.id)::int AS total_logs
          FROM "Station" s
          LEFT JOIN "FuelLog" fl ON fl."stationId" = s.id
          GROUP BY s.id
          ORDER BY s.is_active DESC, s.name ASC
        `,
        sql<
          {
            station_id: number;
            day_of_week: number;
            opens_at: string;
            closes_at: string;
            is_enabled: boolean;
          }[]
        >`
          SELECT
            "stationId" AS station_id,
            day_of_week,
            opens_at,
            closes_at,
            is_enabled
          FROM "StationSchedule"
          WHERE is_enabled = true
          ORDER BY day_of_week ASC
        `,
      ]);

    const totalFilledLiters = Number(litersAggregateRaw[0]?.total_liters ?? 0);

    const vehicleAggregateMap = new Map(
      vehicleAggregatesRaw.map((vehicle) => [
        vehicle.vehicle_id,
        {
          totalLiters: Number(vehicle.total_liters),
          totalLogs: Number(vehicle.total_logs),
        },
      ]),
    );

    const stationScheduleMap = new Map<
      number,
      Array<{
        day_of_week: number;
        opens_at: string;
        closes_at: string;
        is_enabled: boolean;
      }>
    >();

    for (const schedule of schedulesRaw) {
      const current = stationScheduleMap.get(schedule.station_id) ?? [];
      current.push({
        day_of_week: schedule.day_of_week,
        opens_at: schedule.opens_at,
        closes_at: schedule.closes_at,
        is_enabled: schedule.is_enabled,
      });
      stationScheduleMap.set(schedule.station_id, current);
    }

    const todayDayOfWeek = new Date().getDay();

    const stationSummaries: DriverStationSummary[] = stationsRaw.map((station) => {
      const schedules = stationScheduleMap.get(station.id) ?? [];
      const todaySchedules = schedules.filter((schedule) => schedule.day_of_week === todayDayOfWeek);
      const todayScheduleLabel =
        todaySchedules.length > 0
          ? todaySchedules
              .map((schedule) => formatScheduleWindow(schedule.opens_at, schedule.closes_at))
              .join(" ، ")
          : null;

      return {
        id: station.id,
        name: station.name,
        location: station.location,
        isActive: station.is_active,
        runtimeStatus: getStationRuntimeStatus({
          is_active: station.is_active,
          schedules,
        }),
        scheduleSummary: schedules.map((schedule) =>
          `${weekdayLabels[schedule.day_of_week]} ${formatScheduleWindow(
            schedule.opens_at,
            schedule.closes_at,
          )}`,
        ),
        todaySchedule: todayScheduleLabel,
      };
    });

    const vehicleSummaries: DriverVehicleSummary[] = vehiclesRaw.map((vehicle) => {
      const aggregate = vehicleAggregateMap.get(vehicle.id);
      return {
        id: vehicle.id,
        platesNumber: vehicle.plates_number,
        trailerPlates: vehicle.trailer_plates,
        capacityLiters: Number(vehicle.capacity_liters),
        cubicCapacity: Number(vehicle.cubic_capacity),
        totalLiters: aggregate?.totalLiters ?? 0,
        totalLogs: aggregate?.totalLogs ?? 0,
      };
    });

    const fuelVehicles: FuelFillVehicleOption[] = vehicleSummaries.map((vehicle) => ({
      id: vehicle.id,
      platesNumber: vehicle.platesNumber,
      trailerPlates: vehicle.trailerPlates,
      capacityLiters: vehicle.capacityLiters,
      cubicCapacity: vehicle.cubicCapacity,
    }));

    const fuelStations: FuelFillStationOption[] = stationSummaries.map((station) => ({
      id: station.id,
      name: station.name,
      location: station.location,
      runtimeStatus: station.runtimeStatus,
    }));

    const recentFuelHistory: DriverFuelHistoryItem[] = recentFuelLogsRaw.map((log) => ({
      id: log.id,
      liters: Number(log.liters),
      fuelType: fuelTypeLabels[log.fuel_type],
      status: fuelLogStatusLabels[log.status],
      date: formatArabicDateTime(log.date),
      stationName: log.station_name,
      vehiclePlates: log.vehicle_plates,
    }));

    async function handleAddVehicle(payload: AddVehiclePayload): Promise<ActionResult> {
      "use server";

      const platesNumber = payload.platesNumber.trim();
      const trailerPlates = payload.trailerPlates.trim();
      const capacityLiters = Number(payload.capacityLiters);
      const cubicCapacity = Number(payload.cubicCapacity);

      if (!platesNumber || !Number.isFinite(capacityLiters) || capacityLiters <= 0) {
        return {
          success: false,
          error: "يجب إدخال رقم اللوحة وسعة تانك صحيحة.",
        };
      }

      if (!Number.isFinite(cubicCapacity) || cubicCapacity <= 0) {
        return {
          success: false,
          error: "يجب إدخال تكعيب صحيح للشاحنة.",
        };
      }

      try {
        const sql = await getSql();
        await sql`
          INSERT INTO "Vehicle" (
            "driverId", plates_number, trailer_plates, capacity_liters, cubic_capacity, is_active
          )
          VALUES (
            ${sessionDriver.id},
            ${platesNumber},
            ${trailerPlates || null},
            ${capacityLiters},
            ${cubicCapacity},
            true
          )
        `;

        revalidatePath("/driver");
        revalidatePath("/admin");

        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "تعذر إضافة الشاحنة.",
        };
      }
    }

    async function handleFuelFill(payload: FuelFillPayload): Promise<ActionResult> {
      "use server";

      const result = await logFuelEntry({
        driverId: sessionDriver.id,
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

    async function handleSignOut(): Promise<void> {
      "use server";

      const store = await cookies();
      store.delete(DRIVER_SESSION_COOKIE);
      revalidatePath("/driver");
    }

    const dashboardDriver = {
      fullName: sessionDriver.full_name,
      code: sessionDriver.code,
      totalFilledLiters,
      totalFuelLogs: sessionDriver.fuel_log_count,
      vehicleCount: sessionDriver.vehicle_count,
      activeStationCount: stationSummaries.filter((station) => station.runtimeStatus === "OPEN").length,
      accountStatus: sessionDriver.status,
    };

    return (
      <main className={pageBackground}>
        <DriverDashboard
          driver={dashboardDriver}
          navigationItems={[
            { id: "fuel-fill", label: "تأكيد التعبئة" },
            { id: "stations", label: "المحطات" },
            { id: "fleet", label: "مركباتي" },
          ]}
          activeNavId="fuel-fill"
          onSignOut={handleSignOut}
        >
          <div className="space-y-4 pb-6">
            <FuelFillForm vehicles={fuelVehicles} stations={fuelStations} onSubmit={handleFuelFill} />
            <DriverStationsBoard stations={stationSummaries} />
            <DriverVehicleStats vehicles={vehicleSummaries} recentFuelLogs={recentFuelHistory} />
            <AddVehicleForm existingVehicles={vehicleSummaries} onSubmit={handleAddVehicle} />
          </div>
        </DriverDashboard>
      </main>
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);

    return (
      <div style={{ padding: "20px", color: "red", fontSize: "20px" }}>
        {details}
      </div>
    );
  }
}
