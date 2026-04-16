import type { DriverFuelHistoryItem, DriverVehicleSummary } from "./types";

type DriverVehicleStatsProps = {
  vehicles: DriverVehicleSummary[];
  recentFuelLogs: DriverFuelHistoryItem[];
};

export default function DriverVehicleStats({
  vehicles,
  recentFuelLogs,
}: DriverVehicleStatsProps) {
  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-5 shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">Your Fleet</p>
      <h3 className="mt-2 text-2xl font-black text-white">All Period Consumption</h3>

      <div className="mt-5 grid gap-3">
        {vehicles.map((vehicle, index) => (
          <div key={vehicle.id} className="rounded-[24px] border border-white/20 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{`Vehicle ${index + 1}`}</p>
                <p className="mt-2 text-xl font-black text-white">{vehicle.platesNumber}</p>
                <p className="mt-1 text-sm font-semibold text-white">{vehicle.truckType}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">{vehicle.totalLiters}</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white">Liters</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/20 bg-black/30 px-4 py-3">
              <p className="text-sm font-semibold text-white">
                {vehicle.totalLogs} confirmed fuel records for this truck
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-sm font-bold text-white">Recent Fuel Activity</p>
        <div className="mt-3 grid gap-3">
          {recentFuelLogs.length === 0 ? (
            <div className="rounded-2xl border border-white/20 bg-black/25 p-4">
              <p className="text-sm font-semibold text-white">No recent fuel records yet.</p>
            </div>
          ) : (
            recentFuelLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-white/20 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-white">{log.vehiclePlates}</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {log.stationName || "No station"} · {log.fuelType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{log.liters} L</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
                      {log.status}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{log.date}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
