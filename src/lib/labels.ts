import type {
  DriverStatus,
  FuelLogStatus,
  FuelType,
} from "../generated/prisma/client";
import type { StationRuntimeStatus } from "./station-status";

export const driverStatusLabels: Record<DriverStatus, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  DELETED: "محذوف",
};

export const fuelLogStatusLabels: Record<FuelLogStatus, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مؤكد",
  REJECTED: "مرفوض",
};

export const fuelTypeLabels: Record<FuelType, string> = {
  DIESEL: "ديزل",
  GASOLINE: "بنزين",
};

export const stationRuntimeStatusLabels: Record<StationRuntimeStatus, string> = {
  OPEN: "مفتوحة الآن",
  CLOSED: "مغلقة الآن",
  INACTIVE: "غير فعالة",
};

export const formatArabicNumber = (value: number): string =>
  new Intl.NumberFormat("ar-LY", {
    maximumFractionDigits: 0,
  }).format(value);

export const formatArabicDateTime = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ar-LY", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
