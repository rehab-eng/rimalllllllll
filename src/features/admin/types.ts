import type { ReactNode } from "react";

import type { Driver, FuelLog, Vehicle } from "../../generated/prisma/client";

export type AdminRealtimeFuelLog = FuelLog & {
  driver?: Pick<Driver, "id" | "code" | "full_name" | "phone"> | null;
  vehicle?: Pick<Vehicle, "id" | "plates_number" | "trailer_plates" | "truck_type"> | null;
};

export type AdminFuelLogRow = FuelLog & {
  driver: Pick<Driver, "id" | "code" | "full_name" | "phone">;
  vehicle: Pick<Vehicle, "id" | "plates_number" | "trailer_plates" | "truck_type">;
};

export type AdminStatItem = {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
};
