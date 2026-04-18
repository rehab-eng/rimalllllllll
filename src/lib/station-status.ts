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

export const weekdayLabels = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

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

export const formatScheduleWindow = (opensAt: string, closesAt: string): string =>
  `${normalizeTimeForDisplay(opensAt)} - ${normalizeTimeForDisplay(closesAt)}`;

export const getStationRuntimeStatus = (
  station: StationLike,
  now: Date = new Date(),
): StationRuntimeStatus => {
  if (!station.is_active) {
    return "INACTIVE";
  }

  const today = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todaySchedules = station.schedules.filter(
    (schedule) => schedule.day_of_week === today && schedule.is_enabled,
  );

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
