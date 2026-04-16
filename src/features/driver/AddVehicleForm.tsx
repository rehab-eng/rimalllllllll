"use client";

import { useState, useTransition } from "react";

import type { ActionResult, AddVehiclePayload, DriverVehicleSummary } from "./types";

type AddVehicleFormProps = {
  existingVehicles: DriverVehicleSummary[];
  onSubmit: (payload: AddVehiclePayload) => Promise<ActionResult> | ActionResult;
  truckTypeOptions?: string[];
  volumeOptions?: number[];
};

const defaultTruckTypeOptions = ["Mixer", "Flatbed", "Dump Truck", "Water Tanker"];
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

    if (!truckType || !platesNumber.trim() || !imageUrl) {
      setFeedback({
        kind: "error",
        text: "Truck type, plates number, and image are required.",
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
          text: result.error ?? "Unable to add the vehicle.",
        });
        return;
      }

      resetForm();
      setFeedback({
        kind: "success",
        text: `${nextVehicleLabel} is ready.`,
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
            <p className="text-sm font-semibold text-white">Add Vehicle</p>
            <h2 className="mt-1 text-2xl font-black text-white">{nextVehicleLabel}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 bg-black/25 px-4 py-3 text-center">
            <p className="text-xs font-bold text-white">Current</p>
            <p className="text-xl font-black text-white">{existingVehicles.length}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white">Truck Type</span>
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
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white">Truck Plates</span>
            <input
              value={platesNumber}
              onChange={(event) => setPlatesNumber(event.target.value)}
              placeholder="Enter truck plates"
              className="min-h-14 rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-bold text-white outline-none placeholder:text-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white">Trailer Plates</span>
            <input
              value={trailerPlates}
              onChange={(event) => setTrailerPlates(event.target.value)}
              placeholder="Optional trailer plates"
              className="min-h-14 rounded-2xl border border-white/20 bg-black/30 px-4 text-base font-bold text-white outline-none placeholder:text-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white">Truck Volume</span>
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
          </label>

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

      {existingVehicles.length > 0 ? (
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-4 shadow-2xl">
          <h3 className="text-base font-black text-white">Your Vehicles</h3>
          <div className="mt-4 grid gap-3">
            {existingVehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="rounded-2xl border border-white/20 bg-black/25 p-4">
                <p className="text-sm font-black text-white">{`Vehicle ${index + 1}`}</p>
                <p className="mt-2 text-base font-bold text-white">{vehicle.truckType}</p>
                <p className="mt-1 text-sm font-semibold text-white">{vehicle.platesNumber}</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {vehicle.trailerPlates ? vehicle.trailerPlates : "No trailer plates"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
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
            {imageUrl ? "Image linked successfully." : "Use the dummy upload button."}
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

      <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/30 px-4 py-5">
        <p className="text-sm font-bold text-white">
          {imageUrl ? imageUrl : "No image selected yet."}
        </p>
      </div>
    </div>
  );
}
