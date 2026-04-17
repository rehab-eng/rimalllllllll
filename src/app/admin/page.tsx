import { revalidatePath } from "next/cache";

import SystemStatusCard from "../../components/SystemStatusCard";
import { deleteDriverAccount, updateDriverStatus } from "../../actions/driver.actions";
import { saveStation, toggleStationActivity } from "../../actions/station.actions";
import AdminDashboard from "../../features/admin/AdminDashboard";
import AdminDataTable from "../../features/admin/AdminDataTable";
import AdminDriversPanel from "../../features/admin/AdminDriversPanel";
import AdminStationManager from "../../features/admin/AdminStationManager";
import type {
  AdminDriverRow,
  AdminFuelLogRow,
  AdminStationFormPayload,
  AdminStationRow,
} from "../../features/admin/types";
import type { ActionResult } from "../../features/driver/types";
import { DriverStatus } from "../../generated/prisma/client";
import { formatArabicNumber } from "../../lib/labels";
import { getPrisma, isDatabaseConfigured } from "../../lib/prisma";
import { getStationRuntimeStatus } from "../../lib/station-status";

export const dynamic = "force-dynamic";

const serializeForClient = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const pageBackground =
  "min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,245,244,0.14),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(82,82,91,0.16),transparent_30%),linear-gradient(135deg,#030712_0%,#111827_45%,#1f2937_100%)]";

export default async function AdminPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className={pageBackground}>
        <SystemStatusCard
          title="المنظومة غير مهيأة بعد"
          description="لوحة الإدارة تحتاج اتصالًا بقاعدة البيانات، لكن متغير DATABASE_URL غير موجود داخل إعدادات الاستضافة."
          details="أضف DATABASE_URL في Cloudflare Workers، وضعه أيضًا في Build Variables and Secrets، ثم أعد النشر."
        />
      </main>
    );
  }

  try {
    const prisma = getPrisma();
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);

    const [fuelLogs, totalLogsToday, drivers, vehicleAggregates, stations] = await Promise.all([
      prisma.fuelLog.findMany({
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
              plates_number: true,
              trailer_plates: true,
              truck_type: true,
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
        orderBy: {
          date: "desc",
        },
      }),
      prisma.fuelLog.count({
        where: {
          date: {
            gte: startOfDay,
            lt: startOfNextDay,
          },
        },
      }),
      prisma.driver.findMany({
        where: {
          deleted_at: null,
        },
        include: {
          _count: {
            select: {
              vehicles: true,
              fuel_logs: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.fuelLog.groupBy({
        by: ["driverId"],
        _sum: {
          liters: true,
        },
      }),
      prisma.station.findMany({
        include: {
          schedules: {
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
    ]);

    const totalByDriver = new Map(
      vehicleAggregates.map((item) => [item.driverId, Number(item._sum.liters ?? 0)]),
    );

    const tableRows = serializeForClient<AdminFuelLogRow[]>(fuelLogs);

    const driverRows = serializeForClient<AdminDriverRow[]>(
      drivers.map((driver) => ({
        id: driver.id,
        code: driver.code,
        fullName: driver.full_name,
        phone: driver.phone,
        status: driver.status,
        vehicleCount: driver._count.vehicles,
        totalFuelLogs: driver._count.fuel_logs,
        totalFilledLiters: totalByDriver.get(driver.id) ?? 0,
      })),
    );

    const stationRows = serializeForClient<AdminStationRow[]>(
      stations.map((station) => ({
        id: station.id,
        name: station.name,
        location: station.location,
        is_active: station.is_active,
        runtimeStatus: getStationRuntimeStatus(station),
        schedules: station.schedules.map((schedule) => ({
          id: schedule.id,
          day_of_week: schedule.day_of_week,
          opens_at: schedule.opens_at,
          closes_at: schedule.closes_at,
          is_enabled: schedule.is_enabled,
        })),
        totalLogs: station._count.fuel_logs,
      })),
    );

    async function handleSuspendDriver(driverId: number): Promise<ActionResult> {
      "use server";

      const result = await updateDriverStatus(driverId, DriverStatus.SUSPENDED);

      if (result.success) {
        revalidatePath("/admin");
        revalidatePath("/driver");
      }

      return {
        success: result.success,
        error: result.error,
      };
    }

    async function handleActivateDriver(driverId: number): Promise<ActionResult> {
      "use server";

      const result = await updateDriverStatus(driverId, DriverStatus.ACTIVE);

      if (result.success) {
        revalidatePath("/admin");
        revalidatePath("/driver");
      }

      return {
        success: result.success,
        error: result.error,
      };
    }

    async function handleDeleteDriver(driverId: number): Promise<ActionResult> {
      "use server";

      const result = await deleteDriverAccount(driverId);

      if (result.success) {
        revalidatePath("/admin");
        revalidatePath("/driver");
      }

      return {
        success: result.success,
        error: result.error,
      };
    }

    async function handleSaveStation(payload: AdminStationFormPayload): Promise<ActionResult> {
      "use server";

      const result = await saveStation({
        id: payload.id,
        name: payload.name,
        location: payload.location,
        isActive: payload.isActive,
        schedules: payload.schedules,
      });

      if (result.success) {
        revalidatePath("/admin");
        revalidatePath("/driver");
      }

      return {
        success: result.success,
        error: result.error,
      };
    }

    async function handleToggleStation(
      stationId: number,
      isActive: boolean,
    ): Promise<ActionResult> {
      "use server";

      const result = await toggleStationActivity(stationId, isActive);

      if (result.success) {
        revalidatePath("/admin");
        revalidatePath("/driver");
      }

      return {
        success: result.success,
        error: result.error,
      };
    }

    return (
      <main className={pageBackground}>
        <AdminDashboard
          adminName="مدير المنظومة"
          initialTotalLogsToday={totalLogsToday}
          stats={[
            {
              id: "drivers",
              label: "السائقون",
              value: driverRows.length,
              hint: "عدد الحسابات المسجلة",
            },
            {
              id: "stations",
              label: "المحطات",
              value: stationRows.length,
              hint: `${formatArabicNumber(
                stationRows.filter((station) => station.runtimeStatus === "OPEN").length,
              )} محطة مفتوحة الآن`,
            },
            {
              id: "logs",
              label: "سجلات التعبئة",
              value: fuelLogs.length,
              hint: "جميع التأكيدات المسجلة",
            },
          ]}
        >
          <div className="space-y-6">
            <AdminStationManager
              stations={stationRows}
              onSaveStation={handleSaveStation}
              onToggleStation={handleToggleStation}
            />

            <AdminDriversPanel
              drivers={driverRows}
              onSuspendDriver={handleSuspendDriver}
              onActivateDriver={handleActivateDriver}
              onDeleteDriver={handleDeleteDriver}
            />

            <AdminDataTable
              fuelLogs={tableRows}
              exportDriverName="كل السائقين"
              onSuspendDriver={handleSuspendDriver}
              onActivateDriver={handleActivateDriver}
              onDeleteDriver={handleDeleteDriver}
            />
          </div>
        </AdminDashboard>
      </main>
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);

    return (
      <main style={{ minHeight: "100vh", background: "#111", color: "#fff", padding: "16px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>
          Admin Page Runtime Error
        </h1>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "14px" }}>
          {details}
        </pre>
      </main>
    );
  }
}
