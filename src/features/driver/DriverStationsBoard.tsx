import { stationRuntimeStatusLabels } from "../../lib/labels";
import type { DriverStationSummary } from "./types";

type DriverStationsBoardProps = {
  stations: DriverStationSummary[];
};

export default function DriverStationsBoard({ stations }: DriverStationsBoardProps) {
  const sortedStations = [...stations].sort((left, right) => {
    if (left.runtimeStatus === right.runtimeStatus) {
      return left.name.localeCompare(right.name, "ar");
    }

    if (left.runtimeStatus === "OPEN") {
      return -1;
    }

    if (right.runtimeStatus === "OPEN") {
      return 1;
    }

    return left.runtimeStatus.localeCompare(right.runtimeStatus);
  });

  const openStationsCount = stations.filter((station) => station.runtimeStatus === "OPEN").length;

  return (
    <section className="border-b border-slate-200">
      <div className="px-4 py-5 text-right">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            {openStationsCount} متاحة الآن
          </span>

          <div>
            <h3 className="text-xl font-black text-slate-950">المحطات</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              راجع حالة كل محطة ومواعيد اليوم بسرعة.
            </p>
          </div>
        </div>

        {sortedStations.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-bold text-slate-600">لا توجد محطات مضافة حتى الآن.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            {sortedStations.map((station, index) => (
              <div
                key={station.id}
                className={`bg-white px-4 py-4 text-right ${
                  index !== sortedStations.length - 1 ? "border-b border-slate-200" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      station.runtimeStatus === "OPEN"
                        ? "bg-emerald-50 text-emerald-700"
                        : station.runtimeStatus === "CLOSED"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {stationRuntimeStatusLabels[station.runtimeStatus]}
                  </span>

                  <div>
                    <p className="text-base font-black text-slate-950">{station.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {station.location || "الموقع غير مضاف بعد"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-sm font-semibold text-slate-600">
                  {station.todaySchedule ? `اليوم: ${station.todaySchedule}` : "اليوم: لا يوجد دوام محدد"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
