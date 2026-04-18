import { stationRuntimeStatusLabels } from "../../lib/labels";
import type { DriverStationSummary } from "./types";

type DriverStationsBoardProps = {
  stations: DriverStationSummary[];
};

export default function DriverStationsBoard({ stations }: DriverStationsBoardProps) {
  const availableStations = stations.filter((station) => station.runtimeStatus === "OPEN");

  return (
    <section className="rounded-[28px] border border-amber-200 bg-amber-50/85 p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-black text-amber-900">
          {availableStations.length}
        </span>

        <div className="text-right">
          <p className="text-xs font-bold tracking-[0.14em] text-amber-900">الشيلات</p>
          <h3 className="mt-2 text-2xl font-black text-amber-950">المحطات المتاحة حالياً</h3>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {stations.length === 0 ? (
          <div className="rounded-[24px] border border-amber-200 bg-white/80 p-4">
            <p className="text-base font-black text-amber-900">لم يتم إعداد أي محطة حتى الآن.</p>
          </div>
        ) : (
          stations.map((station) => (
            <div key={station.id} className="rounded-[24px] border border-amber-200 bg-white/80 p-4 text-right">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    station.runtimeStatus === "OPEN"
                      ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                      : "border border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {stationRuntimeStatusLabels[station.runtimeStatus]}
                </span>

                <div>
                  <p className="text-lg font-black text-amber-950">{station.name}</p>
                  <p className="mt-1 text-sm font-semibold text-amber-900">
                    {station.location || "لم يتم تحديد موقع"}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-sm font-black text-amber-900">
                  ساعات اليوم: {station.todaySchedule ?? "لا يوجد دوام مفعّل لهذا اليوم"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {station.scheduleSummary.map((entry) => (
                  <span
                    key={`${station.id}-${entry}`}
                    className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-bold text-amber-900"
                  >
                    {entry}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
