"use client";

import { useEffect, useState, useTransition } from "react";

import type { ActionResult, FuelFillPayload, FuelFillVehicleOption } from "./types";

type FuelFillFormProps = {
  vehicles: FuelFillVehicleOption[];
  onSubmit: (payload: FuelFillPayload) => Promise<ActionResult> | ActionResult;
  literOptions?: number[];
  initialVehicleId?: number | string;
  initialLiters?: number;
};

const defaultLiterOptions = [50, 100, 150, 200];

export default function FuelFillForm({
  vehicles,
  onSubmit,
  literOptions = defaultLiterOptions,
  initialVehicleId,
  initialLiters,
}: FuelFillFormProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    String(initialVehicleId ?? vehicles[0]?.id ?? ""),
  );
  const [liters, setLiters] = useState<number>(initialLiters ?? literOptions[0] ?? 50);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!vehicles.length) {
      setSelectedVehicleId("");
      return;
    }

    if (!vehicles.some((vehicle) => String(vehicle.id) === selectedVehicleId)) {
      setSelectedVehicleId(String(vehicles[0].id));
    }
  }, [selectedVehicleId, vehicles]);

  const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === selectedVehicleId);

  const setPresetLiters = (value: number) => {
    setLiters(value);
  };

  const stepLiters = (delta: number) => {
    setLiters((current) => Math.max(5, current + delta));
  };

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

    if (liters <= 0) {
      setFeedback({
        kind: "error",
        text: "Choose a valid liters amount.",
      });
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        vehicleId: selectedVehicle.id,
        liters,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "Unable to save the fuel entry.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        text: "Fuel entry sent successfully.",
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4 text-white">
      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-5 shadow-2xl">
        <p className="text-sm font-semibold text-white">Fuel Fill</p>
        <h2 className="mt-1 text-3xl font-black text-white">Quick Log</h2>

        <div className="mt-5 rounded-[24px] border border-white/20 bg-black/25 p-4">
          <p className="text-sm font-bold text-white">Selected Vehicle</p>
          <p className="mt-2 text-xl font-black text-white">
            {selectedVehicle ? selectedVehicle.platesNumber : "No vehicle selected"}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {selectedVehicle
              ? `${selectedVehicle.truckType}${selectedVehicle.trailerPlates ? ` - ${selectedVehicle.trailerPlates}` : ""}`
              : "Tap a vehicle card below."}
          </p>
        </div>
      </section>

      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-white">Choose Vehicle</h3>
          <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-sm font-black text-white">
            {vehicles.length}
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          {vehicles.map((vehicle, index) => {
            const isSelected = String(vehicle.id) === selectedVehicleId;

            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setSelectedVehicleId(String(vehicle.id))}
                className={`min-h-20 rounded-[24px] border p-4 text-left ${
                  isSelected
                    ? "border-white bg-white text-black"
                    : "border-white/20 bg-black/25 text-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-sm font-black ${isSelected ? "text-black" : "text-white"}`}>
                      {`Vehicle ${index + 1}`}
                    </p>
                    <p className={`mt-1 text-xl font-black ${isSelected ? "text-black" : "text-white"}`}>
                      {vehicle.platesNumber}
                    </p>
                    <p className={`mt-1 text-sm font-semibold ${isSelected ? "text-black" : "text-white"}`}>
                      {vehicle.truckType}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                      isSelected ? "border-black bg-black text-white" : "border-white/20 bg-black/30 text-white"
                    }`}
                  >
                    <CheckIcon />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-4 shadow-2xl">
        <h3 className="text-lg font-black text-white">Choose Liters</h3>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {literOptions.map((option) => {
            const isActive = liters === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setPresetLiters(option)}
                className={`min-h-20 rounded-[24px] border text-center ${
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

        <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-white/20 bg-black/25 p-3">
          <button
            type="button"
            onClick={() => stepLiters(-5)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-black/35 text-3xl font-black text-white"
          >
            -
          </button>

          <div className="flex-1 rounded-2xl border border-white/20 bg-black/35 px-4 py-3 text-center">
            <p className="text-4xl font-black text-white">{liters}</p>
            <p className="mt-1 text-sm font-bold text-white">Liters</p>
          </div>

          <button
            type="button"
            onClick={() => stepLiters(5)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-black/35 text-3xl font-black text-white"
          >
            +
          </button>
        </div>
      </section>

      {feedback ? (
        <div
          className={`rounded-[24px] border px-4 py-4 ${
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
        disabled={isPending || !vehicles.length}
        className="min-h-20 rounded-[28px] border border-white bg-white px-5 text-xl font-black text-black disabled:cursor-not-allowed disabled:border-white/50 disabled:bg-white/60"
      >
        {isPending ? "Saving Fuel Entry..." : "Log Fuel Now"}
      </button>
    </form>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M5 12.5L9.5 17L19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
