import type { ReactNode } from "react";

import type {
  Driver,
  DriverStatus,
  FuelLog,
  FuelLogStatus,
  FuelType,
  Station,
  StationSchedule,
  Vehicle,
} from "../../generated/prisma/client";

export type AdminRealtimeFuelLog = FuelLog & {
  driver?: Pick<Driver, "id" | "code" | "full_name" | "phone" | "status"> | null;
  vehicle?: Pick<Vehicle, "id" | "plates_number" | "trailer_plates" | "truck_type"> | null;
  station?: Pick<Station, "id" | "name" | "location" | "is_active"> | null;
};

export type AdminFuelLogRow = FuelLog & {
  fuel_type: FuelType;
  status: FuelLogStatus;
  driver: Pick<Driver, "id" | "code" | "full_name" | "phone" | "status">;
  vehicle: Pick<Vehicle, "id" | "plates_number" | "trailer_plates" | "truck_type">;
  station?: Pick<Station, "id" | "name" | "location" | "is_active"> | null;
};

export type AdminDriverRow = {
  id: number;
  code: string;
  fullName: string;
  phone: string;
  status: DriverStatus;
  vehicleCount: number;
  totalFuelLogs: number;
  totalFilledLiters: number;
};

export type AdminStationScheduleRow = Pick<
  StationSchedule,
  "id" | "day_of_week" | "opens_at" | "closes_at" | "is_enabled"
>;

export type AdminStationRow = Pick<Station, "id" | "name" | "location" | "is_active"> & {
  runtimeStatus: "OPEN" | "CLOSED" | "INACTIVE";
  schedules: AdminStationScheduleRow[];
  totalLogs: number;
};

export type AdminStationFormPayload = {
  id?: number;
  name: string;
  location: string;
  isActive: boolean;
  schedules: Array<{
    dayOfWeek: number;
    opensAt: string;
    closesAt: string;
    isEnabled: boolean;
  }>;
};

export type AdminStatItem = {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
};
