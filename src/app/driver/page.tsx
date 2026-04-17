import { revalidatePath } from "next/cache";

import { deleteDriverAccount } from "../../actions/driver.actions";
import { logFuelEntry } from "../../actions/fuel.actions";
import SystemStatusCard from "../../components/SystemStatusCard";
import AddVehicleForm from "../../features/driver/AddVehicleForm";
import DriverDangerZone from "../../features/driver/DriverDangerZone";
import DriverDashboard from "../../features/driver/DriverDashboard";
import DriverStationsBoard from "../../features/driver/DriverStationsBoard";
import DriverVehicleStats from "../../features/driver/DriverVehicleStats";
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
import { DriverStatus, FuelLogStatus, FuelType } from "../../lib/db-types";
import { fuelLogStatusLabels, fuelTypeLabels, formatArabicDateTime } from "../../lib/labels";
import { getSql, isDatabaseConfigured } from "../../lib/prisma";
import {
  formatScheduleWindow,
  getStationRuntimeStatus,
  weekdayLabels,
} from "../../lib/station-status";

export const dynamic = "force-dynamic";
// force cloudflare update

const MOCK_DRIVER_CODE = "DRV-001";
const pageBackground =
  "min-h-screen bg-[radial-gradient(circle_at_top,rgba(214,211,209,0.16),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(115,115,115,0.14),transparent_32%),linear-gradient(140deg,#050816_0%,#111827_42%,#1f2937_100%)]";

const parseNumber = (value: string | number): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

type DriverRaw = {
  id: number;
  code: string;
  full_name: string;
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
          description="البوابة تحتاج اتصالًا بقاعدة البيانات، لكن DATABASE_URL غير موجود."
          details="أضف DATABASE_URL في Cloudflare Workers ثم أعد النشر."
        />
      </main>
    );
  }

  try {
    const sql = await getSql();

    const [requestedDriver] = await sql<DriverRaw[]>`
      SELECT
        d.id,
        d.code,
        d.full_name,
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
      WHERE d.code = ${MOCK_DRIVER_CODE}
        AND d.deleted_at IS NULL
        AND d.status <> ${DriverStatus.DELETED}
      LIMIT 1
    `;

    const fallbackDriverRows = requestedDriver
      ? [requestedDriver]
      : await sql<DriverRaw[]>`
          SELECT
            d.id,
            d.code,
            d.full_name,
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
          WHERE d.deleted_at IS NULL
            AND d.status <> ${DriverStatus.DELETED}
          ORDER BY d.id ASC
          LIMIT 1
        `;

    const driver = fallbackDriverRows[0];

    const [vehiclesRaw, recentFuelLogsRaw, litersAggregateRaw, vehicleAggregatesRaw, stationsRaw, schedulesRaw] =
      driver
        ? await Promise.all([
            sql<
              {
                id: number;
                truck_type: string;
                plates_number: string;
                trailer_plates: string | null;
                image_url: string | null;
              }[]
            >`
              SELECT id, truck_type, plates_number, trailer_plates, image_url
              FROM "Vehicle"
              WHERE "driverId" = ${driver.id}
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
              WHERE fl."driverId" = ${driver.id}
              ORDER BY fl.date DESC
              LIMIT 8
            `,
            sql<{ total_liters: number }[]>`
              SELECT COALESCE(SUM(liters), 0)::float8 AS total_liters
              FROM "FuelLog"
              WHERE "driverId" = ${driver.id}
                AND status = ${FuelLogStatus.APPROVED}
            `,
            sql<{ vehicle_id: number; total_liters: number; total_logs: number }[]>`
              SELECT
                "vehicleId" AS vehicle_id,
                COALESCE(SUM(liters), 0)::float8 AS total_liters,
                COUNT(*)::int AS total_logs
              FROM "FuelLog"
              WHERE "driverId" = ${driver.id}
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
          ])
        : [[], [], [], [], [], []];

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

    const stationSummaries: DriverStationSummary[] = stationsRaw.map((station) => {
      const schedules = stationScheduleMap.get(station.id) ?? [];
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
      };
    });

    const vehicleSummaries: DriverVehicleSummary[] = vehiclesRaw.map((vehicle) => {
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
    });

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

      if (!driver) {
        return {
          success: false,
          error: "لا يوجد سائق متاح في هذه الجلسة التجريبية.",
        };
      }

      const sql = await getSql();
      const truckType = payload.truckType.trim();
      const platesNumber = payload.platesNumber.trim();
      const trailerPlates = payload.trailerPlates.trim();
      const truckVolume = parseNumber(payload.truckVolume);

      if (!truckType || !platesNumber || truckVolume <= 0) {
        return {
          success: false,
          error: "يجب إدخال نوع الشاحنة ورقم اللوحة وسعة صحيحة.",
        };
      }

      try {
        await sql`
          INSERT INTO "Vehicle" (
            "driverId", truck_type, plates_number, trailer_plates, truck_volume, image_url, is_active
          )
          VALUES (
            ${driver.id},
            ${truckType},
            ${platesNumber},
            ${trailerPlates || null},
            ${truckVolume},
            ${null},
            true
          )
        `;

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
      totalFuelLogs: driver?.fuel_log_count ?? 0,
      vehicleCount: driver?.vehicle_count ?? 0,
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
    const details = error instanceof Error ? error.message : String(error);

    return (
      <div style={{ padding: "20px", color: "red", fontSize: "20px" }}>
        {details}
      </div>
    );
  }
}
