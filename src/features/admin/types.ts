import type { ReactNode } from "react";

import type {
  DriverRow,
  DriverStatus,
  FuelLogRow,
  FuelLogStatus,
  FuelType,
  StationRow,
  StationScheduleRow,
  VehicleRow,
} from "../../lib/db-types";

export type AdminRealtimeFuelLog = FuelLogRow & {
  driver?: Pick<DriverRow, "id" | "code" | "full_name" | "phone" | "status"> | null;
  vehicle?: Pick<VehicleRow, "id" | "plates_number" | "trailer_plates" | "truck_type"> | null;
  station?: Pick<StationRow, "id" | "name" | "location" | "is_active"> | null;
};

export type AdminFuelLogRow = FuelLogRow & {
  fuel_type: FuelType;
  status: FuelLogStatus;
  driver: Pick<DriverRow, "id" | "code" | "full_name" | "phone" | "status">;
  vehicle: Pick<VehicleRow, "id" | "plates_number" | "trailer_plates" | "truck_type">;
  station?: Pick<StationRow, "id" | "name" | "location" | "is_active"> | null;
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
  StationScheduleRow,
  "id" | "day_of_week" | "opens_at" | "closes_at" | "is_enabled"
>;

export type AdminStationRow = Pick<StationRow, "id" | "name" | "location" | "is_active"> & {
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
