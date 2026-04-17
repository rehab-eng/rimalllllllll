import type { ReactNode } from "react";

import type { DriverStatus, FuelType } from "../../generated/prisma/client";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type DriverVehicleSummary = {
  id: number;
  truckType: string;
  platesNumber: string;
  trailerPlates?: string | null;
  imageUrl?: string | null;
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
  truckType: string;
  platesNumber: string;
  trailerPlates: string;
  truckVolume: number;
  imageUrl: string;
};

export type FuelFillVehicleOption = {
  id: number;
  truckType: string;
  platesNumber: string;
  trailerPlates?: string | null;
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
