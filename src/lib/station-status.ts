export type StationScheduleLike = {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_enabled: boolean;
};

export type StationLike = {
  is_active: boolean;
  schedules: StationScheduleLike[];
};

export type StationRuntimeStatus = "OPEN" | "CLOSED" | "INACTIVE";

export const FORCE_ACTIVE_DAY_OF_WEEK = -1;

export const weekdayLabels = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

export const isVisibleStationScheduleDay = (dayOfWeek: number): boolean =>
  dayOfWeek >= 0 && dayOfWeek <= 6;

const parseTimeToMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return -1;
  }

  return hours * 60 + minutes;
};

const normalizeTimeForDisplay = (value: string): string => {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  return value;
};

const formatTimeTo12Hour = (value: string): string => {
  const normalized = normalizeTimeForDisplay(value);
  const [hours, minutes] = normalized.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return normalized;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
};

export const formatScheduleWindow = (opensAt: string, closesAt: string): string =>
  `${formatTimeTo12Hour(opensAt)} - ${formatTimeTo12Hour(closesAt)}`;

export const getStationRuntimeStatus = (
  station: StationLike,
  now: Date = new Date(),
): StationRuntimeStatus => {
  if (!station.is_active) {
    return "INACTIVE";
  }

  const enabledSchedules = station.schedules.filter((schedule) => schedule.is_enabled);

  if (
    enabledSchedules.some((schedule) => schedule.day_of_week === FORCE_ACTIVE_DAY_OF_WEEK)
  ) {
    return "OPEN";
  }

  if (enabledSchedules.length === 0) {
    return "CLOSED";
  }

  const today = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todaySchedules = enabledSchedules.filter((schedule) => schedule.day_of_week === today);

  const isOpen = todaySchedules.some((schedule) => {
    const opensAt = parseTimeToMinutes(schedule.opens_at);
    const closesAt = parseTimeToMinutes(schedule.closes_at);

    if (opensAt < 0 || closesAt < 0) {
      return false;
    }

    return currentMinutes >= opensAt && currentMinutes <= closesAt;
  });

  return isOpen ? "OPEN" : "CLOSED";
};
