import { formatArabicNumber } from "../../lib/labels";
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
    <section className="bg-amber-50/85 backdrop-blur-md border border-amber-200 rounded-[28px] p-5 shadow-2xl">
      <div className="text-right">
        <p className="text-xs font-bold tracking-[0.14em] text-amber-900">شاحناتي</p>
        <h3 className="mt-2 text-2xl font-black text-amber-950">استهلاك الوقود لكل شاحنة</h3>
      </div>

      <div className="mt-5 grid gap-3">
        {vehicles.map((vehicle, index) => (
          <div
            key={vehicle.id}
            className="rounded-[24px] border border-amber-200 bg-white/80 p-4 text-right"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-left">
                <p className="text-3xl font-black text-amber-950">
                  {formatArabicNumber(vehicle.totalLiters)}
                </p>
                <p className="text-xs font-bold tracking-[0.12em] text-amber-800">لتر</p>
              </div>

              <div>
                <p className="text-sm font-black text-amber-900">{`الشاحنة ${index + 1}`}</p>
                <p className="mt-2 text-xl font-black text-amber-950">{vehicle.platesNumber}</p>
                <p className="mt-1 text-sm font-semibold text-amber-900">
                  السعة: {formatArabicNumber(vehicle.capacityLiters)} لتر
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                {formatArabicNumber(vehicle.totalLogs)} عمليات تعبئة مؤكدة لهذه الشاحنة
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-right">
        <p className="text-sm font-bold text-amber-900">آخر نشاط تعبئة</p>
        <div className="mt-3 grid gap-3">
          {recentFuelLogs.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-amber-900">
                لا توجد عمليات تعبئة حديثة بعد.
              </p>
            </div>
          ) : (
            recentFuelLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-left">
                    <p className="text-xl font-black text-amber-950">
                      {formatArabicNumber(log.liters)} لتر
                    </p>
                    <p className="mt-1 text-xs font-bold tracking-[0.12em] text-amber-800">
                      {log.status}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-amber-950">{log.vehiclePlates}</p>
                    <p className="mt-1 text-sm font-semibold text-amber-900">
                      {log.stationName || "بدون محطة"} - {log.fuelType}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-amber-800">{log.date}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
