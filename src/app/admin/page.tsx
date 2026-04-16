import AdminDashboard from "../../features/admin/AdminDashboard";
import AdminDataTable from "../../features/admin/AdminDataTable";
import type { AdminFuelLogRow } from "../../features/admin/types";
import prisma from "../../lib/prisma";

export const dynamic = "force-dynamic";

const serializeForClient = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export default async function AdminPage() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);

  const [fuelLogs, totalLogsToday, totalDrivers, totalVehicles] = await Promise.all([
    prisma.fuelLog.findMany({
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
            plates_number: true,
            trailer_plates: true,
            truck_type: true,
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
    prisma.driver.count(),
    prisma.vehicle.count(),
  ]);

  const tableRows = serializeForClient<AdminFuelLogRow[]>(fuelLogs);

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,_rgba(3,7,18,1)_0%,_rgba(17,24,39,1)_48%,_rgba(12,74,110,0.74)_100%)]">
      <AdminDashboard
        adminName="Operations Admin"
        initialTotalLogsToday={totalLogsToday}
        stats={[
          {
            id: "drivers",
            label: "Drivers",
            value: totalDrivers,
            hint: "Active registered drivers",
          },
          {
            id: "vehicles",
            label: "Vehicles",
            value: totalVehicles,
            hint: "Tracked fleet vehicles",
          },
          {
            id: "logs",
            label: "Total Logs",
            value: fuelLogs.length,
            hint: "All recorded fuel entries",
          },
        ]}
      >
        <AdminDataTable fuelLogs={tableRows} exportDriverName="All Drivers" />
      </AdminDashboard>
    </main>
  );
}
