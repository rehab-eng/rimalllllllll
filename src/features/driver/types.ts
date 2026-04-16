import type { ReactNode } from "react";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type DriverVehicleSummary = {
  id: number | string;
  truckType: string;
  platesNumber: string;
  trailerPlates?: string | null;
  imageUrl?: string | null;
};

export type DriverDashboardData = {
  fullName: string;
  code: string;
  totalFilledLiters: number;
  vehicleCount?: number;
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
  id: number | string;
  truckType: string;
  platesNumber: string;
  trailerPlates?: string | null;
};

export type FuelFillPayload = {
  vehicleId: number | string;
  liters: number;
};
