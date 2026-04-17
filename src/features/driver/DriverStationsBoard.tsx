import { stationRuntimeStatusLabels } from "../../lib/labels";
import type { DriverStationSummary } from "./types";

type DriverStationsBoardProps = {
  stations: DriverStationSummary[];
};

export default function DriverStationsBoard({ stations }: DriverStationsBoardProps) {
  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-sm font-black text-white">
          {stations.length}
        </span>

        <div className="text-right">
          <p className="text-xs font-bold tracking-[0.14em] text-white">المحطات</p>
          <h3 className="mt-2 text-2xl font-black text-white">المحطات المفتوحة والمغلقة</h3>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {stations.length === 0 ? (
          <div className="rounded-[24px] border border-white/20 bg-black/25 p-4">
            <p className="text-base font-black text-white">لم يتم إعداد أي محطة حتى الآن.</p>
          </div>
        ) : (
          stations.map((station) => (
            <div key={station.id} className="rounded-[24px] border border-white/20 bg-black/25 p-4 text-right">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    station.runtimeStatus === "OPEN"
                      ? "bg-white text-black"
                      : "border border-white/20 bg-black/30 text-white"
                  }`}
                >
                  {stationRuntimeStatusLabels[station.runtimeStatus]}
                </span>

                <div>
                  <p className="text-lg font-black text-white">{station.name}</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {station.location || "لم يتم تحديد موقع"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {station.scheduleSummary.map((entry) => (
                  <span
                    key={`${station.id}-${entry}`}
                    className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-bold text-white"
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
