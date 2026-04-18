"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import type { FuelType } from "../../lib/db-types";
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
  const openStations = useMemo(
    () => stations.filter((station) => station.runtimeStatus === "OPEN"),
    [stations],
  );

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(String(vehicles[0]?.id ?? ""));
  const [selectedStationId, setSelectedStationId] = useState<string>(
    String(openStations[0]?.id ?? stations[0]?.id ?? ""),
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
    const nextStationId = String(openStations[0]?.id ?? stations[0]?.id ?? "");
    if (!stations.some((station) => String(station.id) === selectedStationId)) {
      setSelectedStationId(nextStationId);
      return;
    }

    if (openStations.length > 0 && !openStations.some((station) => String(station.id) === selectedStationId)) {
      setSelectedStationId(nextStationId);
    }
  }, [openStations, selectedStationId, stations]);

  const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === selectedVehicleId);
  const selectedStation = stations.find((station) => String(station.id) === selectedStationId);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!selectedVehicle) {
      setFeedback({
        kind: "error",
        text: "اختر الشاحنة أولاً.",
      });
      return;
    }

    if (!selectedStation || selectedStation.runtimeStatus !== "OPEN") {
      setFeedback({
        kind: "error",
        text: "اختر محطة مفتوحة الآن حتى يتم تأكيد التعبئة.",
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
          text: result.error ?? "تعذر حفظ عملية التعبئة.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        text:
          fuelType === "DIESEL"
            ? "تم تسجيل تعبئة الديزل بنجاح."
            : "تم تسجيل تعبئة البنزين بنجاح.",
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-slate-200">
      <div className="px-4 py-5 text-right">
        <p className="text-xs font-bold tracking-[0.16em] text-slate-500">تعبئة جديدة</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">المحطات الجاهزة الآن</h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
          اختر محطة مفتوحة، ثم أكد الكمية التي استلمتها بضغطة واحدة.
        </p>

        {openStations.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-bold text-slate-700">
              لا توجد محطة متاحة الآن. راجع مواعيد المحطات بالأسفل.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            {openStations.map((station, index) => {
              const isSelected = String(station.id) === selectedStationId;

              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => setSelectedStationId(String(station.id))}
                  className={`flex w-full items-start justify-between gap-3 px-4 py-4 text-right ${
                    index !== openStations.length - 1 ? "border-b border-slate-200" : ""
                  } ${isSelected ? "bg-amber-50" : "bg-white"}`}
                >
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {stationRuntimeStatusLabels[station.runtimeStatus]}
                  </span>

                  <div>
                    <p className="text-base font-black text-slate-950">{station.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {station.location || "الموقع غير مضاف بعد"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <SectionLabel title="الشاحنة" />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {vehicles.map((vehicle) => {
            const isSelected = String(vehicle.id) === selectedVehicleId;

            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setSelectedVehicleId(String(vehicle.id))}
                className={`min-w-[150px] rounded-2xl border px-4 py-3 text-right ${
                  isSelected
                    ? "border-amber-200 bg-amber-50 text-slate-950"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <p className="text-sm font-black">{vehicle.platesNumber}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {formatArabicNumber(vehicle.capacityLiters)} لتر
                </p>
              </button>
            );
          })}
        </div>

        <SectionLabel title="نوع الوقود" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["DIESEL", "GASOLINE"] as const).map((type) => {
            const isActive = fuelType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setFuelType(type)}
                className={`rounded-2xl border px-4 py-3 text-sm font-black ${
                  isActive
                    ? "border-amber-200 bg-amber-50 text-slate-950"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {fuelTypeLabels[type]}
              </button>
            );
          })}
        </div>

        <SectionLabel title="الكمية" />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {literOptions.map((option) => {
            const isActive = liters === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setLiters(option)}
                className={`rounded-2xl border px-3 py-4 ${
                  isActive
                    ? "border-amber-200 bg-amber-50 text-slate-950"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <span className="block text-lg font-black">{formatArabicNumber(option)}</span>
                <span className="mt-1 block text-[11px] font-bold">لتر</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-right">
          <p className="text-sm font-bold text-slate-500">سيتم التسجيل على</p>
          <p className="mt-2 text-base font-black text-slate-950">
            {selectedStation ? selectedStation.name : "لم يتم اختيار محطة"}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {selectedVehicle ? selectedVehicle.platesNumber : "لم يتم اختيار شاحنة"}
          </p>
        </div>

        {feedback ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-4 ${
              feedback.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <p className="text-sm font-black">{feedback.text}</p>
          </div>
        ) : null}

        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={isPending || !vehicles.length || openStations.length === 0}
            className="min-h-16 w-full max-w-xs rounded-2xl bg-amber-500 px-6 text-lg font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPending ? "جارٍ الحفظ..." : "تأكيد التعبئة"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <p className="mt-5 text-sm font-black text-slate-800">{title}</p>;
}
