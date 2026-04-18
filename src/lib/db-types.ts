export const DriverStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  DELETED: "DELETED",
} as const;

export type DriverStatus = (typeof DriverStatus)[keyof typeof DriverStatus];

export const FuelLogStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type FuelLogStatus = (typeof FuelLogStatus)[keyof typeof FuelLogStatus];

export const FuelType = {
  DIESEL: "DIESEL",
  GASOLINE: "GASOLINE",
} as const;

export type FuelType = (typeof FuelType)[keyof typeof FuelType];

export type DriverRow = {
  id: number;
  code: string;
  full_name: string;
  phone: string;
  license_number: string | null;
  device_token: string | null;
  status: DriverStatus;
  deleted_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type VehicleRow = {
  id: number;
  driverId: number;
  plates_number: string;
  trailer_plates: string | null;
  capacity_liters: number | string;
  cubic_capacity: number | string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

export type StationRow = {
  id: number;
  name: string;
  location: string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

export type StationScheduleRow = {
  id: number;
  stationId: number;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_enabled: boolean;
};

export type FuelLogRow = {
  id: number;
  driverId: number;
  vehicleId: number;
  stationId: number | null;
  liters: number | string;
  fuel_type: FuelType;
  date: Date | string;
  confirmed_at: Date | string | null;
  status: FuelLogStatus;
};
