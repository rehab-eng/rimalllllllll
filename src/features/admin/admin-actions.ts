"use server";

import { revalidatePath } from "next/cache";

import { deleteDriverAccount, updateDriverStatus, updateVehicle } from "../../actions/driver.actions";
import {
  deleteStation,
  saveStation,
  toggleStationActivity,
} from "../../actions/station.actions";
import { DriverStatus } from "../../lib/db-types";
import type { ActionResult, UpdateVehiclePayload } from "../driver/types";
import type { AdminStationFormPayload } from "./types";

export async function suspendDriverAction(driverId: number): Promise<ActionResult> {
  const result = await updateDriverStatus(driverId, DriverStatus.SUSPENDED);

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin/drivers");
    revalidatePath("/driver");
  }

  return {
    success: result.success,
    error: result.error,
  };
}

export async function activateDriverAction(driverId: number): Promise<ActionResult> {
  const result = await updateDriverStatus(driverId, DriverStatus.ACTIVE);

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin/drivers");
    revalidatePath("/driver");
  }

  return {
    success: result.success,
    error: result.error,
  };
}

export async function deleteDriverAction(driverId: number): Promise<ActionResult> {
  const result = await deleteDriverAccount(driverId);

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin/drivers");
    revalidatePath("/driver");
  }

  return {
    success: result.success,
    error: result.error,
  };
}

export async function updateVehicleAction(payload: UpdateVehiclePayload): Promise<ActionResult> {
  const result = await updateVehicle({
    vehicleId: payload.vehicleId,
    plates_number: payload.platesNumber,
    trailer_plates: payload.trailerPlates,
    capacity_liters: payload.capacityLiters,
    cubic_capacity: payload.cubicCapacity,
  });

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin/drivers");
    revalidatePath("/driver");
  }

  return {
    success: result.success,
    error: result.error,
  };
}

export async function saveStationAction(payload: AdminStationFormPayload): Promise<ActionResult> {
  const result = await saveStation({
    id: payload.id,
    name: payload.name,
    location: payload.location,
    isActive: payload.isActive,
    schedules: payload.schedules,
  });

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin/stations");
    revalidatePath("/driver");
  }

  return {
    success: result.success,
    error: result.error,
  };
}

export async function toggleStationAction(
  stationId: number,
  isActive: boolean,
): Promise<ActionResult> {
  const result = await toggleStationActivity(stationId, isActive);

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin/stations");
    revalidatePath("/driver");
  }

  return {
    success: result.success,
    error: result.error,
  };
}

export async function deleteStationAction(stationId: number): Promise<ActionResult> {
  const result = await deleteStation(stationId);

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin/stations");
    revalidatePath("/driver");
  }

  return {
    success: result.success,
    error: result.error,
  };
}
