import type { DriverStationSummary } from "./types";

type DriverStationsBoardProps = {
  stations: DriverStationSummary[];
};

export default function DriverStationsBoard({ stations }: DriverStationsBoardProps) {
  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">Stations</p>
          <h3 className="mt-2 text-2xl font-black text-white">Open and Closed Points</h3>
        </div>
        <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-sm font-black text-white">
          {stations.length}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {stations.length === 0 ? (
          <div className="rounded-[24px] border border-white/20 bg-black/25 p-4">
            <p className="text-base font-black text-white">No stations have been configured yet.</p>
          </div>
        ) : (
          stations.map((station) => (
            <div key={station.id} className="rounded-[24px] border border-white/20 bg-black/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-white">{station.name}</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {station.location || "No location specified"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    station.runtimeStatus === "OPEN"
                      ? "bg-white text-black"
                      : "border border-white/20 bg-black/30 text-white"
                  }`}
                >
                  {station.runtimeStatus}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
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
