"use client";

import { useEffect, useState, useTransition } from "react";

import type { FuelType } from "../../generated/prisma/client";
import { formatArabicNumber, fuelTypeLabels, stationRuntimeStatusLabels } from "../../lib/labels";
import type {
  ActionResult,
  FuelFillPayload,
  FuelFillStationOption,
  FuelFillVehicleOption,
} from "./types";

type FuelFillFormProps = {
  vehicles: FuelFillVehicleOption[];
  stations: FuelFillStationOption[];
  onSubmit: (payload: FuelFillPayload) => Promise<ActionResult> | ActionResult;
  literOptions?: number[];
};

const defaultLiterOptions = [50, 100, 150, 200];

export default function FuelFillForm({
  vehicles,
  stations,
  onSubmit,
  literOptions = defaultLiterOptions,
}: FuelFillFormProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(String(vehicles[0]?.id ?? ""));
  const [selectedStationId, setSelectedStationId] = useState<string>(
    String(stations.find((station) => station.runtimeStatus === "OPEN")?.id ?? stations[0]?.id ?? ""),
  );
  const [fuelType, setFuelType] = useState<FuelType>("DIESEL");
  const [liters, setLiters] = useState<number>(literOptions[0] ?? 50);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!vehicles.some((vehicle) => String(vehicle.id) === selectedVehicleId)) {
      setSelectedVehicleId(String(vehicles[0]?.id ?? ""));
    }
  }, [selectedVehicleId, vehicles]);

  useEffect(() => {
    if (!stations.some((station) => String(station.id) === selectedStationId)) {
      setSelectedStationId(String(stations[0]?.id ?? ""));
    }
  }, [selectedStationId, stations]);

  const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === selectedVehicleId);
  const selectedStation = stations.find((station) => String(station.id) === selectedStationId);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!selectedVehicle) {
      setFeedback({
        kind: "error",
        text: "اختر المركبة أولًا.",
      });
      return;
    }

    if (!selectedStation || selectedStation.runtimeStatus !== "OPEN") {
      setFeedback({
        kind: "error",
        text: "لا يمكن تأكيد التعبئة إلا من محطة مفتوحة ضمن ساعات العمل الحالية.",
      });
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        vehicleId: selectedVehicle.id,
        stationId: selectedStation.id,
        liters,
        fuelType,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "تعذر تأكيد عملية التعبئة.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        text:
          fuelType === "DIESEL"
            ? "تم تأكيد استلام الديزل بنجاح."
            : "تم تأكيد استلام البنزين بنجاح.",
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md text-white">
      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-5 shadow-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-white">تأكيد التعبئة</p>
        <h2 className="mt-2 text-3xl font-black text-white">استلمت الوقود</h2>

        <div className="mt-5 rounded-[24px] border border-white/20 bg-black/25 p-4 text-right">
          <p className="text-sm font-bold text-white">المركبة والمحطة المختارتان</p>
          <p className="mt-2 text-xl font-black text-white">
            {selectedVehicle ? selectedVehicle.platesNumber : "لم يتم اختيار مركبة"}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {selectedStation
              ? `${selectedStation.name}${selectedStation.location ? ` - ${selectedStation.location}` : ""}`
              : "لم يتم اختيار محطة"}
          </p>
        </div>

        <div className="mt-5">
          <Label title="اختر المركبة" />
          <div className="mt-3 grid gap-3">
            {vehicles.map((vehicle, index) => {
              const isSelected = String(vehicle.id) === selectedVehicleId;

              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedVehicleId(String(vehicle.id))}
                  className={`min-h-18 rounded-[24px] border p-4 text-right ${
                    isSelected
                      ? "border-white bg-white text-black"
                      : "border-white/20 bg-black/25 text-white"
                  }`}
                >
                  <p className={`text-sm font-black ${isSelected ? "text-black" : "text-white"}`}>
                    {`المركبة ${index + 1}`}
                  </p>
                  <p className={`mt-2 text-xl font-black ${isSelected ? "text-black" : "text-white"}`}>
                    {vehicle.platesNumber}
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${isSelected ? "text-black" : "text-white"}`}>
                    {vehicle.truckType}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <Label title="اختر المحطة" />
          <p className="mt-2 text-sm font-semibold text-white">
            يسمح بالتأكيد فقط إذا كان الوقت الحالي داخل ساعات عمل المحطة.
          </p>
          <div className="mt-3 grid gap-3">
            {stations.map((station) => {
              const isSelected = String(station.id) === selectedStationId;
              const isOpen = station.runtimeStatus === "OPEN";

              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => setSelectedStationId(String(station.id))}
                  className={`rounded-[24px] border p-4 text-right ${
                    isSelected
                      ? "border-white bg-white text-black"
                      : "border-white/20 bg-black/25 text-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        isSelected
                          ? "bg-black text-white"
                          : isOpen
                            ? "bg-white text-black"
                            : "border border-white/20 bg-black/35 text-white"
                      }`}
                    >
                      {stationRuntimeStatusLabels[station.runtimeStatus]}
                    </span>

                    <div className="text-right">
                      <p className={`text-base font-black ${isSelected ? "text-black" : "text-white"}`}>
                        {station.name}
                      </p>
                      <p className={`mt-1 text-sm font-semibold ${isSelected ? "text-black" : "text-white"}`}>
                        {station.location || "لم يتم تحديد موقع"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <Label title="نوع الوقود" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <FuelTypeCard
              isActive={fuelType === "DIESEL"}
              label="ديزل"
              helper="نافطة / ديزل"
              onClick={() => setFuelType("DIESEL")}
            />
            <FuelTypeCard
              isActive={fuelType === "GASOLINE"}
              label="بنزين"
              helper="بنزين"
              onClick={() => setFuelType("GASOLINE")}
            />
          </div>
        </div>

        <div className="mt-5">
          <Label title="كمية اللترات" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {literOptions.map((option) => {
              const isActive = liters === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLiters(option)}
                  className={`min-h-20 rounded-[24px] border ${
                    isActive
                      ? "border-white bg-white text-black"
                      : "border-white/20 bg-black/25 text-white"
                  }`}
                >
                    <span className={`block text-3xl font-black ${isActive ? "text-black" : "text-white"}`}>
                    {formatArabicNumber(option)}
                  </span>
                  <span className={`mt-1 block text-sm font-bold ${isActive ? "text-black" : "text-white"}`}>
                    لتر
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {feedback ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-4 ${
              feedback.kind === "success"
                ? "border-white bg-white text-black"
                : "border-white/20 bg-black/30 text-white"
            }`}
          >
            <p className={`text-base font-black ${feedback.kind === "success" ? "text-black" : "text-white"}`}>
              {feedback.text}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !vehicles.length || !stations.length}
          className="mt-5 min-h-20 w-full rounded-[28px] border border-white bg-white px-5 text-xl font-black text-black disabled:cursor-not-allowed disabled:border-white/50 disabled:bg-white/60"
        >
          {isPending
            ? "جارٍ الحفظ..."
            : fuelType === "DIESEL"
              ? `تم استلام ${fuelTypeLabels.DIESEL}`
              : `تم استلام ${fuelTypeLabels.GASOLINE}`}
        </button>
      </section>
    </form>
  );
}

function Label({ title }: { title: string }) {
  return <p className="text-sm font-bold text-white">{title}</p>;
}

function FuelTypeCard({
  isActive,
  label,
  helper,
  onClick,
}: {
  isActive: boolean;
  label: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-20 rounded-[24px] border p-4 text-right ${
        isActive ? "border-white bg-white text-black" : "border-white/20 bg-black/25 text-white"
      }`}
    >
      <p className={`text-xl font-black ${isActive ? "text-black" : "text-white"}`}>{label}</p>
      <p className={`mt-1 text-sm font-semibold ${isActive ? "text-black" : "text-white"}`}>{helper}</p>
    </button>
  );
}
