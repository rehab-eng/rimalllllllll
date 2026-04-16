import { refresh } from "next/cache";

import DriverDashboard from "../../features/driver/DriverDashboard";
import AddVehicleForm from "../../features/driver/AddVehicleForm";
import FuelFillForm from "../../features/driver/FuelFillForm";
import type {
  ActionResult,
  AddVehiclePayload,
  DriverVehicleSummary,
  FuelFillPayload,
  FuelFillVehicleOption,
} from "../../features/driver/types";
import { logFuelEntry } from "../../actions/fuel.actions";
import prisma from "../../lib/prisma";

export const dynamic = "force-dynamic";

const MOCK_DRIVER_CODE = "DRV-001";

const parseNumber = (value: string | number): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

export default async function DriverPage() {
  const requestedDriver = await prisma.driver.findUnique({
    where: {
      code: MOCK_DRIVER_CODE,
    },
    include: {
      vehicles: {
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  const fallbackDriver =
    requestedDriver ??
    (await prisma.driver.findFirst({
      include: {
        vehicles: {
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    }));

  const driver = fallbackDriver;

  const litersAggregate = driver
    ? await prisma.fuelLog.aggregate({
        where: {
          driverId: driver.id,
        },
        _sum: {
          liters: true,
        },
      })
    : null;

  const totalFilledLiters = litersAggregate?._sum.liters ? Number(litersAggregate._sum.liters) : 0;

  const dashboardDriver = {
    fullName: driver?.full_name ?? "Demo Driver",
    code: driver?.code ?? MOCK_DRIVER_CODE,
    totalFilledLiters,
    vehicleCount: driver?.vehicles.length ?? 0,
  };

  const existingVehicles: DriverVehicleSummary[] =
    driver?.vehicles.map((vehicle) => ({
      id: vehicle.id,
      truckType: vehicle.truck_type,
      platesNumber: vehicle.plates_number,
      trailerPlates: vehicle.trailer_plates,
      imageUrl: vehicle.image_url,
    })) ?? [];

  const fuelVehicles: FuelFillVehicleOption[] =
    driver?.vehicles.map((vehicle) => ({
      id: vehicle.id,
      truckType: vehicle.truck_type,
      platesNumber: vehicle.plates_number,
      trailerPlates: vehicle.trailer_plates,
    })) ?? [];

  async function handleAddVehicle(payload: AddVehiclePayload): Promise<ActionResult> {
    "use server";

    if (!driver) {
      return {
        success: false,
        error: "No driver record is available for this mock session.",
      };
    }

    const truckType = payload.truckType.trim();
    const platesNumber = payload.platesNumber.trim();
    const trailerPlates = payload.trailerPlates.trim();
    const imageUrl = payload.imageUrl.trim();
    const truckVolume = parseNumber(payload.truckVolume);

    if (!truckType || !platesNumber || !imageUrl || truckVolume <= 0) {
      return {
        success: false,
        error: "Truck type, plates number, image, and volume are required.",
      };
    }

    try {
      await prisma.vehicle.create({
        data: {
          driverId: driver.id,
          truck_type: truckType,
          plates_number: platesNumber,
          trailer_plates: trailerPlates || null,
          truck_volume: truckVolume,
          image_url: imageUrl,
        },
      });

      refresh();

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to add vehicle.",
      };
    }
  }

  async function handleFuelFill(payload: FuelFillPayload): Promise<ActionResult> {
    "use server";

    if (!driver) {
      return {
        success: false,
        error: "No driver record is available for this mock session.",
      };
    }

    const result = await logFuelEntry({
      driverId: driver.id,
      vehicleId: parseNumber(payload.vehicleId),
      liters: payload.liters,
    });

    if (result.success) {
      refresh();
    }

    return {
      success: result.success,
      error: result.error,
    };
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(12,74,110,0.58),_rgba(2,6,23,1)_58%)]">
      <DriverDashboard
        driver={dashboardDriver}
        navigationItems={[
          { id: "fuel-fill", label: "Fuel Fill" },
          { id: "vehicles", label: "My Vehicles" },
          { id: "history", label: "Daily Summary" },
        ]}
        activeNavId="fuel-fill"
      >
        <div className="space-y-4 pb-6">
          <FuelFillForm vehicles={fuelVehicles} onSubmit={handleFuelFill} />
          <AddVehicleForm existingVehicles={existingVehicles} onSubmit={handleAddVehicle} />
        </div>
      </DriverDashboard>
    </main>
  );
}
