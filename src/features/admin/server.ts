import type { AdminDriverRow, AdminFuelLogRow, AdminStationRow } from "./types";

import { getSql } from "../../lib/prisma";
import {
  FORCE_ACTIVE_DAY_OF_WEEK,
  getStationRuntimeStatus,
  isVisibleStationScheduleDay,
} from "../../lib/station-status";

const serializeForClient = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

type FuelLogRowRaw = {
  id: number;
  driverId: number;
  vehicleId: number;
  stationId: number | null;
  liters: number;
  fuel_type: "DIESEL" | "GASOLINE";
  date: Date | string;
  confirmed_at: Date | string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  driver_id: number;
  driver_code: string;
  driver_full_name: string;
  driver_phone: string;
  driver_status: "ACTIVE" | "SUSPENDED" | "DELETED";
  vehicle_id: number;
  vehicle_plates_number: string;
  vehicle_trailer_plates: string | null;
  vehicle_capacity_liters: number;
  station_id: number | null;
  station_name: string | null;
  station_location: string | null;
  station_is_active: boolean | null;
};

type DriverRowRaw = {
  id: number;
  code: string;
  full_name: string;
  phone: string;
  license_number: string | null;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  vehicle_count: number;
  fuel_log_count: number;
};

type DriverVehicleRowRaw = {
  driver_id: number;
  id: number;
  plates_number: string;
  trailer_plates: string | null;
  capacity_liters: number;
  cubic_capacity: number;
};

type StationRowRaw = {
  id: number;
  name: string;
  location: string | null;
  is_active: boolean;
  total_logs: number;
};

type ScheduleRowRaw = {
  id: number;
  station_id: number;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_enabled: boolean;
};

export type AdminOverviewData = {
  totalLogsToday: number;
  totalFuelLogs: number;
  totalDrivers: number;
  totalStations: number;
  openStations: number;
  fuelLogs: AdminFuelLogRow[];
};

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const sql = await getSql();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);

  const [fuelLogsRaw, totalLogsTodayRows, totalsRows, stationsRaw, schedulesRaw] = await Promise.all([
    sql<FuelLogRowRaw[]>`
      SELECT
        fl.id,
        fl."driverId",
        fl."vehicleId",
        fl."stationId",
        fl.liters::float8 AS liters,
        fl.fuel_type,
        fl.date,
        fl.confirmed_at,
        fl.status,
        d.id AS driver_id,
        d.code AS driver_code,
        d.full_name AS driver_full_name,
        d.phone AS driver_phone,
        d.status AS driver_status,
        v.id AS vehicle_id,
        v.plates_number AS vehicle_plates_number,
        v.trailer_plates AS vehicle_trailer_plates,
        v.capacity_liters::float8 AS vehicle_capacity_liters,
        s.id AS station_id,
        s.name AS station_name,
        s.location AS station_location,
        s.is_active AS station_is_active
      FROM "FuelLog" fl
      JOIN "Driver" d ON d.id = fl."driverId"
      JOIN "Vehicle" v ON v.id = fl."vehicleId"
      LEFT JOIN "Station" s ON s.id = fl."stationId"
      ORDER BY fl.date DESC
    `,
    sql<{ total: number }[]>`
      SELECT COUNT(*)::int AS total
      FROM "FuelLog"
      WHERE date >= ${startOfDay.toISOString()}
        AND date < ${startOfNextDay.toISOString()}
    `,
    sql<{ total_drivers: number; total_stations: number; total_logs: number }[]>`
      SELECT
        (SELECT COUNT(*)::int FROM "Driver" WHERE deleted_at IS NULL) AS total_drivers,
        (SELECT COUNT(*)::int FROM "Station") AS total_stations,
        (SELECT COUNT(*)::int FROM "FuelLog") AS total_logs
    `,
    sql<StationRowRaw[]>`
      SELECT
        id,
        name,
        location,
        is_active,
        0::int AS total_logs
      FROM "Station"
    `,
    sql<ScheduleRowRaw[]>`
      SELECT
        id,
        "stationId" AS station_id,
        day_of_week,
        opens_at,
        closes_at,
        is_enabled
      FROM "StationSchedule"
    `,
  ]);

  const fuelLogs = serializeForClient<AdminFuelLogRow[]>(
    fuelLogsRaw.map((row) => ({
      id: row.id,
      driverId: row.driverId,
      vehicleId: row.vehicleId,
      stationId: row.stationId,
      liters: Number(row.liters),
      fuel_type: row.fuel_type,
      date: row.date,
      confirmed_at: row.confirmed_at,
      status: row.status,
      driver: {
        id: row.driver_id,
        code: row.driver_code,
        full_name: row.driver_full_name,
        phone: row.driver_phone,
        status: row.driver_status,
      },
      vehicle: {
        id: row.vehicle_id,
        plates_number: row.vehicle_plates_number,
        trailer_plates: row.vehicle_trailer_plates,
        capacity_liters: Number(row.vehicle_capacity_liters),
      },
      station:
        row.station_id === null
          ? null
          : {
              id: row.station_id,
              name: row.station_name ?? "",
              location: row.station_location,
              is_active: Boolean(row.station_is_active),
            },
    })),
  );

  const totals = totalsRows[0];
  const scheduleMap = new Map<number, ScheduleRowRaw[]>();

  for (const schedule of schedulesRaw) {
    const current = scheduleMap.get(schedule.station_id) ?? [];
    current.push(schedule);
    scheduleMap.set(schedule.station_id, current);
  }

  const openStations = stationsRaw.filter((station) =>
    getStationRuntimeStatus({
      is_active: station.is_active,
      schedules: scheduleMap.get(station.id) ?? [],
    }) === "OPEN",
  ).length;

  return {
    totalLogsToday: Number(totalLogsTodayRows[0]?.total ?? 0),
    totalFuelLogs: Number(totals?.total_logs ?? 0),
    totalDrivers: Number(totals?.total_drivers ?? 0),
    totalStations: Number(totals?.total_stations ?? 0),
    openStations,
    fuelLogs,
  };
}

export async function getAdminDriversData(): Promise<{
  totalDrivers: number;
  activeDrivers: number;
  suspendedDrivers: number;
  drivers: AdminDriverRow[];
}> {
  const sql = await getSql();
  const [driversRaw, driverVehiclesRaw, vehicleAggregates, summaryRows] = await Promise.all([
    sql<DriverRowRaw[]>`
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
      WHERE d.deleted_at IS NULL
      ORDER BY d.created_at DESC
    `,
    sql<DriverVehicleRowRaw[]>`
      SELECT
        v."driverId" AS driver_id,
        v.id,
        v.plates_number,
        v.trailer_plates,
        v.capacity_liters::float8 AS capacity_liters,
        v.cubic_capacity::float8 AS cubic_capacity
      FROM "Vehicle" v
      WHERE v.is_active = true
      ORDER BY v."driverId" ASC, v.id ASC
    `,
    sql<{ driver_id: number; total_liters: number }[]>`
      SELECT
        "driverId" AS driver_id,
        COALESCE(SUM(liters), 0)::float8 AS total_liters
      FROM "FuelLog"
      GROUP BY "driverId"
    `,
    sql<{ total_drivers: number; active_drivers: number; suspended_drivers: number }[]>`
      SELECT
        COUNT(*)::int AS total_drivers,
        COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_drivers,
        COUNT(*) FILTER (WHERE status = 'SUSPENDED')::int AS suspended_drivers
      FROM "Driver"
      WHERE deleted_at IS NULL
    `,
  ]);

  const totalByDriver = new Map(
    vehicleAggregates.map((item) => [item.driver_id, Number(item.total_liters)]),
  );

  const driverVehiclesMap = new Map<number, DriverVehicleRowRaw[]>();
  for (const vehicle of driverVehiclesRaw) {
    const current = driverVehiclesMap.get(vehicle.driver_id) ?? [];
    current.push(vehicle);
    driverVehiclesMap.set(vehicle.driver_id, current);
  }

  const drivers = serializeForClient<AdminDriverRow[]>(
    driversRaw.map((driver) => ({
      id: driver.id,
      code: driver.code,
      fullName: driver.full_name,
      phone: driver.phone,
      licenseNumber: driver.license_number,
      status: driver.status,
      vehicleCount: Number(driver.vehicle_count),
      totalFuelLogs: Number(driver.fuel_log_count),
      totalFilledLiters: totalByDriver.get(driver.id) ?? 0,
      vehicles: (driverVehiclesMap.get(driver.id) ?? []).map((vehicle) => ({
        id: vehicle.id,
        plates_number: vehicle.plates_number,
        trailer_plates: vehicle.trailer_plates,
        capacity_liters: Number(vehicle.capacity_liters),
        cubic_capacity: Number(vehicle.cubic_capacity),
      })),
    })),
  );

  const summary = summaryRows[0];

  return {
    totalDrivers: Number(summary?.total_drivers ?? 0),
    activeDrivers: Number(summary?.active_drivers ?? 0),
    suspendedDrivers: Number(summary?.suspended_drivers ?? 0),
    drivers,
  };
}

export async function getAdminStationsData(): Promise<{
  totalStations: number;
  openStations: number;
  stations: AdminStationRow[];
}> {
  const sql = await getSql();

  const [stationsRaw, schedulesRaw, summaryRows] = await Promise.all([
    sql<StationRowRaw[]>`
      SELECT
        s.id,
        s.name,
        s.location,
        s.is_active,
        COUNT(fl.id)::int AS total_logs
      FROM "Station" s
      LEFT JOIN "FuelLog" fl ON fl."stationId" = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
    `,
    sql<ScheduleRowRaw[]>`
      SELECT
        id,
        "stationId" AS station_id,
        day_of_week,
        opens_at,
        closes_at,
        is_enabled
      FROM "StationSchedule"
      ORDER BY day_of_week ASC
    `,
    sql<{ total_stations: number; open_stations: number }[]>`
      SELECT
        COUNT(*)::int AS total_stations,
        COUNT(*) FILTER (WHERE is_active = true)::int AS open_stations
      FROM "Station"
    `,
  ]);

  const scheduleMap = new Map<
    number,
    Array<{
      id: number;
      day_of_week: number;
      opens_at: string;
      closes_at: string;
      is_enabled: boolean;
    }>
  >();

  for (const schedule of schedulesRaw) {
    const current = scheduleMap.get(schedule.station_id) ?? [];
    current.push({
      id: schedule.id,
      day_of_week: schedule.day_of_week,
      opens_at: schedule.opens_at,
      closes_at: schedule.closes_at,
      is_enabled: schedule.is_enabled,
    });
    scheduleMap.set(schedule.station_id, current);
  }

  const stations = serializeForClient<AdminStationRow[]>(
    stationsRaw.map((station) => {
      const schedules = scheduleMap.get(station.id) ?? [];
      const isForceActive = schedules.some(
        (schedule) =>
          schedule.is_enabled && schedule.day_of_week === FORCE_ACTIVE_DAY_OF_WEEK,
      );

      return {
        id: station.id,
        name: station.name,
        location: station.location,
        is_active: station.is_active,
        isForceActive,
        runtimeStatus: getStationRuntimeStatus({
          is_active: station.is_active,
          schedules,
        }),
        schedules: schedules.filter((schedule) =>
          isVisibleStationScheduleDay(schedule.day_of_week),
        ),
        totalLogs: Number(station.total_logs),
      };
    }),
  );

  return {
    totalStations: stations.length || Number(summaryRows[0]?.total_stations ?? 0),
    openStations: stations.filter((station) => station.runtimeStatus === "OPEN").length,
    stations,
  };
}
