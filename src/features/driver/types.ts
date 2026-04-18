import type { ReactNode } from "react";

import type { DriverStatus, FuelType } from "../../lib/db-types";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type DriverVehicleSummary = {
  id: number;
  platesNumber: string;
  trailerPlates?: string | null;
  capacityLiters: number;
  cubicCapacity: number;
  totalLiters: number;
  totalLogs: number;
};

export type DriverStationSummary = {
  id: number;
  name: string;
  location?: string | null;
  runtimeStatus: "OPEN" | "CLOSED" | "INACTIVE";
  isActive: boolean;
  scheduleSummary: string[];
  todaySchedule: string | null;
};

export type DriverFuelHistoryItem = {
  id: number;
  liters: number;
  fuelType: string;
  status: string;
  date: string;
  stationName?: string | null;
  vehiclePlates: string;
};

export type DriverDashboardData = {
  fullName: string;
  code: string;
  totalFilledLiters: number;
  totalFuelLogs: number;
  vehicleCount: number;
  activeStationCount: number;
  accountStatus: DriverStatus;
};

export type DriverNavigationItem = {
  id: string;
  label: string;
  icon?: ReactNode;
};

export type AddVehiclePayload = {
  platesNumber: string;
  trailerPlates: string;
  capacityLiters: number;
  cubicCapacity: number;
};

export type FuelFillVehicleOption = {
  id: number;
  platesNumber: string;
  trailerPlates?: string | null;
  capacityLiters: number;
  cubicCapacity: number;
};

export type FuelFillStationOption = {
  id: number;
  name: string;
  location?: string | null;
  runtimeStatus: "OPEN" | "CLOSED" | "INACTIVE";
};

export type FuelFillPayload = {
  vehicleId: number;
  stationId: number;
  liters: number;
  fuelType: FuelType;
};

export type DriverAuthVehicleInput = {
  platesNumber: string;
  trailerPlates: string;
  capacityLiters: number;
  cubicCapacity: number;
};

export type DriverLoginPayload = {
  phone: string;
  licenseNumber: string;
};

export type DriverRegisterPayload = {
  fullName: string;
  phone: string;
  licenseNumber: string;
  vehicles: DriverAuthVehicleInput[];
};
