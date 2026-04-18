import { formatArabicNumber } from "../../lib/labels";
import type { DriverFuelHistoryItem, DriverVehicleSummary } from "./types";

type DriverVehicleStatsProps = {
  vehicles: DriverVehicleSummary[];
  recentFuelLogs: DriverFuelHistoryItem[];
  mode?: "fleet" | "history" | "combined";
};

export default function DriverVehicleStats({
  vehicles,
  recentFuelLogs,
  mode = "combined",
}: DriverVehicleStatsProps) {
  return (
    <>
      {mode !== "history" ? <FleetSection vehicles={vehicles} /> : null}
      {mode !== "fleet" ? <HistorySection recentFuelLogs={recentFuelLogs} /> : null}
    </>
  );
}

function FleetSection({ vehicles }: { vehicles: DriverVehicleSummary[] }) {
  return (
    <section className="border-b border-slate-200">
      <div className="px-4 py-5 text-right">
        <h3 className="text-xl font-black text-slate-950">شاحناتي</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          كل شاحنة مرتبطة بحسابك تظهر هنا مباشرة.
        </p>

        {vehicles.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-bold text-slate-600">لا توجد شاحنات مرتبطة بهذا الحساب بعد.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            {vehicles.map((vehicle, index) => (
              <div
                key={vehicle.id}
                className={`bg-white px-4 py-4 text-right ${
                  index !== vehicles.length - 1 ? "border-b border-slate-200" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-left">
                    <p className="text-lg font-black text-slate-950">
                      {formatArabicNumber(vehicle.totalLiters)}
                    </p>
                    <p className="text-xs font-bold text-slate-500">لتر مؤكد</p>
                  </div>

                  <div>
                    <p className="text-base font-black text-slate-950">{vehicle.platesNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {vehicle.trailerPlates ? `مقطورة: ${vehicle.trailerPlates}` : "بدون لوحة مقطورة"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <Metric label="سعة التانك" value={`${formatArabicNumber(vehicle.capacityLiters)} لتر`} />
                  <Metric label="التكعيب" value={formatArabicNumber(vehicle.cubicCapacity)} />
                  <Metric label="عدد العمليات" value={formatArabicNumber(vehicle.totalLogs)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HistorySection({ recentFuelLogs }: { recentFuelLogs: DriverFuelHistoryItem[] }) {
  return (
    <section className="border-b border-slate-200">
      <div className="px-4 py-5 text-right">
        <h3 className="text-xl font-black text-slate-950">سجل التعبئة</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          آخر العمليات المسجلة على حسابك.
        </p>

        {recentFuelLogs.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-bold text-slate-600">لا توجد عمليات تعبئة مسجلة بعد.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            {recentFuelLogs.map((log, index) => (
              <div
                key={log.id}
                className={`bg-white px-4 py-4 text-right ${
                  index !== recentFuelLogs.length - 1 ? "border-b border-slate-200" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-left">
                    <p className="text-lg font-black text-slate-950">
                      {formatArabicNumber(log.liters)} لتر
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{log.status}</p>
                  </div>

                  <div>
                    <p className="text-base font-black text-slate-950">{log.vehiclePlates}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {log.stationName || "بدون محطة"} - {log.fuelType}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-500">{log.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <p className="text-sm font-black text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-slate-500">{label}</p>
    </div>
  );
}
