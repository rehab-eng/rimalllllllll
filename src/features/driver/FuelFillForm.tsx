"use client";

import { useEffect, useState, useTransition } from "react";

import type { FuelType } from "../../generated/prisma/client";
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
        text: "Choose a vehicle first.",
      });
      return;
    }

    if (!selectedStation || selectedStation.runtimeStatus !== "OPEN") {
      setFeedback({
        kind: "error",
        text: "Choose a station that is open now.",
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
          text: result.error ?? "Unable to confirm this fuel fill.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        text:
          fuelType === "DIESEL"
            ? "Diesel receipt was confirmed successfully."
            : "Gasoline receipt was confirmed successfully.",
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md text-white">
      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-5 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">Fuel Confirmation</p>
        <h2 className="mt-2 text-3xl font-black text-white">I Got Fuel</h2>

        <div className="mt-5 rounded-[24px] border border-white/20 bg-black/25 p-4">
          <p className="text-sm font-bold text-white">Selected Truck</p>
          <p className="mt-2 text-xl font-black text-white">
            {selectedVehicle ? selectedVehicle.platesNumber : "No vehicle selected"}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {selectedStation ? `${selectedStation.name}${selectedStation.location ? ` - ${selectedStation.location}` : ""}` : "No station selected"}
          </p>
        </div>

        <div className="mt-5">
          <Label title="Choose Vehicle" />
          <div className="mt-3 grid gap-3">
            {vehicles.map((vehicle, index) => {
              const isSelected = String(vehicle.id) === selectedVehicleId;

              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedVehicleId(String(vehicle.id))}
                  className={`min-h-18 rounded-[24px] border p-4 text-left ${
                    isSelected
                      ? "border-white bg-white text-black"
                      : "border-white/20 bg-black/25 text-white"
                  }`}
                >
                  <p className={`text-sm font-black ${isSelected ? "text-black" : "text-white"}`}>
                    {`Vehicle ${index + 1}`}
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
          <Label title="Choose Station" />
          <div className="mt-3 grid gap-3">
            {stations.map((station) => {
              const isSelected = String(station.id) === selectedStationId;
              const isOpen = station.runtimeStatus === "OPEN";

              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => setSelectedStationId(String(station.id))}
                  className={`rounded-[24px] border p-4 text-left ${
                    isSelected
                      ? "border-white bg-white text-black"
                      : "border-white/20 bg-black/25 text-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-base font-black ${isSelected ? "text-black" : "text-white"}`}>
                        {station.name}
                      </p>
                      <p className={`mt-1 text-sm font-semibold ${isSelected ? "text-black" : "text-white"}`}>
                        {station.location || "No location specified"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        isSelected
                          ? "bg-black text-white"
                          : isOpen
                            ? "bg-white text-black"
                            : "border border-white/20 bg-black/35 text-white"
                      }`}
                    >
                      {station.runtimeStatus}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <Label title="Choose Fuel Type" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <FuelTypeCard
              isActive={fuelType === "DIESEL"}
              label="Diesel"
              helper="نافطة / ديزل"
              onClick={() => setFuelType("DIESEL")}
            />
            <FuelTypeCard
              isActive={fuelType === "GASOLINE"}
              label="Gasoline"
              helper="بنزين"
              onClick={() => setFuelType("GASOLINE")}
            />
          </div>
        </div>

        <div className="mt-5">
          <Label title="Choose Liters" />
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
                    {option}
                  </span>
                  <span className={`mt-1 block text-sm font-bold ${isActive ? "text-black" : "text-white"}`}>
                    Liters
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
          {isPending ? "Saving..." : fuelType === "DIESEL" ? "I Got Diesel" : "I Got Gasoline"}
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
      className={`min-h-20 rounded-[24px] border p-4 text-left ${
        isActive ? "border-white bg-white text-black" : "border-white/20 bg-black/25 text-white"
      }`}
    >
      <p className={`text-xl font-black ${isActive ? "text-black" : "text-white"}`}>{label}</p>
      <p className={`mt-1 text-sm font-semibold ${isActive ? "text-black" : "text-white"}`}>{helper}</p>
    </button>
  );
}
