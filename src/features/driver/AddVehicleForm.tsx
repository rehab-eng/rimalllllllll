"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { formatArabicNumber } from "../../lib/labels";
import type { ActionResult, AddVehiclePayload, DriverVehicleSummary } from "./types";

type AddVehicleFormProps = {
  existingVehicles: DriverVehicleSummary[];
  onSubmit: (payload: AddVehiclePayload) => Promise<ActionResult> | ActionResult;
  capacityOptions?: number[];
};

const defaultCapacityOptions = [8000, 12000, 16000, 20000, 24000];

export default function AddVehicleForm({
  existingVehicles,
  onSubmit,
  capacityOptions = defaultCapacityOptions,
}: AddVehicleFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(existingVehicles.length === 0);
  const [platesNumber, setPlatesNumber] = useState("");
  const [trailerPlates, setTrailerPlates] = useState("");
  const [capacityLiters, setCapacityLiters] = useState(capacityOptions[0] ?? 8000);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextVehicleLabel = `الشاحنة ${existingVehicles.length + 1}`;

  const resetForm = () => {
    setPlatesNumber("");
    setTrailerPlates("");
    setCapacityLiters(capacityOptions[0] ?? 8000);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!platesNumber.trim()) {
      setFeedback({
        kind: "error",
        text: "رقم لوحة السيارة مطلوب.",
      });
      return;
    }

    if (!Number.isFinite(capacityLiters) || capacityLiters <= 0) {
      setFeedback({
        kind: "error",
        text: "سعة الشاحنة باللتر يجب أن تكون أكبر من صفر.",
      });
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        platesNumber: platesNumber.trim(),
        trailerPlates: trailerPlates.trim(),
        capacityLiters,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "تعذر إضافة هذه الشاحنة.",
        });
        return;
      }

      resetForm();
      setFeedback({
        kind: "success",
        text: `تمت إضافة ${nextVehicleLabel} بنجاح.`,
      });
      setIsFormOpen(false);
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 text-amber-950">
      <section className="bg-amber-50/85 backdrop-blur-md border border-amber-200 rounded-[28px] p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setIsFormOpen((value) => !value);
              setFeedback(null);
            }}
            className="min-h-12 rounded-2xl border border-amber-300 bg-white px-4 text-sm font-black text-amber-950"
          >
            {isFormOpen ? "إغلاق النموذج" : "إضافة شاحنة جديدة"}
          </button>

          <div className="text-right">
            <p className="text-xs font-bold tracking-[0.14em] text-amber-900">إدارة الشاحنات</p>
            <h2 className="mt-2 text-2xl font-black text-amber-950">{nextVehicleLabel}</h2>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 text-right">
          <p className="text-sm font-bold text-amber-900">عدد الشاحنات المرتبطة بالحساب</p>
          <p className="mt-1 text-2xl font-black text-amber-950">
            {formatArabicNumber(existingVehicles.length)}
          </p>
        </div>

        {existingVehicles.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {existingVehicles.map((vehicle, index) => (
              <div
                key={vehicle.id}
                className="rounded-2xl border border-amber-200 bg-white/80 p-4 text-right"
              >
                <p className="text-sm font-black text-amber-900">{`الشاحنة ${index + 1}`}</p>
                <p className="mt-2 text-base font-bold text-amber-950">{vehicle.platesNumber}</p>
                <p className="mt-1 text-sm font-semibold text-amber-900">
                  السعة: {formatArabicNumber(vehicle.capacityLiters)} لتر
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {isFormOpen ? (
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <Field label="رقم لوحة السيارة">
              <input
                value={platesNumber}
                onChange={(event) => setPlatesNumber(event.target.value)}
                placeholder="أدخل رقم اللوحة"
                className="min-h-14 rounded-2xl border border-amber-200 bg-white px-4 text-base font-bold text-amber-950 outline-none placeholder:text-amber-700/60"
              />
            </Field>

            <Field label="رقم لوحة المقطورة">
              <input
                value={trailerPlates}
                onChange={(event) => setTrailerPlates(event.target.value)}
                placeholder="اختياري"
                className="min-h-14 rounded-2xl border border-amber-200 bg-white px-4 text-base font-bold text-amber-950 outline-none placeholder:text-amber-700/60"
              />
            </Field>

            <Field label="السعة / التكعيب باللتر">
              <select
                value={capacityLiters}
                onChange={(event) => setCapacityLiters(Number(event.target.value))}
                className="min-h-14 rounded-2xl border border-amber-200 bg-white px-4 text-base font-bold text-amber-950 outline-none"
              >
                {capacityOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatArabicNumber(option)} لتر
                  </option>
                ))}
              </select>
            </Field>

            {feedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 ${
                  feedback.kind === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <p className="text-sm font-black">{feedback.text}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="min-h-16 rounded-2xl border border-amber-300 bg-amber-200 px-5 text-lg font-black text-amber-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "جارٍ حفظ الشاحنة..." : "حفظ الشاحنة"}
            </button>
          </form>
        ) : null}
      </section>
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
    <label className="grid gap-2 text-right">
      <span className="text-sm font-bold text-amber-900">{label}</span>
      {children}
    </label>
  );
}
