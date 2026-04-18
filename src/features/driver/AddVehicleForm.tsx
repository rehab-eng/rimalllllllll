"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { formatArabicNumber } from "../../lib/labels";
import type { ActionResult, AddVehiclePayload, DriverVehicleSummary } from "./types";

type AddVehicleFormProps = {
  existingVehicles: DriverVehicleSummary[];
  onSubmit: (payload: AddVehiclePayload) => Promise<ActionResult> | ActionResult;
};

export default function AddVehicleForm({
  existingVehicles,
  onSubmit,
}: AddVehicleFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(existingVehicles.length === 0);
  const [platesNumber, setPlatesNumber] = useState("");
  const [trailerPlates, setTrailerPlates] = useState("");
  const [capacityLiters, setCapacityLiters] = useState<number | "">("");
  const [cubicCapacity, setCubicCapacity] = useState<number | "">("");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setPlatesNumber("");
    setTrailerPlates("");
    setCapacityLiters("");
    setCubicCapacity("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!platesNumber.trim()) {
      setFeedback({
        kind: "error",
        text: "رقم لوحة الشاحنة مطلوب.",
      });
      return;
    }

    const numericCapacity = Number(capacityLiters);
    const numericCubic = Number(cubicCapacity);

    if (!Number.isFinite(numericCapacity) || numericCapacity <= 0) {
      setFeedback({
        kind: "error",
        text: "أدخل سعة تانك صحيحة.",
      });
      return;
    }

    if (!Number.isFinite(numericCubic) || numericCubic <= 0) {
      setFeedback({
        kind: "error",
        text: "أدخل قيمة صحيحة لتكعيب الشاحنة.",
      });
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        platesNumber: platesNumber.trim(),
        trailerPlates: trailerPlates.trim(),
        capacityLiters: numericCapacity,
        cubicCapacity: numericCubic,
      });

      if (!result.success) {
        setFeedback({
          kind: "error",
          text: result.error ?? "تعذر إضافة الشاحنة.",
        });
        return;
      }

      resetForm();
      setIsFormOpen(false);
      setFeedback({
        kind: "success",
        text: "تمت إضافة الشاحنة الجديدة بنجاح.",
      });
    });
  };

  return (
    <section className="border-b border-slate-200">
      <div className="px-4 py-5 text-right">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setIsFormOpen((value) => !value);
              setFeedback(null);
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700"
          >
            {isFormOpen ? "إغلاق" : "إضافة شاحنة"}
          </button>

          <div>
            <h3 className="text-xl font-black text-slate-950">إضافة شاحنة جديدة</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              عدد الشاحنات الحالية: {formatArabicNumber(existingVehicles.length)}
            </p>
          </div>
        </div>

        {!isFormOpen ? (
          <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
            افتح النموذج عند الحاجة لإضافة شاحنة أخرى على نفس الحساب.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
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
                  value={capacityLiters}
                  onChange={(event) => setCapacityLiters(event.target.value ? Number(event.target.value) : "")}
                  placeholder="16000"
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
                />
              </Field>

              <Field label="تكعيب الشاحنة">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cubicCapacity}
                  onChange={(event) => setCubicCapacity(event.target.value ? Number(event.target.value) : "")}
                  placeholder="45"
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
                />
              </Field>
            </div>

            {feedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 ${
                  feedback.kind === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <p className="text-sm font-black">{feedback.text}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="min-h-14 rounded-2xl bg-amber-500 px-5 text-base font-black text-white disabled:opacity-60"
            >
              {isPending ? "جارٍ حفظ الشاحنة..." : "حفظ الشاحنة"}
            </button>
          </form>
        )}
      </div>
    </section>
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
