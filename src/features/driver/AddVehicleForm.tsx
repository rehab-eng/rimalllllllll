"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import type { ActionResult, AddVehiclePayload, DriverVehicleSummary } from "./types";

type AddVehicleFormProps = {
  existingVehicles: DriverVehicleSummary[];
  onSubmit: (payload: AddVehiclePayload) => Promise<ActionResult> | ActionResult;
  truckTypeOptions?: string[];
  volumeOptions?: number[];
};

const defaultTruckTypeOptions = ["Dump Truck", "Mixer", "Water Tanker", "Flatbed"];
const defaultVolumeOptions = [18, 24, 32, 40];

export default function AddVehicleForm({
  existingVehicles,
  onSubmit,
  truckTypeOptions = defaultTruckTypeOptions,
  volumeOptions = defaultVolumeOptions,
}: AddVehicleFormProps) {
  const [truckType, setTruckType] = useState(truckTypeOptions[0] ?? "");
  const [platesNumber, setPlatesNumber] = useState("");
  const [trailerPlates, setTrailerPlates] = useState("");
  const [truckVolume, setTruckVolume] = useState(volumeOptions[0] ?? 18);
  const [imageUrl, setImageUrl] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextVehicleLabel = `Vehicle ${existingVehicles.length + 1}`;

  const resetForm = () => {
    setTruckType(truckTypeOptions[0] ?? "");
    setPlatesNumber("");
    setTrailerPlates("");
    setTruckVolume(volumeOptions[0] ?? 18);
    setImageUrl("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!truckType || !platesNumber.trim()) {
      setFeedback({
        kind: "error",
        text: "Truck type and truck plates are required.",
      });
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        truckType,
        platesNumber: platesNumber.trim(),
        trailerPlates: trailerPlates.trim(),
        truckVolume,
        imageUrl,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "Unable to add this vehicle.",
        });
        return;
      }

      resetForm();
      setFeedback({
        kind: "success",
        text: `${nextVehicleLabel} was added successfully.`,
      });
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">Fleet Expansion</p>
            <h2 className="mt-2 text-2xl font-black text-white">{nextVehicleLabel}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 bg-black/25 px-4 py-3 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white">Current</p>
            <p className="mt-2 text-2xl font-black text-white">{existingVehicles.length}</p>
          </div>
        </div>

        {existingVehicles.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {existingVehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="rounded-2xl border border-white/20 bg-black/25 p-4">
                <p className="text-sm font-black text-white">{`Vehicle ${index + 1}`}</p>
                <p className="mt-2 text-base font-bold text-white">{vehicle.platesNumber}</p>
                <p className="mt-1 text-sm font-semibold text-white">{vehicle.truckType}</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {vehicle.totalLiters} L total across {vehicle.totalLogs} logs
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4">
          <Field label="Truck Type">
            <select
              value={truckType}
              onChange={(event) => setTruckType(event.target.value)}
              className="min-h-14 rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-bold text-white outline-none"
            >
              {truckTypeOptions.map((option) => (
                <option key={option} value={option} className="text-black">
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Truck Plates">
            <input
              value={platesNumber}
              onChange={(event) => setPlatesNumber(event.target.value)}
              placeholder="Enter truck plates"
              className="min-h-14 rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-bold text-white outline-none placeholder:text-white/70"
            />
          </Field>

          <Field label="Trailer Plates">
            <input
              value={trailerPlates}
              onChange={(event) => setTrailerPlates(event.target.value)}
              placeholder="Optional trailer plates"
              className="min-h-14 rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-bold text-white outline-none placeholder:text-white/70"
            />
          </Field>

          <Field label="Truck Volume">
            <select
              value={truckVolume}
              onChange={(event) => setTruckVolume(Number(event.target.value))}
              className="min-h-14 rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-bold text-white outline-none"
            >
              {volumeOptions.map((option) => (
                <option key={option} value={option} className="text-black">
                  {option} m3
                </option>
              ))}
            </select>
          </Field>

          <ImageUpload imageUrl={imageUrl} onUpload={setImageUrl} />

          {feedback ? (
            <div
              className={`rounded-2xl border px-4 py-3 ${
                feedback.kind === "success"
                  ? "border-white bg-white text-black"
                  : "border-white/20 bg-black/30 text-white"
              }`}
            >
              <p className={`text-sm font-black ${feedback.kind === "success" ? "text-black" : "text-white"}`}>
                {feedback.text}
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="min-h-16 rounded-2xl border border-white bg-white px-5 text-lg font-black text-black disabled:cursor-not-allowed disabled:border-white/50 disabled:bg-white/60"
          >
            {isPending ? "Saving Vehicle..." : `Save ${nextVehicleLabel}`}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-white">{label}</span>
      {children}
    </label>
  );
}

function ImageUpload({
  imageUrl,
  onUpload,
}: {
  imageUrl: string;
  onUpload: (url: string) => void;
}) {
  const dummyUrl = `https://res.cloudinary.com/demo/image/upload/v1/rimall-vehicle-${Date.now()}.jpg`;

  return (
    <div className="rounded-[24px] border border-white/20 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">Vehicle Image</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {imageUrl ? "Image linked successfully." : "Use the upload button if available."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onUpload(dummyUrl)}
          className="min-h-12 rounded-2xl border border-white bg-white px-4 text-sm font-black text-black"
        >
          Upload
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/30 px-4 py-4">
        <p className="text-sm font-bold text-white">{imageUrl || "No image selected yet."}</p>
      </div>
    </div>
  );
}
