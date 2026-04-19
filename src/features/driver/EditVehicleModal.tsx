"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import type { ActionResult, UpdateVehiclePayload } from "./types";

type EditableVehicle = {
  id: number;
  platesNumber: string;
  trailerPlates?: string | null;
  capacityLiters: number | string;
  cubicCapacity: number | string;
};

type EditVehicleModalProps = {
  vehicle: EditableVehicle;
  onClose: () => void;
  onSubmit: (payload: UpdateVehiclePayload) => Promise<ActionResult> | ActionResult;
  onSaved?: (payload: UpdateVehiclePayload) => void;
  title?: string;
  description?: string;
};

export default function EditVehicleModal({
  vehicle,
  onClose,
  onSubmit,
  onSaved,
  title = "تعديل بيانات المركبة",
  description = "حدّث رقم اللوحة أو السعات ثم احفظ التعديلات.",
}: EditVehicleModalProps) {
  const [platesNumber, setPlatesNumber] = useState(vehicle.platesNumber);
  const [trailerPlates, setTrailerPlates] = useState(vehicle.trailerPlates ?? "");
  const [capacityLiters, setCapacityLiters] = useState(String(vehicle.capacityLiters ?? ""));
  const [cubicCapacity, setCubicCapacity] = useState(String(vehicle.cubicCapacity ?? ""));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!platesNumber.trim()) {
      setFeedback("رقم لوحة الشاحنة مطلوب.");
      return;
    }

    if (!capacityLiters.trim()) {
      setFeedback("أدخل سعة تانك صحيحة.");
      return;
    }

    if (!cubicCapacity.trim()) {
      setFeedback("أدخل قيمة صحيحة لتكعيب الشاحنة.");
      return;
    }

    const payload: UpdateVehiclePayload = {
      vehicleId: vehicle.id,
      platesNumber: platesNumber.trim(),
      trailerPlates: trailerPlates.trim(),
      capacityLiters: capacityLiters.trim(),
      cubicCapacity: cubicCapacity.trim(),
    };

    startTransition(async () => {
      const result = await onSubmit(payload);

      if (!result.success) {
        setFeedback(result.error ?? "تعذر تحديث بيانات المركبة.");
        return;
      }

      onSaved?.(payload);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="إغلاق نافذة تعديل المركبة"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />

      <div className="absolute left-4 right-4 top-1/2 mx-auto w-full max-w-lg -translate-y-1/2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            aria-label="إغلاق"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"
          >
            <CloseIcon />
          </button>

          <div className="text-right">
            <p className="text-xs font-black tracking-[0.18em] text-slate-500">EDIT VEHICLE</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">{title}</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <Field label="رقم لوحة الشاحنة">
            <input
              value={platesNumber}
              onChange={(event) => setPlatesNumber(event.target.value)}
              placeholder="مثال: 123 ليبيا"
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
            />
          </Field>

          <Field label="رقم لوحة المقطورة">
            <input
              value={trailerPlates}
              onChange={(event) => setTrailerPlates(event.target.value)}
              placeholder="اختياري"
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="سعة التانك باللتر">
              <input
                type="number"
                min="0"
                step="0.01"
                lang="en-GB"
                dir="ltr"
                inputMode="decimal"
                value={capacityLiters}
                onChange={(event) => setCapacityLiters(event.target.value)}
                placeholder="16000"
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-left font-sans text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="تكعيب الشاحنة">
              <input
                type="number"
                min="0"
                step="0.01"
                lang="en-GB"
                dir="ltr"
                inputMode="decimal"
                value={cubicCapacity}
                onChange={(event) => setCubicCapacity(event.target.value)}
                placeholder="45"
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-left font-sans text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </Field>
          </div>

          {feedback ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="text-sm font-black">{feedback}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="min-h-12 rounded-2xl bg-amber-500 px-5 text-sm font-black text-white disabled:opacity-60"
            >
              {isPending ? "جارٍ حفظ التعديلات..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
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
      <span className="text-sm font-black text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
